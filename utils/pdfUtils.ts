/**
 * Utilidades para manejo de PDFs
 * - Generación de thumbnails de primera página
 * - Detección de tipo de archivo
 * - Validación y formateo
 */

/**
 * Determina si un archivo es PDF basándose en su nombre
 */
export const isPdfFile = (filename: string): boolean => {
  if (!filename) return false;
  const extension = getFileExtension(filename);
  return extension === 'pdf';
};

/**
 * Determina si un archivo es imagen basándose en su nombre
 */
export const isImageFile = (filename: string): boolean => {
  if (!filename) return false;
  const extension = getFileExtension(filename);
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];
  return imageExtensions.includes(extension);
};

/**
 * Obtiene la extensión de un archivo
 */
export const getFileExtension = (filename: string): string => {
  if (!filename) return '';
  const parts = filename.toLowerCase().split('.');
  return parts.length > 1 ? parts[parts.length - 1] : '';
};

/**
 * Detecta el tipo de archivo basándose en el nombre
 */
export const getFileType = (filename: string): 'image' | 'pdf' | 'unknown' => {
  if (!filename) return 'unknown';
  
  if (isPdfFile(filename)) return 'pdf';
  if (isImageFile(filename)) return 'image';
  
  return 'unknown';
};

/**
 * 🖼️ Genera un thumbnail de un PDF (primera página)
 * 
 * NOTA IMPORTANTE:
 * - En React Native no podemos renderizar PDFs directamente como en web
 * - Esta función usa un placeholder por ahora
 * - Para implementación real se necesitaría:
 *   1. react-native-pdf (para renderizar PDFs)
 *   2. react-native-view-shot (para capturar screenshot)
 *   3. O un servicio backend que genere thumbnails
 * 
 * POR AHORA: Retornamos null y usamos un placeholder visual
 */
export const generatePdfThumbnail = async (
  base64: string,
  filename: string
): Promise<string | null> => {
  try {
    if (__DEV__) {
      console.log('📄 Intentando generar thumbnail para:', filename);
    }

    // TODO: Implementar con react-native-pdf + react-native-view-shot
    // 
    // Ejemplo de implementación futura:
    // 1. Usar react-native-pdf para cargar el PDF
    // 2. Renderizar solo la primera página
    // 3. Usar react-native-view-shot para capturar como imagen
    // 4. Convertir a base64 y retornar
    //
    // Por ahora, simulamos delay y retornamos null (usa placeholder)
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Retornar null hace que DocumentPreview use el placeholder de PDF
    return null;
    
    // IMPLEMENTACIÓN FUTURA (ejemplo):
    /*
    import Pdf from 'react-native-pdf';
    import { captureRef } from 'react-native-view-shot';
    
    const pdfRef = createRef<Pdf>();
    
    // Renderizar PDF offscreen
    const thumbnailUri = await captureRef(pdfRef, {
      format: 'jpg',
      quality: 0.8,
    });
    
    // Convertir URI a base64
    const base64Thumbnail = await FileSystem.readAsStringAsync(thumbnailUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return base64Thumbnail;
    */
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error generando thumbnail PDF:', error);
    }
    return null;
  }
};

/**
 * Valida que el base64 de un PDF sea válido
 */
export const isValidPdfBase64 = (base64: string): boolean => {
  if (!base64) return false;
  
  try {
    // Los PDFs comienzan con "%PDF" que en base64 es "JVBERi0"
    const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    return cleanBase64.startsWith('JVBERi0');
  } catch (error) {
    return false;
  }
};

/**
 * Valida que el base64 de una imagen sea válido
 */
export const isValidImageBase64 = (base64: string): boolean => {
  if (!base64) return false;
  
  try {
    const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
    
    // Verificar que comience con caracteres típicos de imágenes
    // JPG: /9j/, PNG: iVBOR, GIF: R0lGOD
    return (
      cleanBase64.startsWith('/9j/') ||  // JPEG
      cleanBase64.startsWith('iVBOR') || // PNG
      cleanBase64.startsWith('R0lGOD')   // GIF
    );
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene el tamaño aproximado de un archivo base64 en KB
 */
export const getFileSize = (base64: string): number => {
  if (!base64) return 0;
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  return cleanBase64.length / 1024;
};

/**
 * Formatea el tamaño del archivo para mostrar
 */
export const formatFileSize = (sizeKB: number): string => {
  if (sizeKB < 1024) {
    return `${sizeKB.toFixed(1)} KB`;
  }
  return `${(sizeKB / 1024).toFixed(1)} MB`;
};

/**
 * Genera un URI de datos completo para preview
 */
export const getDataUri = (base64: string, fileType: 'image' | 'pdf'): string => {
  const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
  
  if (fileType === 'pdf') {
    return `data:application/pdf;base64,${cleanBase64}`;
  }
  
  // Para imágenes, intentar detectar el tipo específico
  if (cleanBase64.startsWith('/9j/')) {
    return `data:image/jpeg;base64,${cleanBase64}`;
  }
  if (cleanBase64.startsWith('iVBOR')) {
    return `data:image/png;base64,${cleanBase64}`;
  }
  if (cleanBase64.startsWith('R0lGOD')) {
    return `data:image/gif;base64,${cleanBase64}`;
  }
  
  // Por defecto, asumir JPEG
  return `data:image/jpeg;base64,${cleanBase64}`;
};

/**
 * Limpia el base64 de prefijos
 */
export const cleanBase64 = (base64: string): string => {
  if (!base64) return '';
  return base64.includes(',') ? base64.split(',')[1] : base64;
};

/**
 * Valida que un archivo no exceda el tamaño máximo
 */
export const validateFileSize = (
  base64: string,
  maxSizeMB: number = 10
): { valid: boolean; size: number; error?: string } => {
  const sizeKB = getFileSize(base64);
  const sizeMB = sizeKB / 1024;
  
  if (sizeMB > maxSizeMB) {
    return {
      valid: false,
      size: sizeKB,
      error: `El archivo excede el tamaño máximo de ${maxSizeMB}MB. Tamaño actual: ${sizeMB.toFixed(1)}MB`
    };
  }
  
  return {
    valid: true,
    size: sizeKB
  };
};

/**
 * Obtiene información completa del archivo
 */
export const getFileInfo = (base64: string, filename: string) => {
  const fileType = getFileType(filename);
  const sizeKB = getFileSize(base64);
  const extension = getFileExtension(filename);
  
  return {
    filename,
    extension,
    fileType,
    sizeKB,
    sizeFormatted: formatFileSize(sizeKB),
    isValid: fileType === 'pdf' 
      ? isValidPdfBase64(base64) 
      : isValidImageBase64(base64),
  };
};