import { ODOO_CONFIG } from './config';
import {
  extractOdooErrorMessage,
  isAccessDeniedError,
  isExpectedError,
  isSessionExpiredError,
} from './errorHandler';
import { getStoredSessionId, handleSessionExpired } from './sessionManager';
import { OdooResponse, OdooResult, RequestParams } from './types';

/**
 * Realiza una petición al API de Odoo con manejo robusto de errores y sesión
 */
export const odooRequest = async <T = any>(
  path: string,
  params: RequestParams | Record<string, any>,
  requiresAuth: boolean = true
): Promise<OdooResult<T>> => {
  try {
    const url = `${ODOO_CONFIG.host}${path}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (requiresAuth) {
      const sid = await getStoredSessionId();
      if (sid) {
        headers['X-Openerp-Session-Id'] = sid;
      } else {
        return {
          success: false,
          error: {
            message: 'No hay sesión activa',
            code: 'NO_SESSION',
          },
        };
      }
    }

    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: new Date().getTime(),
      method: 'call',
      params,
    });

    if (__DEV__) {
      console.log(`🔥 Odoo Request: ${path}`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
      credentials: 'include',
    });

    if (__DEV__) {
      console.log(`📡 Response Status: ${response.status}`);
    }

    const textResponse = await response.text();

    if (!response.ok) {
      const errorMessage = `HTTP Error: ${response.status} ${response.statusText}`;
      throw new Error(errorMessage);
    }

    let responseJson: OdooResponse<T>;
    try {
      responseJson = JSON.parse(textResponse);
    } catch (e) {
      throw new Error(`No se pudo parsear JSON: ${textResponse.substring(0, 100)}`);
    }

    if (responseJson.error) {
      if (isSessionExpiredError(responseJson.error) || isAccessDeniedError(responseJson.error)) {
        if (__DEV__) {
          console.log('🔒 Sesión expirada o inválida detectada');
        }
        await handleSessionExpired();
        // Lanzar excepción para detener el flujo y evitar alertas duplicadas
        // handleSessionExpired() ya manejó la alerta y navegación
        throw new Error('SESSION_EXPIRED_HANDLED');
      }

      const errorMsg = extractOdooErrorMessage(responseJson.error);

      if (__DEV__ && !isExpectedError(errorMsg)) {
        console.log('❌ Error de Odoo:', errorMsg);
      }

      return { success: false, error: errorMsg };
    }

    if (__DEV__) {
      console.log('✅ Odoo Response: Success');
    }
    return { success: true, data: responseJson.result };
  } catch (error: any) {
    const errorMsg = error.message || 'Error desconocido';

    // Si es una sesión expirada que ya fue manejada, no hacer nada más
    if (errorMsg === 'SESSION_EXPIRED_HANDLED') {
      // handleSessionExpired() ya mostró la alerta y navegó al login
      // Retornamos un error silencioso para que los servicios no muestren alertas adicionales
      return { success: false, error: { message: '', isSessionExpired: true } };
    }

    if (__DEV__ && !isExpectedError(errorMsg)) {
      console.log('❌ Error inesperado:', errorMsg);
    }

    return { success: false, error: { message: errorMsg } };
  }
};