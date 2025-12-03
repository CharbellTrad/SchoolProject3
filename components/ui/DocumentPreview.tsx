/**
 * Vista previa de documentos (imágenes y PDFs)
 * Muestra thumbnail y permite abrir en DocumentViewer
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import Colors from '../../constants/Colors';
import { cleanBase64, formatFileSize, getFileSize } from '../../utils/pdfUtils';

interface DocumentPreviewProps {
  uri: string;
  fileType: 'image' | 'pdf';
  filename?: string;
  thumbnail?: string | null;
  loading?: boolean;
  circular?: boolean;
  onPress: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  uri,
  fileType,
  filename,
  thumbnail,
  loading = false,
  circular = false,
  onPress,
}) => {
  // Preparar URI para mostrar
  const getDisplayUri = () => {
    if (fileType === 'image') {
      if (uri.startsWith('data:')) return uri;
      const base64Clean = cleanBase64(uri);
      return `data:image/jpeg;base64,${base64Clean}`;
    }

    // Para PDF, usar thumbnail si existe
    if (thumbnail) {
      if (thumbnail.startsWith('data:')) return thumbnail;
      const base64Clean = cleanBase64(thumbnail);
      return `data:image/jpeg;base64,${base64Clean}`;
    }

    return null;
  };

  const displayUri = getDisplayUri();
  const sizeKB = getFileSize(uri);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        circular && styles.circularContainer
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={loading}
    >
      {loading ? (
        // Estado de carga
        <View style={[
          styles.loadingContainer,
          circular && styles.circularLoading
        ]}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Procesando...</Text>
        </View>
      ) : (
        <>
          {/* Vista previa de la imagen o PDF */}
          {displayUri ? (
            <Image
              source={{ uri: displayUri }}
              style={[
                styles.image,
                circular && styles.circularImage
              ]}
              resizeMode="cover"
            />
          ) : (
            // Placeholder para PDF sin thumbnail
            <View style={[
              styles.pdfPlaceholder,
              circular && styles.circularPlaceholder
            ]}>
              <Ionicons 
                name="document-text" 
                size={circular ? 48 : 64} 
                color={Colors.primary} 
              />
              <Text style={styles.pdfText}>PDF</Text>
            </View>
          )}

          {/* Overlay con información */}
          <View style={[
            styles.overlay,
            circular && styles.circularOverlay
          ]}>
            {/* Badge de tipo de archivo */}
            {fileType === 'pdf' && (
              <View style={styles.badge}>
                <Ionicons name="document-text" size={14} color="#fff" />
                <Text style={styles.badgeText}>PDF</Text>
              </View>
            )}

            {/* Icono de zoom/expand */}
            <View style={styles.expandIcon}>
              <Ionicons name="expand" size={20} color="#fff" />
            </View>
          </View>

          {/* Información del archivo (debajo de la vista previa) */}
          {!circular && filename && (
            <View style={styles.infoContainer}>
              <Text style={styles.filename} numberOfLines={1}>
                {filename}
              </Text>
              <Text style={styles.filesize}>
                {formatFileSize(sizeKB)}
              </Text>
            </View>
          )}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 150,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.primary + '10',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      }
    }),
  },
  circularContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
  },
  image: {
    width: '100%',
    height: 150,
    backgroundColor: '#f0f0f0',
  },
  circularImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  pdfPlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
  },
  circularPlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  pdfText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    opacity: 0,
  },
  circularOverlay: {
    borderRadius: 12,
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  expandIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
  },
  circularLoading: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 8,
  },
  infoContainer: {
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  filename: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  filesize: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});