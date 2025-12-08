/**
 * Servicio de gestión de dispositivos biométricos con Odoo
 */

import * as odooApi from '../apiService';
import {
  ApiResponse,
  BiometricDeviceBackend,
  OperationResult,
  RegisterDevicePayload,
} from './types';

// ============================================
// GESTIÓN DE DISPOSITIVOS
// ============================================

/**
 * Registra un nuevo dispositivo biométrico en el backend
 * @param deviceData - Información del dispositivo
 * @returns Dispositivo registrado
 */
export const registerDevice = async (
  deviceData: RegisterDevicePayload
): Promise<ApiResponse<BiometricDeviceBackend>> => {
  try {
    if (__DEV__) {
      console.log('📡 [Odoo] Registrando dispositivo:', deviceData.device_name);
    }

    const result = await odooApi.callMethod(
      'biometric.device',
      'register_device',
      [],
      deviceData
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
        console.error('❌ [Odoo] Error registrando dispositivo:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    if (__DEV__) {
      console.log('✅ [Odoo] Dispositivo registrado:', result.data?.deviceName);
    }

    return {
      success: true,
      data: result.data,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado registrando dispositivo:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};


/**
 * Convierte fecha de Odoo (UTC sin Z) a formato ISO correcto
 */
const parseOdooDate = (odooDate: string | null | undefined): string | undefined => {
  if (!odooDate) return undefined;

  try {
    // Odoo envía fechas en UTC pero sin el sufijo 'Z'
    // Formato: "2025-12-06T06:08:20"
    // Necesitamos agregarlo para que JS lo interprete como UTC

    if (odooDate.includes('Z') || odooDate.includes('+')) {
      // Ya tiene zona horaria
      return odooDate;
    }

    // Agregar 'Z' para indicar que es UTC
    return odooDate + 'Z';
  } catch {
    return odooDate;
  }
};


/**
 * Obtiene todos los dispositivos del usuario actual
 * @param currentDeviceId - ID del dispositivo actual para marcarlo
 * @returns Lista de dispositivos
 */
export const getUserDevices = async (
  currentDeviceId?: string
): Promise<ApiResponse<BiometricDeviceBackend[]>> => {
  try {
    if (__DEV__) {
      console.log('📡 [Odoo] Obteniendo dispositivos del usuario...');
    }

    const result = await odooApi.callMethod(
      'biometric.device',
      'get_user_devices',
      [],
      { current_device_id: currentDeviceId }
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
        console.error('❌ [Odoo] Error obteniendo dispositivos:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    const devices: BiometricDeviceBackend[] = result.data || [];

    // Mapear las fechas para agregar 'Z' y convertir a UTC correctamente
    const devicesWithFixedDates = devices.map(device => ({
      ...device,
      enrolledAt: parseOdooDate(device.enrolledAt),
      lastUsedAt: parseOdooDate(device.lastUsedAt),
    }));

    if (__DEV__) {
      console.log(`✅ [Odoo] ${devicesWithFixedDates.length} dispositivo(s) obtenido(s)`);
    }

    return {
      success: true,
      data: devicesWithFixedDates,
      count: devicesWithFixedDates.length,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado obteniendo dispositivos:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};


/**
 * Valida que un dispositivo esté activo y habilitado en Odoo
 * Usado después del login biométrico para verificar que el dispositivo sigue autorizado
 * @param deviceId - ID único del dispositivo (generado por la app)
 * @returns Resultado de la validación
 */
export const validateDevice = async (
  deviceId: string
): Promise<{ valid: boolean; deviceOdooId: number | null; message: string; isSessionExpired?: boolean }> => {
  try {
    if (__DEV__) {
      console.log('📡 [Odoo] Validando dispositivo:', deviceId);
    }

    const result = await odooApi.callMethod(
      'biometric.device',
      'validate_device',
      [],
      { device_id: deviceId }
    );

    if (!result.success) {
      // Si es sesión expirada, no loguear (handleSessionExpired() ya lo manejó)
      if (result.error?.isSessionExpired) {
        return {
          valid: false,
          deviceOdooId: null,
          message: 'Sesión expirada',
          isSessionExpired: true,
        };
      }
      const errorMsg = odooApi.extractOdooErrorMessage(result.error);
      if (__DEV__) {
        console.error('❌ [Odoo] Error validando dispositivo:', errorMsg);
      }
      return {
        valid: false,
        deviceOdooId: null,
        message: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    const data = result.data as {
      valid: boolean;
      device_odoo_id: number | null;
      message: string;
    };

    if (__DEV__) {
      console.log(`✅ [Odoo] Dispositivo ${data.valid ? 'válido' : 'NO válido'}:`, data.message);
    }

    return {
      valid: data.valid,
      deviceOdooId: data.device_odoo_id,
      message: data.message,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado validando dispositivo:', error);
    }
    return {
      valid: false,
      deviceOdooId: null,
      message: error.message || 'Error desconocido',
    };
  }
};

/**
 * Obtiene información de un dispositivo específico por su ID de Odoo
 * @param deviceId - ID del dispositivo en Odoo
 * @returns Información del dispositivo
 */
export const getDeviceById = async (
  deviceId: number
): Promise<ApiResponse<BiometricDeviceBackend>> => {
  try {
    if (__DEV__) {
      console.log(`📡 [Odoo] Obteniendo dispositivo ${deviceId}...`);
    }

    const result = await odooApi.read('biometric.device', [deviceId], [
      'device_id',
      'device_name',
      'platform',
      'os_version',
      'model_name',
      'brand',
      'is_physical_device',
      'biometric_type_display',
      'state',
      'is_enabled',
      'enrolled_at',
      'last_used_at',
      'auth_count',
      'is_recently_used',
      'is_stale',
      'days_since_last_use',
      'device_info_json',
      'notes'
    ]);

    if (!result.success || !result.data || result.data.length === 0) {
      return {
        success: false,
        error: 'Dispositivo no encontrado',
      };
    }

    const device = mapOdooDeviceToFrontend(result.data[0]);

    if (__DEV__) {
      console.log('✅ [Odoo] Dispositivo obtenido:', device.deviceName);
    }

    return {
      success: true,
      data: device,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error obteniendo dispositivo:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};

/**
 * Revoca el acceso de un dispositivo
 * @param deviceId - ID del dispositivo en Odoo
 * @returns Resultado de la operación
 */
export const revokeDevice = async (
  deviceId: number
): Promise<OperationResult> => {
  try {
    if (__DEV__) {
      console.log(`📡 [Odoo] Revocando dispositivo ${deviceId}...`);
    }

    const result = await odooApi.callMethod(
      'biometric.device',
      'action_revoke',
      [[deviceId]],
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
        console.error('❌ [Odoo] Error revocando dispositivo:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    if (__DEV__) {
      console.log('✅ [Odoo] Dispositivo revocado exitosamente');
    }

    return {
      success: true,
      message: 'Dispositivo revocado exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado revocando dispositivo:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};

/**
 * Reactiva un dispositivo previamente revocado
 * @param deviceId - ID del dispositivo en Odoo
 * @returns Resultado de la operación
 */
export const activateDevice = async (
  deviceId: number
): Promise<OperationResult> => {
  try {
    if (__DEV__) {
      console.log(`📡 [Odoo] Activando dispositivo ${deviceId}...`);
    }

    const result = await odooApi.callMethod(
      'biometric.device',
      'action_activate',
      [[deviceId]],
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
        console.error('❌ [Odoo] Error activando dispositivo:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    if (__DEV__) {
      console.log('✅ [Odoo] Dispositivo activado exitosamente');
    }

    return {
      success: true,
      message: 'Dispositivo activado exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ [Odoo] Error inesperado activando dispositivo:', error);
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
 * Mapea un dispositivo de Odoo (snake_case) a formato frontend (camelCase)
 */
const mapOdooDeviceToFrontend = (odooDevice: any): BiometricDeviceBackend => {
  return {
    id: odooDevice.id,
    deviceId: odooDevice.device_id,
    deviceName: odooDevice.device_name,
    platform: odooDevice.platform,
    osVersion: odooDevice.os_version,
    modelName: odooDevice.model_name,
    brand: odooDevice.brand,
    isPhysicalDevice: odooDevice.is_physical_device,
    biometricType: odooDevice.biometric_type_display || odooDevice.biometric_type,
    state: odooDevice.state,
    isEnabled: odooDevice.is_enabled,
    isCurrentDevice: odooDevice.is_current_device || false,
    enrolledAt: odooDevice.enrolled_at,
    lastUsedAt: odooDevice.last_used_at,
    authCount: odooDevice.auth_count || 0,
    isRecentlyUsed: odooDevice.is_recently_used || false,
    isStale: odooDevice.is_stale || false,
    daysSinceLastUse: odooDevice.days_since_last_use || 0,
    hasActiveSession: odooDevice.has_active_session || false, // Asegurar que mapemos esto si viene
    device_info_json: odooDevice.device_info_json,
    notes: odooDevice.notes,
  };
};

/**
 * Mapea tipo de biometría local a formato backend
 */
export const mapBiometricTypeToBackend = (type: string): string => {
  const typeLower = type.toLowerCase();

  if (typeLower.includes('face') || typeLower.includes('facial')) {
    return 'facial_recognition';
  }
  if (typeLower.includes('touch') || typeLower.includes('huella') || typeLower.includes('finger')) {
    return 'fingerprint';
  }
  if (typeLower.includes('iris')) {
    return 'iris';
  }

  return 'unknown';
};