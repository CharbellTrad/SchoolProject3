import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Head from 'expo-router/head';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, View, } from 'react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';

const { height } = Dimensions.get('window');

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState({ username: false, password: false });
  const [errors, setErrors] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  const { login } = useAuth();

  // Animaciones simples
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
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

  const handleUsernameFocus = () => {
    setIsFocused({ ...isFocused, username: true });
  };

  const handleUsernameBlur = () => {
    setIsFocused({ ...isFocused, username: false });
  };

  const handlePasswordFocus = () => {
    setIsFocused({ ...isFocused, password: true });
  };

  const handlePasswordBlur = () => {
    setIsFocused({ ...isFocused, password: false });
  };

  return (
    <>
      <Head>
        <title>Iniciar Sesión - Sistema Escolar</title>
      </Head>

      <LinearGradient
        colors={['#ffffff', '#f8fafc', '#f1f5f9']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Elementos decorativos */}
        <View style={styles.decorativeCircle1} />
        <View style={styles.decorativeCircle2} />
        <View style={styles.decorativeCircle3} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
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
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <View style={styles.logoBackground}>
                    <MaterialCommunityIcons
                      name="school"
                      size={70}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.logoPulse} />
                </View>
                <Text style={styles.title}>U.E.N.B. Ciudad Jardin</Text>
                <Text style={styles.subtitle}>
                  Sistema Escolar - Gestión Académica Integral
                </Text>
              </View>

              {/* Form Card */}
              <View style={styles.formCard}>
                <View style={styles.formContainer}>
                  {loginError ? (
                    <Animated.View style={styles.errorBanner}>
                      <View style={styles.errorIconWrapper}>
                        <Ionicons name="alert-circle" size={20} color={Colors.error} />
                      </View>
                      <View style={styles.errorTextWrapper}>
                        <Text style={styles.errorBannerText}>{loginError}</Text>
                      </View>
                    </Animated.View>
                  ) : (
                    <View style={{ height: 0 }} />
                  )}

                  <Input
                    label="Usuario"
                    placeholder="Ingresa tu usuario"
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      clearError('username');
                    }}
                    onFocus={handleUsernameFocus}
                    onBlur={handleUsernameBlur}
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
                    onFocus={handlePasswordFocus}
                    onBlur={handlePasswordBlur}
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
                <View style={styles.securityBadge}>
                  <View style={styles.securityIconWrapper}>
                    <Ionicons name="shield-checkmark" size={14} color={Colors.success} />
                  </View>
                  <Text style={styles.securityText}>Sistema Seguro con Odoo</Text>
                </View>
                <Text style={styles.versionText}>Versión 1.0.0</Text>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(59, 130, 246, 0.06)',
    zIndex: 0,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -30,
    left: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    zIndex: 0,
  },
  decorativeCircle3: {
    position: 'absolute',
    top: '40%',
    right: -80,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    zIndex: 0,
  },
  scrollContent: {
    flexGrow: 1,
    minHeight: height,
    zIndex: 1,
  },
  loginContainer: {
    flex: 1,
    minHeight: height,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 30,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  logoBackground: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#dbeafe',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  logoPulse: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: Colors.primary,
    opacity: 0.2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: Colors.textSecondary,
    paddingHorizontal: 20,
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  formContainer: {
    width: '100%',
  },
  buttonWrapper: {
    marginTop: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
    padding: 14,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  errorIconWrapper: {
    marginRight: 10,
  },
  errorTextWrapper: {
    flex: 1,
  },
  errorBannerText: {
    color: Colors.error,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  footer: {
    alignItems: 'center',
    marginTop: 30,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 10,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  securityIconWrapper: {
    marginRight: 6,
  },
  securityText: {
    color: Colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  versionText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: '500',
  },
});