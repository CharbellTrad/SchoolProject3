import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Stack, useRouter, useSegments } from "expo-router"
import * as SplashScreen from 'expo-splash-screen'
import { useCallback, useEffect, useRef, useState } from "react"
import { LogBox } from "react-native"
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AuthProvider, useAuth } from "../contexts/AuthContext"
import { ROLE_DASHBOARDS, type UserRole } from "../types/auth"

// Suprimir warnings específicos en desarrollo
LogBox.ignoreLogs(["shadow*", "props.pointerEvents is deprecated", "useNativeDriver"])

const isDev = typeof __DEV__ !== "undefined" && __DEV__

if (isDev) {
  const originalWarn = console.warn
  console.warn = (...args) => {
    const message = args[0]
    if (
      typeof message === "string" &&
      (message.includes("shadow") || message.includes("pointerEvents") || message.includes("useNativeDriver"))
    ) {
      return
    }
    originalWarn(...args)
  }
}

// Prevenir que el splash screen se oculte automáticamente
SplashScreen.preventAutoHideAsync()

/**
 * Navegación principal con protección de rutas
 */

function RootLayoutNav() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [splashHidden, setSplashHidden] = useState(false)
  const [splashPrevented, setSplashPrevented] = useState(false)

  // 🆕 Referencias para prevenir navegaciones duplicadas
  const lastNavigationRef = useRef<string>('')
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const navigationInProgress = useRef(false)

  /**
   * 🆕 Función helper para navegación segura
   * Previene múltiples llamadas a router.push() en el mismo ciclo
   */
  const safeNavigate = useCallback((route: string, reason: string) => {
    // Cancelar navegación pendiente
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current)
      navigationTimeoutRef.current = null
    }

    // Prevenir navegación duplicada a la misma ruta
    if (lastNavigationRef.current === route) {
      if (isDev) {
        console.log(`⚠️ Navegación duplicada prevenida a: ${route}`)
      }
      return
    }

    // Programar navegación con pequeño delay para consolidar múltiples cambios
    navigationTimeoutRef.current = setTimeout(() => {
      if (isDev) {
        console.log(`🧭 Navegando a: ${route} (Razón: ${reason})`)
      }
      lastNavigationRef.current = route
      router.push(route as any)
      navigationTimeoutRef.current = null
    }, 50)
  }, [router])

  // Cleanup del timeout al desmontar
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
        navigationTimeoutRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!splashPrevented) {
      SplashScreen.preventAutoHideAsync()
      setSplashPrevented(true)
      if (isDev) console.log("🛡️ Splash preventAutoHide ejecutado")
    }
  }, [splashPrevented])

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (e) {
        console.warn(e)
      }
    }
    prepare()
  }, [])

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (!splashHidden) {
        await SplashScreen.hideAsync()
        setSplashHidden(true)
        if (isDev) console.log("🛡️ FALLBACK: Splash ocultado por timeout")
      }
    }, 3000)

    return () => clearTimeout(timeout)
  }, [splashHidden])

  const onLayoutRootView = useCallback(async () => {
    if (!splashHidden) {
      try {
        await SplashScreen.hideAsync()
        setSplashHidden(true)
        if (isDev) console.log("✅ Splash screen ocultado normalmente")
      } catch (e) {
        console.warn("Error hiding splash:", e)
      }
    }
  }, [splashHidden])

  // Navegación protegida
  useEffect(() => {
    if (loading) {
      return
    }

    // Si ya hay una navegación en progreso, esperar
    if (navigationInProgress.current) {
      return
    }

    const inLoginPage = segments[0] === "login"
    const validRoles: UserRole[] = ["admin", "teacher", "student", "employee"]
    const inDashboard = validRoles.includes(segments[0] as UserRole)
    const inRootPage = !inLoginPage && !inDashboard && segments[0] !== "_sitemap"

    // Usuario no autenticado → ir a login
    if (!user && !inLoginPage) {
      navigationInProgress.current = true
      if (isDev) console.log('🔐 Sesión expirada - Limpiando stack y navegando a login')
      // ✅ REPLACE para login - limpia pantallas autenticadas del stack
      router.push("/login" as any)
      setTimeout(() => { navigationInProgress.current = false }, 100)
    }
    // Usuario autenticado en login → ir a dashboard
    else if (user && inLoginPage) {
      navigationInProgress.current = true
      const dashboardRoute = ROLE_DASHBOARDS[user.role]
      if (isDev) console.log(`✅ Login exitoso, navegando a ${dashboardRoute}`)
      // ✅ PUSH para mantener stack saludable (permite navegación correcta de cards)
      router.replace(dashboardRoute as any)
      setTimeout(() => { navigationInProgress.current = false }, 100)
    }
    // Usuario autenticado en ruta raíz → ir a dashboard
    else if (user && inRootPage) {
      navigationInProgress.current = true
      const dashboardRoute = ROLE_DASHBOARDS[user.role]
      if (isDev) console.log(`📍 En raíz, redirigiendo a ${dashboardRoute}`)
      router.replace(dashboardRoute as any)
      setTimeout(() => { navigationInProgress.current = false }, 100)
    }
    // Usuario en dashboard incorrecto → corregir
    else if (user && !inLoginPage && !inRootPage) {
      const currentSegment = segments[0] as UserRole | string
      const isInWrongDashboard = validRoles.includes(currentSegment as UserRole) && currentSegment !== user.role

      if (isInWrongDashboard) {
        navigationInProgress.current = true
        const expectedDashboard = ROLE_DASHBOARDS[user.role]
        if (isDev) console.log(`⚠️ Dashboard incorrecto, redirigiendo a ${expectedDashboard}`)
        router.replace(expectedDashboard as any)
        setTimeout(() => { navigationInProgress.current = false }, 100)
      }
    }
  }, [user, segments, loading, router])

  // Layout principal
  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <BottomSheetModalProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_bottom',
            presentation: 'containedTransparentModal',
            gestureEnabled: true,
            gestureDirection: 'horizontal',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="teacher" />
          <Stack.Screen name="student" />
        </Stack>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  )
}


/**
 * Layout principal con Providers
 */
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
