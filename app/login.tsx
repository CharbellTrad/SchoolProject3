import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Head from 'expo-router/head';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

const { height, width } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ username: false, password: false });
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const { login } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;

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

      const success = await login(username, password);

      if (success) {
        if (__DEV__) {
          console.log('✅ Login exitoso, redirigiendo...');
        }

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

  const clearError = (field: 'username' | 'password'): void => {
    setErrors((prev) => ({ ...prev, [field]: '' }));
    setLoginError('');
  };

  return (
    <>
      <Head>
        <title>Iniciar Sesión - Sistema Escolar</title>
      </Head>

      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent />

        {/* Elementos decorativos modernos */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeSquare} />

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
              {/* Header con logo */}
              <View style={styles.header}>
                <Animated.View 
                  style={[
                    styles.logoContainer,
                    {
                      transform: [{ scale: logoScale }],
                    }
                  ]}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    style={styles.logoGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <MaterialCommunityIcons
                      name="school"
                      size={48}
                      color="#ffffff"
                    />
                  </LinearGradient>
                </Animated.View>
                
                <Text style={styles.title}>Bienvenido</Text>
                <Text style={styles.subtitle}>
                  Sistema de Gestión Escolar
                </Text>
                <Text style={styles.schoolName}>U.E.N.B. Ciudad Jardín</Text>
              </View>

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
                </View>
              </View>

              {/* Footer moderno */}
              <View style={styles.footer}>
                <View style={styles.securityBadge}>
                  <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
                  <Text style={styles.securityText}>Conexión Segura</Text>
                </View>
                <Text style={styles.versionText}>Versión 1.0.0 • Powered by Odoo</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </>
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
  decorativeCircle1: {
    position: 'absolute',
    top: -100,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(30, 64, 175, 0.08)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
  },
  decorativeSquare: {
    position: 'absolute',
    top: '45%',
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    transform: [{ rotate: '25deg' }],
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
  },
  loginContainer: {
    flex: 1,
    minHeight: height,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 80 : 70,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  schoolName: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
      },
      android: {
        elevation: 6,
      },
    }),
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    width: '100%',
  },
  buttonWrapper: {
    marginTop: 8,
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
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
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
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 12,
    gap: 6,
  },
  securityText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  versionText: {
    color: Colors.textTertiary,
    fontSize: 12,
    fontWeight: '500',
  },
});
