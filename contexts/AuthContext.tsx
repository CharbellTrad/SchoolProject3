import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserSession, AuthContextType } from '../types/auth';
import * as authService from '../services-odoo/authService';
import * as odooApi from '../services-odoo/apiService';
import { showAlert } from '../components/showAlert';
import { router } from 'expo-router';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticación para Odoo con manejo robusto de errores
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionExpiredHandled, setIsSessionExpiredHandled] = useState(false);

  useEffect(() => {
    // Configurar callback para sesión expirada
    odooApi.setSessionExpiredCallback(handleSessionExpired);

    initializeAuth();
  }, []);

  /**
   * Maneja cuando la sesión expira durante el uso de la app
   */
  const handleSessionExpired = () => {
    // Evitar mostrar múltiples alertas
    if (isSessionExpiredHandled) {
      return;
    }

    setIsSessionExpiredHandled(true);

    if (__DEV__) {
      console.log('🔒 Sesión expirada, cerrando sesión...');
    }

    setUser(null);

    // Mostrar alerta
    showAlert(
      'Sesión Expirada',
      'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      [
        {
          text: 'Aceptar',
          onPress: () => {
            setIsSessionExpiredHandled(false);
            // router.replace('/login');
          },
        },
      ]
    );
  };

  /**
   * Inicializa la autenticación al cargar la app
   */
  const initializeAuth = async (): Promise<void> => {
    try {
      setLoading(true);

      if (__DEV__) {
        console.log('🔄 Inicializando autenticación...');
      }

      const serverAvailable = await authService.checkServerHealth();

      if (!serverAvailable) {
        if (__DEV__) {
          console.log('🔴 Servidor Odoo no disponible');
        }
        setUser(null);
        setLoading(false);
        return;
      }

      if (__DEV__) {
        console.log('✅ Servidor Odoo disponible');
      }

      const savedSession = await authService.getSavedUserSession();

      if (!savedSession) {
        if (__DEV__) {
          console.log('🔍 No hay sesión guardada');
        }
        setUser(null);
        setLoading(false);
        return;
      }

      if (__DEV__) {
        console.log('📦 Sesión local encontrada:', {
          username: savedSession.username,
          role: savedSession.role,
        });
      }

      const validSession = await authService.verifySession();

      if (validSession) {
        if (__DEV__) {
          console.log('✅ Sesión válida en Odoo');
        }
        setUser(validSession);
      } else {
        if (__DEV__) {
          console.log('🔒 Sesión expirada durante inicialización');
        }
        setUser(null);
      }
    } catch (error) {
      if (__DEV__) {
        console.log('⚠️ Error inicializando auth:', error);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Login con Odoo
   */
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      if (__DEV__) {
        console.log('🔐 Intentando login:', username);
      }

      const serverAvailable = await authService.checkServerHealth();

      if (!serverAvailable) {
        showAlert(
          'Servidor no disponible',
          'No se puede conectar con el servidor. Por favor, verifica tu conexión e intenta nuevamente.'
        );
        return false;
      }

      const result = await authService.login(username, password);

      if (result.success && result.user) {
        if (__DEV__) {
          console.log('✅ Login exitoso:', {
            username: result.user.username,
            role: result.user.role,
            uid: result.user.odooData.uid,
          });
        }

        if (__DEV__) {
          console.log('🔍 Verificando sesión recién creada...');
        }
        
        const validSession = await authService.verifySession();

        if (!validSession) {
          if (__DEV__) {
            console.log('❌ La sesión no pudo ser verificada después del login');
          }
          
          showAlert(
            'Error de sesión',
            'No se pudo establecer la sesión correctamente. Por favor, intenta nuevamente.'
          );
          
          await authService.logout();
          return false;
        }

        if (__DEV__) {
          console.log('✅ Sesión verificada exitosamente después del login');
        }

        setUser(validSession);
        setIsSessionExpiredHandled(false);
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

      showAlert('Error', 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout - Cierra la sesión
   */
  const logout = async (): Promise<void> => {
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
      setIsSessionExpiredHandled(false);
    } catch (error) {
      if (__DEV__) {
        console.log('⚠️ Error durante logout:', error);
      }

      setUser(null);
      setIsSessionExpiredHandled(false);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualiza los datos del usuario en la sesión
   */
  const updateUser = async (updates: Partial<UserSession>): Promise<void> => {
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
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook para usar el contexto de autenticación
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
};