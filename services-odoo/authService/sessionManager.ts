/**
 * Gestión de sesión local con AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSession } from '../../types/auth';

const USER_SESSION_KEY = '@odoo_user_session';

/**
 * Guarda la sesión de usuario en AsyncStorage
 * @param session - Sesión a guardar
 */
export const saveUserSession = async (session: UserSession): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    
    if (__DEV__) {
      console.log('💾 Sesión guardada:', {
        username: session.username,
        role: session.role,
      });
    }
    
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error guardando sesión:', error);
    }
    return false;
  }
};

/**
 * Obtiene la sesión guardada de AsyncStorage
 * @returns UserSession si existe, null si no
 */
export const getSavedUserSession = async (): Promise<UserSession | null> => {
  try {
    const sessionString = await AsyncStorage.getItem(USER_SESSION_KEY);

    if (!sessionString) {
      return null;
    }

    const session: UserSession = JSON.parse(sessionString);

    // Validar integridad de la sesión
    if (!session.id || !session.username || !session.token) {
      if (__DEV__) {
        console.warn('⚠️ Sesión guardada incompleta, limpiando...');
      }
      await clearUserSession();
      return null;
    }

    return session;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error obteniendo sesión:', error);
    }
    return null;
  }
};

/**
 * Actualiza parcialmente la sesión guardada
 * @param updates - Campos a actualizar
 * @returns true si se actualizó correctamente
 */
export const updateUserSession = async (
  updates: Partial<UserSession>
): Promise<boolean> => {
  try {
    const currentSession = await getSavedUserSession();

    if (!currentSession) {
      if (__DEV__) {
        console.warn('⚠️ No hay sesión para actualizar');
      }
      return false;
    }

    const updatedSession: UserSession = {
      ...currentSession,
      ...updates,
    };

    await saveUserSession(updatedSession);

    if (__DEV__) {
      console.log('✅ Sesión actualizada');
    }
    
    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error actualizando sesión:', error);
    }
    return false;
  }
};

/**
 * Elimina la sesión guardada
 */
export const clearUserSession = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    
    if (__DEV__) {
      console.log('🗑️ Sesión local eliminada');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error limpiando sesión:', error);
    }
  }
};

/**
 * Verifica si existe una sesión guardada
 * @returns true si existe una sesión
 */
export const hasStoredSession = async (): Promise<boolean> => {
  try {
    const session = await getSavedUserSession();
    return session !== null;
  } catch {
    return false;
  }
};