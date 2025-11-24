/**
 * Estructura de respuesta de Odoo
 */
export interface OdooResponse<T = any> {
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
export interface RequestParams {
  model: string;
  method: string;
  args?: any[];
  kwargs?: Record<string, any>;
}

/**
 * Resultado estándar de operaciones con Odoo
 */
export interface OdooResult<T = any> {
  success: boolean;
  data?: T;
  error?: any;
}

/**
 * Resultado de autenticación con Session ID
 */
export interface AuthResult extends OdooResult {
  sid?: string;
}