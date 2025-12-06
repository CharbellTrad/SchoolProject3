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
  }, []);

  // Función para verificar soporte biométrico
  const checkBiometricSupport = async () => {
    try {
      const availability = await biometricService.checkBiometricAvailability();
      const enabled = await biometricService.isBiometricEnabled();
      const savedUsername = await biometricService.getBiometricUsername();
      const savedFullName = await biometricService.getBiometricFullName();

      setBiometricAvailable(availability.isAvailable);
      setBiometricEnabled(enabled);
      setBiometricUsername(savedUsername);
      setBiometricFullName(savedFullName);

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
    loggedFullName: string
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
                  loggedFullName
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

        setTimeout(async () => {
          await offerBiometricSetup(
            username,
            password,
            result.user!.fullName
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

  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent />
      <>
        <Head>
          <title>Iniciar Sesión - Sistema Escolar</title>
        </Head>
        <View style={styles.container}>

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
              <View style={styles.mainWrapper}>
                {/* Modern Curved Header */}
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryDark]}
                  style={styles.headerBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Animated.View
                    style={[
                      styles.logoContainer,
                      {
                        transform: [{ scale: logoScale }],
                      },
                    ]}
                  >
                    <View style={styles.logoCircle}>
                      <MaterialCommunityIcons name="school" size={56} color={Colors.primary} />
                    </View>
                  </Animated.View>
                  <Text style={styles.headerSchoolName}>U.E.N.B. Ciudad Jardín</Text>
                  <Text style={styles.headerSubtitle}>Sistema de Gestión Escolar</Text>
                </LinearGradient>

                <Animated.View
                  style={[
                    styles.loginContainer,
                    {
                      opacity: fadeAnim,
                      transform: [{ translateY: slideAnim }],
                    },
                  ]}
                >

                  {/* Form Card */}
                  <View style={styles.formCard}>
                    {loginError ? (
                      <View style={styles.errorBanner}>
                        <Ionicons name="alert-circle" size={20} color={Colors.error} />
                        <Text style={styles.errorBannerText}>{loginError}</Text>
                      </View>
                    ) : null}

                    {/* Biometric Section */}
                    {biometricAvailable && biometricEnabled && biometricUsername && (
                      <Animated.View style={{ transform: [{ scale: biometricButtonScale }], marginBottom: 24 }}>
                        <TouchableOpacity
                          style={styles.biometricButton}
                          onPress={handleBiometricLogin}
                          disabled={isLoading}
                          activeOpacity={0.7}
                        >
                          <LinearGradient
                            colors={[Colors.primary, Colors.primaryDark]}
                            style={styles.biometricGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                          >
                            <Ionicons
                              name={getBiometricIcon(biometricType)}
                              size={28}
                              color="#ffffff"
                            />
                            <View style={styles.biometricTextContainer}>
                              <Text style={styles.biometricButtonText}>
                                Acceder con {biometricType}
                              </Text>
                              <Text style={styles.biometricUsernameText}>{biometricFullName}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.8)" />
                          </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.divider}>
                          <View style={styles.dividerLine} />
                          <Text style={styles.dividerText}>o usa tu contraseña</Text>
                          <View style={styles.dividerLine} />
                        </View>
                      </Animated.View>
                    )}

                    <View style={styles.formContainer}>
                      <Input
                        label="Usuario"
                        placeholder="Jorge"
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
                        placeholder="••••••••"
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
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={styles.footer}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={Colors.textTertiary} />
                    <Text style={styles.versionText}> v1.0.0 • Powered by Odoo</Text>
                  </View>
                </Animated.View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
  },
  mainWrapper: {
    flex: 1,
    justifyContent: 'center', // Helps center content vertically
  },
  headerBackground: {
    paddingTop: Platform.OS === 'android' ? 60 : 70,
    paddingBottom: 50,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
    marginBottom: -40, // Pull content up
    zIndex: 1,
    position: 'absolute', // Absolute to stay at top but allow centering logic below if needed
    top: 0,
    left: 0,
    right: 0,
  },
  logoContainer: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 0,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSchoolName: {
    fontSize: 24, // Increased visibility
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
    textAlign: 'center',
  },
  loginContainer: {
    flex: 1,
    paddingHorizontal: 20,
    zIndex: 2,
    justifyContent: 'center', // Center the card
    paddingTop: 280, // Push down below absolute header
    paddingBottom: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 0,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    gap: 8,
  },
  buttonWrapper: {
    marginTop: 12,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: Colors.error,
  },
  errorBannerText: {
    flex: 1,
    color: Colors.error,
    fontSize: 13,
    fontWeight: '600',
  },
  biometricButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 0,
  },
  biometricGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
  },
  biometricTextContainer: {
    flex: 1,
  },
  biometricButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  biometricUsernameText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    fontWeight: '500',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: -10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 40
  },
  versionText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
  // Dev only styles kept for compatibility
  clearBiometricButton: {
    marginTop: 10,
    alignSelf: 'center',
  },
  clearBiometricText: {
    fontSize: 10,
    color: Colors.error,
  },
});