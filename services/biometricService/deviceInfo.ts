/**
 * Información del dispositivo para gestión de biometría
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { BiometricCredentials } from './types';

// Clave para almacenar UUID persistente en Keychain/SecureStore
const DEVICE_UUID_KEY = 'persistent_device_uuid';

/**
 * Información del dispositivo actual
 */
export interface DeviceInfo {
  deviceId: string;
  deviceName: string;
  platform: 'ios' | 'android' | 'web';
  osVersion: string;
  modelName: string;
  brand: string;
  isPhysicalDevice: boolean;
}

/**
 * Dispositivo biométrico registrado (vista local)
 */
export interface BiometricDevice extends DeviceInfo {
  enrolledAt: string;
  lastUsedAt?: string;
  biometricType: string;
  isCurrentDevice: boolean;
}

/**
 * Genera un UUID v4 único
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Obtiene o genera un UUID persistente del dispositivo
 * Este UUID sobrevive a reinstalaciones de la app (gracias al Keychain en iOS)
 */
const getPersistentDeviceUUID = async (): Promise<string> => {
  try {
    // Intentar recuperar UUID existente
    const existingUUID = await SecureStore.getItemAsync(DEVICE_UUID_KEY);

    if (existingUUID) {
      if (__DEV__) {
        console.log('🔑 UUID recuperado del Keychain:', existingUUID);
      }
      return existingUUID;
    }

    // No existe, generar uno nuevo
    const newUUID = generateUUID();

    if (__DEV__) {
      console.log('🆕 Generando nuevo UUID persistente:', newUUID);
    }

    // Guardar en Keychain/SecureStore
    // En iOS, esto persiste incluso después de desinstalar la app
    await SecureStore.setItemAsync(DEVICE_UUID_KEY, newUUID, {
      // iOS: kSecAttrAccessibleAfterFirstUnlock (persiste en Keychain)
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });

    if (__DEV__) {
      console.log('✅ UUID guardado en Keychain (persistirá entre reinstalaciones)');
    }

    return newUUID;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error gestionando UUID persistente:', error);
    }
    // Fallback: generar UUID temporal
    return generateUUID();
  }
};

/**
 * Obtiene información del dispositivo actual
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  try {
    // 🔧 ESTRATEGIA HÍBRIDA DE IDENTIFICACIÓN
    // Prioridad: UUID Persistente > Hardware ID > Fallback
    let deviceId: string;

    if (Platform.OS === 'ios') {
      // iOS: Usar UUID persistente en Keychain
      // Este UUID sobrevive a REINSTALACIONES de la app
      const persistentUUID = await getPersistentDeviceUUID();
      deviceId = `ios-${persistentUUID}`;

      if (__DEV__) {
        // También mostrar IDFV para comparación
        const Application = await import('expo-application');
        const idfv = await Application.getIosIdForVendorAsync();
        console.log('📱 iOS Device IDs:');
        console.log('   - UUID Persistente (usado):', persistentUUID);
        console.log('   - IDFV (referencia):', idfv);
      }
    } else if (Platform.OS === 'android') {
      // Android: ANDROID_ID ya es suficientemente persistente
      // Persiste hasta factory reset
      const Application = await import('expo-application');
      const androidId = Application.getAndroidId();

      if (androidId) {
        deviceId = `android-${androidId}`;
        if (__DEV__) {
          console.log('🤖 Android ID obtenido:', androidId);
        }
      } else {
        // Fallback: UUID persistente también para Android
        const persistentUUID = await getPersistentDeviceUUID();
        deviceId = `android-${persistentUUID}`;
        if (__DEV__) {
          console.warn('⚠️ ANDROID_ID no disponible, usando UUID persistente');
        }
      }
    } else {
      // Web u otra plataforma: UUID persistente
      const persistentUUID = await getPersistentDeviceUUID();
      deviceId = `${Platform.OS}-${persistentUUID}`;
      if (__DEV__) {
        console.log('🌐 Web/Otra plataforma, usando UUID persistente');
      }
    }

    if (__DEV__) {
      console.log('✅ Device ID Final (PERSISTENTE):', deviceId);
      console.log('📊 Comparación de IDs:');
      console.log('   - Device ID (usado):', deviceId);
      console.log('   - installationId:', Constants.installationId);
      console.log('   - sessionId:', Constants.sessionId);
    }

    return {
      deviceId,
      deviceName: Device.deviceName || 'Dispositivo Desconocido',
      platform: Platform.OS as 'ios' | 'android' | 'web',
      osVersion: Device.osVersion || 'Desconocido',
      modelName: Device.modelName || 'Modelo Desconocido',
      brand: Device.brand || 'Marca Desconocida',
      isPhysicalDevice: Device.isDevice,
    };
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error obteniendo info del dispositivo:', error);
    }

    // Fallback: UUID persistente o installationId
    let fallbackId: string;
    try {
      const persistentUUID = await getPersistentDeviceUUID();
      fallbackId = `${Platform.OS}-${persistentUUID}`;
    } catch {
      fallbackId = Constants.installationId || `${Platform.OS}-unknown-${Date.now()}`;
    }

    if (__DEV__) {
      console.warn('⚠️ Usando fallback ID:', fallbackId);
    }

    return {
      deviceId: fallbackId,
      deviceName: 'Dispositivo',
      platform: Platform.OS as 'ios' | 'android' | 'web',
      osVersion: 'Desconocido',
      modelName: 'Desconocido',
      brand: 'Desconocido',
      isPhysicalDevice: false,
    };
  }
};

/**
 * Formatea nombre del dispositivo para mostrar
 */
export const formatDeviceName = (device: DeviceInfo): string => {
  if (device.brand && device.modelName) {
    return `${device.brand} ${device.modelName}`;
  }
  if (device.deviceName) {
    return device.deviceName;
  }
  return 'Dispositivo';
};

/**
 * Formatea plataforma para mostrar
 */
export const formatPlatform = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case 'ios':
      return 'iOS';
    case 'android':
      return 'Android';
    case 'web':
      return 'Web';
    default:
      return platform;
  }
};

/**
 * Obtiene icono según la plataforma
 */
export const getPlatformIcon = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case 'ios':
      return 'logo-apple';
    case 'android':
      return 'logo-android';
    case 'web':
      return 'globe-outline';
    default:
      return 'phone-portrait-outline';
  }
};

/**
 * Combina credenciales biométricas con info del dispositivo
 */
export const mapCredentialsToDevice = async (
  credentials: BiometricCredentials,
  biometricTypeName: string
): Promise<BiometricDevice> => {
  const deviceInfo = await getDeviceInfo();

  return {
    ...deviceInfo,
    enrolledAt: credentials.enrolledAt,
    lastUsedAt: credentials.lastUsedAt,
    biometricType: biometricTypeName,
    isCurrentDevice: true, // Siempre true porque es local
  };
};