import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ROLE_DASHBOARDS, UserRole } from '../types/auth';

// Suprimir warnings específicos en desarrollo
LogBox.ignoreLogs([
  'shadow*',
  'props.pointerEvents is deprecated',
  'useNativeDriver',
]);

// Suprimir todos los warnings (opcional, solo para desarrollo limpio)
if (__DEV__) {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const message = args[0];
    if (
      typeof message === 'string' &&
      (message.includes('shadow') ||
        message.includes('pointerEvents') ||
        message.includes('useNativeDriver'))
    ) {
      return;
    }
    originalWarn(...args);
  };
}

/**
 * Navegación principal con protección de rutas
 */
function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      if (__DEV__) {
        console.log('🔄 AuthContext cargando...');
      }
      return;
    }

    const inLoginPage = segments[0] === 'login';
    const validRoles: UserRole[] = ['admin', 'teacher', 'student', 'employee'];
    const inDashboard = validRoles.includes(segments[0] as UserRole);
    const inRootPage = !inLoginPage && !inDashboard && segments[0] !== '_sitemap';

    if (__DEV__) {
      console.log('🔍 Verificando navegación:', {
        hasUser: !!user,
        inLoginPage,
        inRootPage,
        segments,
        userRole: user?.role,
      });
    }

    // Usuario no autenticado
    if (!user && !inLoginPage) {
      if (__DEV__) {
        console.log('🔒 No autenticado, redirigiendo a login');
      }
      router.replace('/login' as any);
    }
    // Usuario autenticado en login
    else if (user && inLoginPage) {
      const dashboardRoute = ROLE_DASHBOARDS[user.role];

      if (__DEV__) {
        console.log('✅ Usuario autenticado en login, redirigiendo a:', dashboardRoute);
      }

      router.replace(dashboardRoute as any);
    }
    // Usuario autenticado en ruta raíz
    else if (user && inRootPage) {
      const dashboardRoute = ROLE_DASHBOARDS[user.role];

      if (__DEV__) {
        console.log('✅ Usuario autenticado en raíz, redirigiendo a:', dashboardRoute);
      }

      router.replace(dashboardRoute as any);
    }
    // Usuario autenticado en dashboard incorrecto
    else if (user && !inLoginPage && !inRootPage) {
      const currentRoute = `/${segments.join('/')}`;
      const expectedDashboard = ROLE_DASHBOARDS[user.role];

      const currentSegment = segments[0] as UserRole | string;
      
      const isInWrongDashboard = 
        validRoles.includes(currentSegment as UserRole) && 
        currentSegment !== user.role;

      if (isInWrongDashboard) {
        if (__DEV__) {
          console.log('⚠️ Usuario en ruta incorrecta, redirigiendo:', {
            current: currentRoute,
            expected: expectedDashboard,
            role: user.role,
          });
        }
        router.replace(expectedDashboard as any);
      }
    }
  }, [user, segments, loading, router]);

  return <Slot />;
}

/**
 * Layout principal con Provider
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}