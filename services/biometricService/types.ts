/**
 * Tipos para el servicio de autenticación biométrica
 */

import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Resultado de verificación de disponibilidad biométrica
 */
export interface BiometricAvailability {
  isAvailable: boolean;
  biometricType: BiometricType | null;
  allTypes?: LocalAuthentication.AuthenticationType[];
  hasHardware: boolean;
  isEnrolled: boolean;
}

/**
 * Tipos de biometría disponibles
 */
export enum BiometricType {
  FINGERPRINT = 'fingerprint',
  FACIAL_RECOGNITION = 'facial_recognition',
  IRIS = 'iris',
  UNKNOWN = 'unknown',
}

/**
 * Datos guardados para autenticación biométrica
 */
export interface BiometricCredentials {
  username: string;
  password: string;
  fullName: string;
  imageUrl?: string; // Foto del usuario (base64)
  isEnabled: boolean;
  enrolledAt: string;
  lastUsedAt?: string;
  deviceInfo?: string;
}

/**
 * Resultado de autenticación biométrica
 */
export interface BiometricAuthResult {
  success: boolean;
  username?: string;
  password?: string; // 🆕 Contraseña recuperada después de autenticación exitosa
  error?: string;
  errorCode?: BiometricErrorCode;
}

/**
 * Códigos de error de biometría
 */
export enum BiometricErrorCode {
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  NOT_ENROLLED = 'NOT_ENROLLED',
  NOT_ENABLED = 'NOT_ENABLED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  USER_CANCELED = 'USER_CANCELED',
  SYSTEM_CANCELED = 'SYSTEM_CANCELED',
  LOCKOUT = 'LOCKOUT',
  NO_CREDENTIALS = 'NO_CREDENTIALS',
}

/**
 * Configuración de prompt biométrico
 */
export interface BiometricPromptConfig {
  promptMessage?: string;
  cancelLabel?: string;
  disableDeviceFallback?: boolean;
  requireConfirmation?: boolean;
}

/**
 * Re-exportar tipos de expo-local-authentication
 */
export type AuthenticationType = LocalAuthentication.AuthenticationType;
export type LocalAuthenticationResult = LocalAuthentication.LocalAuthenticationResult;