import { ODOO_CONFIG } from './config';
import { isSessionExpiredError } from './errorHandler';
import {
    clearSessionId,
    extractSessionId,
    getStoredSessionId,
    handleSessionExpired,
    saveSessionId,
} from './sessionManager';
import { AuthResult, OdooResponse, OdooResult } from './types';

/**
 * Obtiene la lista de bases de datos disponibles en Odoo
 */
export const getDatabases = async (): Promise<OdooResult> => {
  try {
    const url = `${ODOO_CONFIG.host}/web/database/list`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const responseJson = await response.json() as OdooResponse;

    if (responseJson.error) {
      return { success: false, error: responseJson.error };
    }

    return { success: true, data: responseJson.result };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
};

/**
 * Autentica un usuario en Odoo y obtiene el Session ID
 */
export const authenticate = async (
  username: string,
  password: string
): Promise<AuthResult> => {
  try {
    const params = {
      db: ODOO_CONFIG.database,
      login: username,
      password: password,
    };

    const url = `${ODOO_CONFIG.host}/web/session/authenticate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ params }),
    });

    const responseJson = await response.json() as OdooResponse;

    if (responseJson.error) {
      return { success: false, error: responseJson.error };
    }

    let sid = extractSessionId(response.headers.get('set-cookie'));
    
    // Si no se pudo extraer del header (caso web), intentar del result
    if (!sid && responseJson.result && responseJson.result.session_id) {
      sid = responseJson.result.session_id;
    }

    if (sid) {
      await saveSessionId(sid);
    }

    return {
      success: true,
      data: responseJson.result,
      sid,
    };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
};

/**
 * Verifica si la sesión actual sigue siendo válida en Odoo
 */
export const verifySession = async (): Promise<OdooResult> => {
  try {
    const url = `${ODOO_CONFIG.host}/web/session/get_session_info`;
    const sid = await getStoredSessionId();

    if (!sid) {
      return { success: false, error: { message: 'No hay sesión activa' } };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Openerp-Session-Id': sid,
      },
      credentials: 'include',
      body: JSON.stringify({}),
    });

    const responseJson = await response.json() as OdooResponse;

    if (responseJson.error) {
      if (isSessionExpiredError(responseJson.error)) {
        await handleSessionExpired();
        return {
          success: false,
          error: {
            ...responseJson.error,
            isSessionExpired: true,
          },
        };
      }

      return { success: false, error: responseJson.error };
    }

    return { success: true, data: responseJson.result };
  } catch (error: any) {
    return { success: false, error: { message: error.message } };
  }
};

/**
 * Cierra la sesión en Odoo y limpia el Session ID local
 */
export const destroySession = async (): Promise<OdooResult> => {
  try {
    const url = `${ODOO_CONFIG.host}/web/session/destroy`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const responseJson = await response.json() as OdooResponse;

    if (responseJson.error) {
      return { success: false, error: responseJson.error };
    }

    await clearSessionId();
    return { success: true };
  } catch (error: any) {
    await clearSessionId();
    return { success: false, error: { message: error.message } };
  }
};

/**
 * Verifica si hay conexión disponible con el servidor Odoo
 */
export const checkOdooConnection = async (): Promise<boolean> => {
  try {
    const result = await getDatabases();
    return result.success;
  } catch (error) {
    if (__DEV__) {
      console.log('❌ No se puede conectar a Odoo:', error);
    }
    return false;
  }
};