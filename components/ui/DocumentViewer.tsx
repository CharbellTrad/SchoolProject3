/**
 * Modal de visualización completa de imágenes y PDFs
 * Soporta zoom, pan para imágenes y scroll vertical para PDFs
 */

import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Modal,
    Platform,
    StatusBar as RNStatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { GestureHandlerRootView, PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { WebView } from 'react-native-webview';
import Colors from '../../constants/Colors';
import { cleanBase64 } from '../../utils/pdfUtils';

interface DocumentViewerProps {
  visible: boolean;
  uri: string;
  fileType: 'image' | 'pdf';
  filename?: string;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  visible,
  uri,
  fileType,
  filename,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Valores para zoom y pan (solo imágenes)
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedScale = useSharedValue(1);

  // Reset zoom cuando se cierra
  const handleClose = () => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    setLoading(true);
    setError(null);
    onClose();
  };

  // Manejador de gestos de pinch para zoom (API moderna)
  const pinchHandler = React.useCallback((event: any) => {
    'worklet';
    
    if (event.state === State.ACTIVE) {
      scale.value = Math.max(1, Math.min(event.scale * savedScale.value, 4));
    } else if (event.state === State.END) {
      savedScale.value = scale.value;
      
      if (scale.value < 1.2) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
      }
    }
  }, []);

  // Estilos animados para la imagen
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  // Preparar URI según tipo
  const getSourceUri = () => {
    if (!uri) return '';
    
    if (fileType === 'pdf') {
      // Para PDFs, necesitamos base64 limpio
      const base64Clean = cleanBase64(uri);
      return `data:application/pdf;base64,${base64Clean}`;
    }
    
    // Para imágenes
    if (uri.startsWith('data:')) {
      return uri;
    }
    
    // Si no tiene prefijo, agregarlo
    const base64Clean = cleanBase64(uri);
    return `data:image/jpeg;base64,${base64Clean}`;
  };

  // Generar HTML para mostrar PDF en WebView
  const getPDFHTML = () => {
    const base64Clean = cleanBase64(uri);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              background-color: #000;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              overflow-x: hidden;
            }
            embed {
              width: 100%;
              min-height: 100vh;
              border: none;
            }
          </style>
        </head>
        <body>
          <embed 
            src="data:application/pdf;base64,${base64Clean}" 
            type="application/pdf" 
            width="100%" 
            height="100%"
          />
        </body>
      </html>
    `;
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar style="light" />
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.headerLeft}>
                <Ionicons
                  name={fileType === 'pdf' ? 'document-text' : 'image'}
                  size={24}
                  color="#fff"
                />
                <View style={styles.headerTextContainer}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {filename || (fileType === 'pdf' ? 'Documento PDF' : 'Imagen')}
                  </Text>
                  {fileType === 'pdf' && totalPages > 0 && (
                    <Text style={styles.headerSubtitle}>
                      Página {currentPage} de {totalPages}
                    </Text>
                  )}
                </View>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Cargando...</Text>
              </View>
            )}

            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={64} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleClose}>
                  <Text style={styles.retryButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}

            {!error && fileType === 'image' && (
              <PinchGestureHandler
                onGestureEvent={pinchHandler}
                onHandlerStateChange={pinchHandler}
              >
                <Animated.Image
                  source={{ uri: getSourceUri() }}
                  style={[styles.image, animatedStyle]}
                  resizeMode="contain"
                  onLoadStart={() => setLoading(true)}
                  onLoadEnd={() => setLoading(false)}
                  onError={() => {
                    setLoading(false);
                    setError('Error al cargar la imagen');
                  }}
                />
              </PinchGestureHandler>
            )}

            {!error && fileType === 'pdf' && (
              <WebView
                source={{ html: getPDFHTML() }}
                style={styles.webview}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Error al cargar el PDF');
                }}
                scalesPageToFit={true}
                bounces={false}
              />
            )}
          </View>

          {/* Footer con instrucciones (solo para imágenes) */}
          {!loading && !error && fileType === 'image' && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Pellizca para hacer zoom
              </Text>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 40 : 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  image: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT - 120,
  },
  webview: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: '#000',
  },
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
});