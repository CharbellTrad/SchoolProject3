# Modo Desarrollo en React Native/Expo

## ¿Qué es `__DEV__`?

`__DEV__` es una variable global de React Native que indica si la aplicación está ejecutándose en modo desarrollo o producción. **No se puede cambiar manualmente en el código**, se establece automáticamente según cómo ejecutes la aplicación.

## ¿Cuándo está activo?

### Modo Desarrollo (__DEV__ = true) ✅
- Cuando ejecutas `npm start` o `expo start`
- En el simulador/emulador durante desarrollo
- En Expo Go durante desarrollo
- En builds de desarrollo (`expo build --profile development`)

### Modo Producción (__DEV__ = false) 🚀
- En builds de producción (`expo build` o `eas build --profile production`)
- En la versión publicada en las tiendas (App Store, Google Play)
- Cuando ejecutas con flags de producción

## Cómo Activar/Desactivar el Modo Desarrollo

### ✅ ACTIVAR Modo Desarrollo (Por Defecto)

**Opción 1: Usando npm scripts (Recomendado)**
```bash
npm start
```

**Opción 2: Usando npx (sin instalar Expo CLI globalmente)**
```bash
npx expo start
```

**Opción 3: Con flags explícitos**
```bash
npx expo start --dev-client
```

**Opción 4: Build de desarrollo**
```bash
npx expo build --profile development
# o con EAS (requiere instalación)
npx eas-cli build --profile development --platform android
```

### 🚀 DESACTIVAR (Modo Producción)

**⚠️ IMPORTANTE:** `npm start` y `expo start` **SIEMPRE** inician en modo desarrollo. Para ejecutar sin modo DEV, necesitas crear un **build de producción**.

**Opción 1: Build de producción con EAS Build (Recomendado)**
```bash
# Primero instala EAS CLI globalmente (una sola vez)
npm install -g eas-cli

# Inicializa EAS (solo la primera vez)
eas build:configure

# Crea un build de producción para Android
eas build --profile production --platform android

# O para iOS
eas build --profile production --platform ios
```

**Opción 2: Build local de producción (Android)**
```bash
# Para Android - genera un APK/AAB de producción
npx expo run:android --variant release
```

**Opción 3: Build local de producción (iOS)**
```bash
# Para iOS - genera un build de producción
npx expo run:ios --configuration Release
```

**Opción 4: Build para Web (producción)**
```bash
# Genera un build optimizado para web
npx expo export:web
# Luego sirve los archivos estáticos
npx serve dist
```

### 📱 Probar el Build de Producción

Después de crear el build:
- **Android**: Instala el APK/AAB generado en tu dispositivo o emulador
- **iOS**: Instala el IPA generado en tu dispositivo o simulador
- **Web**: Abre los archivos exportados en un servidor

**Nota:** Los builds de producción pueden tardar varios minutos en generarse.

### 📝 Nota Importante sobre Comandos

Si ves el error `"expo" no se reconoce como un comando`, significa que Expo CLI no está instalado globalmente. **Solución: usa `npx` antes del comando:**

```bash
# ❌ Esto falla si no tienes Expo CLI global
expo start

# ✅ Esto siempre funciona (usa npx)
npx expo start
```

**O usa los scripts de npm que ya están configurados:**
```bash
npm start        # Equivale a: npx expo start
npm run android  # Equivale a: npx expo start --android
npm run ios      # Equivale a: npx expo start --ios
npm run web      # Equivale a: npx expo start --web
```

## Verificar el Modo Actual

### En el Código

Puedes verificar el modo actual agregando temporalmente en cualquier componente:

```typescript
if (__DEV__) {
  console.log('✅ Estás en MODO DESARROLLO');
} else {
  console.log('🚀 Estás en MODO PRODUCCIÓN');
}
```

### Visualmente en la App

Cuando estás en modo desarrollo, verás:
- **Badge "DEV"** en el header del dashboard
- **Fila "Modo: Desarrollo"** en la sección "Mi Información"

Si NO ves estos indicadores, estás en modo producción.

## Uso en el Código

Todos los `console.log` están protegidos con `__DEV__`:

```typescript
if (__DEV__) {
  console.log('Este mensaje solo aparece en desarrollo');
}
```

## Beneficios

### Modo Desarrollo
- ✅ Todos los logs visibles en consola
- ✅ Herramientas de debugging activas
- ✅ Hot reload y fast refresh
- ✅ Indicadores visuales de modo DEV

### Modo Producción
- 🚀 **Mejor rendimiento** (no se ejecutan logs)
- 🔒 **Más seguridad** (no se exponen datos de debug)
- 📱 **Consola limpia** (sin mensajes de desarrollo)
- ⚡ **App optimizada** para usuarios finales

## Configuración Avanzada

### Variables de Entorno

Puedes usar variables de entorno para controlar comportamientos:

```typescript
// .env.development
EXPO_PUBLIC_API_URL=http://localhost:3000

// .env.production
EXPO_PUBLIC_API_URL=https://api.tudominio.com
```

### Verificar en Runtime

```typescript
const isDevelopment = __DEV__;
const isProduction = !__DEV__;

if (isDevelopment) {
  // Código solo para desarrollo
}

if (isProduction) {
  // Código solo para producción
}
```

## Notas Importantes

1. **`__DEV__` es automático**: No necesitas configurarlo manualmente
2. **No se puede cambiar en runtime**: Se establece al compilar/ejecutar
3. **`npm start` SIEMPRE es desarrollo**: No puedes iniciar en modo producción con `npm start`
4. **Para producción necesitas un build**: Solo los builds compilados tienen `__DEV__ = false`
5. **Los builds tardan tiempo**: Crear un build de producción puede tomar 10-30 minutos
6. **✅ Al empaquetar, automáticamente es producción**: Cuando creas un APK, AAB o IPA, automáticamente `__DEV__ = false` y NO verás los indicadores de DEV ni los logs

## Resumen Rápido

| Comando | Modo | __DEV__ | Nota |
|---------|------|---------|------|
| `npm start` | Desarrollo | ✅ true | ✅ Recomendado |
| `npx expo start` | Desarrollo | ✅ true | ✅ Funciona sin instalar |
| `expo start` | Desarrollo | ✅ true | ⚠️ Requiere Expo CLI global |
| `npx expo build --profile production` | Producción | 🚀 false | ✅ Funciona sin instalar |
| `eas build --profile production` | Producción | 🚀 false | ⚠️ Requiere EAS CLI |
| `eas build --profile development` | Desarrollo | ✅ true | ⚠️ Requiere EAS CLI |

## Troubleshooting

**P: ¿Cómo sé si estoy en modo desarrollo?**
R: Mira el dashboard - si ves el badge "DEV" y la fila "Modo: Desarrollo", estás en desarrollo.

**P: ¿Puedo forzar el modo desarrollo en producción?**
R: No, y no deberías. `__DEV__` se establece automáticamente y cambiarlo manualmente puede causar problemas.

**P: ¿Los logs aparecen en producción?**
R: No, todos los `console.log` están protegidos con `if (__DEV__)` y no se ejecutan en producción.

**P: Error: "expo" no se reconoce como un comando**
R: Usa `npx expo` en lugar de solo `expo`, o usa los scripts de npm: `npm start`

**P: ¿Necesito instalar Expo CLI globalmente?**
R: No es necesario. Puedes usar `npx expo` o los scripts de npm (`npm start`). Solo instala EAS CLI si vas a hacer builds en la nube: `npm install -g eas-cli`

**P: ¿Cómo inicio la app sin modo DEV?**
R: No puedes hacerlo con `npm start` (siempre es desarrollo). Debes crear un build de producción:
- Android: `npx expo run:android --variant release`
- iOS: `npx expo run:ios --configuration Release`
- O usa EAS Build: `eas build --profile production --platform android`

**P: ¿Por qué no puedo simplemente cambiar una variable?**
R: `__DEV__` se establece durante la compilación del código, no en tiempo de ejecución. Esto es por diseño para optimizar la app en producción.

**P: ¿Cuando empaquete la app estará automáticamente en modo producción?**
R: ✅ **SÍ, automáticamente**. Cuando creas un build (APK, AAB, IPA) para distribución:
- `__DEV__` será automáticamente `false`
- NO verás el badge "DEV" ni la fila "Modo: Desarrollo"
- NO se ejecutarán los `console.log` protegidos con `if (__DEV__)`
- La app estará optimizada para producción
- No necesitas hacer nada adicional, es automático al compilar
