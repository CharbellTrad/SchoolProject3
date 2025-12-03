/**
 * Modal de visualización completa de imágenes y PDFs
 * ✅ Funciona en Expo Go (iOS + Android) y Builds
 * ✅ Muestra todas las páginas del PDF
 * ✅ Título correcto según tipo de archivo
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
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

  // ========== VALORES PARA ZOOM Y PAN (SOLO IMÁGENES) ==========
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const insets = useSafeAreaInsets();

  // ========== RESET AL CERRAR ==========
  const handleClose = () => {
    scale.value = withTiming(1);
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedScale.value = 1;
    originX.value = 0;
    originY.value = 0;
    setLoading(true);
    setError(null);
    onClose();
  };

  // ========== GESTOS MODERNOS PARA IMÁGENES ==========
  
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      if (scale.value < 1.2) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        originX.value = 0;
        originY.value = 0;
      } else {
        savedScale.value = scale.value;
      }
    });

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (savedScale.value > 1) {
        translateX.value = e.translationX + originX.value;
        translateY.value = e.translationY + originY.value;
      }
    })
    .onEnd(() => {
      originX.value = translateX.value;
      originY.value = translateY.value;
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedScale.value = 1;
        originX.value = 0;
        originY.value = 0;
      } else {
        scale.value = withSpring(2);
        savedScale.value = 2;
      }
    });

  const composedGesture = Gesture.Simultaneous(
    pinchGesture,
    panGesture,
    doubleTapGesture
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  // ========== PREPARAR URI ==========
  const getSourceUri = () => {
    if (!uri) return '';
    
    if (fileType === 'pdf') {
      const base64Clean = cleanBase64(uri);
      return `data:application/pdf;base64,${base64Clean}`;
    }
    
    if (uri.startsWith('data:')) return uri;
    
    const base64Clean = cleanBase64(uri);
    return `data:image/jpeg;base64,${base64Clean}`;
  };

  // ========== HTML PARA PDF - FUNCIONA EN EXPO GO Y BUILDS ==========
  const getPDFHTML = () => {
    const base64Clean = cleanBase64(uri);
    
    // 🔧 WORKAROUND: En Android, usar Mozilla PDF.js para mejor compatibilidad
    if (Platform.OS === 'android') {
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
                overflow-x: hidden;
              }
              iframe {
                width: 100%;
                min-height: 100vh;
                border: none;
              }
            </style>
          </head>
          <body>
            <iframe 
              src="https://mozilla.github.io/pdf.js/web/viewer.html?file=data:application/pdf;base64,${base64Clean}"
              width="100%" 
              height="100%"
            ></iframe>
          </body>
        </html>
      `;
    }
    
    // 🍎 iOS: usar embed nativo (funciona perfecto en iOS)
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
              background-color: #303030;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
              overflow-x: hidden;
              padding: 10px;
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

  // ========== RENDER ==========
  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <StatusBar style="light" translucent />
      <GestureHandlerRootView style={styles.container}>
        <View style={[styles.container, { paddingBottom: insets.bottom }]}>
          
          {/* ========== HEADER ========== */}
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
                  <Text style={styles.headerSubtitle}>
                    {fileType === 'pdf' ? 'Documento PDF' : 'Imagen'}
                  </Text>
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

          {/* ========== CONTENT ========== */}
          <View style={styles.content}>
            
            {/* Loading */}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Cargando {fileType === 'pdf' ? 'PDF' : 'imagen'}...</Text>
              </View>
            )}

            {/* Error */}
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={64} color={Colors.error} />
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleClose}>
                  <Text style={styles.retryButtonText}>Cerrar</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* IMAGEN con gestos */}
            {!error && fileType === 'image' && (
              <GestureDetector gesture={composedGesture}>
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
              </GestureDetector>
            )}

            {/* PDF con WebView - TODAS LAS PÁGINAS */}
            {!error && fileType === 'pdf' && (
              <WebView
                source={{ html: getPDFHTML() }}
                style={styles.webview}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  setLoading(false);
                  setError('Error al cargar el PDF');
                  if (__DEV__) {
                    console.error('WebView error:', nativeEvent);
                  }
                }}
                scalesPageToFit={true}
                bounces={true}
                scrollEnabled={true}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
              />
            )}
          </View>

          {/* ========== FOOTER CON INSTRUCCIONES ========== */}
          {!loading && !error && (
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {fileType === 'pdf' 
                  ? 'Desliza para ver todas las páginas • Pellizca para hacer zoom'
                  : 'Pellizca para hacer zoom • Toca dos veces para ajustar'
                }
              </Text>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// ========== ESTILOS ==========
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
    backgroundColor: '#303030',
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
    textAlign: 'center',
  },
});