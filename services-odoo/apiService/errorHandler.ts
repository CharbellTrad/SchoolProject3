import { EXPECTED_ERRORS } from './config';

/**
 * Verifica si un error indica que la sesión ha expirado
 */
export const isSessionExpiredError = (error: any): boolean => {
  if (!error) return false;

  const errorString = JSON.stringify(error).toLowerCase();

  return (
    errorString.includes('session expired') ||
    errorString.includes('session_expired') ||
    errorString.includes('sessionexpiredexception') ||
    error.code === 100 ||
    (error.data?.name && error.data.name.includes('SessionExpired'))
  );
};

/**
 * Verifica si un error es de acceso denegado por sesión inválida
 */
export const isAccessDeniedError = (error: any): boolean => {
  if (!error) return false;

  const errorString = JSON.stringify(error).toLowerCase();

  return (
    errorString.includes('access denied') ||
    errorString.includes('access_denied') ||
    errorString.includes('accessdenied')
  );
};

/**
 * Determina si un error es esperado y no requiere logging detallado
 */
export const isExpectedError = (errorMessage: string): boolean => {
  return EXPECTED_ERRORS.some(expected =>
    errorMessage.toLowerCase().includes(expected.toLowerCase())
  );
};

/**
 * Extrae un mensaje de error legible desde la respuesta de Odoo
 */
export const extractOdooErrorMessage = (error: any): string => {
  try {
    if (typeof error === 'string') {
      return error;
    }

    if (error.message) {
      return error.message;
    }

    if (error.data && error.data.message) {
      return error.data.message;
    }

    if (error.data && error.data.arguments && Array.isArray(error.data.arguments)) {
      return error.data.arguments[0] || 'Error desconocido';
    }

    return JSON.stringify(error).substring(0, 200);
  } catch (e) {
    return 'Error desconocido';
  }
};