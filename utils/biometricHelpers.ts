/**
 * Funciones auxiliares para gestión de dispositivos biométricos
 */

import { Ionicons } from '@expo/vector-icons';
import { BiometricDevice } from '../services/biometricService';
import { formatTimeAgo } from './formatHelpers';


/**
 * Obtiene el icono correcto según el tipo de biometría
 */
export const getBiometricIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  if (type === 'Face ID') return 'scan';
  if (type === 'Touch ID') return 'finger-print';
  if (type.includes('Huella')) return 'finger-print';
  if (type.includes('Facial')) return 'scan';
  if (type.includes('Iris')) return 'eye';
  return 'shield-checkmark';
};


/**
 * Formatea la fecha de inscripción
 */
export const formatEnrolledDate = (enrolledAt: string): string => {
  try {
    return formatTimeAgo(enrolledAt);
  } catch (error) {
    return 'Fecha desconocida';
  }
};

/**
 * Formatea la fecha de último uso
 */
export const formatLastUsed = (lastUsedAt?: string): string => {
  if (!lastUsedAt) {
    return 'Nunca usado';
  }

  try {
    return formatTimeAgo(lastUsedAt);
  } catch (error) {
    return 'Fecha desconocida';
  }
};

/**
 * Obtiene un texto descriptivo del dispositivo
 */
export const getDeviceDescription = (device: BiometricDevice): string => {
  const parts = [];

  if (device.brand && device.modelName) {
    parts.push(`${device.brand} ${device.modelName}`);
  } else if (device.deviceName) {
    parts.push(device.deviceName);
  }

  if (device.osVersion) {
    const platform = device.platform === 'ios' ? 'iOS' : 'Android';
    parts.push(`${platform} ${device.osVersion}`);
  }

  return parts.join(' • ');
};

/**
 * Determina si un dispositivo fue usado recientemente (últimas 24h)
 */
export const wasUsedRecently = (device: BiometricDevice): boolean => {
  if (!device.lastUsedAt) {
    return false;
  }

  try {
    const lastUsed = new Date(device.lastUsedAt).getTime();
    const now = new Date().getTime();
    const hoursDiff = (now - lastUsed) / (1000 * 60 * 60);

    return hoursDiff <= 24;
  } catch (error) {
    return false;
  }
};

/**
 * Determina si un dispositivo es antiguo (más de 30 días sin usar)
 */
export const isStaleDevice = (device: BiometricDevice): boolean => {
  if (!device.lastUsedAt) {
    // Si nunca se usó, verificar fecha de inscripción
    try {
      const enrolled = new Date(device.enrolledAt).getTime();
      const now = new Date().getTime();
      const daysDiff = (now - enrolled) / (1000 * 60 * 60 * 24);
      return daysDiff > 30;
    } catch (error) {
      return false;
    }
  }

  try {
    const lastUsed = new Date(device.lastUsedAt).getTime();
    const now = new Date().getTime();
    const daysDiff = (now - lastUsed) / (1000 * 60 * 60 * 24);

    return daysDiff > 30;
  } catch (error) {
    return false;
  }
};

/**
 * Obtiene un color de indicador según el estado del dispositivo
 */
export const getDeviceStatusColor = (device: BiometricDevice): string => {
  if (wasUsedRecently(device)) {
    return '#10b981'; // Verde - Activo recientemente
  }

  if (isStaleDevice(device)) {
    return '#f59e0b'; // Amarillo - Inactivo por mucho tiempo
  }

  return '#3b82f6'; // Azul - Estado normal
};

/**
 * Obtiene un texto de estado del dispositivo
 */
export const getDeviceStatusText = (device: BiometricDevice): string => {
  if (device.isCurrentDevice) {
    return 'Este dispositivo';
  }

  if (wasUsedRecently(device)) {
    return 'Activo recientemente';
  }

  if (isStaleDevice(device)) {
    return 'Inactivo';
  }

  return 'Activo';
};

/**
 * Genera un identificador corto del dispositivo
 */
export const getShortDeviceId = (deviceId: string): string => {
  if (deviceId.length <= 8) {
    return deviceId;
  }

  return `${deviceId.slice(0, 4)}...${deviceId.slice(-4)}`;
};

/**
 * Ordena dispositivos según criterio
 */
export const sortDevices = (
  devices: BiometricDevice[],
  sortBy: 'enrolledAt' | 'lastUsedAt' | 'deviceName' = 'enrolledAt',
  order: 'asc' | 'desc' = 'desc'
): BiometricDevice[] => {
  const sorted = [...devices].sort((a, b) => {
    let compareValue = 0;

    switch (sortBy) {
      case 'enrolledAt':
        compareValue = new Date(a.enrolledAt).getTime() - new Date(b.enrolledAt).getTime();
        break;

      case 'lastUsedAt':
        const aTime = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
        const bTime = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
        compareValue = aTime - bTime;
        break;

      case 'deviceName':
        compareValue = a.deviceName.localeCompare(b.deviceName);
        break;
    }

    return order === 'desc' ? -compareValue : compareValue;
  });

  return sorted;
};

/**
 * Filtra dispositivos según query de búsqueda
 */
export const filterDevices = (
  devices: BiometricDevice[],
  searchQuery: string
): BiometricDevice[] => {
  if (!searchQuery || searchQuery.trim() === '') {
    return devices;
  }

  const query = searchQuery.toLowerCase().trim();

  return devices.filter(device => {
    return (
      device.deviceName.toLowerCase().includes(query) ||
      device.modelName.toLowerCase().includes(query) ||
      device.brand.toLowerCase().includes(query) ||
      device.platform.toLowerCase().includes(query) ||
      device.biometricType.toLowerCase().includes(query)
    );
  });
};

/**
 * Obtiene estadísticas de dispositivos
 */
export const getDeviceStats = (devices: BiometricDevice[]): {
  total: number;
  recentlyUsed: number;
  stale: number;
  currentDevice?: BiometricDevice;
} => {
  const currentDevice = devices.find(d => d.isCurrentDevice);
  const recentlyUsed = devices.filter(d => wasUsedRecently(d)).length;
  const stale = devices.filter(d => isStaleDevice(d)).length;

  return {
    total: devices.length,
    recentlyUsed,
    stale,
    currentDevice,
  };
};