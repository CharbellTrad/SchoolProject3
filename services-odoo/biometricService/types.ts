/**
 * Tipos para el servicio biométrico con Odoo
 */

// ============================================
// DISPOSITIVO BIOMÉTRICO
// ============================================

/**
 * Dispositivo biométrico (formato backend)
 */
export interface BiometricDeviceBackend {
  id: number;
  deviceId: string;
  deviceName: string;
  platform: 'ios' | 'android' | 'web';
  osVersion: string;
  modelName: string;
  brand: string;
  isPhysicalDevice: boolean;
  biometricType: string;
  state: 'active' | 'inactive' | 'revoked';
  isEnabled: boolean;
  isCurrentDevice: boolean;
  enrolledAt?: string;
  lastUsedAt?: string;
  authCount: number;
  isRecentlyUsed: boolean;
  isStale: boolean;
  daysSinceLastUse: number;
  hasActiveSession: boolean;  // 🆕 Si hay sesión activa en este dispositivo
  device_info_json?: string; // 🆕 JSON con info técnica
  notes?: string;           // 🆕 Notas
}

/**
 * Payload para registrar dispositivo
 */
export interface RegisterDevicePayload {
  device_id: string;
  device_name: string;
  platform: 'ios' | 'android' | 'web';
  os_version: string;
  model_name: string;
  brand: string;
  biometric_type: 'fingerprint' | 'facial_recognition' | 'iris' | 'unknown';
  biometric_type_display: string;
  is_physical_device: boolean;
  device_info_json?: string;
  notes?: string;
}

// ============================================
// LOG DE AUTENTICACIÓN
// ============================================

/**
 * Payload para registrar log de autenticación
 */
export interface AuthLogPayload {
  device_id: number; // ID de Odoo (no device_id local)
  success: boolean;
  error_info?: {
    code: string;
    message: string;
  };
  session_id?: string;
  duration_ms?: number;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Log de autenticación (formato backend)
 */
export interface BiometricAuthLog {
  id: number;
  device_name: string;
  device_platform: 'ios' | 'android' | 'web';
  device_name_direct?: string;     // 🆕 Nombre snapshot
  device_platform_direct?: string; // 🆕 Plataforma snapshot
  auth_date: string;
  success: boolean;
  auth_type: 'biometric' | 'traditional' | 'fallback' | 'automatic';
  session_active: boolean;
  session_ended_at?: string;
  error_code?: string;
  error_message?: string;
  ip_address?: string;    // 🆕 IP
  user_agent?: string;    // 🆕 User Agent
  duration_ms?: number;   // 🆕 Duración
  notes?: string;         // 🆕 Notas
  session_id?: string;    // 🆕 ID Sesión
}

/**
 * Estadísticas de autenticación de un dispositivo
 */
export interface DeviceAuthStats {
  total_attempts: number;
  successful: number;
  failed: number;
  success_rate: number;
  last_auth?: string;
}

// ============================================
// RESPUESTAS DE API
// ============================================

/**
 * Respuesta genérica de la API
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  isSessionExpired?: boolean; // Indica si el error es por sesión expirada
}

/**
 * Resultado de operación
 */
export interface OperationResult {
  success: boolean;
  message?: string;
  error?: string;
  isSessionExpired?: boolean; // Indica si el error es por sesión expirada
}