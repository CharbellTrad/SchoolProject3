import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSession } from '../types/auth';
import * as odooApi from './apiService';

const USER_SESSION_KEY = '@odoo_user_session';

/**
 * Mapeo de roles de Odoo a roles de la aplicación
 */
const mapOdooRoleToAppRole = (
  odooRole: string
): 'admin' | 'teacher' | 'student' | 'employee' => {
  const roleMap: Record<string, 'admin' | 'teacher' | 'student' | 'employee'> = {
    'administrativo': 'admin',
    'docente': 'teacher',
    'obrero': 'employee',
    'cenar': 'employee',
  };

  return roleMap[odooRole] || 'employee';
};

/**
 * Estructura de respuesta de autenticación de Odoo
 */
interface OdooAuthResponse {
  uid: number;
  username: string;
  name: string;
  user_context: Record<string, any>;
  company_id: number;
  partner_id: number;
  role?: string; // El role que devuelve tu API
  [key: string]: any;
}

/**
 * Login con Odoo
 * @param username - Nombre de usuario
 * @param password - Contraseña
 * @returns Objeto con success, user y message
 */
export const login = async (
  username: string,
  password: string
): Promise<{ success: boolean; user?: UserSession; message?: string }> => {
  try {
    // Validaciones básicas
    if (!username.trim() || !password.trim()) {
      return {
        success: false,
        message: 'Usuario y contraseña son requeridos',
      };
    }

    // Intentar autenticar con Odoo
    const authResult = await odooApi.authenticate(username, password);

    if (!authResult.success) {
      const errorMsg = odooApi.extractOdooErrorMessage(authResult.error);
      
      // Mensajes de error más amigables
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

    // Verificar que tengamos los datos necesarios
    if (!authData || !authData.uid || !sid) {
      return {
        success: false,
        message: 'Respuesta de autenticación incompleta',
      };
    }

    // Verificar que el usuario tenga un rol definido
    if (!authData.role || authData.role.trim() === '') {
      if (__DEV__) {
        console.log('❌ Usuario sin rol definido:', {
          username: authData.username,
          uid: authData.uid,
        });
      }

      // Destruir la sesión antes de retornar el error
      await odooApi.destroySession();

      return {
        success: false,
        message: 'NO_ROLE_DEFINED',
      };
    }

    // Determinar el rol del usuario (ya validamos que existe)
    const userRole = mapOdooRoleToAppRole(authData.role);

    // Crear sesión de usuario
    const userSession: UserSession = {
      id: authData.uid,
      username: authData.username || username,
      password: '', // No guardamos la contraseña
      email: authData.login || `${username}@school.com`,
      role: userRole,
      fullName: authData.name || username,
      createdAt: new Date().toISOString(),
      active: true,
      token: sid, // Usamos el SID como token
      loginTime: new Date().toISOString(),
      // Datos adicionales de Odoo
      odooData: {
        uid: authData.uid,
        companyId: authData.company_id,
        partnerId: authData.partner_id,
        context: authData.user_context,
        originalRole: authData.role,
      },
    };

    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(userSession));

    if (__DEV__) {
      console.log('✅ Login exitoso:', {
        username: userSession.username,
        role: userSession.role,
        uid: authData.uid,
      });
    }

    return {
      success: true,
      user: userSession,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.log('❌ Error en login:', error);
    }
    return {
      success: false,
      message: error.message || 'Error inesperado al iniciar sesión',
    };
  }
};

/**
 * Logout - Cierra la sesión
 */
export const logout = async (): Promise<void> => {
  try {
    if (__DEV__) {
      console.log('🔐 Cerrando sesión...');
    }

    await odooApi.destroySession();
    await AsyncStorage.multiRemove([USER_SESSION_KEY]);

    if (__DEV__) {
      console.log('✅ Sesión cerrada correctamente');
    }
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error durante logout:', error);
    }
    
    await AsyncStorage.multiRemove([USER_SESSION_KEY]);
  }
};

/**
 * Verifica si la sesión actual es válida
 * @returns UserSession si es válida, null si no lo es
 */
export const verifySession = async (): Promise<UserSession | null> => {
  try {
    // Verificar si hay sesión guardada localmente
    const savedSession = await getSavedUserSession();

    if (!savedSession) {
      if (__DEV__) {
        console.log('🔐 No hay sesión guardada localmente');
      }
      return null;
    }

    const verifyResult = await odooApi.verifySession();

    if (!verifyResult.success) {
      if (__DEV__) {
        console.log('🔐 Sesión expirada en Odoo');
      }
      
      await AsyncStorage.removeItem(USER_SESSION_KEY);
      return null;
    }

    const sessionData = verifyResult.data;

    if (sessionData.uid !== savedSession.id) {
      if (__DEV__) {
        console.log('⚠️ UID no coincide, limpiando sesión');
      }
      await AsyncStorage.removeItem(USER_SESSION_KEY);
      return null;
    }

    const updatedSession: UserSession = {
      ...savedSession,
      fullName: sessionData.name || savedSession.fullName,
      odooData: {
        ...savedSession.odooData,
        context: sessionData.user_context,
      },
    };

    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedSession));

    if (__DEV__) {
      console.log('✅ Sesión válida:', {
        username: updatedSession.username,
        role: updatedSession.role,
      });
    }

    return updatedSession;
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error verificando sesión:', error);
    }
    
    // En caso de error, limpiar sesión local
    await AsyncStorage.removeItem(USER_SESSION_KEY);
    return null;
  }
};

/**
 * Obtiene la sesión de usuario guardada localmente
 * @returns UserSession si existe, null si no
 */
export const getSavedUserSession = async (): Promise<UserSession | null> => {
  try {
    const sessionString = await AsyncStorage.getItem(USER_SESSION_KEY);

    if (!sessionString) {
      return null;
    }

    const session: UserSession = JSON.parse(sessionString);

    if (!session.id || !session.username || !session.token) {
      if (__DEV__) {
        console.log('⚠️ Sesión guardada incompleta, limpiando...');
      }
      await AsyncStorage.removeItem(USER_SESSION_KEY);
      return null;
    }

    return session;
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error obteniendo sesión guardada:', error);
    }
    return null;
  }
};

/**
 * Actualiza la información del usuario en la sesión
 * @param updates - Campos a actualizar
 */
export const updateUserSession = async (
  updates: Partial<UserSession>
): Promise<boolean> => {
  try {
    const currentSession = await getSavedUserSession();

    if (!currentSession) {
      return false;
    }

    const updatedSession: UserSession = {
      ...currentSession,
      ...updates,
    };

    await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(updatedSession));

    if (__DEV__) {
      console.log('✅ Sesión actualizada');
    }
    return true;
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error actualizando sesión:', error);
    }
    return false;
  }
};

/**
 * Verifica la salud del servidor Odoo
 * @returns true si el servidor está disponible
 */
export const checkServerHealth = async (): Promise<{ ok: boolean; error?: any }> => {
  try {
    const isConnected = await odooApi.checkOdooConnection();

    if (__DEV__) {
      if (isConnected) {
        console.log('✅ Servidor Odoo disponible');
      } else {
        console.log('❌ Servidor Odoo no disponible');
      }
    }

    return { ok: isConnected };
  } catch (error) {
    if (__DEV__) {
      console.log('❌ Error verificando servidor:', error);
    }
    return { ok: false, error };
  }
};


/**
 * Obtiene información adicional del usuario desde Odoo
 * Solo para usuarios autenticados
 */
export const getUserInfo = async (): Promise<{ success: boolean; data?: any; error?: any }> => {
  try {
    const session = await getSavedUserSession();

    if (!session || !session.odooData) {
      return {
        success: false,
        error: { message: 'No hay sesión activa' },
      };
    }

    // Leer información del partner asociado
    const result = await odooApi.read(
      'res.partner',
      [session.odooData.partnerId],
      ['name', 'email', 'phone', 'mobile', 'street', 'city']
    );

    return result;
  } catch (error: any) {
    return {
      success: false,
      error: { message: error.message },
    };
  }
};

/**
 * Cambia la contraseña del usuario actual
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<{ success: boolean; message?: string }> => {
  try {
    const session = await getSavedUserSession();

    if (!session) {
      return {
        success: false,
        message: 'No hay sesión activa',
      };
    }

    // Validar contraseña actual intentando autenticar
    const authResult = await odooApi.authenticate(session.username, currentPassword);

    if (!authResult.success) {
      return {
        success: false,
        message: 'Contraseña actual incorrecta',
      };
    }

    // Cambiar contraseña usando método de Odoo
    const changeResult = await odooApi.callMethod(
      'res.users',
      'change_password',
      [[session.id], newPassword],
      {}
    );

    if (!changeResult.success) {
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(changeResult.error),
      };
    }

    return {
      success: true,
      message: 'Contraseña cambiada exitosamente',
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Error al cambiar contraseña',
    };
  }
};

// Exportar también las funciones del apiService para facilitar el uso
export { checkOdooConnection } from './apiService';

