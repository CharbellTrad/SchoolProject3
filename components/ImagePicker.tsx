import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { generatePdfThumbnail } from '../utils/pdfUtils';
import { DocumentPreview } from './ui/DocumentPreview';
import { DocumentViewer } from './ui/DocumentViewer';

interface ImagePickerComponentProps {
  label?: string;
  value?: string;
  onImageSelected: (base64: string, filename: string) => void;
  aspectRatio?: [number, number];
  allowsEditing?: boolean;
  circular?: boolean;
  acceptPDF?: boolean;
  compress?: boolean;
  initialFileType?: 'image' | 'pdf';
  initialFilename?: string;
}

export const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  label,
  value,
  onImageSelected,
  aspectRatio = [1, 1],
  allowsEditing = false,
  circular = false,
  acceptPDF = false,
  compress = true,
  initialFileType, 
  initialFilename, 
}) => {
  const [loading, setLoading] = useState(false);
  
  const [currentFileType, setCurrentFileType] = useState<'image' | 'pdf'>(initialFileType || 'image');
  const [currentFilename, setCurrentFilename] = useState<string>(initialFilename || '');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  useEffect(() => {
    if (!value) {
      setCurrentFileType('image');
      setCurrentFilename('');
      setThumbnail(null);
      return;
    }

    if (initialFileType) {
      setCurrentFileType(initialFileType);
      
      if (__DEV__) {
        console.log(`✅ Usando tipo inicial del padre: ${initialFileType}`);
      }
    } 
    else {
      const detectedType = detectFileTypeFromBase64(value, currentFilename);
      setCurrentFileType(detectedType);
      
      if (__DEV__) {
        console.log(`✅ Tipo detectado por contenido: ${detectedType} para ${currentFilename}`);
      }
    }

    if (initialFilename) {
      setCurrentFilename(initialFilename);
    }

    // Si es PDF, generar thumbnail
    if ((initialFileType === 'pdf' || detectFileTypeFromBase64(value, currentFilename) === 'pdf') && acceptPDF) {
      setGeneratingThumbnail(true);
      generatePdfThumbnail(value, currentFilename || initialFilename || 'document.pdf')
        .then(thumb => setThumbnail(thumb))
        .catch(err => {
          if (__DEV__) console.error('Error generando thumbnail:', err);
          setThumbnail(null);
        })
        .finally(() => setGeneratingThumbnail(false));
    } else {
      setThumbnail(null);
    }
  }, [value, initialFileType, initialFilename, currentFilename, acceptPDF]);

  // Función auxiliar para detectar tipo (igual que en el hook)
  const detectFileTypeFromBase64 = (base64: string, filename: string): 'image' | 'pdf' => {
    const cleanedBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    
    // Verificar por contenido
    if (cleanedBase64.startsWith('JVBERi0')) {
      return 'pdf';
    }
    
    // Verificar por extensión
    const extension = filename.toLowerCase().split('.').pop() || '';
    if (extension === 'pdf') {
      return 'pdf';
    }
    
    return 'image';
  };

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permisos Necesarios',
          'Necesitamos permisos para acceder a tu cámara y galería de fotos.'
        );
        return false;
      }
    }
    return true;
  };

  const convertToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1] || base64;
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      throw new Error('Error al convertir archivo a base64');
    }
  };

  const generateFilename = (extension: string = 'jpg'): string => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `file_${timestamp}_${random}.${extension}`;
  };

  const handleFileSelected = async (base64: string, selectedFilename: string) => {
    const detectedType = detectFileTypeFromBase64(base64, selectedFilename);
    
    setCurrentFilename(selectedFilename);
    setCurrentFileType(detectedType);
    
    if (__DEV__) {
      console.log(`📁 Archivo seleccionado: ${selectedFilename} (${detectedType})`);
    }
    
    if (detectedType === 'pdf') {
      setGeneratingThumbnail(true);
      try {
        const thumb = await generatePdfThumbnail(base64, selectedFilename);
        setThumbnail(thumb);
      } catch (error) {
        if (__DEV__) console.error('Error generando thumbnail:', error);
        setThumbnail(null);
      } finally {
        setGeneratingThumbnail(false);
      }
    } else {
      setThumbnail(null);
    }
    
    onImageSelected(base64, selectedFilename);
  };

  const takePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'La cámara no está disponible en la web');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: "images",
        allowsEditing,
        aspect: aspectRatio,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = await convertToBase64(result.assets[0].uri);
        const newFilename = generateFilename();
        await handleFileSelected(base64, newFilename);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto');
      if (__DEV__) console.error('Error taking photo:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'La galería no está disponible en la web. Use "Seleccionar Archivo"');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing,
        aspect: aspectRatio,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = await convertToBase64(result.assets[0].uri);
        const newFilename = generateFilename();
        await handleFileSelected(base64, newFilename);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar la imagen');
      if (__DEV__) console.error('Error picking image:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickDocument = async () => {
    setLoading(true);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: acceptPDF ? ['image/*', 'application/pdf'] : ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64 = await convertToBase64(asset.uri);
        const realFilename = asset.name || generateFilename('pdf');
        await handleFileSelected(base64, realFilename);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
      if (__DEV__) console.error('Error picking document:', error);
    } finally {
      setLoading(false);
    }
  };

  const showOptions = () => {
    if (Platform.OS === 'web') {
      pickDocument();
      return;
    }

    const options: any[] = [
      { text: 'Tomar Foto', onPress: takePhoto },
      { text: 'Elegir de Galería', onPress: pickFromGallery },
    ];

    if (acceptPDF) {
      options.push({
        text: 'Seleccionar Archivo (PDF/Imagen)',
        onPress: pickDocument,
      });
    }

    options.push({ text: 'Cancelar', style: 'cancel' });

    Alert.alert('Seleccionar Archivo', 'Elige una opción', options, { cancelable: true });
  };

  const handleDelete = () => {
    setCurrentFileType('image');
    setCurrentFilename('');
    setThumbnail(null);
    onImageSelected('', '');
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.content}>
        {!acceptPDF && value ? (
          <DocumentPreview
            uri={value}
            fileType={currentFileType}
            filename={currentFilename}
            thumbnail={thumbnail}
            loading={generatingThumbnail}
            circular={circular}
            onPress={() => setShowViewer(true)}
          />
        ) : !acceptPDF && !value ? (
          <View style={[styles.placeholder, circular && styles.circularPlaceholder]}>
            <Ionicons name="person" size={circular ? 45 : 60} color={Colors.textTertiary} />
          </View>
        ) : null}

        {acceptPDF && value ? (
          <DocumentPreview
            uri={value}
            fileType={currentFileType}
            filename={currentFilename}
            thumbnail={thumbnail}
            loading={generatingThumbnail}
            circular={false}
            onPress={() => setShowViewer(true)}
          />
        ) : acceptPDF && !value ? (
          <View style={[styles.placeholder, circular && styles.circularPlaceholder]}>
            <Ionicons name="document-text" size={circular ? 45 : 60} color={Colors.textTertiary} />
          </View>
        ) : null}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={showOptions}
            disabled={loading || generatingThumbnail}
          >
            <Ionicons name={Platform.OS === 'web' ? 'cloud-upload' : 'camera'} size={20} color={Colors.primary} />
            <Text style={styles.buttonText}>
              {value ? 'Cambiar Archivo' : acceptPDF ? 'Subir Documento' : 'Agregar Imagen'}
            </Text>
          </TouchableOpacity>

          {value && (
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
              disabled={loading || generatingThumbnail}
            >
              <Ionicons name="trash" size={20} color={Colors.error} />
              <Text style={[styles.buttonText, styles.deleteButtonText]}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>

        {(loading || generatingThumbnail) && (
          <Text style={styles.loadingText}>
            {generatingThumbnail ? 'Generando vista previa...' : 'Procesando archivo...'}
          </Text>
        )}
      </View>

      {value && (
        <DocumentViewer
          visible={showViewer}
          uri={value}
          fileType={currentFileType}
          filename={currentFilename}
          onClose={() => setShowViewer(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  content: {
    alignItems: 'center',
  },
  placeholder: {
    width: 100,
    height: 100,
    marginBottom: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  circularPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: '#fff',
  },
  deleteButton: {
    borderColor: Colors.error,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteButtonText: {
    color: Colors.error,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
    fontStyle: 'italic',
  },
});

// ============================================
// HOOK PERSONALIZADO (ACTUALIZADO Y MEJORADO)
// ============================================

const detectFileTypeFromBase64 = (base64: string, filename: string): 'image' | 'pdf' => {
  // Detectar por contenido (más confiable)
  const cleanedBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  
  // Verificar si es PDF por contenido (los PDFs empiezan con "JVBERi0" en base64)
  if (cleanedBase64.startsWith('JVBERi0')) {
    if (__DEV__) {
      console.log(`✅ Detectado como PDF por CONTENIDO: ${filename}`);
    }
    return 'pdf';
  }
  
  // Detectar por extensión del filename
  const extension = filename.toLowerCase().split('.').pop() || '';
  if (extension === 'pdf') {
    if (__DEV__) {
      console.log(`✅ Detectado como PDF por EXTENSIÓN: ${filename}`);
    }
    return 'pdf';
  }
  
  // Por defecto, es imagen
  return 'image';
};

export const useImagePicker = () => {
  const [images, setImages] = useState<Record<string, { 
    base64: string; 
    filename: string;
    thumbnail?: string | null;
    fileType: 'image' | 'pdf';
  }>>({});

  const setImage = useCallback((key: string, base64: string, filename: string, thumbnail?: string | null) => {
    // Detectar tipo SIEMPRE al guardar
    const fileType = detectFileTypeFromBase64(base64, filename);
    
    // Si es PDF y no hay thumbnail, marcarlo explícitamente
    const finalThumbnail = fileType === 'pdf' ? (thumbnail || null) : undefined;
    
    setImages(prev => ({
      ...prev,
      [key]: { 
        base64, 
        filename,
        thumbnail: finalThumbnail,
        fileType
      }
    }));

    if (__DEV__) {
      console.log(`✅ setImage: ${key} → ${fileType} (${filename})`);
    }
  }, []);

  const getImage = useCallback((key: string) => {
    const image = images[key];
    
    // Re-detectar tipo al recuperar (por si acaso)
    if (image && !image.fileType) {
      const correctedType = detectFileTypeFromBase64(image.base64, image.filename);
      
      if (__DEV__) {
        console.warn(`⚠️ getImage: Re-detectando tipo para ${key}: ${correctedType}`);
      }
      
      // Actualizar en memoria
      setImages(prev => ({
        ...prev,
        [key]: {
          ...image,
          fileType: correctedType
        }
      }));
      
      return {
        ...image,
        fileType: correctedType
      };
    }
    
    return image;
  }, [images]);

  const getThumbnail = useCallback((key: string) => {
    return images[key]?.thumbnail;
  }, [images]);

  const getFileType = useCallback((key: string): 'image' | 'pdf' => {
    const image = images[key];
    if (!image) return 'image';
    
    // Si no tiene tipo guardado, detectar ahora
    if (!image.fileType) {
      const detected = detectFileTypeFromBase64(image.base64, image.filename);
      
      if (__DEV__) {
        console.warn(`⚠️ getFileType: Detectando tipo para ${key}: ${detected}`);
      }
      
      return detected;
    }
    
    return image.fileType;
  }, [images]);

  const clearImage = useCallback((key: string) => {
    setImages(prev => {
      const newImages = { ...prev };
      delete newImages[key];
      return newImages;
    });
  }, []);

  const clearAll = useCallback(() => {
    setImages({});
  }, []);

  return { 
    images, 
    setImage, 
    getImage, 
    getThumbnail, 
    getFileType,
    clearImage, 
    clearAll 
  };
};