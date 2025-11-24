/**
 * Constantes para el contexto de autenticación
 */

/**
 * Tiempo de espera para reintentos de conexión (ms)
 */
export const CONNECTION_RETRY_DELAY = 1000;

/**
 * Número máximo de reintentos de conexión
 */
export const MAX_CONNECTION_RETRIES = 3;

/**
 * Tiempo de espera antes de mostrar error de conexión (ms)
 */
export const CONNECTION_TIMEOUT = 5000;

/**
 * Intervalo para verificar sesión automáticamente (ms)
 * null = deshabilitado
 */
export const SESSION_CHECK_INTERVAL = null; // 5 * 60 * 1000; // 5 minutos

/**
 * Mensajes de error estándar
 */
export const ERROR_MESSAGES = {
  NO_ROLE: 'Tu usuario no tiene un rol definido en el sistema. Por favor, contacta al administrador para que asigne un rol a tu cuenta.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  SERVER_UNAVAILABLE: 'No se puede conectar con el servidor. Por favor, verifica tu conexión e intenta nuevamente.',
  SESSION_ERROR: 'No se pudo establecer la sesión correctamente. Por favor, intenta nuevamente.',
  UNEXPECTED_ERROR: 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
} as const;