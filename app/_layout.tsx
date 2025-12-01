import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { Stack, useRouter, useSegments } from "expo-router"
import * as SplashScreen from 'expo-splash-screen'
import { useCallback, useEffect, useState } from "react"
import { LogBox } from "react-native"
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from "react-native-safe-area-context"
import { AppReadyProvider, useAppReady } from "../contexts/AppReady"
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
  const { setAppReady } = useAppReady()
  const segments = useSegments()
  const router = useRouter()
  const [appIsReady, setAppIsReady] = useState(false)

  // Preparar la app
  useEffect(() => {
    async function prepare() {
      try {
        // Dar tiempo para que se cargue todo
        await new Promise((resolve) => setTimeout(resolve, 1000))
      } catch (e) {
        console.warn(e)
      } finally {
        setAppIsReady(true)
        setAppReady(true)
      }
    }

    prepare()
  }, [])

  // Ocultar splash cuando todo esté listo
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync()
      if (isDev) {
        console.log("✅ Splash screen ocultado")
      }
    }
  }, [appIsReady])

  // Navegación protegida
  useEffect(() => {
    if (loading || !appIsReady) {
      return
    }

    const inLoginPage = segments[0] === "login"
    const validRoles: UserRole[] = ["admin", "teacher", "student", "employee"]
    const inDashboard = validRoles.includes(segments[0] as UserRole)
    const inRootPage = !inLoginPage && !inDashboard && segments[0] !== "_sitemap"

    // Usuario no autenticado
    if (!user && !inLoginPage) {
      router.replace("/login" as any)
    }
    // Usuario autenticado en login
    else if (user && inLoginPage) {
      const dashboardRoute = ROLE_DASHBOARDS[user.role]
      router.replace(dashboardRoute as any)
    }
    // Usuario autenticado en ruta raíz
    else if (user && inRootPage) {
      const dashboardRoute = ROLE_DASHBOARDS[user.role]
      router.replace(dashboardRoute as any)
    }
    // Usuario autenticado en dashboard incorrecto
    else if (user && !inLoginPage && !inRootPage) {
      const currentSegment = segments[0] as UserRole | string
      const isInWrongDashboard = validRoles.includes(currentSegment as UserRole) && currentSegment !== user.role

      if (isInWrongDashboard) {
        const expectedDashboard = ROLE_DASHBOARDS[user.role]
        router.replace(expectedDashboard as any)
      }
    }
  }, [user, segments, loading, router, appIsReady])

  // Esperar a que la app esté lista
  if (!appIsReady) {
    return null
  }

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
      <AppReadyProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </AppReadyProvider>
    </SafeAreaProvider>
  )
}
