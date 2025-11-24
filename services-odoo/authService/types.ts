/**
 * Tipos específicos para authService
 */

import { UserSession } from '../../types/auth';

/**
 * Estructura de respuesta de autenticación de Odoo
 */
export interface OdooAuthResponse {
  uid: number;
  username: string;
  name: string;
  user_context: Record<string, any>;
  company_id: number;
  partner_id: number;
  role?: string;
  [key: string]: any;
}

/**
 * Resultado de operación de login
 */
export interface LoginResult {
  success: boolean;
  user?: UserSession;
  message?: string;
}

/**
 * Resultado de verificación de servidor
 */
export interface ServerHealthResult {
  ok: boolean;
  error?: any;
}

/**
 * Resultado de operación genérica
 */
export interface OperationResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: any;
}