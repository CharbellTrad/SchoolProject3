/**
 * Gestión de sesiones biométricas
 */

import * as odooApi from '../apiService';
import { OperationResult } from './types';

/**
 * Destruye/finaliza una sesión específica
 * @param sessionId - Session ID a destruir
 * @returns Resultado de la operación
 */
export const destroySession = async (
  sessionId: string
): Promise<OperationResult> => {
  try {
    if (__DEV__) {
      console.log('🔓 Destruyendo sesión:', sessionId);
    }

    const result = await odooApi.callMethod(
      'biometric.auth.log',
      'destroy_session',
      [],
      { session_id: sessionId }
    );

    if (!result.success) {
      // Si es sesión expirada, no loguear (handleSessionExpired() ya lo manejó)
      if (result.error?.isSessionExpired) {
        return {
          success: false,
          error: 'Sesión expirada',
          isSessionExpired: true,
        };
      }
      const errorMsg = odooApi.extractOdooErrorMessage(result.error);
      if (__DEV__) {
        console.error('❌ Error destruyendo sesión:', errorMsg);
      }
      return {
        success: false,
        error: errorMsg,
        isSessionExpired: result.error?.isSessionExpired,
      };
    }

    const data = result.data as {
      success: boolean;
      message: string;
      session_id?: string;
    };

    if (!data.success) {
      if (__DEV__) {
        console.error('❌ Error desde backend:', data.message);
      }
      return {
        success: false,
        error: data.message,
      };
    }

    if (__DEV__) {
      console.log('✅ Sesión destruida exitosamente');
    }

    return {
      success: true,
      message: data.message,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error inesperado destruyendo sesión:', error);
    }
    return {
      success: false,
      error: error.message || 'Error desconocido',
    };
  }
};
