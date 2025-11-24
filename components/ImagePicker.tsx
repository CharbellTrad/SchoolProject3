import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { Alert, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../constants/Colors';

interface ImagePickerComponentProps {
  label?: string;
  value?: string;
  onImageSelected: (base64: string, filename: string) => void;
  aspectRatio?: [number, number];
  quality?: number;
  allowsEditing?: boolean; // true = permitir recorte, false = usar imagen completa
  circular?: boolean;
  maxWidth?: number; // null = sin límite
  maxHeight?: number; // null = sin límite
  acceptPDF?: boolean;
  compress?: boolean; // Comprimir automáticamente
}

export const ImagePickerComponent: React.FC<ImagePickerComponentProps> = ({
  label,
  value,
  onImageSelected,
  aspectRatio = [1, 1],
  quality = 0.8,
  allowsEditing = false, // ✅ Por defecto NO recorta
  circular = false,
  maxWidth, // ✅ Sin valor por defecto = sin límite
  maxHeight, // ✅ Sin valor por defecto = sin límite
  acceptPDF = false,
  compress = true,
}) => {
  const [loading, setLoading] = useState(false);

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
        allowsEditing, // ✅ Respeta la configuración
        aspect: aspectRatio,
        quality,
        base64: false,
        // ✅ Respeta límites opcionales
        ...(maxWidth && { maxWidth }),
        ...(maxHeight && { maxHeight }),
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = await convertToBase64(result.assets[0].uri);
        const filename = generateFilename();
        onImageSelected(base64, filename);
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
        allowsEditing, // ✅ Respeta la configuración
        aspect: aspectRatio,
        quality,
        base64: false,
        // ✅ Respeta límites opcionales
        ...(maxWidth && { maxWidth }),
        ...(maxHeight && { maxHeight }),
      });

      if (!result.canceled && result.assets[0]) {
        const base64 = await convertToBase64(result.assets[0].uri);
        const filename = generateFilename();
        onImageSelected(base64, filename);
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
        const filename = generateFilename(extension);
        onImageSelected(base64, filename);
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

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.content}>
        {!acceptPDF && (
          <View style={[styles.imageContainer, circular && styles.circularContainer]}>
            {value ? (
              <Image
                source={{ uri: value.startsWith('data:') ? value : `data:image/jpeg;base64,${value}` }}
                style={[styles.image, circular && styles.circularImage]}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.placeholder, circular && styles.circularPlaceholder]}>
                <Ionicons name="person" size={circular ? 60 : 80} color={Colors.textTertiary} />
              </View>
            )}
          </View>
        )}

        {acceptPDF && value && (
          <View style={styles.documentPreview}>
            <Ionicons name="document-text" size={48} color={Colors.primary} />
            <Text style={styles.documentText}>Documento cargado</Text>
          </View>
        )}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={showOptions}
            disabled={loading}
          >
            <Ionicons name={Platform.OS === 'web' ? 'cloud-upload' : 'camera'} size={20} color={Colors.primary} />
            <Text style={styles.buttonText}>
              {value ? 'Cambiar Archivo' : acceptPDF ? 'Subir Documento' : 'Agregar Imagen'}
            </Text>
          </TouchableOpacity>

          {value && (
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={() => onImageSelected('', '')}
              disabled={loading}
            >
              <Ionicons name="trash" size={20} color={Colors.error} />
              <Text style={[styles.buttonText, styles.deleteButtonText]}>Eliminar</Text>
            </TouchableOpacity>
          )}
        </View>

        {loading && (
          <Text style={styles.loadingText}>Procesando archivo...</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
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
  imageContainer: {
    width: 150,
    height: 150,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  circularContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  circularImage: {
    borderRadius: 60,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
  },
  circularPlaceholder: {
    borderRadius: 60,
  },
  documentPreview: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    minWidth: 150,
  },
  documentText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 12,
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
// HOOK PERSONALIZADO (sin cambios)
// ============================================
export const useImagePicker = () => {
  const [images, setImages] = useState<Record<string, { base64: string; filename: string }>>({});

  const setImage = (key: string, base64: string, filename: string) => {
    setImages(prev => ({
      ...prev,
      [key]: { base64, filename }
    }));
  };

  const getImage = (key: string) => {
    return images[key];
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

  return { images, setImage, getImage, clearImage, clearAll };
};