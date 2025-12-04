/**
 * ✅ DOCUMENTVIEWER - VERSIÓN FUNCIONAL CON PDF RENDERING
 * - Funciona en Expo Go
 * - Funciona en iOS y Android builds
 * - PDFs renderizan directamente con Canvas HTML5
 * - No requiere módulos nativos
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

  // Valores para zoom y pan (solo imágenes)
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const insets = useSafeAreaInsets();

  // Reset al cerrar
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

  // Gestos para imágenes
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
    
    if (uri.startsWith('data:')) return uri;
    
    const base64Clean = cleanBase64(uri);
    return `data:image/jpeg;base64,${base64Clean}`;
  };

  // ========== HTML CON PDF.JS EMBEBIDO ==========
  const getPDFHTML = () => {
    const base64Clean = cleanBase64(uri);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-touch-callout: none;
              -webkit-user-select: none;
            }
            html, body {
              width: 100%;
              height: 100%;
              overflow-x: hidden;
              overflow-y: auto;
              background-color: #303030;
              font-family: system-ui, -apple-system, sans-serif;
            }
            #container {
              width: 100%;
              min-height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              padding: 10px;
              gap: 10px;
            }
            .page-container {
              width: 100%;
              max-width: 100%;
              background: white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              margin-bottom: 10px;
              position: relative;
            }
            canvas {
              display: block;
              width: 100%;
              height: auto;
            }
            #loading {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: white;
              text-align: center;
              z-index: 100;
            }
            .spinner {
              border: 3px solid rgba(255,255,255,0.3);
              border-radius: 50%;
              border-top: 3px solid white;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 0 auto 10px;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            #error {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: #ff6b6b;
              text-align: center;
              padding: 20px;
              background: rgba(0,0,0,0.9);
              border-radius: 8px;
              display: none;
            }
            .page-number {
              position: absolute;
              bottom: 5px;
              right: 5px;
              background: rgba(0,0,0,0.7);
              color: white;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div id="loading">
            <div class="spinner"></div>
            <p>Cargando PDF...</p>
          </div>
          <div id="error">
            <p style="font-size: 18px; margin-bottom: 10px;">⚠️ Error al cargar PDF</p>
            <p style="font-size: 14px;">El archivo puede estar corrupto o ser muy grande</p>
          </div>
          <div id="container"></div>
          
          <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
          <script>
            (async function() {
              const loading = document.getElementById('loading');
              const error = document.getElementById('error');
              const container = document.getElementById('container');
              
              try {
                // Configurar PDF.js
                pdfjsLib.GlobalWorkerOptions.workerSrc = 
                  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                
                // Convertir base64 a Uint8Array
                const base64Data = '${base64Clean}';
                const binaryString = atob(base64Data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                
                console.log('📄 Loading PDF, size:', bytes.length, 'bytes');
                
                // Cargar el PDF
                const loadingTask = pdfjsLib.getDocument({ data: bytes });
                const pdf = await loadingTask.promise;
                
                console.log('✅ PDF loaded, pages:', pdf.numPages);
                loading.style.display = 'none';
                
                // Renderizar cada página
                for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                  const page = await pdf.getPage(pageNum);
                  
                  // Calcular escala con ALTA CALIDAD
                  // Usar devicePixelRatio para pantallas de alta densidad
                  const viewport = page.getViewport({ scale: 1 });
                  const desiredWidth = window.innerWidth - 20;
                  
                  // Escala base para ajustar al ancho
                  const baseScale = desiredWidth / viewport.width;
                  
                  // Multiplicar por devicePixelRatio para mayor calidad (máximo 3x)
                  const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
                  const renderScale = baseScale * pixelRatio;
                  
                  const scaledViewport = page.getViewport({ scale: renderScale });
                  
                  // Crear contenedor de página
                  const pageContainer = document.createElement('div');
                  pageContainer.className = 'page-container';
                  pageContainer.style.width = desiredWidth + 'px';
                  
                  // Crear canvas con dimensiones escaladas
                  const canvas = document.createElement('canvas');
                  canvas.width = scaledViewport.width;
                  canvas.height = scaledViewport.height;
                  
                  // Ajustar tamaño visual del canvas (CSS)
                  canvas.style.width = desiredWidth + 'px';
                  canvas.style.height = (scaledViewport.height / pixelRatio) + 'px';
                  
                  // Agregar número de página
                  const pageNumber = document.createElement('div');
                  pageNumber.className = 'page-number';
                  pageNumber.textContent = pageNum + ' / ' + pdf.numPages;
                  
                  pageContainer.appendChild(canvas);
                  pageContainer.appendChild(pageNumber);
                  container.appendChild(pageContainer);
                  
                  // Renderizar página
                  const context = canvas.getContext('2d');
                  const renderContext = {
                    canvasContext: context,
                    viewport: scaledViewport
                  };
                  
                  await page.render(renderContext).promise;
                  console.log('✅ Rendered page', pageNum);
                }
                
                console.log('🎉 All pages rendered successfully');
                
              } catch (err) {
                console.error('❌ PDF Error:', err);
                loading.style.display = 'none';
                error.style.display = 'block';
                error.querySelector('p:last-child').textContent = err.message || 'Error desconocido';
              }
            })();
          </script>
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
          <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight || 40 : insets.top + 10 }]}>
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
                <Text style={styles.loadingText}>
                  Cargando {fileType === 'pdf' ? 'PDF' : 'imagen'}...
                </Text>
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

            {/* PDF con WebView + PDF.js */}
            {!error && fileType === 'pdf' && (
              <WebView
                source={{ html: getPDFHTML() }}
                style={styles.webview}
                onLoadStart={() => {
                  setLoading(true);
                  console.log('📱 WebView: Load started');
                }}
                onLoadEnd={() => {
                  // Damos tiempo para que PDF.js termine de renderizar
                  setTimeout(() => {
                    setLoading(false);
                    console.log('✅ WebView: Load ended');
                  }, 500);
                }}
                onError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.error('❌ WebView error:', nativeEvent);
                  setLoading(false);
                  setError('Error al inicializar el visor de PDF');
                }}
                onHttpError={(syntheticEvent) => {
                  const { nativeEvent } = syntheticEvent;
                  console.warn('⚠️ HTTP error:', nativeEvent.statusCode);
                }}
                // Configuración esencial
                javaScriptEnabled={true}
                domStorageEnabled={true}
                scalesPageToFit={true}
                bounces={true}
                scrollEnabled={true}
                startInLoadingState={false}
                allowFileAccess={true}
                allowUniversalAccessFromFileURLs={true}
                originWhitelist={['*']}
                mixedContentMode="always"
                cacheEnabled={false}
                // Handlers de mensajes desde el HTML
                onMessage={(event) => {
                  const data = event.nativeEvent.data;
                  console.log('📨 Message from WebView:', data);
                  
                  // Puedes recibir eventos del HTML aquí
                  if (data === 'pdf_loaded') {
                    setLoading(false);
                  } else if (data.startsWith('error:')) {
                    setError(data.replace('error:', ''));
                    setLoading(false);
                  }
                }}
              />
            )}
          </View>

          {/* ========== FOOTER ========== */}
          {!loading && !error && (
            <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
              <Text style={styles.footerText}>
                {fileType === 'pdf' 
                  ? '📄 Desliza verticalmente para ver todas las páginas • Pellizca para zoom'
                  : '🔍 Pellizca para zoom • Toca dos veces para ajustar'
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
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
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
    height: SCREEN_HEIGHT - 160,
  },
  webview: {
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: '#303030',
  },
  footer: {
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});