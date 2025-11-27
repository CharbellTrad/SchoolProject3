/**
 * Utilidades para reducir tamaño de imágenes base64
 * Compatible con React Native (sin compresión real, solo optimización)
 */
/**
 * En React Native, la "compresión" real se hace con expo-image-manipulator
 * Por ahora, solo validamos y limpiamos el base64
 */
export const compressBase64Image = async (
  base64: string,
): Promise<string> => {
  try {
    // Extraer el base64 puro (sin data:image/...;base64,)
    const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
    
    // En React Native simplemente retornamos el base64 limpio
    // La compresión real requeriría expo-image-manipulator que es opcional
    
    if (__DEV__) {
      const sizeKB = (base64Data.length / 1024).toFixed(1);
      console.log(`📦 Base64 procesado: ${sizeKB}KB`);
    }

    return base64Data;
  } catch (error) {
    if (__DEV__) {
      console.warn('⚠️ Error procesando imagen:', error);
    }
    // Si falla, devolver original sin prefix
    return base64.includes(',') ? base64.split(',')[1] : base64;
  }
};

/**
 * Procesa múltiples imágenes en paralelo
 */
export const compressMultipleImages = async (
  images: Record<string, string>,
): Promise<Record<string, string>> => {
  const entries = Object.entries(images);
  
  if (entries.length === 0) {
    return {};
  }

  if (__DEV__) {
    console.log(`📦 Procesando ${entries.length} imágenes...`);
  }

  const processed = await Promise.all(
    entries.map(async ([key, base64]) => {
      if (!base64) return [key, ''];
      const processedBase64 = await compressBase64Image(base64);
      return [key, processedBase64];
    })
  );

  return Object.fromEntries(processed);
};

/**
 * Obtiene el tamaño aproximado de una imagen base64 en KB
 */
export const getBase64Size = (base64: string): number => {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  return base64Data.length / 1024;
};

/**
 * Limpia el base64 de cualquier prefix
 */
export const cleanBase64 = (base64: string): string => {
  if (!base64) return '';
  return base64.includes(',') ? base64.split(',')[1] : base64;
};

/**
 * Para uso directo: limpia el base64 sin procesamiento adicional
 */
export const smartCompress = async (
  base64: string,
): Promise<string> => {
  return cleanBase64(base64);
};