/**
 * Validación de sesiones activas
 */

import { UserSession } from '../../types/auth';
import * as odooApi from '../apiService';
import { clearUserSession, getSavedUserSession, saveUserSession } from './sessionManager';

/**
 * Verifica si la sesión actual es válida en Odoo
 * @returns UserSession actualizada si es válida, null si no lo es
 */
export const verifySession = async (): Promise<UserSession | null> => {
  try {
    // 1. Verificar sesión local
    const savedSession = await getSavedUserSession();

    if (!savedSession) {
      if (__DEV__) {
        console.log('🔐 No hay sesión guardada localmente');
      }
      return null;
    }

    // 2. Verificar con Odoo
    const verifyResult = await odooApi.verifySession();

    if (!verifyResult.success) {
      if (__DEV__) {
        console.log('🔐 Sesión expirada en Odoo');
      }
      await clearUserSession();
      return null;
    }

    const sessionData = verifyResult.data;

    // 3. Validar coincidencia de UID
    if (sessionData.uid !== savedSession.id) {
      if (__DEV__) {
        console.warn('⚠️ UID no coincide, limpiando sesión');
      }
      await clearUserSession();
      return null;
    }

    // 4. Actualizar sesión con datos frescos
    const updatedSession: UserSession = {
      ...savedSession,
      fullName: sessionData.name || savedSession.fullName,
      odooData: {
        ...savedSession.odooData,
        context: sessionData.user_context,
      },
    };

    await saveUserSession(updatedSession);

    if (__DEV__) {
      console.log('✅ Sesión válida:', {
        username: updatedSession.username,
        role: updatedSession.role,
      });
    }

    return updatedSession;
  } catch (error) {
    if (__DEV__) {
      console.error('⚠️ Error verificando sesión:', error);
    }
    
    // En caso de error, limpiar sesión por seguridad
    await clearUserSession();
    return null;
  }
};

/**
 * Valida que una sesión tenga todos los campos requeridos
 * @param session - Sesión a validar
 * @returns true si la sesión es válida
 */
export const isValidSession = (session: UserSession | null): boolean => {
  if (!session) return false;
  
  return !!(
    session.id &&
    session.username &&
    session.token &&
    session.role &&
    session.odooData?.uid
  );
};

/**
 * Verifica si una sesión está expirada por tiempo
 * @param session - Sesión a verificar
 * @param maxAgeHours - Máximo de horas de vigencia (default: 24)
 * @returns true si la sesión está expirada
 */
export const isSessionExpiredByTime = (
  session: UserSession,
  maxAgeHours: number = 24
): boolean => {
  if (!session.loginTime) return true;
  
  const loginTime = new Date(session.loginTime).getTime();
  const now = new Date().getTime();
  const ageHours = (now - loginTime) / (1000 * 60 * 60);
  
  return ageHours > maxAgeHours;
};