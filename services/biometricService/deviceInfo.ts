/**
 * Información del dispositivo para gestión de biometría
 */

import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { BiometricCredentials } from './types';

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
 * Obtiene información del dispositivo actual
 */
export const getDeviceInfo = async (): Promise<DeviceInfo> => {
  try {
    // Generar ID único del dispositivo
    const deviceId = Constants.sessionId || 
                     Constants.installationId || 
                     `${Platform.OS}-${Device.modelName}-${Date.now()}`;

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

    // Fallback
    return {
      deviceId: `${Platform.OS}-unknown-${Date.now()}`,
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