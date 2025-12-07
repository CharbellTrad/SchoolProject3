/**
 * Operaciones de autenticación (Login/Logout)
 */

import { UserSession } from '../../types/auth';
import * as odooApi from '../apiService';
import { mapOdooRoleToAppRole } from './roleMapper';
import { clearUserSession, saveUserSession } from './sessionManager';
import { verifySession } from './sessionValidator';
import { LoginResult, OdooAuthResponse } from './types';

/**
 * Valida las credenciales antes de enviarlas
 * @param username - Nombre de usuario
 * @param password - Contraseña
 * @returns Mensaje de error o null si es válido
 */
const validateCredentials = (username: string, password: string): string | null => {
  if (!username.trim()) {
    return 'El nombre de usuario es requerido';
  }

  if (!password.trim()) {
    return 'La contraseña es requerida';
  }

  if (username.trim().length < 3) {
    return 'El nombre de usuario debe tener al menos 3 caracteres';
  }

  return null;
};

/**
 * Procesa la respuesta de autenticación de Odoo
 * @param authData - Datos de autenticación
 * @param sid - Session ID
 * @param username - Username original
 * @returns Sesión de usuario
 */
const processAuthResponse = async (
  authData: OdooAuthResponse,
  sid: string,
  username: string
): Promise<UserSession> => {

  if (__DEV__) {
    console.log('🔍 DEBUG - authData de Odoo:', {
      name: authData.name,
      username: authData.username,
      uid: authData.uid,
    });
  }
  const userRole = mapOdooRoleToAppRole(authData.role || '');

  // Intentar obtener la imagen del usuario
  let userImage: string | undefined;
  try {
    const imageResult = await odooApi.read(
      'res.partner',
      [authData.partner_id],
      ['image_1920']
    );

    if (imageResult.success && imageResult.data && imageResult.data.length > 0) {
      userImage = imageResult.data[0].image_1920 || undefined;
    }
  } catch (error) {
    if (__DEV__) {
      console.warn('⚠️ No se pudo obtener imagen durante login');
    }
  }

  return {
    id: authData.uid,
    username: authData.username || username,
    password: '', // No guardamos la contraseña
    email: authData.login || `${username}@school.com`,
    role: userRole,
    fullName: authData.name || username,
    createdAt: new Date().toISOString(),
    active: true,
    imageUrl: userImage,
    token: sid,
    loginTime: new Date().toISOString(),
    odooData: {
      uid: authData.uid,
      companyId: authData.company_id,
      partnerId: authData.partner_id,
      context: authData.user_context,
      originalRole: authData.role,
    },
  };
};

/**
 * Realiza el login con Odoo
 * @param username - Nombre de usuario
 * @param password - Contraseña
 * @returns Resultado del login con usuario si es exitoso
 */
export const login = async (
  username: string,
  password: string
): Promise<LoginResult> => {
  try {
    // 1. Validar credenciales
    const validationError = validateCredentials(username, password);
    if (validationError) {
      return {
        success: false,
        message: validationError,
      };
    }

    if (__DEV__) {
      console.log('🔐 Intentando login:', username);
    }

    // 2. Autenticar con Odoo
    const authResult = await odooApi.authenticate(username, password);

    if (!authResult.success) {
      const errorMsg = odooApi.extractOdooErrorMessage(authResult.error);

      // Mensajes de error amigables
      if (errorMsg.toLowerCase().includes('access denied') ||
        errorMsg.toLowerCase().includes('acceso denegado')) {
        return {
          success: false,
          message: 'Usuario o contraseña incorrectos',
        };
      }

      return {
        success: false,
        message: errorMsg || 'Error al iniciar sesión',
      };
    }

    const authData = authResult.data as OdooAuthResponse;
    const sid = authResult.sid;

    // 3. Validar respuesta completa
    if (!authData || !authData.uid || !sid) {
      return {
        success: false,
        message: 'Respuesta de autenticación incompleta',
      };
    }

    // 4. Verificar rol definido
    if (!authData.role || authData.role.trim() === '') {
      if (__DEV__) {
        console.warn('❌ Usuario sin rol definido:', {
          username: authData.username,
          uid: authData.uid,
        });
      }

      // Destruir la sesión
      await odooApi.destroySession();

      return {
        success: false,
        message: 'NO_ROLE_DEFINED',
      };
    }

    // 5. Crear sesión de usuario
    const userSession = await processAuthResponse(authData, sid, username);
    await saveUserSession(userSession);

    // 6. Verificar que la sesión se guardó correctamente
    if (__DEV__) {
      console.log('🔍 Verificando sesión recién creada...');
    }

    const validSession = await verifySession();

    if (!validSession) {
      if (__DEV__) {
        console.error('❌ La sesión no pudo ser verificada después del login');
      }

      await odooApi.destroySession();

      return {
        success: false,
        message: 'No se pudo establecer la sesión correctamente',
      };
    }

    if (__DEV__) {
      console.log('✅ Login exitoso:', {
        username: validSession.username,
        role: validSession.role,
        uid: authData.uid,
      });
    }

    return {
      success: true,
      user: validSession,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error inesperado en login:', error);
    }

    return {
      success: false,
      message: error.message || 'Error inesperado al iniciar sesión',
    };
  }
};

/**
 * Cierra la sesión del usuario
 */
export const logout = async (): Promise<void> => {
  try {
    if (__DEV__) {
      console.log('🔓 Cerrando sesión...');
    }

    // Destruir sesión en Odoo
    await odooApi.destroySession();

    // Limpiar sesión local
    await clearUserSession();

    if (__DEV__) {
      console.log('✅ Sesión cerrada correctamente');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('⚠️ Error durante logout:', error);
    }

    // Asegurar limpieza local incluso si falla Odoo
    await clearUserSession();
  }
};