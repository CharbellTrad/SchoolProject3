/**
 * Validación de sesiones activas
 */

import { UserSession } from '../../types/auth';
import * as odooApi from '../apiService';
import { clearUserSession, getSavedUserSession, saveUserSession } from './sessionManager';
import { getUserImage } from './userOperations';

// ⏱️ NUEVA CONSTANTE: Tiempo de expiración de sesión (4 horas)
const SESSION_EXPIRY_HOURS = 4;

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

    // 🆕 2. Verificar expiración por tiempo (4 horas)
    if (isSessionExpiredByTime(savedSession, SESSION_EXPIRY_HOURS)) {
      if (__DEV__) {
        console.log('⏱️ Sesión expirada por tiempo (4 horas). Destruyendo sesión en Odoo...');
      }

      // Destruir sesión en Odoo
      await odooApi.destroySession();

      // Limpiar sesión local
      await clearUserSession();

      return null;
    }

    // 3. Verificar con Odoo
    const verifyResult = await odooApi.verifySession();

    if (!verifyResult.success) {
      if (__DEV__) {
        console.log('🔐 Sesión expirada en Odoo');
      }

      // Destruir sesión en Odoo (por si acaso)
      await odooApi.destroySession();

      await clearUserSession();
      return null;
    }

    const sessionData = verifyResult.data;

    // 4. Validar coincidencia de UID
    if (sessionData.uid !== savedSession.id) {
      if (__DEV__) {
        console.warn('⚠️ UID no coincide, limpiando sesión');
      }

      await odooApi.destroySession();
      await clearUserSession();
      return null;
    }

    // 5. Actualizar sesión con datos frescos
    // Intentar obtener la imagen del usuario (no bloquear si falla)
    let userImage = savedSession.imageUrl; // Mantener la imagen existente por defecto
    try {
      const fetchedImage = await getUserImage(savedSession.odooData.partnerId);
      if (fetchedImage) {
        userImage = fetchedImage;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('⚠️ No se pudo obtener imagen de usuario durante verifySession');
      }
    }

    const updatedSession: UserSession = {
      ...savedSession,
      fullName: sessionData.name || savedSession.fullName,
      imageUrl: userImage,
      odooData: {
        ...savedSession.odooData,
        context: sessionData.user_context,
      },
    };

    await saveUserSession(updatedSession);

    if (__DEV__) {
      const timeRemaining = getSessionTimeRemaining(updatedSession);
      console.log('✅ Sesión válida:', {
        username: updatedSession.username,
        role: updatedSession.role,
        hasImage: !!updatedSession.imageUrl,
        timeRemaining,
      });
    }

    return updatedSession;
  } catch (error) {
    if (__DEV__) {
      console.error('⚠️ Error verificando sesión:', error);
    }

    // En caso de error, destruir y limpiar sesión por seguridad
    try {
      await odooApi.destroySession();
    } catch (e) {
      // Ignorar error de destroy
    }

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
 * @param maxAgeHours - Máximo de horas de vigencia (default: 4)
 * @returns true si la sesión está expirada
 */
export const isSessionExpiredByTime = (
  session: UserSession,
  maxAgeHours: number = SESSION_EXPIRY_HOURS
): boolean => {
  if (!session.loginTime) return true;

  const loginTime = new Date(session.loginTime).getTime();
  const now = new Date().getTime();
  const ageHours = (now - loginTime) / (1000 * 60 * 60);

  return ageHours >= maxAgeHours;
};

/**
 * 🆕 Obtiene el tiempo restante de sesión en formato legible
 * @param session - Sesión actual
 * @returns Texto con tiempo restante (ej: "2h 15m")
 */
export const getSessionTimeRemaining = (session: UserSession): string => {
  if (!session.loginTime) return 'Desconocido';

  const loginTime = new Date(session.loginTime).getTime();
  const now = new Date().getTime();
  const ageMs = now - loginTime;
  const expiryMs = SESSION_EXPIRY_HOURS * 60 * 60 * 1000;
  const remainingMs = expiryMs - ageMs;

  if (remainingMs <= 0) {
    return 'Expirada';
  }

  const hours = Math.floor(remainingMs / (1000 * 60 * 60));
  const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
};

/**
 * 🆕 Verifica si la sesión está cerca de expirar (menos de 30 minutos)
 * @param session - Sesión a verificar
 * @returns true si está cerca de expirar
 */
export const isSessionNearExpiry = (session: UserSession): boolean => {
  if (!session.loginTime) return true;

  const loginTime = new Date(session.loginTime).getTime();
  const now = new Date().getTime();
  const ageHours = (now - loginTime) / (1000 * 60 * 60);

  // Menos de 30 minutos restantes
  return ageHours >= (SESSION_EXPIRY_HOURS - 0.5);
};