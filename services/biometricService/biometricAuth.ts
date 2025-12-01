/**
 * Servicio de autenticación biométrica
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import {
    getBiometricCredentials,
    isBiometricEnabled,
    updateLastUsed,
} from './biometricStorage';
import {
    BiometricAuthResult,
    BiometricAvailability,
    BiometricErrorCode,
    BiometricPromptConfig,
    BiometricType,
} from './types';

/**
 * Verifica la disponibilidad de autenticación biométrica en el dispositivo
 * @returns Información sobre disponibilidad biométrica
 */
export const checkBiometricAvailability = async (): Promise<BiometricAvailability> => {
  try {
    // Verificar si el hardware está disponible
    const hasHardware = await LocalAuthentication.hasHardwareAsync();

    if (!hasHardware) {
      return {
        isAvailable: false,
        biometricType: null,
        hasHardware: false,
        isEnrolled: false,
      };
    }

    // Verificar si hay biometría configurada
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();

    if (!isEnrolled) {
      return {
        isAvailable: false,
        biometricType: null,
        hasHardware: true,
        isEnrolled: false,
      };
    }

    // Obtener tipos de autenticación soportados
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
    const biometricType = mapAuthTypeToString(supportedTypes);

    return {
      isAvailable: true,
      biometricType,
      hasHardware: true,
      isEnrolled: true,
    };
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error verificando disponibilidad biométrica:', error);
    }

    return {
      isAvailable: false,
      biometricType: null,
      hasHardware: false,
      isEnrolled: false,
    };
  }
};

/**
 * Mapea los tipos de autenticación a una cadena legible
 */
const mapAuthTypeToString = (
  types: LocalAuthentication.AuthenticationType[]
): BiometricType => {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return BiometricType.FACIAL_RECOGNITION;
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return BiometricType.FINGERPRINT;
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return BiometricType.IRIS;
  }
  return BiometricType.UNKNOWN;
};

/**
 * Obtiene el nombre legible del tipo de biometría
 */
export const getBiometricTypeName = (type: BiometricType | null): string => {
  switch (type) {
    case BiometricType.FACIAL_RECOGNITION:
      return Platform.OS === 'ios' ? 'Face ID' : 'Reconocimiento Facial';
    case BiometricType.FINGERPRINT:
      return Platform.OS === 'ios' ? 'Touch ID' : 'Huella Digital';
    case BiometricType.IRIS:
      return 'Reconocimiento de Iris';
    default:
      return 'Biometría';
  }
};

/**
 * Realiza la autenticación biométrica
 * @param config - Configuración del prompt
 * @returns Resultado de la autenticación con username si es exitosa
 */
export const authenticateWithBiometrics = async (
  config?: BiometricPromptConfig
): Promise<BiometricAuthResult> => {
  try {
    // 1. Verificar disponibilidad
    const availability = await checkBiometricAvailability();
    if (!availability.isAvailable) {
      if (!availability.hasHardware) {
        return {
          success: false,
          error: 'Este dispositivo no soporta autenticación biométrica',
          errorCode: BiometricErrorCode.NOT_AVAILABLE,
        };
      }
      if (!availability.isEnrolled) {
        return {
          success: false,
          error: 'No tienes configurada la autenticación biométrica en tu dispositivo',
          errorCode: BiometricErrorCode.NOT_ENROLLED,
        };
      }
    }

    // 2. Verificar si está habilitada en la app
    const enabled = await isBiometricEnabled();
    if (!enabled) {
      return {
        success: false,
        error: 'La autenticación biométrica no está habilitada',
        errorCode: BiometricErrorCode.NOT_ENABLED,
      };
    }

    // 3. Obtener credenciales completas (username Y password)
    const credentials = await getBiometricCredentials();
    if (!credentials || !credentials.username || !credentials.password) {
      return {
        success: false,
        error: 'No hay credenciales biométricas guardadas',
        errorCode: BiometricErrorCode.NO_CREDENTIALS,
      };
    }

    // 4. Mostrar prompt biométrico
    const biometricTypeName = getBiometricTypeName(availability.biometricType);
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage:
        config?.promptMessage || `Usa ${biometricTypeName} para continuar`,
      cancelLabel: config?.cancelLabel || 'Cancelar',
      disableDeviceFallback: config?.disableDeviceFallback ?? false,
      requireConfirmation: config?.requireConfirmation ?? false,
    });

    // 5. Procesar resultado
    if (result.success) {
      // Actualizar timestamp de último uso
      await updateLastUsed();

      if (__DEV__) {
        console.log('✅ Autenticación biométrica exitosa');
      }

      return {
        success: true,
        username: credentials.username,
        password: credentials.password, // ← Ahora devolvemos el password
      };
    } else {
      // Mapear error
      const errorCode = mapBiometricError(result.error);
      if (__DEV__) {
        console.log('❌ Autenticación biométrica fallida:', result.error);
      }

      return {
        success: false,
        error: getErrorMessage(errorCode),
        errorCode,
      };
    }
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en autenticación biométrica:', error);
    }

    return {
      success: false,
      error: 'Error inesperado durante la autenticación biométrica',
      errorCode: BiometricErrorCode.AUTHENTICATION_FAILED,
    };
  }
};

/**
 * Mapea errores de LocalAuthentication a nuestros códigos
 */
const mapBiometricError = (error?: string): BiometricErrorCode => {
  if (!error) {
    return BiometricErrorCode.USER_CANCELED;
  }

  const errorLower = error.toLowerCase();

  if (errorLower.includes('cancel') || errorLower.includes('cancelado')) {
    return BiometricErrorCode.USER_CANCELED;
  }

  if (errorLower.includes('lockout') || errorLower.includes('bloqueado')) {
    return BiometricErrorCode.LOCKOUT;
  }

  if (errorLower.includes('system') || errorLower.includes('sistema')) {
    return BiometricErrorCode.SYSTEM_CANCELED;
  }

  return BiometricErrorCode.AUTHENTICATION_FAILED;
};

/**
 * Obtiene un mensaje de error legible
 */
const getErrorMessage = (errorCode: BiometricErrorCode): string => {
  switch (errorCode) {
    case BiometricErrorCode.NOT_AVAILABLE:
      return 'Autenticación biométrica no disponible';
    case BiometricErrorCode.NOT_ENROLLED:
      return 'Configure la autenticación biométrica en su dispositivo';
    case BiometricErrorCode.NOT_ENABLED:
      return 'Autenticación biométrica no habilitada';
    case BiometricErrorCode.USER_CANCELED:
      return 'Autenticación cancelada';
    case BiometricErrorCode.SYSTEM_CANCELED:
      return 'Autenticación cancelada por el sistema';
    case BiometricErrorCode.LOCKOUT:
      return 'Demasiados intentos fallidos. Intenta más tarde';
    case BiometricErrorCode.NO_CREDENTIALS:
      return 'No hay credenciales guardadas';
    default:
      return 'Error en la autenticación';
  }
};