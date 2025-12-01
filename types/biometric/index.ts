/**
 * Tipos para gestión de dispositivos biométricos
 */

import { BiometricDevice } from '../../services/biometricService';

/**
 * Estado de un dispositivo biométrico
 */
export type BiometricDeviceStatus = 'active' | 'inactive' | 'revoked';

/**
 * Acción disponible sobre un dispositivo
 */
export type DeviceAction = 'view' | 'revoke' | 'refresh';

/**
 * Resultado de operación sobre dispositivo
 */
export interface DeviceOperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * Estadísticas de dispositivos biométricos
 */
export interface BiometricDeviceStats {
  totalDevices: number;
  activeDevices: number;
  lastUsedDevice?: BiometricDevice;
  oldestDevice?: BiometricDevice;
}

/**
 * Filtros para lista de dispositivos
 */
export interface DeviceFilters {
  platform?: 'ios' | 'android' | 'web';
  status?: BiometricDeviceStatus;
  searchQuery?: string;
}

/**
 * Opciones de ordenamiento
 */
export type DeviceSortOption = 
  | 'enrolledAt-desc'
  | 'enrolledAt-asc'
  | 'lastUsedAt-desc'
  | 'lastUsedAt-asc'
  | 'deviceName-asc'
  | 'deviceName-desc';

/**
 * Props para componentes de dispositivos
 */
export interface BiometricDeviceCardProps {
  device: BiometricDevice;
  onRevoke?: (device: BiometricDevice) => void;
  onViewDetails?: (device: BiometricDevice) => void;
  isLoading?: boolean;
}

export interface BiometricDevicesListProps {
  devices: BiometricDevice[];
  onRefresh?: () => void;
  onRevokeDevice?: (device: BiometricDevice) => void;
  isLoading?: boolean;
  isRefreshing?: boolean;
}

export interface BiometricDevicesPanelProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

/**
 * Re-exportar tipos del servicio
 */
export type { BiometricDevice, DeviceInfo } from '../../services/biometricService';
