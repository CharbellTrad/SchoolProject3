import { Slot, useRouter, useSegments } from "expo-router"
import * as SplashScreen from "expo-splash-screen"
import LottieView from "lottie-react-native"
import { useCallback, useEffect, useRef, useState } from "react"
import { LogBox, StyleSheet, Text, View } from "react-native"
import Animated, { FadeIn, FadeOut } from "react-native-reanimated"
import splashAnimation from "../assets/lotties/splashAnimation.json"
import Colors from "../constants/Colors"
import { AuthProvider, useAuth } from "../contexts/AuthContext"
import { ROLE_DASHBOARDS, type UserRole } from "../types/auth"

// Prevenir que el splash nativo se oculte automáticamente
SplashScreen.preventAutoHideAsync()

// Suprimir warnings específicos en desarrollo
LogBox.ignoreLogs(["shadow*", "props.pointerEvents is deprecated", "useNativeDriver"])

if (__DEV__) {
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

/**
 * Navegación principal con protección de rutas
 */
function RootLayoutNav() {
  const { user, loading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [isAnimationFinished, setIsAnimationFinished] = useState(false)
  const [appIsReady, setAppIsReady] = useState(false)
  const [splashHidden, setSplashHidden] = useState(false)
  const animationRef = useRef<LottieView>(null)
  const timerRef = useRef<number | null>(null)

  // Preparar la app
  useEffect(() => {
    async function prepare() {
      try {
        // Dar tiempo para que se cargue todo
        await new Promise((resolve) => setTimeout(resolve, 300))
      } catch (e) {
        console.warn(e)
      } finally {
        setAppIsReady(true)
      }
    }

    prepare()
  }, [])

  // Ocultar splash nativo cuando la animación esté lista
  const onLayoutRootView = useCallback(async () => {
    if (appIsReady && !splashHidden) {
      try {
        // Pequeño delay para asegurar que la animación Lottie está renderizada
        await new Promise((resolve) => setTimeout(resolve, 100))
        await SplashScreen.hideAsync()
        setSplashHidden(true)
        
        if (__DEV__) {
          console.log("✅ Splash nativo ocultado")
        }
      } catch (e) {
        console.warn(e)
      }
    }
  }, [appIsReady, splashHidden])

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (loading) {
      if (__DEV__) {
        console.log("🔄 AuthContext cargando...")
      }
      return
    }

    const inLoginPage = segments[0] === "login"
    const validRoles: UserRole[] = ["admin", "teacher", "student", "employee"]
    const inDashboard = validRoles.includes(segments[0] as UserRole)
    const inRootPage = !inLoginPage && !inDashboard && segments[0] !== "_sitemap"

    if (__DEV__) {
      console.log("🔍 Verificando navegación:", {
        hasUser: !!user,
        inLoginPage,
        inRootPage,
        segments,
        userRole: user?.role,
      })
    }

    // Usuario no autenticado
    if (!user && !inLoginPage) {
      if (__DEV__) {
        console.log("🔒 No autenticado, redirigiendo a login")
      }
      router.replace("/login" as any)
    }
    // Usuario autenticado en login
    else if (user && inLoginPage) {
      const dashboardRoute = ROLE_DASHBOARDS[user.role]

      if (__DEV__) {
        console.log("✅ Usuario autenticado en login, redirigiendo a:", dashboardRoute)
      }

      router.replace(dashboardRoute as any)
    }
    // Usuario autenticado en ruta raíz
    else if (user && inRootPage) {
      const dashboardRoute = ROLE_DASHBOARDS[user.role]

      if (__DEV__) {
        console.log("✅ Usuario autenticado en raíz, redirigiendo a:", dashboardRoute)
      }

      router.replace(dashboardRoute as any)
    }
    // Usuario autenticado en dashboard incorrecto
    else if (user && !inLoginPage && !inRootPage) {
      const currentRoute = `/${segments.join("/")}`
      const expectedDashboard = ROLE_DASHBOARDS[user.role]

      const currentSegment = segments[0] as UserRole | string

      const isInWrongDashboard = validRoles.includes(currentSegment as UserRole) && currentSegment !== user.role

      if (isInWrongDashboard) {
        if (__DEV__) {
          console.log("⚠️ Usuario en ruta incorrecta, redirigiendo:", {
            current: currentRoute,
            expected: expectedDashboard,
            role: user.role,
          })
        }
        router.replace(expectedDashboard as any)
      }
    }
  }, [user, segments, loading, router])

  // Esperar a que la app esté lista
  if (!appIsReady) {
    return null
  }

  // Mostrar animación hasta que termine
  if (!isAnimationFinished) {
    return (
      <View style={styles.splashContainer} onLayout={onLayoutRootView}>
        <Animated.View 
          style={styles.animationWrapper}
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(500)}
        >
          <LottieView
            ref={animationRef}
            source={splashAnimation}
            autoPlay
            loop={false}
            style={styles.lottie}
            speed={1}
            resizeMode="cover"
            onAnimationFinish={() => {
              if (__DEV__) {
                console.log("🎬 Animación terminada, esperando 2.5s...")
              }
              // Timer después de que la animación termine
              timerRef.current = setTimeout(() => {
                if (__DEV__) {
                  console.log("✨ Finalizando splash screen")
                }
                setIsAnimationFinished(true)
              }, 2500)
            }}
          />
          <Animated.View 
            style={styles.institutionNameContainer} 
            entering={FadeIn.delay(1800).duration(800)}
          >
            <Text style={styles.institutionName}>U.E.N.B. Ciudad Jardín</Text>
            <Text style={styles.institutionSubtitle}>Sistema Academico</Text>
          </Animated.View>
        </Animated.View>
      </View>
    )
  }

  return (
    <Animated.View style={{ flex: 1 }} entering={FadeIn.duration(300)}>
      <Slot />
    </Animated.View>
  )
}

/**
 * Layout principal con Provider
 */
export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  animationWrapper: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  lottie: {
    width: "80%",
    aspectRatio: 1, // Mantiene proporción cuadrada
  },
  institutionNameContainer: {
    position: "absolute",
    bottom: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  institutionName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1E7B9D",
    letterSpacing: 2,
  },
  institutionSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#2D8F8A",
    marginTop: 8,
    letterSpacing: 1,
  },
})