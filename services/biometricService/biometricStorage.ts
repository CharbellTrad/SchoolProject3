/**
 * Gestión de almacenamiento seguro para credenciales biométricas
 */

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import * as biometricOdooService from '../../services-odoo/biometricService';
import { BiometricCredentials } from './types';

// Claves de almacenamiento
const BIOMETRIC_KEY = 'biometric_credentials';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

/**
 * Guarda las credenciales biométricas de forma segura
 * @param username - Nombre de usuario
 * @param password - Contraseña (se guarda encriptada automáticamente por SecureStore)
 * @returns true si se guardó exitosamente
  */
export const saveBiometricCredentials = async (
  username: string,
  password: string, // 🆕 Ahora también guardamos la contraseña
  fullName: string,
  imageUrl?: string // Foto del usuario
): Promise<boolean> => {
  try {
    const credentials: BiometricCredentials = {
      username,
      password, // 🆕 SecureStore la encripta automáticamente
      fullName,
      imageUrl,
      isEnabled: true,
      enrolledAt: new Date().toISOString(),
      deviceInfo: 'mobile',
    };

    await SecureStore.setItemAsync(
      BIOMETRIC_KEY,
      JSON.stringify(credentials),
      {
        // 🆕 Requerir autenticación para acceder (extra seguridad)
        ...(Platform.OS === 'ios' && !__DEV__ && { requireAuthentication: true }),
      }
    );

    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');

    if (__DEV__) {
      console.log('✅ Credenciales biométricas guardadas:', username);
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error guardando credenciales biométricas:', error);
    }
    return false;
  }
};

/**
 * Obtiene las credenciales biométricas guardadas
 * @returns Credenciales o null si no existen
 */
export const getBiometricCredentials = async (): Promise<BiometricCredentials | null> => {
  try {
    const credentialsJson = await SecureStore.getItemAsync(BIOMETRIC_KEY, {
      // 🆕 Requerir autenticación biométrica para leer (extra seguridad)
      ...(Platform.OS === 'ios' && !__DEV__ && { requireAuthentication: true }),
    });

    if (!credentialsJson) {
      return null;
    }

    const credentials: BiometricCredentials = JSON.parse(credentialsJson);

    // Validar integridad
    if (!credentials.username || !credentials.password || !credentials.isEnabled) {
      if (__DEV__) {
        console.warn('⚠️ Credenciales biométricas inválidas, limpiando...');
      }
      await clearBiometricCredentials();
      return null;
    }

    return credentials;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error obteniendo credenciales biométricas:', error);
    }
    return null;
  }
};

/**
 * Actualiza el timestamp de último uso
 */
export const updateLastUsed = async (): Promise<void> => {
  try {
    const credentials = await getBiometricCredentials();

    if (!credentials) {
      return;
    }

    credentials.lastUsedAt = new Date().toISOString();

    await SecureStore.setItemAsync(
      BIOMETRIC_KEY,
      JSON.stringify(credentials)
    );
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error actualizando lastUsedAt:', error);
    }
  }
};

/**
 * Verifica si la biometría está habilitada
 * @returns true si está habilitada
 */
export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    const credentials = await getBiometricCredentials();

    return enabled === 'true' && credentials !== null;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error verificando biometría habilitada:', error);
    }
    return false;
  }
};

/**
 * Obtiene el username guardado para biometría
 * @returns Username o null
 */
export const getBiometricUsername = async (): Promise<string | null> => {
  try {
    const credentials = await getBiometricCredentials();
    return credentials?.username || null;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error obteniendo username biométrico:', error);
    }
    return null;
  }
};

/**
 * 🆕 Obtiene el nombre completo guardado para biometría
 * @returns Nombre completo o null
 */
export const getBiometricFullName = async (): Promise<string | null> => {
  try {
    const credentials = await getBiometricCredentials();
    return credentials?.fullName || null;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error obteniendo fullName biométrico:', error);
    }
    return null;
  }
};

/**
 * Obtiene la imagen del usuario guardada para biometría
 * @returns URL de imagen (base64) o null
 */
export const getBiometricUserImage = async (): Promise<string | null> => {
  try {
    const credentials = await getBiometricCredentials();
    return credentials?.imageUrl || null;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error obteniendo imagen biométrica:', error);
    }
    return null;
  }
};

/**
 * Elimina todas las credenciales biométricas
 */
export const clearBiometricCredentials = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
    await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);

    if (__DEV__) {
      console.log('🗑️ Credenciales biométricas eliminadas');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error eliminando credenciales biométricas:', error);
    }
  }
};

/**
 * Deshabilita la biometría sin eliminar las credenciales
 * (útil para pausar temporalmente)
 */
export const disableBiometric = async (): Promise<void> => {
  try {
    const credentials = await getBiometricCredentials();

    if (credentials) {
      credentials.isEnabled = false;
      await SecureStore.setItemAsync(
        BIOMETRIC_KEY,
        JSON.stringify(credentials)
      );
    }

    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');

    if (__DEV__) {
      console.log('🔒 Biometría deshabilitada');
    }
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error deshabilitando biometría:', error);
    }
  }
};

/**
 * 🆕 Actualiza la información del dispositivo al guardar credenciales
 * (Para mantener info actualizada cuando se habilita biometría)
 */
export const saveBiometricCredentialsWithDeviceInfo = async (
  username: string,
  password: string,
  fullName: string,
  imageUrl?: string // Foto del usuario
): Promise<boolean> => {
  try {
    // 1. Obtener información del dispositivo
    const { getDeviceInfo } = await import('./deviceInfo');
    const deviceInfo = await getDeviceInfo();

    // 2. Obtener tipo de biometría
    const { checkBiometricAvailability, getBiometricTypeName } = await import('./biometricAuth');
    const availability = await checkBiometricAvailability();
    const biometricTypeName = getBiometricTypeName(
      availability.biometricType,
      availability.allTypes
    );

    // 3. Guardar localmente PRIMERO (funcionalidad offline)
    const credentials: BiometricCredentials = {
      username,
      password,
      fullName,
      imageUrl,
      isEnabled: true,
      enrolledAt: new Date().toISOString(),
      lastUsedAt: undefined,
      deviceInfo: JSON.stringify(deviceInfo),
    };

    await SecureStore.setItemAsync(
      BIOMETRIC_KEY,
      JSON.stringify(credentials),
      {
        ...(Platform.OS === 'ios' && !__DEV__ && { requireAuthentication: true }),
      }
    );

    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');

    if (__DEV__) {
      console.log('✅ Credenciales guardadas localmente');
    }

    // 4. 🆕 Registrar dispositivo en backend de Odoo
    try {
      const payload: biometricOdooService.RegisterDevicePayload = {
        device_id: deviceInfo.deviceId,
        device_name: deviceInfo.deviceName,
        platform: deviceInfo.platform as 'ios' | 'android' | 'web',
        os_version: deviceInfo.osVersion,
        model_name: deviceInfo.modelName,
        brand: deviceInfo.brand,
        biometric_type: biometricOdooService.mapBiometricTypeToBackend(biometricTypeName) as any,
        biometric_type_display: biometricTypeName,
        is_physical_device: deviceInfo.isPhysicalDevice,
        device_info_json: JSON.stringify(deviceInfo),
      };

      const result = await biometricOdooService.registerDevice(payload);

      if (result.success) {
        if (__DEV__) {
          console.log('✅ Dispositivo registrado en Odoo:', result.data?.deviceName);
        }
      } else {
        if (__DEV__) {
          console.warn('⚠️ No se pudo registrar en Odoo (funcionalidad local OK):', result.error);
        }
        // No fallar si el backend falla - la funcionalidad local sigue funcionando
      }
    } catch (backendError) {
      if (__DEV__) {
        console.warn('⚠️ Error de Odoo (ignorado para funcionalidad local):', backendError);
      }
      // Continuar - el almacenamiento local es suficiente para que funcione
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error guardando credenciales:', error);
    }
    return false;
  }
};