/**
 * Gestor de dispositivos biométricos (versión local)
 */

import {
  checkBiometricAvailability,
  getBiometricTypeName,
} from './biometricAuth';
import {
  clearBiometricCredentials,
  getBiometricCredentials,
} from './biometricStorage';
import { BiometricDevice, mapCredentialsToDevice } from './deviceInfo';

/**
 * Obtiene la lista de dispositivos con biometría habilitada
 * (En versión local, solo retorna el dispositivo actual si existe)
 */
export const getBiometricDevices = async (): Promise<BiometricDevice[]> => {
  try {
    const credentials = await getBiometricCredentials();

    if (!credentials) {
      return [];
    }

    const availability = await checkBiometricAvailability();
    const biometricTypeName = getBiometricTypeName(availability.biometricType, availability.allTypes);

    const device = await mapCredentialsToDevice(credentials, biometricTypeName);

    return [device];
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error obteniendo dispositivos biométricos:', error);
    }
    return [];
  }
};

/**
 * Obtiene el dispositivo actual si tiene biometría habilitada
 */
export const getCurrentBiometricDevice = async (): Promise<BiometricDevice | null> => {
  try {
    const devices = await getBiometricDevices();
    return devices.length > 0 ? devices[0] : null;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error obteniendo dispositivo actual:', error);
    }
    return null;
  }
};

/**
 * Elimina la biometría del dispositivo actual
 */
export const removeBiometricFromCurrentDevice = async (): Promise<boolean> => {
  try {
    await clearBiometricCredentials();

    if (__DEV__) {
      console.log('✅ Biometría eliminada del dispositivo actual');
    }

    return true;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error eliminando biometría:', error);
    }
    return false;
  }
};

/**
 * Verifica si hay dispositivos con biometría habilitada
 */
export const hasBiometricDevices = async (): Promise<boolean> => {
  try {
    const devices = await getBiometricDevices();
    return devices.length > 0;
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene el conteo de dispositivos con biometría
 */
export const getBiometricDevicesCount = async (): Promise<number> => {
  try {
    const devices = await getBiometricDevices();
    return devices.length;
  } catch (error) {
    return 0;
  }
};