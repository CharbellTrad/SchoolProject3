/**
 * Servicio de Autenticación Biométrica
 * Exporta todas las funcionalidades necesarias
 */

// Autenticación
export {
    authenticateWithBiometrics,
    checkBiometricAvailability,
    getBiometricTypeName
} from './biometricAuth';

// Almacenamiento
export {
    clearBiometricCredentials,
    disableBiometric,
    getBiometricCredentials, getBiometricFullName, getBiometricUserImage, getBiometricUsername, isBiometricEnabled,
    saveBiometricCredentials,
    saveBiometricCredentialsWithDeviceInfo,
    updateLastUsed
} from './biometricStorage';

// Tipos
export type {
    BiometricAuthResult,
    BiometricAvailability,
    BiometricCredentials,
    BiometricPromptConfig
} from './types';

export { BiometricErrorCode, BiometricType } from './types';

// Gestión de dispositivos
export {
    formatDeviceName,
    formatPlatform,
    getDeviceInfo,
    getPlatformIcon,
    mapCredentialsToDevice,
    type BiometricDevice,
    type DeviceInfo
} from './deviceInfo';

export {
    getBiometricDevices,
    getBiometricDevicesCount,
    getCurrentBiometricDevice,
    hasBiometricDevices,
    removeBiometricFromCurrentDevice
} from './deviceManager';

