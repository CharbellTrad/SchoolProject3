/**
 * Hook para monitorear y manejar sesiones expiradas
 */

import { useCallback, useEffect, useRef } from 'react';
import { showAlert } from '../../components/showAlert';
import { UserSession } from '../../types/auth';
import { useAppReady } from '../AppReady';
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
  const { isAppReady } = useAppReady();
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
      console.log('   - isAppReady:', isAppReady);
      console.log('   - pendingSessionExpiredRef:', pendingSessionExpiredRef.current);
    }

    // Evitar mostrar múltiples alertas
    if (isSessionExpiredHandled) {
      if (__DEV__) {
        console.log('⚠️ Alerta ya manejada, IGNORANDO');
      }
      return;
    }

    // Si la app NO está lista (aún en splash), marcar como pendiente
    if (!isAppReady) {
      pendingSessionExpiredRef.current = true;
      if (__DEV__) {
        console.log('🔒 Sesión expirada, esperando a que la app esté lista...');
      }
      return;
    }

    // Si la app YA está lista, mostrar alerta inmediatamente
    if (__DEV__) {
      console.log('🔒 App lista, mostrando alerta inmediatamente');
    }
    
    showSessionExpiredAlert();
  }, [isSessionExpiredHandled, isAppReady, showSessionExpiredAlert]);

  /**
   * Efecto para mostrar la alerta pendiente cuando la app esté lista
   */
  useEffect(() => {
    if (__DEV__) {
      console.log('📡 [useEffect] Verificando condiciones');
      console.log('   - isAppReady:', isAppReady);
      console.log('   - pendingSessionExpiredRef:', pendingSessionExpiredRef.current);
      console.log('   - isSessionExpiredHandled:', isSessionExpiredHandled);
    }

    if (isAppReady && pendingSessionExpiredRef.current && !isSessionExpiredHandled) {
      if (__DEV__) {
        console.log('✅ Condiciones cumplidas, mostrando alerta pendiente');
      }
      showSessionExpiredAlert();
      // Limpiar la referencia pendiente
      pendingSessionExpiredRef.current = false;
    }
  }, [isAppReady, showSessionExpiredAlert, isSessionExpiredHandled]);

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