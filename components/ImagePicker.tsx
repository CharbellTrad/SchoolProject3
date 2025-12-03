import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';
import { generatePdfThumbnail, getFileType } from '../utils/pdfUtils';
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
}) => {
  const [loading, setLoading] = useState(false);
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
  const [filename, setFilename] = useState<string>('');
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false);
  const [showViewer, setShowViewer] = useState(false);

  // Detectar tipo de archivo cuando cambia el valor
  useEffect(() => {
    if (value && filename) {
      const detectedType = getFileType(filename);
      if (detectedType === 'pdf' || detectedType === 'image') {
        setFileType(detectedType);
      }
    }
  }, [value, filename]);

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
    const detectedType = getFileType(selectedFilename);
    
    setFilename(selectedFilename);
    setFileType(detectedType === 'pdf' ? 'pdf' : 'image');
    
    // Si es PDF, generar thumbnail
    if (detectedType === 'pdf') {
      setGeneratingThumbnail(true);
      try {
        const thumb = await generatePdfThumbnail(base64, selectedFilename);
        setThumbnail(thumb);
      } catch (error) {
        if (__DEV__) {
          console.error('Error generando thumbnail:', error);
        }
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
      if (__DEV__) {
        console.error('Error taking photo:', error);
      }
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
      if (__DEV__) {
        console.error('Error picking image:', error);
      }
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
        const extension = asset.name.split('.').pop() || 'pdf';
        const newFilename = generateFilename(extension);
        await handleFileSelected(base64, newFilename);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
      if (__DEV__) {
        console.error('Error picking document:', error);
      }
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
      {
        text: 'Tomar Foto',
        onPress: takePhoto,
      },
      {
        text: 'Elegir de Galería',
        onPress: pickFromGallery,
      },
    ];

    if (acceptPDF) {
      options.push({
        text: 'Seleccionar Archivo (PDF/Imagen)',
        onPress: pickDocument,
      });
    }

    options.push({
      text: 'Cancelar',
      style: 'cancel',
    });

    Alert.alert('Seleccionar Archivo', 'Elige una opción', options, { cancelable: true });
  };

  const handleDelete = () => {
    setFileType('image');
    setFilename('');
    setThumbnail(null);
    onImageSelected('', '');
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.content}>
        {/* Vista Previa Mejorada */}
        {!acceptPDF && value ? (
          <DocumentPreview
            uri={value}
            fileType={fileType}
            filename={filename}
            thumbnail={thumbnail}
            loading={generatingThumbnail}
            circular={circular}
            onPress={() => setShowViewer(true)}
          />
        ) : !acceptPDF && !value ? (
          <View style={[styles.placeholder, circular && styles.circularPlaceholder]}>
            <Ionicons name="person" size={circular ? 60 : 80} color={Colors.textTertiary} />
          </View>
        ) : null}

        {/* Vista Previa para PDFs */}
        {acceptPDF && value && (
          <DocumentPreview
            uri={value}
            fileType={fileType}
            filename={filename}
            thumbnail={thumbnail}
            loading={generatingThumbnail}
            circular={false}
            onPress={() => setShowViewer(true)}
          />
        )}

        {/* Botones de Acción */}
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

      {/* Modal de Visualización Completa */}
      {value && (
        <DocumentViewer
          visible={showViewer}
          uri={value}
          fileType={fileType}
          filename={filename}
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
    width: 150,
    height: 150,
    marginBottom: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  circularPlaceholder: {
    width: 120,
    height: 120,
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
// HOOK PERSONALIZADO (ACTUALIZADO)
// ============================================
export const useImagePicker = () => {
  const [images, setImages] = useState<Record<string, { 
    base64: string; 
    filename: string;
    thumbnail?: string | null;
    fileType: 'image' | 'pdf';
  }>>({});

  const setImage = (key: string, base64: string, filename: string, thumbnail?: string | null) => {
    const fileType = getFileType(filename);
    setImages(prev => ({
      ...prev,
      [key]: { 
        base64, 
        filename,
        thumbnail: fileType === 'pdf' ? thumbnail : undefined,
        fileType: fileType === 'pdf' ? 'pdf' : 'image'
      }
    }));
  };

  const getImage = (key: string) => {
    return images[key];
  };

  const getThumbnail = (key: string) => {
    return images[key]?.thumbnail;
  };

  const getFileType = (key: string): 'image' | 'pdf' => {
    return images[key]?.fileType || 'image';
  };

  const clearImage = (key: string) => {
    setImages(prev => {
      const newImages = { ...prev };
      delete newImages[key];
      return newImages;
    });
  };

  const clearAll = () => {
    setImages({});
  };

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