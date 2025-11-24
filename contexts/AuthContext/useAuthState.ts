/**
 * Hook para manejar el estado del contexto de autenticación
 */

import { useCallback, useState } from 'react';
import { UserSession } from '../../types/auth';

export interface AuthStateHook {
  user: UserSession | null;
  loading: boolean;
  isSessionExpiredHandled: boolean;
  setUser: (user: UserSession | null) => void;
  setLoading: (loading: boolean) => void;
  setSessionExpiredHandled: (handled: boolean) => void;
  resetState: () => void;
}

/**
 * Hook personalizado para manejar el estado de autenticación
 */
export const useAuthState = (): AuthStateHook => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionExpiredHandled, setSessionExpiredHandled] = useState(false);

  /**
   * Resetea todo el estado a valores iniciales
   */
  const resetState = useCallback(() => {
    setUser(null);
    setLoading(false);
    setSessionExpiredHandled(false);
  }, []);

  return {
    user,
    loading,
    isSessionExpiredHandled,
    setUser,
    setLoading,
    setSessionExpiredHandled,
    resetState,
  };
};