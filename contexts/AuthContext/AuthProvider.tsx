/**
 * Provider de autenticación modularizado
 * 🆕 ACTUALIZADO CON BIOMETRÍA
 */

import React, { ReactNode, useEffect } from 'react';
import * as odooApi from '../../services-odoo/apiService';
import * as authService from '../../services-odoo/authService';
import { AuthContextType } from '../../types/auth';
import { useAuthOperations } from './useAuthOperations';
import { useAuthState } from './useAuthState';
import { useSessionMonitor } from './useSessionMonitor';

interface AuthProviderProps {
  children: ReactNode;
}

// Crear el contexto
export const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de autenticación para Odoo con manejo robusto de errores
 * 🆕 INCLUYE AUTENTICACIÓN BIOMÉTRICA
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Estado
  const {
    user,
    loading,
    isSessionExpiredHandled,
    setUser,
    setLoading,
    setSessionExpiredHandled,
  } = useAuthState();

  // Monitoreo de sesión
  const { handleSessionExpired } = useSessionMonitor({
    isSessionExpiredHandled,
    setSessionExpiredHandled,
    setUser,
  });

  // Operaciones (incluye biometría)
  const {
    login,
    loginWithBiometrics,
    logout,
    updateUser,
    enableBiometricLogin,
    disableBiometricLogin,
    isBiometricAvailable,
    isBiometricEnabled,
  } = useAuthOperations({
    user,
    setUser,
    setLoading,
    setSessionExpiredHandled,
  });

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

      if (!serverAvailable.ok) {
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

      // ⏱️ Verificar sesión (incluye validación de 4 horas)
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

  // Configurar callback para sesión expirada y inicializar
  useEffect(() => {
    odooApi.setSessionExpiredCallback(handleSessionExpired);
    initializeAuth();
  }, []);

  const value: AuthContextType = {
    user,
    login,
    loginWithBiometrics,
    logout,
    loading,
    updateUser,
    handleSessionExpired,
    enableBiometricLogin, 
    disableBiometricLogin, 
    isBiometricAvailable, 
    isBiometricEnabled, 
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};