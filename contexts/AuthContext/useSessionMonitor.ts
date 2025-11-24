/**
 * Hook para monitorear y manejar sesiones expiradas
 */

import { useCallback, useEffect, useRef } from 'react';
import { showAlert } from '../../components/showAlert';
import { UserSession } from '../../types/auth';
import { ERROR_MESSAGES } from './constants';

export interface SessionMonitorHook {
  handleSessionExpired: () => void;
  startSessionMonitoring: () => void;
  stopSessionMonitoring: () => void;
}

interface UseSessionMonitorProps {
  isSessionExpiredHandled: boolean;
  setSessionExpiredHandled: (handled: boolean) => void;
  setUser: (user: UserSession | null) => void;
}

/**
 * Hook para monitorear la sesión y manejar expiraciones
 */
export const useSessionMonitor = ({
  isSessionExpiredHandled,
  setSessionExpiredHandled,
  setUser,
}: UseSessionMonitorProps): SessionMonitorHook => {
  const monitorIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Maneja cuando la sesión expira durante el uso de la app
   */
  const handleSessionExpired = useCallback(() => {
    // Evitar mostrar múltiples alertas
    if (isSessionExpiredHandled) {
      return;
    }

    setSessionExpiredHandled(true);

    if (__DEV__) {
      console.log('🔒 Sesión expirada, cerrando sesión...');
    }

    setUser(null);

    // Mostrar alerta
    showAlert(
      'Sesión Expirada',
      ERROR_MESSAGES.SESSION_EXPIRED,
      [
        {
          text: 'Aceptar',
          onPress: () => {
            setSessionExpiredHandled(false);
          },
        },
      ]
    );
  }, [isSessionExpiredHandled, setSessionExpiredHandled, setUser]);

  /**
   * Inicia el monitoreo periódico de la sesión (opcional)
   */
  const startSessionMonitoring = useCallback(() => {
    // Por ahora deshabilitado, se puede implementar después
    // si se desea verificar la sesión periódicamente
    if (__DEV__) {
      console.log('📡 Monitoreo de sesión disponible (actualmente deshabilitado)');
    }
  }, []);

  /**
   * Detiene el monitoreo de sesión
   */
  const stopSessionMonitoring = useCallback(() => {
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
      
      if (__DEV__) {
        console.log('🛑 Monitoreo de sesión detenido');
      }
    }
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      stopSessionMonitoring();
    };
  }, [stopSessionMonitoring]);

  return {
    handleSessionExpired,
    startSessionMonitoring,
    stopSessionMonitoring,
  };
};