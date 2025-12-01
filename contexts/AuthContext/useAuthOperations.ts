/**
 * Hook para operaciones de autenticación (login, logout, updateUser)
 * 🆕 ACTUALIZADO CON BIOMETRÍA
 */

import { useCallback } from 'react';
import { showAlert } from '../../components/showAlert';
import * as authService from '../../services-odoo/authService';
import * as biometricService from '../../services/biometricService';
import { UserSession } from '../../types/auth';
import { ERROR_MESSAGES } from './constants';

export interface AuthOperationsHook {
  // ✅ CAMBIAR ESTA LÍNEA
  login: (username: string, password: string) => Promise<{ success: boolean; user?: UserSession }>;
  loginWithBiometrics: () => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<UserSession>) => Promise<void>;
  enableBiometricLogin: () => Promise<boolean>;
  disableBiometricLogin: () => Promise<void>;
  isBiometricAvailable: () => Promise<boolean>;
  isBiometricEnabled: () => Promise<boolean>;
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
   * Login tradicional con Odoo
   * ✅ MODIFICADO: Retorna { success, user }
   */
  const login = useCallback(
    async (username: string, password: string): Promise<{ success: boolean; user?: UserSession }> => {
      try {
        setLoading(true);

        if (__DEV__) {
          console.log('🔐 Intentando login tradicional:', username);
        }

        // Verificar servidor
        const serverHealth = await authService.checkServerHealth();

        if (!serverHealth.ok) {
          showAlert('Servidor no disponible', ERROR_MESSAGES.SERVER_UNAVAILABLE);
          return { success: false }; // ✅ Cambiar aquí
        }

        // Intentar login
        const result = await authService.login(username, password);

        // Caso especial: usuario sin rol
        if (!result.success && result.message === 'NO_ROLE_DEFINED') {
          if (__DEV__) {
            console.log('❌ Usuario sin rol definido - Mostrando alerta y limpiando datos');
          }

          await authService.logout();
          setUser(null);

          showAlert('Usuario sin rol', ERROR_MESSAGES.NO_ROLE, [
            {
              text: 'Aceptar',
              onPress: () => {},
            },
          ]);

          return { success: false }; // ✅ Cambiar aquí
        }

        // Login exitoso
        if (result.success && result.user) {
          if (__DEV__) {
            console.log('✅ Login exitoso:', {
              username: result.user.username,
              role: result.user.role,
              fullName: result.user.fullName, // ✅ Debug
              uid: result.user.odooData.uid,
            });
          }

          // Verificar sesión
          const validSession = await authService.verifySession();

          if (!validSession) {
            if (__DEV__) {
              console.log('❌ La sesión no pudo ser verificada después del login');
            }

            showAlert('Error de sesión', ERROR_MESSAGES.SESSION_ERROR);
            await authService.logout();
            return { success: false }; // ✅ Cambiar aquí
          }

          setUser(validSession);
          setSessionExpiredHandled(false);
          return { success: true, user: validSession }; // ✅ Cambiar aquí
        } else {
          if (__DEV__) {
            console.log('❌ Login fallido:', result.message);
          }
          return { success: false }; // ✅ Cambiar aquí
        }
      } catch (error: any) {
        if (__DEV__) {
          console.log('❌ Error inesperado en login:', error);
        }

        showAlert('Error', ERROR_MESSAGES.UNEXPECTED_ERROR);
        return { success: false }; // ✅ Cambiar aquí
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, setSessionExpiredHandled]
  );

  /**
   * 🆕 Login con biometría
   */
  const loginWithBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);

      if (__DEV__) {
        console.log('🔐 Intentando login biométrico...');
      }

      // 1. Autenticar con biometría (esto ya incluye el prompt y obtiene username + password)
      const bioResult = await biometricService.authenticateWithBiometrics({
        promptMessage: 'Inicia sesión con biometría',
      });

      if (!bioResult.success) {
        if (__DEV__) {
          console.log('❌ Autenticación biométrica fallida:', bioResult.error);
        }

        // Solo mostrar error si no es cancelación del usuario
        if (bioResult.errorCode !== biometricService.BiometricErrorCode.USER_CANCELED) {
          showAlert('Error Biométrico', bioResult.error || 'No se pudo autenticar');
        }

        return false;
      }

      const username = bioResult.username!;
      const password = bioResult.password!; // 🆕 Ahora tenemos la contraseña

      if (__DEV__) {
        console.log('✅ Autenticación biométrica exitosa para:', username);
      }

      // 2. Verificar servidor
      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        showAlert('Servidor no disponible', ERROR_MESSAGES.SERVER_UNAVAILABLE);
        return false;
      }

      // 3. 🆕 Hacer login automático con las credenciales recuperadas
      if (__DEV__) {
        console.log('🔐 Realizando login automático con credenciales biométricas...');
      }

      const loginResult = await authService.login(username, password);

      if (!loginResult.success) {
        if (__DEV__) {
          console.log('❌ Login automático fallido:', loginResult.message);
        }

        // Si las credenciales no funcionan, limpiar biometría
        if (loginResult.message?.includes('incorrectos') || 
            loginResult.message?.includes('denied')) {
          await biometricService.clearBiometricCredentials();
          
          showAlert(
            'Credenciales Inválidas',
            'Las credenciales guardadas ya no son válidas. Por favor, inicia sesión nuevamente.',
            [{ text: 'Aceptar', onPress: () => {} }]
          );
        } else {
          showAlert('Error', loginResult.message || 'Error al iniciar sesión');
        }

        return false;
      }

      // 4. Verificar sesión
      const validSession = await authService.verifySession();

      if (!validSession) {
        if (__DEV__) {
          console.log('❌ La sesión no pudo ser verificada después del login biométrico');
        }

        await authService.logout();
        showAlert('Error de sesión', ERROR_MESSAGES.SESSION_ERROR);
        return false;
      }

      if (__DEV__) {
        console.log('✅ Login biométrico completo:', {
          username: validSession.username,
          role: validSession.role,
        });
      }

      await biometricService.updateLastUsed();

      if (__DEV__) {
        console.log('📅 Timestamp de último uso actualizado');
      }

      setUser(validSession);
      setSessionExpiredHandled(false);
      return true;
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Error en login biométrico:', error);
      }

      showAlert('Error', ERROR_MESSAGES.UNEXPECTED_ERROR);
      return false;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, setSessionExpiredHandled]);

  /**
   * 🆕 Habilitar login biométrico
   */
  const enableBiometricLogin = useCallback(async (): Promise<boolean> => {
    try {
      if (!user) {
        if (__DEV__) {
          console.log('⚠️ No hay usuario para habilitar biometría');
        }
        return false;
      }

      if (__DEV__) {
        console.log('🔐 Habilitando biometría para:', user.username);
      }

      // Verificar disponibilidad
      const availability = await biometricService.checkBiometricAvailability();

      if (!availability.isAvailable) {
        const message = !availability.hasHardware
          ? 'Tu dispositivo no soporta autenticación biométrica'
          : 'Configura la autenticación biométrica en tu dispositivo primero';

        showAlert('Biometría no disponible', message);
        return false;
      }

      // Realizar autenticación de prueba
      const bioResult = await biometricService.authenticateWithBiometrics({
        promptMessage: 'Confirma tu identidad para habilitar biometría',
      });

      if (!bioResult.success) {
        if (bioResult.errorCode !== biometricService.BiometricErrorCode.USER_CANCELED) {
          showAlert('Error', bioResult.error || 'No se pudo autenticar');
        }
        return false;
      }

      // ✅ CORREGIR AQUÍ: Agregar fullName
      const saved = await biometricService.saveBiometricCredentialsWithDeviceInfo(
        user.username, 
        user.password,
        user.fullName // ✅ Agregar este parámetro
      );

      if (saved) {
        if (__DEV__) {
          console.log('✅ Biometría habilitada exitosamente');
        }

        const biometricName = biometricService.getBiometricTypeName(
          availability.biometricType
        );

        showAlert(
          'Biometría Habilitada',
          `Ahora puedes usar ${biometricName} para iniciar sesión rápidamente.`
        );

        return true;
      }

      return false;
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Error habilitando biometría:', error);
      }

      showAlert('Error', 'No se pudo habilitar la autenticación biométrica');
      return false;
    }
  }, [user]);

  /**
   * 🆕 Deshabilitar login biométrico
   */
  const disableBiometricLogin = useCallback(async (): Promise<void> => {
    try {
      if (__DEV__) {
        console.log('🔒 Deshabilitando biometría...');
      }

      await biometricService.clearBiometricCredentials();

      showAlert('Biometría Deshabilitada', 'La autenticación biométrica ha sido deshabilitada.');

      if (__DEV__) {
        console.log('✅ Biometría deshabilitada exitosamente');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Error deshabilitando biometría:', error);
      }

      showAlert('Error', 'No se pudo deshabilitar la autenticación biométrica');
    }
  }, []);

  /**
   * 🆕 Verificar si biometría está disponible
   */
  const isBiometricAvailable = useCallback(async (): Promise<boolean> => {
    try {
      const availability = await biometricService.checkBiometricAvailability();
      return availability.isAvailable;
    } catch (error) {
      return false;
    }
  }, []);

  /**
   * 🆕 Verificar si biometría está habilitada
   */
  const isBiometricEnabled = useCallback(async (): Promise<boolean> => {
    try {
      return await biometricService.isBiometricEnabled();
    } catch (error) {
      return false;
    }
  }, []);

  /**
   * Logout - Cierra la sesión (NO elimina biometría)
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);

      if (__DEV__) {
        console.log('🔓 Cerrando sesión...');
      }

      // Destruir sesión en Odoo
      await authService.logout();

      if (__DEV__) {
        console.log('✅ Sesión cerrada (biometría se mantiene)');
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
    loginWithBiometrics,
    logout,
    updateUser,
    enableBiometricLogin,
    disableBiometricLogin,
    isBiometricAvailable,
    isBiometricEnabled,
  };
};