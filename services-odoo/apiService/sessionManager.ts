import AsyncStorage from '@react-native-async-storage/async-storage';
import { SESSION_KEY } from './config';

/**
 * Callback global para manejar sesión expirada
 * Se configura desde AuthContext para redirigir al login automáticamente
 */
let onSessionExpiredCallback: (() => void) | null = null;

export const setSessionExpiredCallback = (callback: () => void) => {
  onSessionExpiredCallback = callback;
};

/**
 * Obtiene el Session ID almacenado localmente
 */
export const getStoredSessionId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(SESSION_KEY);
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error obteniendo session ID:', error);
    }
    return null;
  }
};

/**
 * Guarda el Session ID en almacenamiento local
 */
export const saveSessionId = async (sid: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, sid);
    if (__DEV__) {
      console.log('✅ Session ID guardado');
    }
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error guardando session ID:', error);
    }
  }
};

/**
 * Elimina el Session ID del almacenamiento local
 */
export const clearSessionId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    if (__DEV__) {
      console.log('🗑️ Session ID eliminado');
    }
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error eliminando session ID:', error);
    }
  }
};

/**
 * Maneja la expiración de sesión limpiando datos locales y notificando al contexto
 */
export const handleSessionExpired = async (): Promise<void> => {
  if (__DEV__) {
    console.log('🔒 Sesión expirada detectada, limpiando datos...');
  }

  try {
    await clearSessionId();

    if (onSessionExpiredCallback) {
      onSessionExpiredCallback();
    }
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error limpiando sesión expirada:', error);
    }
  }
};

/**
 * Extrae el Session ID del header Set-Cookie de la respuesta HTTP
 */
export const extractSessionId = (setCookie: string | null): string => {
  if (setCookie && setCookie.includes('session_id')) {
    const match = setCookie.match(/session_id=([^;]+)/);
    return match ? match[1] : '';
  }
  return '';
};