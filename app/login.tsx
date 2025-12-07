import { getBiometricIcon } from '@/utils/biometricHelpers';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserAvatar } from '../components/common/UserAvatar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import * as biometricService from '../services/biometricService';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ username: false, password: false });
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometría');
  const [biometricUsername, setBiometricUsername] = useState<string | null>(null);
  const [biometricFullName, setBiometricFullName] = useState<string | null>(null);
  const [biometricUserImage, setBiometricUserImage] = useState<string | null>(null); // Imagen del usuario
  const [showBiometricMode, setShowBiometricMode] = useState(false); // Modo biométrico personalizado
  const [manualModeOverride, setManualModeOverride] = useState(false);

  const { login, loginWithBiometrics } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const biometricButtonScale = useRef(new Animated.Value(0)).current; // 🆕
  const insets = useSafeAreaInsets();

  // Verificar disponibilidad de biometría al montar y cuando la pantalla gana foco
  useEffect(() => {
    checkBiometricSupport();

    // Recargar cuando vuelve a la pantalla
    const interval = setInterval(() => {
      checkBiometricSupport();
    }, 2000);

    return () => clearInterval(interval);
  }, [manualModeOverride]);

  // Función para verificar soporte biométrico
  const checkBiometricSupport = async () => {
    try {
      const availability = await biometricService.checkBiometricAvailability();
      const enabled = await biometricService.isBiometricEnabled();
      const savedUsername = await biometricService.getBiometricUsername();
      const savedFullName = await biometricService.getBiometricFullName();
      const savedImage = await biometricService.getBiometricUserImage(); // Obtener imagen

      setBiometricAvailable(availability.isAvailable);
      setBiometricEnabled(enabled);
      setBiometricUsername(savedUsername);
      setBiometricFullName(savedFullName);
      setBiometricUserImage(savedImage); // Guardar imagen

      // Activar modo biométrico si hay credenciales Y usuario no cambió manualmente
      if (enabled && savedUsername && !manualModeOverride) {
        setShowBiometricMode(true);
        setUsername(savedUsername);
      } else if (!enabled || !savedUsername) {
        setShowBiometricMode(false);
      }

      if (availability.biometricType) {
        const typeName = biometricService.getBiometricTypeName(availability.biometricType, availability.allTypes);
        setBiometricType(typeName);
      }

      if (__DEV__) {
        console.log('🔐 Biometría:', {
          available: availability.isAvailable,
          enabled,
          type: availability.biometricType,
          username: savedUsername,
          hasImage: !!savedImage,
        });
      }

      // Animar botón biométrico si está disponible
      if (availability.isAvailable && enabled) {
        Animated.spring(biometricButtonScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
          delay: 400,
        }).start();
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error verificando biometría:', error);
      }
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 40,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Ofrecer configurar biometría después del login
  const offerBiometricSetup = async (
    loggedUsername: string,
    loggedPassword: string,
    loggedFullName: string,
    loggedImageUrl?: string // Foto del usuario
  ) => {
    try {
      // Verificar si ya está habilitada
      const alreadyEnabled = await biometricService.isBiometricEnabled();
      if (alreadyEnabled) {
        return;
      }

      const availability = await biometricService.checkBiometricAvailability();
      if (!availability.isAvailable) {
        return;
      }

      const biometricName = biometricService.getBiometricTypeName(availability.biometricType, availability.allTypes);

      Alert.alert(
        `¿Usar ${biometricName}?`,
        `Habilita ${biometricName} para iniciar sesión más rápido la próxima vez.`,
        [
          {
            text: 'Ahora no',
            style: 'cancel',
            onPress: () => {
              if (__DEV__) {
                console.log('Usuario rechazó configurar biometría');
              }
            },
          },
          {
            text: 'Habilitar',
            onPress: async () => {
              try {
                if (__DEV__) {
                  console.log('🔐 Habilitando biometría para:', loggedUsername);
                  console.log('📝 Full Name:', loggedFullName);
                }

                const LocalAuthentication = await import('expo-local-authentication');

                const bioResult = await LocalAuthentication.authenticateAsync({
                  promptMessage: 'Confirma tu identidad para habilitar biometría',
                  cancelLabel: 'Cancelar',
                  disableDeviceFallback: false,
                });

                if (!bioResult.success) {
                  if (__DEV__) {
                    console.log('❌ Autenticación biométrica cancelada o fallida');
                  }
                  if (bioResult.error && !bioResult.error.toLowerCase().includes('cancel')) {
                    Alert.alert('Error', 'No se pudo autenticar con biometría');
                  }
                  return;
                }

                const saved = await biometricService.saveBiometricCredentialsWithDeviceInfo(
                  loggedUsername,
                  loggedPassword,
                  loggedFullName,
                  loggedImageUrl // Imagen del usuario
                );

                if (saved) {
                  if (__DEV__) {
                    console.log('✅ Biometría habilitada exitosamente');
                    console.log('📝 Guardado con nombre:', loggedFullName);
                  }

                  Alert.alert(
                    'Biometría Habilitada',
                    `Ahora puedes usar ${biometricName} para iniciar sesión rápidamente.`
                  );

                  await checkBiometricSupport();
                }
              } catch (error: any) {
                if (__DEV__) {
                  console.error('❌ Error habilitando biometría:', error);
                }
                Alert.alert('Error', 'No se pudo habilitar la autenticación biométrica');
              }
            },
          },
        ]
      );
    } catch (error) {
      if (__DEV__) {
        console.error('Error ofreciendo biometría:', error);
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors = { username: '', password: '' };
    let isValid = true;

    if (!username.trim()) {
      newErrors.username = 'El nombre de usuario es requerido';
      isValid = false;
    }

    if (!password.trim()) {
      newErrors.password = 'La contraseña es requerida';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (): Promise<void> => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setLoginError('');

    try {
      if (__DEV__) {
        console.log('🔐 Intentando login con:', username);
      }

      const result = await login(username, password);

      if (result.success && result.user) {
        if (__DEV__) {
          console.log('✅ Login exitoso:', {
            username: result.user.username,
            fullName: result.user.fullName,
          });
        }

        const isBiometricEnabled = await biometricService.isBiometricEnabled();
        if (isBiometricEnabled) {
          await biometricService.saveBiometricCredentialsWithDeviceInfo(
            username,
            password,
            result.user.fullName,
            result.user.imageUrl // Actualizar imagen
          );
          if (__DEV__) {
            console.log('🔄 Credenciales biométricas actualizadas');
            console.log('🔍 Imagen guardada:', result.user.imageUrl?.substring(0, 40));
          }
        }

        setTimeout(async () => {
          await offerBiometricSetup(
            username,
            password,
            result.user!.fullName,
            result.user!.imageUrl // Pasar imagen del usuario
          );
        }, 800);

        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else {
        if (__DEV__) {
          console.log('❌ Login fallido');
        }
        setLoginError('Usuario o contraseña incorrectos');
        setPassword('');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.log('❌ Error inesperado:', error);
      }
      setLoginError(error.message || 'Ha ocurrido un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  // Manejo de login biométrico
  const handleBiometricLogin = async (): Promise<void> => {
    setIsLoading(true);
    setLoginError('');

    try {
      if (__DEV__) {
        console.log('🔐 Intentando login biométrico...');
      }

      const success = await loginWithBiometrics();

      if (success) {
        if (__DEV__) {
          console.log('✅ Login biométrico exitoso');
        }

        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
      // No mostramos error aquí porque ya se muestra en loginWithBiometrics
    } catch (error: any) {
      if (__DEV__) {
        console.log('❌ Error en login biométrico:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = (field: 'username' | 'password'): void => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setLoginError('');
  };

  // Función para cambiar de usuario (salir del modo biométrico)
  const handleSwitchUser = (): void => {
    setManualModeOverride(true); // Marcar cambio manual
    setShowBiometricMode(false);
    setUsername('');
    setPassword('');
    setLoginError('');
    setErrors({ username: '', password: '' });
  };

  // Función para volver al usuario biométrico desde login normal
  const handleBackToBiometric = (): void => {
    if (biometricEnabled && biometricUsername) {
      setManualModeOverride(false); // Permitir auto-activación
      setShowBiometricMode(true);
      setUsername(biometricUsername);
      setPassword('');
      setLoginError('');
      setErrors({ username: '', password: '' });
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent />
      <>
        <Head>
          <title>Iniciar Sesión - Sistema Escolar</title>
        </Head>
        <View style={{ ...styles.container, paddingBottom: insets.bottom }}>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Animated.View
                style={[
                  styles.loginContainer,
                  {
                    opacity: fadeAnim,
                    transform: [{ translateY: slideAnim }],
                  },
                ]}
              >
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.headerBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Header con logo */}
                  <View style={styles.header}>
                    <Animated.View
                      style={[
                        styles.logoContainer,
                        {
                          transform: [{ scale: logoScale }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['#fff', '#fff']}
                        style={styles.logoGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <MaterialCommunityIcons name="school" size={56} color={Colors.primary} />
                      </LinearGradient>
                    </Animated.View>

                    <Text style={styles.schoolName}>U.E.N.B. Ciudad Jardín</Text>
                    <Text style={styles.subtitle}>Sistema de Gestión Escolar</Text>
                  </View>
                </LinearGradient>

                {/* Form Card con glassmorphism */}
                <View style={styles.formCard}>
                  {loginError ? (
                    <View style={styles.errorBanner}>
                      <View style={styles.errorIconContainer}>
                        <Ionicons name="alert-circle" size={22} color={Colors.error} />
                      </View>
                      <Text style={styles.errorBannerText}>{loginError}</Text>
                    </View>
                  ) : null}

                  {/* Modo biométrico personalizado con perfil */}
                  {showBiometricMode ? (
                    <>
                      {/* Sección de perfil del usuario */}
                      <View style={styles.profileSection}>
                        <View style={styles.profileAvatarContainer}>
                          <UserAvatar
                            imageUrl={biometricUserImage ?? undefined}
                            size={100}
                            iconColor={Colors.primary}
                            gradientColors={['#ffffff', '#ffffff']}
                            borderRadius={12}
                          />
                        </View>
                        <Text style={styles.profileName}>{biometricFullName || biometricUsername}</Text>
                        <Text style={styles.profileSubtext}>Sesión guardada</Text>
                      </View>

                      <View style={styles.formContainer}>
                        {/* Campo de usuario bloqueado */}
                        <Input
                          label="Usuario"
                          placeholder="Usuario"
                          value={username}
                          onChangeText={() => { }} // No hace nada, campo bloqueado
                          leftIcon="lock-closed"
                          editable={false} // Bloqueado
                          isFocused={false}
                        />

                        {/* Campo de contraseña para login manual */}
                        <Input
                          label="Contraseña"
                          placeholder="Ingresa tu contraseña"
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            clearError('password');
                          }}
                          onFocus={() => setIsFocused({ ...isFocused, password: true })}
                          onBlur={() => setIsFocused({ ...isFocused, password: false })}
                          leftIcon="lock-closed-outline"
                          rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          onRightIconPress={() => setShowPassword(!showPassword)}
                          error={errors.password}
                          isFocused={isFocused.password}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          editable={!isLoading}
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                        />

                        {/* Botones lado a lado: Login + Biometría */}
                        <View style={styles.biometricLoginRow}>
                          <View style={{ flex: 1, marginRight: 12 }}>
                            <Button
                              title="INICIAR SESIÓN"
                              onPress={handleLogin}
                              loading={isLoading}
                              variant="primary"
                              size="large"
                              disabled={isLoading}
                            />
                          </View>
                          <TouchableOpacity
                            style={styles.biometricIconButton}
                            onPress={handleBiometricLogin}
                            disabled={isLoading}
                            activeOpacity={0.7}
                          >
                            <LinearGradient
                              colors={[Colors.primary, Colors.primaryDark]}
                              style={styles.biometricIconGradient}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                            >
                              <Ionicons
                                name={getBiometricIcon(biometricType)}
                                size={28}
                                color="#ffffff"
                              />
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>

                        {/* Enlace para cambiar de usuario */}
                        <TouchableOpacity
                          style={styles.switchUserButton}
                          onPress={handleSwitchUser}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.switchUserText}>
                            ¿Deseas iniciar sesión con otro usuario?
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  ) : (
                    <>
                      {/* Modo login normal */}
                      <View style={styles.formContainer}>
                        <Input
                          label="Usuario"
                          placeholder="Ingresa tu usuario"
                          value={username}
                          onChangeText={(text) => {
                            setUsername(text);
                            clearError('username');
                          }}
                          onFocus={() => setIsFocused({ ...isFocused, username: true })}
                          onBlur={() => setIsFocused({ ...isFocused, username: false })}
                          leftIcon="person-outline"
                          error={errors.username}
                          isFocused={isFocused.username}
                          showClearButton
                          onClear={() => setUsername('')}
                          autoCapitalize="none"
                          autoCorrect={false}
                          editable={!isLoading}
                          returnKeyType="next"
                        />

                        <Input
                          label="Contraseña"
                          placeholder="Ingresa tu contraseña"
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            clearError('password');
                          }}
                          onFocus={() => setIsFocused({ ...isFocused, password: true })}
                          onBlur={() => setIsFocused({ ...isFocused, password: false })}
                          leftIcon="lock-closed-outline"
                          rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          onRightIconPress={() => setShowPassword(!showPassword)}
                          error={errors.password}
                          isFocused={isFocused.password}
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          editable={!isLoading}
                          returnKeyType="done"
                          onSubmitEditing={handleLogin}
                        />

                        <View style={styles.buttonWrapper}>
                          <Button
                            title="INICIAR SESIÓN"
                            onPress={handleLogin}
                            loading={isLoading}
                            icon="arrow-forward"
                            iconPosition="right"
                            variant="primary"
                            size="large"
                            disabled={isLoading}
                          />
                        </View>

                        {/* Enlace para volver al modo biométrico si está disponible */}
                        {biometricEnabled && biometricUsername && (
                          <TouchableOpacity
                            style={styles.backToBiometricButton}
                            onPress={handleBackToBiometric}
                            activeOpacity={0.7}
                          >
                            <Ionicons name={getBiometricIcon(biometricType)} size={16} color={Colors.primary} />
                            <Text style={styles.backToBiometricText}>
                              Volver a {biometricFullName}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </>
                  )}
                </View>

                {/* Footer moderno */}
                <View style={styles.footer}>
                  <Text style={styles.versionText}>Versión 1.0.0 • Powered by Odoo</Text>
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </>
    </SafeAreaProvider >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  headerBackground: {
    width: Dimensions.get('window').width, // ← Agrega esto
    paddingTop: Platform.OS === 'android' ? 30 : 40,
    paddingBottom: 25,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
    alignItems: 'center',
    zIndex: 1,
    alignSelf: 'center', // ← Agrega esto para centrar
    marginBottom: 10
  },
  scrollContent: {
    flexGrow: 1,
  },
  loginContainer: {
    flex: 1,
    minHeight: 20,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 30,
  },
  logoContainer: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 0,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
    }),
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  schoolName: {
    fontSize: 24, // Increased visibility
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
    }),
    borderWidth: 1,
    borderColor: Colors.gray[200],
  },
  formContainer: {
    width: '100%',
  },
  buttonWrapper: {
    marginTop: 6,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorIconContainer: {
    marginRight: 12,
  },
  errorBannerText: {
    flex: 1,
    color: Colors.error,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  biometricButton: {
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 5,
  },
  biometricGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    gap: 12,
  },
  biometricTextContainer: {
    flex: 1,
  },
  biometricButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  biometricUsernameText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.textTertiary,
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30
  },
  versionText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
  clearBiometricButton: {
    backgroundColor: '#fee2e2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearBiometricText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  // Nuevos estilos para modo biométrico personalizado
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  profileAvatarContainer: {
    marginTop: -10,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 0,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  profileSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: -30,
  },
  biometricLoginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  biometricIconButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: 'hidden',
  },
  biometricIconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchUserButton: {
    marginTop: 20,
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchUserText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  backToBiometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backToBiometricText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
});