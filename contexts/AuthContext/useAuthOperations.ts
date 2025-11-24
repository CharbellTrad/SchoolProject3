/**
 * Hook para operaciones de autenticación (login, logout, updateUser)
 */

import { useCallback } from 'react';
import { showAlert } from '../../components/showAlert';
import * as authService from '../../services-odoo/authService';
import { UserSession } from '../../types/auth';
import { ERROR_MESSAGES } from './constants';

export interface AuthOperationsHook {
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserSession>) => Promise<void>;
}

interface UseAuthOperationsProps {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  setLoading: (loading: boolean) => void;
  setSessionExpiredHandled: (handled: boolean) => void;
}

/**
 * Hook para manejar operaciones de autenticación
 */
export const useAuthOperations = ({
  user,
  setUser,
  setLoading,
  setSessionExpiredHandled,
}: UseAuthOperationsProps): AuthOperationsHook => {
  /**
   * Login con Odoo
   */
  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        setLoading(true);

        if (__DEV__) {
          console.log('🔐 Intentando login:', username);
        }

        // Verificar servidor
        const serverHealth = await authService.checkServerHealth();

        if (!serverHealth.ok) {
          showAlert('Servidor no disponible', ERROR_MESSAGES.SERVER_UNAVAILABLE);
          return false;
        }

        // Intentar login
        const result = await authService.login(username, password);

        // Caso especial: usuario sin rol
        if (!result.success && result.message === 'NO_ROLE_DEFINED') {
          if (__DEV__) {
            console.log('❌ Usuario sin rol definido - Mostrando alerta y limpiando datos');
          }

          // Asegurar limpieza
          await authService.logout();
          setUser(null);

          // Alerta específica
          showAlert('Usuario sin rol', ERROR_MESSAGES.NO_ROLE, [
            {
              text: 'Aceptar',
              onPress: () => {},
            },
          ]);

          return false;
        }

        // Login exitoso
        if (result.success && result.user) {
          if (__DEV__) {
            console.log('✅ Login exitoso:', {
              username: result.user.username,
              role: result.user.role,
              uid: result.user.odooData.uid,
            });
          }

          // Verificar sesión
          if (__DEV__) {
            console.log('🔍 Verificando sesión recién creada...');
          }

          const validSession = await authService.verifySession();

          if (!validSession) {
            if (__DEV__) {
              console.log('❌ La sesión no pudo ser verificada después del login');
            }

            showAlert('Error de sesión', ERROR_MESSAGES.SESSION_ERROR);

            await authService.logout();
            return false;
          }

          if (__DEV__) {
            console.log('✅ Sesión verificada exitosamente después del login');
          }

          setUser(validSession);
          setSessionExpiredHandled(false);
          return true;
        } else {
          const errorMessage = result.message || 'Error al iniciar sesión';

          if (__DEV__) {
            console.log('❌ Login fallido:', errorMessage);
          }
          return false;
        }
      } catch (error: any) {
        if (__DEV__) {
          console.log('❌ Error inesperado en login:', error);
        }

        showAlert('Error', ERROR_MESSAGES.UNEXPECTED_ERROR);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, setSessionExpiredHandled]
  );

  /**
   * Logout - Cierra la sesión
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      if (__DEV__) {
        console.log('🔓 Cerrando sesión...');
      }

      await authService.logout();

      if (__DEV__) {
        console.log('✅ Sesión cerrada');
      }

      setUser(null);
      setSessionExpiredHandled(false);
    } catch (error) {
      if (__DEV__) {
        console.log('⚠️ Error durante logout:', error);
      }

      // Asegurar limpieza local
      setUser(null);
      setSessionExpiredHandled(false);
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, setSessionExpiredHandled]);

  /**
   * Actualiza los datos del usuario en la sesión
   */
  const updateUser = useCallback(
    async (updates: Partial<UserSession>): Promise<void> => {
      try {
        if (!user) {
          if (__DEV__) {
            console.log('⚠️ No hay usuario para actualizar');
          }
          return;
        }

        const success = await authService.updateUserSession(updates);

        if (success) {
          setUser({
            ...user,
            ...updates,
          });

          if (__DEV__) {
            console.log('✅ Usuario actualizado');
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.log('⚠️ Error actualizando usuario:', error);
        }
      }
    },
    [user, setUser]
  );

  return {
    login,
    logout,
    updateUser,
  };
};