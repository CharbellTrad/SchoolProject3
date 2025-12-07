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
  const pendingSessionExpiredRef = useRef(false);

  /**
   * Muestra la alerta de sesión expirada
   */
  const showSessionExpiredAlert = useCallback(() => {
    if (__DEV__) {
      console.log('🔒 [showSessionExpiredAlert] Mostrando alerta');
    }

    // Marcar como manejado
    setSessionExpiredHandled(true);

    // Cerrar sesión
    setUser(null);

    // Mostrar alerta
    showAlert(
      'Sesión Expirada',
      ERROR_MESSAGES.SESSION_EXPIRED,
      [
        {
          text: 'Aceptar',
          onPress: () => {
            if (__DEV__) {
              console.log('✅ [onPress Aceptar] Reseteando estados');
            }

            // Resetear el estado cuando se presiona Aceptar
            setSessionExpiredHandled(false);
            pendingSessionExpiredRef.current = false;
          },
        },
      ],
    );
  }, [setSessionExpiredHandled, setUser]); // 👈 REMOVIDO isSessionExpiredHandled de las dependencias

  /**
   * Maneja cuando la sesión expira durante el uso de la app
   */
  const handleSessionExpired = useCallback(() => {
    if (__DEV__) {
      console.log('⚠️ [handleSessionExpired] Llamado');
      console.log('   - isSessionExpiredHandled:', isSessionExpiredHandled);
    }

    // Evitar mostrar múltiples alertas
    if (isSessionExpiredHandled) {
      if (__DEV__) {
        console.log('⚠️ Alerta ya manejada, IGNORANDO');
      }
      return;
    }

    // Mostrar alerta inmediatamente
    if (__DEV__) {
      console.log('🔒 Mostrando alerta de sesión expirada');
    }

    showSessionExpiredAlert();
  }, [isSessionExpiredHandled, showSessionExpiredAlert]);



  /**
   * Inicia el monitoreo periódico de la sesión (opcional)
   */
  const startSessionMonitoring = useCallback(() => {
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
      pendingSessionExpiredRef.current = false;
    };
  }, [stopSessionMonitoring]);

  return {
    handleSessionExpired,
    startSessionMonitoring,
    stopSessionMonitoring,
  };
};