import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Configuración de conexión con Odoo
 */
const ODOO_CONFIG = {
  host: 'http://185.111.156.32',
  database: 'test',
};

const SESSION_KEY = '@odoo_session_id';

/**
 * Callback global para manejar sesión expirada
 * Se configura desde AuthContext para redirigir al login automáticamente
 */
let onSessionExpiredCallback: (() => void) | null = null;

export const setSessionExpiredCallback = (callback: () => void) => {
  onSessionExpiredCallback = callback;
};

/**
 * Estructura de respuesta de Odoo
 */
interface OdooResponse<T = any> {
  result?: T;
  error?: {
    code?: number;
    message: string;
    data?: {
      name?: string;
      message?: string;
      arguments?: string[];
      debug?: string;
      [key: string]: any;
    };
    [key: string]: any;
  };
}

/**
 * Parámetros para peticiones a Odoo
 */
interface RequestParams {
  model: string;
  method: string;
  args?: any[];
  kwargs?: Record<string, any>;
}

/**
 * Verifica si un error indica que la sesión ha expirado
 */
const isSessionExpiredError = (error: any): boolean => {
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
const isAccessDeniedError = (error: any): boolean => {
  if (!error) return false;

  const errorString = JSON.stringify(error).toLowerCase();

  return (
    errorString.includes('access denied') ||
    errorString.includes('access_denied') ||
    errorString.includes('accessdenied')
  );
};

/**
 * Maneja la expiración de sesión limpiando datos locales y notificando al contexto
 */
const handleSessionExpired = async (): Promise<void> => {
  if (__DEV__) {
    console.log('🔐 Sesión expirada detectada, limpiando datos...');
  }

  try {
    await clearSessionId();

    if (onSessionExpiredCallback) {
      onSessionExpiredCallback();
    }
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error limpiando sesión expirada:', error);
    }
  }
};

/**
 * Lista de errores esperados que no requieren logging extensivo
 */
const EXPECTED_ERRORS = [
  'sesión',
  'session',
  'contraseña',
  'password',
  'usuario',
  'user',
  'acceso',
  'access',
  'denied',
  'denegado',
  'inválido',
  'invalid',
];

/**
 * Determina si un error es esperado y no requiere logging detallado
 */
const isExpectedError = (errorMessage: string): boolean => {
  return EXPECTED_ERRORS.some(expected =>
    errorMessage.toLowerCase().includes(expected.toLowerCase())
  );
};

/**
 * Extrae el Session ID del header Set-Cookie de la respuesta HTTP
 */
const extractSessionId = (setCookie: string | null): string => {
  if (setCookie && setCookie.includes('session_id')) {
    const match = setCookie.match(/session_id=([^;]+)/);
    return match ? match[1] : '';
  }
  return '';
};

/**
 * Obtiene el Session ID almacenado localmente
 */
export const getStoredSessionId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(SESSION_KEY);
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error obteniendo session ID:', error);
    }
    return null;
  }
};

/**
 * Guarda el Session ID en almacenamiento local
 */
export const saveSessionId = async (sid: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(SESSION_KEY, sid);
    if (__DEV__) {
      console.log('✅ Session ID guardado');
    }
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error guardando session ID:', error);
    }
  }
};

/**
 * Elimina el Session ID del almacenamiento local
 */
export const clearSessionId = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
    if (__DEV__) {
      console.log('🗑️ Session ID eliminado');
    }
  } catch (error) {
    if (__DEV__) {
      console.log('⚠️ Error eliminando session ID:', error);
    }
  }
};

/**
 * Realiza una petición al API de Odoo con manejo robusto de errores y sesión
 */
const odooRequest = async <T = any>(
  path: string,
  params: RequestParams | Record<string, any>,
  requiresAuth: boolean = true
): Promise<{ success: boolean; data?: T; error?: any }> => {
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
          console.log('🔐 Sesión expirada o inválida detectada');
        }
        await handleSessionExpired();

        return {
          success: false,
          error: {
            ...responseJson.error,
            isSessionExpired: true,
            message: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          },
        };
      }

      const errorMsg = extractOdooErrorMessage(responseJson.error);

      if (__DEV__ && !isExpectedError(errorMsg)) {
        console.log('❌ Error de Odoo:', errorMsg);
      }

      return { success: false, error: responseJson.error };
    }

    if (__DEV__) {
      console.log('✅ Odoo Response: Success');
    }
    return { success: true, data: responseJson.result };
  } catch (error: any) {
    const errorMsg = error.message || 'Error desconocido';

    if (__DEV__ && !isExpectedError(errorMsg)) {
      console.log('❌ Error inesperado:', errorMsg);
    }

    return { success: false, error: { message: errorMsg } };
  }
};

/**
 * Obtiene la lista de bases de datos disponibles en Odoo
 */
export const getDatabases = async (): Promise<{ success: boolean; data?: any; error?: any }> => {
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
): Promise<{ success: boolean; data?: any; sid?: string; error?: any }> => {
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
      body: JSON.stringify({ params }),
    });

    const responseJson = await response.json() as OdooResponse;

    if (responseJson.error) {
      return { success: false, error: responseJson.error };
    }

    const sid = extractSessionId(response.headers.get('set-cookie'));

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
export const verifySession = async (): Promise<{ success: boolean; data?: any; error?: any }> => {
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
export const destroySession = async (): Promise<{ success: boolean; error?: any }> => {
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
 * Busca registros en Odoo y devuelve solo los IDs
 */
export const search = async (
  model: string,
  domain: any[] = [],
  limit: number = 100,
  offset: number = 0
): Promise<{ success: boolean; data?: number[]; error?: any }> => {
  return odooRequest<number[]>('/web/dataset/call_kw', {
    model,
    method: 'search',
    args: [domain],
    kwargs: {
      limit,
      offset,
    },
  });
};

/**
 * Busca y lee registros en una sola operación
 */
export const searchRead = async (
  model: string,
  domain: any[] = [],
  fields: string[] = [],
  limit: number = 100,
  offset: number = 0,
  order: string = ''
): Promise<{ success: boolean; data?: any[]; error?: any }> => {
  return odooRequest<any[]>('/web/dataset/call_kw', {
    model,
    method: 'search_read',
    args: [],
    kwargs: {
      domain,
      fields,
      limit,
      offset,
      order,
    },
  });
};

/**
 * Lee registros específicos por sus IDs
 */
export const read = async (
  model: string,
  ids: number[],
  fields: string[] = []
): Promise<{ success: boolean; data?: any[]; error?: any }> => {
  return odooRequest<any[]>('/web/dataset/call_kw', {
    model,
    method: 'read',
    args: [ids],
    kwargs: {
      fields,
    },
  });
};

/**
 * Cuenta el número de registros que coinciden con el dominio
 */
export const searchCount = async (
  model: string,
  domain: any[] = []
): Promise<{ success: boolean; data?: number; error?: any }> => {
  return odooRequest<number>('/web/dataset/call_kw', {
    model,
    method: 'search_count',
    args: [domain],
    kwargs: {},
  });
};

/**
 * Crea un nuevo registro en Odoo
 */
export const create = async (
  model: string,
  values: any
): Promise<{ success: boolean; data?: number; error?: any }> => {
  return odooRequest<number>('/web/dataset/call_kw', {
    model,
    method: 'create',
    args: [values],
    kwargs: {},
  });
};

/**
 * Actualiza registros existentes en Odoo
 */
export const update = async (
  model: string,
  ids: number[],
  values: any
): Promise<{ success: boolean; data?: boolean; error?: any }> => {
  return odooRequest<boolean>('/web/dataset/call_kw', {
    model,
    method: 'write',
    args: [ids, values],
    kwargs: {},
  });
};

/**
 * Elimina registros de Odoo
 */
export const deleteRecords = async (
  model: string,
  ids: number[]
): Promise<{ success: boolean; data?: boolean; error?: any }> => {
  return odooRequest<boolean>('/web/dataset/call_kw', {
    model,
    method: 'unlink',
    args: [ids],
    kwargs: {},
  });
};

/**
 * Llama a un método personalizado de un modelo en Odoo
 */
export const callMethod = async (
  model: string,
  method: string,
  args: any[] = [],
  kwargs: Record<string, any> = {}
): Promise<{ success: boolean; data?: any; error?: any }> => {
  return odooRequest('/web/dataset/call_kw', {
    model,
    method,
    args,
    kwargs,
  });
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
