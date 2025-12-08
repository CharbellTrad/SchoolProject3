/**
 * Servicio de logs de autenticación biométrica con Odoo
 */

import * as odooApi from '../apiService';
import {
  ApiResponse,
  AuthLogPayload,
  BiometricAuthLog,
  DeviceAuthStats,
  OperationResult,
} from './types';

// ============================================
// TIPOS DE RESPUESTA
// ============================================

/**
 * Respuesta paginada de historial
 */
export interface AuthHistoryPaginatedResponse {
  records: BiometricAuthLog[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// ============================================
// LOGS DE AUTENTICACIÓN
// ============================================

/**
 * Registra un log de autenticación biométrica
 * @param payload - Datos del intento de autenticación
 * @returns Resultado de la operación
 */
export const logAuthentication = async (
  payload: AuthLogPayload
): Promise<OperationResult> => {
  try {
    if (__DEV__) {
      console.log(
        `📡 [Odoo] Registrando log de autenticación (${payload.success ? 'exitoso' : 'fallido'})...`
      );
    }

    const result = await odooApi.callMethod(
      'biometric.auth.log',
      'log_authentication',
      [],
      {
        device_id: payload.device_id,
        success: payload.success,
        error_info: payload.error_info,
        session_id: payload.session_id,
        duration_ms: payload.duration_ms,
      }
    );

    if (!result.success) {
      // Si es sesión expirada, no loguear (handleSessionExpired() ya lo manejó)
      if (result.error?.isSessionExpired) {
        return {
          success: false,
          error: 'Sesión expirada',
          isSessionExpired: true,
        };
      }
      const errorMsg = odooApi.extractOdooErrorMessage(result.error);
      if (__DEV__) {
        console.error('❌ [Odoo] Error registrando log:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    if (__DEV__) {
      console.log('✅ [Odoo] Log registrado exitosamente');
    }

    return {
      success: true,
      message: 'Log registrado correctamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado registrando log:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};

/**
 * Obtiene el historial de autenticaciones del usuario actual con paginación
 * @param limit - Número máximo de registros por página
 * @param offset - Desplazamiento para paginación
 * @returns Historial de autenticaciones con info de paginación
 */
export const getAuthHistory = async (
  limit: number = 20,
  offset: number = 0
): Promise<ApiResponse<AuthHistoryPaginatedResponse>> => {
  try {
    if (__DEV__) {
      console.log(`📡 [Odoo] Obteniendo historial (limit: ${limit}, offset: ${offset})...`);
    }

    const result = await odooApi.callMethod(
      'biometric.auth.log',
      'get_user_auth_history',
      [],
      { limit, offset }
    );

    if (!result.success) {
      // Si es sesión expirada, no loguear (handleSessionExpired() ya lo manejó)
      if (result.error?.isSessionExpired) {
        return {
          success: false,
          error: 'Sesión expirada',
          isSessionExpired: true,
        };
      }
      const errorMsg = odooApi.extractOdooErrorMessage(result.error);
      if (__DEV__) {
        console.error('❌ [Odoo] Error obteniendo historial:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    const data = result.data as AuthHistoryPaginatedResponse;

    if (__DEV__) {
      console.log(`✅ [Odoo] ${data.records?.length || 0} log(s) obtenido(s), total: ${data.total}`);
    }

    return {
      success: true,
      data: data,
      count: data.total,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado obteniendo historial:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};

/**
 * Obtiene estadísticas de autenticación de un dispositivo
 * @param deviceId - ID del dispositivo en Odoo
 * @returns Estadísticas del dispositivo
 */
export const getDeviceStats = async (
  deviceId: number
): Promise<ApiResponse<DeviceAuthStats>> => {
  try {
    if (__DEV__) {
      console.log(`📡 [Odoo] Obteniendo estadísticas del dispositivo ${deviceId}...`);
    }

    const result = await odooApi.callMethod(
      'biometric.auth.log',
      'get_device_auth_stats',
      [deviceId],
      {}
    );

    if (!result.success) {
      // Si es sesión expirada, no loguear (handleSessionExpired() ya lo manejó)
      if (result.error?.isSessionExpired) {
        return {
          success: false,
          error: 'Sesión expirada',
          isSessionExpired: true,
        };
      }
      const errorMsg = odooApi.extractOdooErrorMessage(result.error);
      if (__DEV__) {
        console.error('❌ [Odoo] Error obteniendo estadísticas:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    if (__DEV__) {
      console.log('✅ [Odoo] Estadísticas obtenidas');
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado obteniendo estadísticas:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};

// ============================================
// HELPERS
// ============================================

/**
 * Crea un payload de log desde información local
 */
export const createAuthLogPayload = (
  deviceId: number,
  success: boolean,
  options?: {
    errorCode?: string;
    errorMessage?: string;
    sessionId?: string;
    durationMs?: number;
  }
): AuthLogPayload => {
  const payload: AuthLogPayload = {
    device_id: deviceId,
    success,
  };

  if (!success && (options?.errorCode || options?.errorMessage)) {
    payload.error_info = {
      code: options.errorCode || 'UNKNOWN',
      message: options.errorMessage || 'Error desconocido',
    };
  }

  if (options?.sessionId) {
    payload.session_id = options.sessionId;
  }

  if (options?.durationMs) {
    payload.duration_ms = options.durationMs;
  }

  return payload;
};

// ============================================
// GESTIÓN DE SESIONES
// ============================================

/**
 * Registra un login tradicional (usuario/contraseña)
 * @param sessionId - ID de sesión opcional
 * @param deviceInfo - Info del dispositivo
 * @returns Resultado de la operación
 */
export const logTraditionalLogin = async (
  sessionId?: string,
  deviceInfo?: { device_name: string; platform: string; device_id?: string }
): Promise<OperationResult> => {
  try {
    if (__DEV__) {
      console.log('📡 [Odoo] Registrando login tradicional...');
    }

    const result = await odooApi.callMethod(
      'biometric.auth.log',
      'log_traditional_login',
      [],
      { session_id: sessionId, device_info: deviceInfo }
    );

    if (!result.success) {
      // Si es sesión expirada, no loguear (handleSessionExpired() ya lo manejó)
      if (result.error?.isSessionExpired) {
        return {
          success: false,
          error: 'Sesión expirada',
          isSessionExpired: true,
        };
      }
      const errorMsg = odooApi.extractOdooErrorMessage(result.error);
      if (__DEV__) {
        console.error('❌ [Odoo] Error registrando login tradicional:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    if (__DEV__) {
      console.log('✅ [Odoo] Login tradicional registrado');
    }

    return {
      success: true,
      message: 'Login registrado correctamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};

/**
 * Marca la sesión actual como finalizada (llamar al logout)
 * 🔧 CORREGIDO: Ahora verifica result.data para el resultado del método Odoo
 * @param sessionId - ID de sesión opcional
 * @returns Resultado de la operación
 */
export const endSession = async (
  sessionId?: string,
  deviceId?: string
): Promise<OperationResult> => {
  try {
    if (__DEV__) {
      console.log('📡 [Odoo] Finalizando sesión...');
    }

    const result = await odooApi.callMethod(
      'biometric.auth.log',
      'end_session',
      [],
      { session_id: sessionId, device_uuid: deviceId }
    );

    // 🔍 LOGGING DETALLADO PARA DEBUG
    if (__DEV__) {
      console.log('📡 [Odoo] endSession - HTTP success:', result.success);
      console.log('📡 [Odoo] endSession - result.data:', JSON.stringify(result.data));
    }

    // 1. Verificar si la llamada HTTP falló
    if (!result.success) {
      // Si es sesión expirada, no loguear (handleSessionExpired() ya lo manejó)
      if (result.error?.isSessionExpired) {
        return {
          success: false,
          error: 'Sesión expirada',
          isSessionExpired: true,
        };
      }
      const errorMsg = odooApi.extractOdooErrorMessage(result.error);
      if (__DEV__) {
        console.error('❌ [Odoo] Error HTTP en endSession:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    // 2. Verificar el resultado del método Odoo (viene en result.data)
    const methodResult = result.data;

    if (methodResult && methodResult.success) {
      if (__DEV__) {
        console.log(`✅ [Odoo] Sesiones finalizadas: ${methodResult.sessions_ended || 0}`);
      }
      return {
        success: true,
        message: `${methodResult.sessions_ended || 0} sesión(es) finalizada(s)`,
      };
    } else if (methodResult && methodResult.success === false) {
      // El método Odoo retornó un error explícito
      if (__DEV__) {
        console.error('❌ [Odoo] El método end_session falló:', methodResult.error);
      }
      return {
        success: false,
        error: methodResult.error || 'Error finalizando sesión en Odoo',
      };
    } else {
      // Caso legacy: result.data no es el formato esperado pero la llamada fue exitosa
      if (__DEV__) {
        console.log('✅ [Odoo] Sesión finalizada (respuesta legacy)');
      }
      return {
        success: true,
        message: 'Sesión finalizada correctamente',
      };
    }
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado en endSession:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};

/**
 * Obtiene las sesiones activas del usuario
 * @returns Lista de sesiones activas
 */
export const getActiveSessions = async (): Promise<ApiResponse<BiometricAuthLog[]>> => {
  try {
    if (__DEV__) {
      console.log('📡 [Odoo] Obteniendo sesiones activas...');
    }

    const result = await odooApi.callMethod(
      'biometric.auth.log',
      'get_active_sessions',
      [],
      {}
    );

    if (!result.success) {
      // Si es sesión expirada, no loguear (handleSessionExpired() ya lo manejó)
      if (result.error?.isSessionExpired) {
        return {
          success: false,
          error: 'Sesión expirada',
          isSessionExpired: true,
        };
      }
      const errorMsg = odooApi.extractOdooErrorMessage(result.error);
      if (__DEV__) {
        console.error('❌ [Odoo] Error obteniendo sesiones:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    if (__DEV__) {
      console.log(`✅ [Odoo] ${(result.data || []).length} sesión(es) activa(s)`);
    }

    return {
      success: true,
      data: result.data || [],
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};