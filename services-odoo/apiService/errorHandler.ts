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

    // Odoo UserError: The actual message is in data.arguments[0]
    if (error.data?.arguments && Array.isArray(error.data.arguments) && error.data.arguments.length > 0) {
      return error.data.arguments[0];
    }

    // Sometimes the message is in data.message
    if (error.data?.message && error.data.message !== error.message) {
      return error.data.message;
    }

    // Check data.name for error type (e.g., "odoo.exceptions.UserError")
    // and extract from debug if available
    if (error.data?.debug) {
      // Try to extract the actual message from UserError in debug
      const debugStr = error.data.debug;
      const userErrorMatch = debugStr.match(/UserError\(['"](.+?)['"]\)/);
      if (userErrorMatch && userErrorMatch[1]) {
        return userErrorMatch[1];
      }

      // Try ValidationError pattern
      const validationMatch = debugStr.match(/ValidationError\(['"](.+?)['"]\)/);
      if (validationMatch && validationMatch[1]) {
        return validationMatch[1];
      }

      // Get first meaningful line from debug
      const lines = debugStr.split('\n').filter((l: string) => l.trim());
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1].trim();
        // If it contains a meaningful message (not just class names)
        if (lastLine.includes(':')) {
          const parts = lastLine.split(':');
          if (parts.length > 1) {
            return parts.slice(1).join(':').trim();
          }
        }
      }
    }

    // Fallback to generic message only if nothing else found
    if (error.message && error.message !== 'Odoo Server Error') {
      return error.message;
    }

    // Last resort: stringify a portion of the error
    return JSON.stringify(error).substring(0, 200);
  } catch (e) {
    return 'Error desconocido';
  }
};
