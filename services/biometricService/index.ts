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
    getBiometricCredentials, getBiometricFullName, getBiometricUsername, isBiometricEnabled,
    saveBiometricCredentials,
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

