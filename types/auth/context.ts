/**
 * Tipos relacionados con el contexto de autenticación
 */

import { UserSession } from './base';

/**
 * Contexto de autenticación
 */
export interface AuthContextType {
  user: UserSession | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  updateUser?: (updates: Partial<UserSession>) => Promise<void>;
}

/**
 * Estado del contexto de autenticación
 */
export interface AuthState {
  user: UserSession | null;
  loading: boolean;
  isSessionExpiredHandled: boolean;
}

/**
 * Acciones del contexto de autenticación
 */
export type AuthAction =
  | { type: 'SET_USER'; payload: UserSession | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_SESSION_EXPIRED_HANDLED'; payload: boolean }
  | { type: 'RESET' };