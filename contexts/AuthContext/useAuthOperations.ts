/**
 * Hook para operaciones de autenticación (login, logout, updateUser)
 * 🆕 ACTUALIZADO CON BIOMETRÍA Y VALIDACIÓN DE DISPOSITIVOS
 */

import { useCallback } from 'react';
import { showAlert } from '../../components/showAlert';
import * as authService from '../../services-odoo/authService';
import * as biometricOdooService from '../../services-odoo/biometricService';
import * as biometricService from '../../services/biometricService';
import { getDeviceInfo } from '../../services/biometricService/deviceInfo';
import { UserSession } from '../../types/auth';
import { ERROR_MESSAGES } from './constants';

export interface AuthOperationsHook {
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
   */
  const login = useCallback(
    async (username: string, password: string): Promise<{ success: boolean; user?: UserSession }> => {
      try {
        setLoading(true);

        if (__DEV__) {
          console.log('🔐 Intentando login tradicional:', username);
        }

        const serverHealth = await authService.checkServerHealth();
        if (!serverHealth.ok) {
          showAlert('Servidor no disponible', ERROR_MESSAGES.SERVER_UNAVAILABLE);
          return { success: false };
        }

        const result = await authService.login(username, password);

        if (!result.success && result.message === 'NO_ROLE_DEFINED') {
          if (__DEV__) {
            console.log('❌ Usuario sin rol definido');
          }
          await authService.logout();
          setUser(null);
          showAlert('Usuario sin rol', ERROR_MESSAGES.NO_ROLE, [
            { text: 'Aceptar', onPress: () => { } },
          ]);
          return { success: false };
        }

        if (result.success && result.user) {
          if (__DEV__) {
            console.log('✅ Login exitoso:', {
              username: result.user.username,
              role: result.user.role,
              fullName: result.user.fullName,
              uid: result.user.odooData.uid,
            });
          }

          const validSession = await authService.verifySession();
          if (!validSession) {
            if (__DEV__) {
              console.log('❌ La sesión no pudo ser verificada');
            }
            showAlert('Error de sesión', ERROR_MESSAGES.SESSION_ERROR);
            await authService.logout();
            return { success: false };
          }

          setUser(validSession);
          setSessionExpiredHandled(false);

          // 🆕 Registrar login tradicional en historial con info del dispositivo
          try {
            const deviceInfo = await getDeviceInfo();
            await biometricOdooService.logTraditionalLogin(
              validSession.token,
              {
                device_name: deviceInfo.deviceName || 'Dispositivo',
                platform: deviceInfo.platform || 'unknown',
                device_id: deviceInfo.deviceId // 🆕 ID único para identificar dispositivo
              }
            );
            if (__DEV__) {
              console.log('✅ Login tradicional registrado en historial');
            }
          } catch (logError) {
            if (__DEV__) {
              console.warn('⚠️ Error registrando login tradicional:', logError);
            }
          }

          return { success: true, user: validSession };
        } else {
          if (__DEV__) {
            console.log('❌ Login fallido:', result.message);
          }
          return { success: false };
        }
      } catch (error: any) {
        if (__DEV__) {
          console.log('❌ Error inesperado en login:', error);
        }
        showAlert('Error', ERROR_MESSAGES.UNEXPECTED_ERROR);
        return { success: false };
      } finally {
        setLoading(false);
      }
    },
    [setUser, setLoading, setSessionExpiredHandled]
  );

  /**
   * 🆕 Login con biometría - CORREGIDO para evitar error "No hay sesión activa"
   */
  const loginWithBiometrics = useCallback(async (): Promise<boolean> => {
    const startTime = Date.now();
    let odooDeviceId: number | null = null;
    let currentDeviceInfo: { deviceId: string } | null = null;

    try {
      setLoading(true);

      if (__DEV__) {
        console.log('🔐 Intentando login biométrico...');
      }

      // 1. Obtener información del dispositivo local (SIN llamar a Odoo aún)
      try {
        currentDeviceInfo = await getDeviceInfo();
      } catch (deviceError) {
        if (__DEV__) {
          console.warn('⚠️ No se pudo obtener info del dispositivo:', deviceError);
        }
      }

      // 2. Autenticar con biometría local
      const bioResult = await biometricService.authenticateWithBiometrics({
        promptMessage: 'Inicia sesión con biometría',
      });

      if (!bioResult.success) {
        if (__DEV__) {
          console.log('❌ Autenticación biométrica fallida:', bioResult.error);
        }

        if (bioResult.errorCode !== biometricService.BiometricErrorCode.USER_CANCELED) {
          showAlert('Error Biométrico', bioResult.error || 'No se pudo autenticar');
        }

        return false;
      }

      const username = bioResult.username!;
      const password = bioResult.password!;

      if (__DEV__) {
        console.log('✅ Autenticación biométrica local exitosa para:', username);
      }

      // 3. Verificar servidor
      const serverHealth = await authService.checkServerHealth();
      if (!serverHealth.ok) {
        showAlert('Servidor no disponible', ERROR_MESSAGES.SERVER_UNAVAILABLE);
        return false;
      }

      // 4. Login automático con Odoo (AQUÍ se crea la sesión)
      if (__DEV__) {
        console.log('🔐 Realizando login automático en Odoo...');
      }

      const loginResult = await authService.login(username, password);

      if (!loginResult.success) {
        if (__DEV__) {
          console.log('❌ Login automático fallido:', loginResult.message);
        }

        if (loginResult.message?.includes('incorrectos') ||
          loginResult.message?.includes('denied')) {
          await biometricService.clearBiometricCredentials();

          showAlert(
            'Credenciales Inválidas',
            'Las credenciales guardadas ya no son válidas. Por favor, inicia sesión nuevamente.',
            [{ text: 'Aceptar', onPress: () => { } }]
          );
        } else {
          showAlert('Error', loginResult.message || 'Error al iniciar sesión');
        }

        return false;
      }

      // 5. Verificar sesión
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

      // 6. Actualizar último uso local
      await biometricService.updateLastUsed();

      // 7. 🆕 Validar que el dispositivo siga activo en Odoo (DESPUÉS del login)
      if (currentDeviceInfo?.deviceId) {
        try {
          const validationResult = await biometricOdooService.validateDevice(currentDeviceInfo.deviceId);

          if (!validationResult.valid) {
            const status = (validationResult as any).status || 'revocado';

            if (__DEV__) {
              console.log(`❌ Dispositivo ${status}:`, validationResult.message);
            }

            // Si el dispositivo está deshabilitado (no revocado), no limpiar credenciales
            if (status === 'deshabilitado') {
              await authService.logout();
              setUser(null);

              showAlert(
                'Dispositivo Deshabilitado',
                'Este dispositivo ha sido deshabilitado temporalmente. Contacta al administrador o espera a que sea habilitado nuevamente.',
                [{ text: 'Aceptar', onPress: () => { } }]
              );
            } else {
              // Dispositivo revocado - limpiar todo
              await biometricService.clearBiometricCredentials();
              await authService.logout();
              setUser(null);

              showAlert(
                'Dispositivo Revocado',
                'Este dispositivo ya no está autorizado para usar biometría. Por favor, inicia sesión con usuario y contraseña.',
                [{ text: 'Aceptar', onPress: () => { } }]
              );
            }

            return false;
          }

          odooDeviceId = validationResult.deviceOdooId;

          if (loginResult.user?.imageUrl) {
            await biometricService.saveBiometricCredentialsWithDeviceInfo(
              username,
              password,
              loginResult.user.fullName,
              loginResult.user.imageUrl
            );
            if (__DEV__) {
              console.log('🔄 Imagen biométrica actualizada desde servidor');
            }
          }

          if (__DEV__) {
            console.log('✅ Dispositivo validado en Odoo:', validationResult.deviceOdooId);
          }
        } catch (validationError) {
          if (__DEV__) {
            console.warn('⚠️ No se pudo validar dispositivo (ignorado):', validationError);
          }
        }
      }

      // 8. Registrar autenticación exitosa en Odoo
      if (odooDeviceId) {
        try {
          await biometricOdooService.logAuthentication(
            biometricOdooService.createAuthLogPayload(
              odooDeviceId,
              true,
              {
                sessionId: validSession.token,
                durationMs: Date.now() - startTime,
              }
            )
          );

          if (__DEV__) {
            console.log('✅ Log de autenticación registrado en Odoo');
          }
        } catch (logError) {
          if (__DEV__) {
            console.warn('⚠️ Error registrando log en Odoo (ignorado):', logError);
          }
        }
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

      const availability = await biometricService.checkBiometricAvailability();
      if (!availability.isAvailable) {
        const message = !availability.hasHardware
          ? 'Tu dispositivo no soporta autenticación biométrica'
          : 'Configura la autenticación biométrica en tu dispositivo primero';

        showAlert('Biometría no disponible', message);
        return false;
      }

      const bioResult = await biometricService.authenticateWithBiometrics({
        promptMessage: 'Confirma tu identidad para habilitar biometría',
      });

      if (!bioResult.success) {
        if (bioResult.errorCode !== biometricService.BiometricErrorCode.USER_CANCELED) {
          showAlert('Error', bioResult.error || 'No se pudo autenticar');
        }
        return false;
      }

      const saved = await biometricService.saveBiometricCredentialsWithDeviceInfo(
        user.username,
        user.password,
        user.fullName,
        user.imageUrl // Guardar imagen del usuario
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

      // 🆕 Marcar sesión como finalizada en Odoo (solo para este dispositivo)
      try {
        const deviceInfo = await getDeviceInfo();
        await biometricOdooService.endSession(undefined, deviceInfo.deviceId);

        if (__DEV__) {
          console.log('✅ Sesión marcada como finalizada en Odoo para dispositivo:', deviceInfo.deviceName);
        }
      } catch (sessionError) {
        if (__DEV__) {
          console.warn('⚠️ Error finalizando sesión en Odoo:', sessionError);
        }
      }

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