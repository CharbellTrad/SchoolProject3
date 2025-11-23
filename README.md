# SchoolProject

## Descripción General

SchoolProject es una aplicación móvil multiplataforma desarrollada con React Native y Expo Router que funciona como un sistema integral de gestión escolar con autenticación basada en roles. La aplicación se conecta a un backend Odoo para administrar el ciclo completo de información académica: estudiantes, profesores, cursos, calificaciones y personal administrativo.

El proyecto implementa un sistema de navegación inteligente que redirige automáticamente a los usuarios según su rol, garantizando que cada tipo de usuario tenga acceso únicamente a las funcionalidades correspondientes a sus permisos.

---

## Tecnologías Principales

**Framework y SDK:**
- React Native 0.81.4 - Base de la aplicación móvil
- Expo SDK ~54.0 - Desarrollo multiplataforma
- Expo Router ~6.0.11 - Sistema de enrutamiento basado en archivos
- TypeScript ~5.9.2 - Tipado estático y desarrollo seguro

**Gestión de Estado y Datos:**
- React Context API - Gestión de autenticación y sesión
- AsyncStorage 2.2.0 - Persistencia local de sesión
- crypto-js 4.2.0 - Encriptación de datos sensibles

**UI y Animaciones:**
- React Native Reanimated ~4.1.1 - Animaciones fluidas
- lottie-react-native ~7.3.1 - Animaciones vectoriales
- Expo Linear Gradient ~15.0.7 - Gradientes
- Lucide React 0.553.0 - Sistema de iconografía moderno

**Integración:**
- Odoo API REST - Backend ERP educativo

---

## Estructura del Proyecto

### Directorio /app - Sistema de Rutas

El directorio 'app' utiliza el sistema de enrutamiento basado en archivos de Expo Router, donde la estructura de carpetas define automáticamente las rutas de navegación.

**Estructura principal:**
- app/_layout.tsx - Layout raíz con protección de rutas y lógica de redirección
- app/index.tsx - Ruta raíz que muestra loading mientras redirige
- app/login.tsx - Pantalla de autenticación
- app/admin/ - Módulo de administrador con dashboard y gestión académica
- app/teacher/ - Módulo de profesor con dashboard
- app/student/ - Módulo de estudiante con dashboard

**Archivos clave:**

_layout.tsx es el layout raíz que implementa la lógica de protección de rutas. Verifica constantemente si el usuario está autenticado, si está intentando acceder a una ruta no autorizada para su rol, y redirige automáticamente al dashboard correspondiente o al login.

index.tsx es la ruta raíz requerida por Expo Router. Solo muestra un loading temporal mientras el _layout.tsx procesa la lógica de autenticación y redirige al usuario a login o su dashboard correspondiente. Este archivo es necesario para que Expo Router funcione correctamente.

login.tsx es la pantalla de inicio de sesión con validación de formularios, integración con authService, manejo de errores de autenticación e indicadores de carga.

Los dashboards están organizados por rol:
- admin/dashboard.tsx proporciona panel de control administrativo con métricas y acceso a gestión completa
- teacher/dashboard.tsx muestra vista de clases, estudiantes asignados y herramientas docentes
- student/dashboard.tsx presenta información académica personal, horarios y calificaciones

**Nota sobre la estructura:** La carpeta '(tabs)' fue eliminada del proyecto ya que no se utiliza navegación por pestañas. Expo Router requiere una ruta raíz 'index.tsx' para funcionar, por lo que se creó app/index.tsx como punto de entrada que delega toda la lógica de navegación al _layout.tsx.

---

### Directorio /services-odoo - Capa de Servicios

Capa de integración con el backend Odoo mediante API REST con arquitectura limpia y separación de responsabilidades.

#### apiService.ts - Cliente HTTP Base

Este servicio es responsable de la configuración centralizada de conexión con Odoo, gestión automática de Session ID, manejo robusto de errores y excepciones, y detección automática de sesiones expiradas.

**Funcionalidades principales:**

authenticate() autentica usuario y obtiene Session ID, retornando un objeto con success, data, sid y error.

verifySession() verifica la validez de la sesión actual consultando al servidor.

destroySession() cierra sesión tanto en el servidor como localmente.

search() busca registros en Odoo retornando solo los IDs que coinciden con el dominio especificado.

searchRead() combina búsqueda y lectura en una sola operación, retornando los registros completos.

read() lee registros específicos por sus IDs.

create() crea un nuevo registro en Odoo y retorna el ID del registro creado.

update() actualiza registros existentes mediante el método write de Odoo.

deleteRecords() elimina registros permanentemente usando el método unlink.

callMethod() permite llamar a métodos personalizados de cualquier modelo en Odoo.

**Sistema de manejo de errores:**

El servicio implementa detección automática de sesión expirada identificando múltiples variantes de error de sesión. Cuando se detecta, ejecuta un callback automático que notifica al AuthContext para redirigir al login. Además, limpia el Session ID del almacenamiento local y usa un sistema de logging inteligente que registra solo errores inesperados en desarrollo. También extrae y parsea errores de Odoo convirtiéndolos en mensajes legibles para el usuario.

**Gestión de Session ID:**

getStoredSessionId() recupera la sesión del almacenamiento local.
saveSessionId() persiste la sesión para solicitudes futuras.
clearSessionId() elimina la sesión en logout o expiración.
setSessionExpiredCallback() registra el callback para manejo global de sesión expirada.

---

#### authService.ts - Servicio de Autenticación

Este servicio gestiona el ciclo completo de autenticación, validación de credenciales, obtención de información del usuario, verificación de roles y permisos, validación de datos de sesión, verificación de rol obligatorio y limpieza automática de sesiones inválidas.

**Funciones principales:**

login(username, password) autentica al usuario y obtiene datos del usuario con validaciones adicionales. Se usa en la pantalla de login.

logout() cierra sesión en servidor y cliente. Se invoca desde el botón de cerrar sesión.

verifySession() verifica validez de sesión con servidor y limpia si es inválida. Usado para verificación periódica de sesión.

getCurrentUser() obtiene información del usuario actual del almacenamiento local.

getUserRole() determina el rol del usuario autenticado para redirección de rutas.

getSavedUserSession() obtiene sesión guardada con validación de integridad de datos.

updateUserSession() actualiza información del usuario en sesión activa.

checkServerHealth() verifica disponibilidad del servidor Odoo antes de operaciones críticas.

getUserInfo() obtiene información adicional del partner de Odoo para perfil detallado.

changePassword() cambia contraseña del usuario actual desde configuración de cuenta.

**Validaciones implementadas:**

Validación de campos obligatorios: Al iniciar sesión, se valida que usuario y contraseña no estén vacíos. Si alguno falta, retorna un mensaje específico indicando que ambos campos son requeridos.

Validación de respuesta de autenticación: Verifica que la respuesta del servidor contenga todos los datos necesarios incluyendo authData, uid y sid. Si falta algún dato, retorna error de respuesta incompleta.

Validación de rol obligatorio: Se valida que el usuario tenga un rol asignado en Odoo y que no esté vacío. Si no tiene rol, destruye la sesión automáticamente y retorna el código especial 'NO_ROLE_DEFINED' para manejo específico en la UI.

Validación de integridad de sesión guardada: Al recuperar sesión guardada del almacenamiento, valida que contenga id, username y token. Si falta algún campo, elimina la sesión corrupta automáticamente.

Validación de UID en verificación: Al verificar sesión con el servidor, compara el UID local con el del servidor. Si no coinciden, elimina la sesión para prevenir suplantación de identidad.

**Mapeo de roles:**

El servicio mapea roles de Odoo a roles de la aplicación. 'administrativo' se mapea a 'admin', 'docente' a 'teacher', 'obrero' a 'employee', 'cenar' a 'employee', y cualquier otro rol se mapea por defecto a 'employee'.

---

#### personService.ts - Gestión de Personas

Este servicio proporciona CRUD completo de personas incluyendo estudiantes, profesores y empleados. Incluye gestión de imágenes y avatares, búsqueda y filtrado avanzado, y asignación de roles y grupos.

**Funciones principales:**

getStudents() obtiene lista de estudiantes con parámetros de limit, offset y search.

getTeachers() obtiene lista de profesores con los mismos parámetros de paginación y búsqueda.

getEmployees() obtiene lista de empleados.

getPersonById() obtiene detalle completo de una persona por su ID.

createPerson() crea nueva persona con rol específico recibiendo los datos completos de la persona.

updatePerson() actualiza información de persona existente por su ID.

deletePerson() elimina persona del sistema permanentemente.

uploadAvatar() sube imagen de perfil de una persona recibiendo el personId y la URI de la imagen.

searchPersons() realiza búsqueda con filtros múltiples incluyendo query, role y otros filtros personalizados.

**Características:**

El servicio realiza validación de datos antes de enviar al servidor, conversión automática de imágenes a base64 para compatibilidad con Odoo, manejo de relaciones many2one y many2many, y filtrado por múltiples criterios como nombre, email, teléfono y rol.

---

### Directorio /contexts - Gestión de Estado Global

#### AuthContext.tsx - Contexto de Autenticación

El AuthContext mantiene el estado global de autenticación de la aplicación. Es responsable de persistir la sesión entre reinicios de app, proporcionar métodos de login y logout, verificar sesión al iniciar la aplicación, verificar disponibilidad del servidor antes de operaciones, manejar el caso especial de usuario sin rol, prevenir alertas duplicadas de sesión expirada, y realizar doble verificación de sesión después del login.

**Estado gestionado:**

El contexto mantiene user que puede ser un UserSession o null representando al usuario actual autenticado, loading como booleano indicador de carga, login como función para autenticar usuario, logout como función para cerrar sesión, y updateUser como función para actualizar datos del usuario.

**Flujo de inicialización:**

Cuando la app inicia, el AuthContext se monta y comienza el proceso de inicialización. Primero verifica la disponibilidad del servidor Odoo. Si el servidor no está disponible, sale sin intentar restaurar sesión. Si está disponible, verifica si existe sesión guardada en AsyncStorage. Si no hay sesión, muestra la pantalla de login. Si existe sesión, valida la integridad de los datos. Si los datos están incompletos, limpia y muestra login. Si los datos están completos, verifica la sesión con el servidor. Si el servidor valida la sesión, restaura los datos del usuario. Si el servidor rechaza la sesión, limpia los datos y muestra login.

**Mejoras implementadas:**

Verificación previa del servidor: Antes de intentar login, se verifica que el servidor esté disponible. Si no lo está, muestra una alerta indicando que no se puede conectar con el servidor.

Manejo especial de usuario sin rol: Se detecta cuando un usuario no tiene rol asignado mediante el código especial 'NO_ROLE_DEFINED'. En este caso, ejecuta logout inmediato, limpia el estado y muestra una alerta específica informando que el usuario no tiene un rol definido en el sistema y debe contactar al administrador.

Doble verificación post-login: Después de un login exitoso, se verifica nuevamente la sesión con el servidor para asegurar que se estableció correctamente. Si la verificación falla, muestra alerta de error, ejecuta logout automático y retorna false.

Prevención de alertas duplicadas: Se implementa un flag isSessionExpiredHandled para evitar mostrar múltiples alertas de sesión expirada. Cuando se detecta sesión expirada, verifica si ya se manejó. Si no, marca el flag, limpia el usuario y muestra la alerta. Al cerrar la alerta, resetea el flag.

---

### Directorio /components - Componentes Reutilizables

Los componentes están organizados por función y dominio para facilitar el mantenimiento y reutilización.

**Estructura de componentes:**

components/forms/ contiene formularios especializados como StudentForm.tsx para estudiantes, TeacherForm.tsx para profesores y PersonForm.tsx como formulario genérico de personas.

components/list/ incluye componentes de listas como PersonList.tsx para mostrar lista de personas y ListValidation.tsx para validación de datos de lista.

components/selectors/ tiene selectores desplegables como DropdownSelector.tsx que es un selector personalizado con búsqueda.

components/student/ contiene componentes específicos de estudiantes como StudentCard.tsx que es una tarjeta de información de estudiante.

components/ui/ agrupa componentes base de UI como Button.tsx para botón personalizado, Input.tsx para campo de entrada, Card.tsx como tarjeta contenedora y LoadingSpinner.tsx como indicador de carga.

**Componentes destacados:**

ImagePicker.tsx permite selección desde galería o cámara, recorte y edición básica, conversión a formato compatible con Odoo y previsualización antes de subir.

DropdownSelector.tsx ofrece búsqueda dinámica en listas largas, soporte para selección múltiple, estilizado consistente con diseño global y accesibilidad mejorada.

showAlert.tsx es una utilidad para mostrar alertas nativas del sistema.

---

### Directorio /types - Definiciones TypeScript

#### auth.ts - Tipos de Autenticación

Define las estructuras de datos para el sistema de autenticación.

**Roles disponibles:**

UserRole puede ser 'admin', 'teacher', 'student' o 'employee'.

**Estructura de usuario autenticado:**

UserSession contiene id como number, username como string, password como string vacío por seguridad, email como string, role como UserRole, fullName como string, createdAt como string, active como boolean, token como string que es el Session ID de Odoo, loginTime como string, y odooData que es un objeto con uid, companyId, partnerId, context y originalRole.

**Mapeo de roles a rutas:**

ROLE_DASHBOARDS mapea cada UserRole a su ruta correspondiente. 'admin' va a '/admin/dashboard', 'teacher' a '/teacher/dashboard', 'student' a '/student/dashboard' y 'employee' a '/employee/dashboard'.

**Contexto de autenticación:**

AuthContextType define la interfaz del contexto con user como UserSession o null, login como función async que recibe username y password retornando Promise boolean, logout como función async que retorna Promise void, loading como boolean, y updateUser como función async que recibe actualizaciones parciales de UserSession.

---

### Directorio /constants - Constantes

Contiene configuraciones centralizadas como paleta de colores del tema, URLs de API y endpoints, configuraciones de navegación, mensajes de error estándar y límites y validaciones.

**Colors.ts:**

Define la paleta de colores del proyecto con colores primarios (#1e40af, #3b82f6, #1e3a8a), colores secundarios (#00c070ff, #10b981, #059669), colores de estado (success, error, warning, info), colores de texto (primary, secondary, tertiary, light), colores de fondo (background, backgroundSecondary, backgroundTertiary), colores de bordes (border, borderLight, borderDark), escala de grises completa y colores para overlays, sombras y gradientes.

---

### Directorio /hooks - Custom Hooks

Incluye hooks reutilizables para lógica compartida.

useAuth() proporciona acceso al contexto de autenticación.
useDebounce() implementa retardo en búsquedas para optimizar rendimiento.
useImagePicker() encapsula lógica de selección de imágenes.
useFormValidation() maneja validación de formularios de manera centralizada.

---

### Directorio /utils - Utilidades

Funciones auxiliares organizadas por dominio.

FormatHelpers incluye funciones para formateo de fechas, números y texto.
ValidationHelpers contiene validaciones de email, teléfono y otros formatos.
DataTransformers proporciona conversión entre formatos de datos.
ErrorHelpers ofrece extracción y formateo de errores.

---

### Directorio /validators - Esquemas de Validación

Contiene validadores para formularios y datos con validación de campos obligatorios, validación de formatos como email y teléfono, reglas de negocio específicas y mensajes de error localizados.

---

### Directorio /assets - Recursos Estáticos

Organiza recursos estáticos de la aplicación.

assets/images/ contiene imágenes e ilustraciones incluyendo iconos de la aplicación (icon.png, favicon.png, splash-icon.png) e iconos adaptativos para Android (android-icon-foreground.png, android-icon-background.png, android-icon-monochrome.png).

**Nota:** Los archivos de demostración de Expo (react-logo.png, partial-react-logo.png, etc.) fueron eliminados del proyecto para mantener solo recursos relevantes al proyecto escolar.

---

## Flujo de Autenticación Detallado

### Inicio de la Aplicación

El flujo comienza cuando la app inicia. El AuthContext se monta y comienza el proceso de verificación. Primero pregunta si el servidor está disponible. Si no lo está, muestra error y no restaura sesión. Si está disponible, pregunta si existe Session ID local. Si no existe, muestra Login. Si existe, verifica con servidor. Si la sesión es válida, carga datos de usuario y redirige a Dashboard. Si no es válida, limpia datos y muestra Login.

La ruta raíz app/index.tsx se renderiza brevemente mostrando solo un indicador de carga mientras el _layout.tsx procesa la lógica de autenticación y ejecuta las redirecciones correspondientes.

### Proceso de Login

El usuario ingresa credenciales en la pantalla de login. La app valida que no estén vacíos los campos. Luego verifica la disponibilidad del servidor. Si el servidor está disponible, envía petición a authService.login(). El backend Odoo valida las credenciales. Si son correctas, verifica que la respuesta tenga todos los datos necesarios. Luego valida que el usuario tenga rol asignado. Si no tiene rol, destruye la sesión y muestra alerta específica indicando que debe contactar al administrador. Si tiene rol, mapea el rol de Odoo a rol de app, crea el objeto de sesión de usuario y guarda el Session ID en AsyncStorage. Después verifica nuevamente la sesión con el servidor. Si la verificación falla, ejecuta logout automático. Si la verificación pasa, actualiza el AuthContext y redirige a dashboard según rol.

### Protección de Rutas

El archivo app/_layout.tsx implementa un sistema de guardias de ruta que verifica constantemente el estado de autenticación. Si loading es true, no hace nada. Identifica si el usuario está en la página de login. Si el usuario no está autenticado y no está en login, redirige a '/login'. Si el usuario está autenticado y está en login, redirige al dashboard correspondiente según su rol. Si el usuario está autenticado pero está en un dashboard incorrecto para su rol, redirige al dashboard correcto.

### Manejo de Sesión Expirada

Cuando el servidor detecta que la sesión expiró, apiService detecta el error de sesión en la respuesta. Ejecuta la función handleSessionExpired() que limpia el Session ID del almacenamiento. Notifica a AuthContext mediante callback. AuthContext verifica el flag de alerta ya mostrada. Si no se ha mostrado, muestra alerta y actualiza flag, y limpia el estado de usuario. La guardia de ruta detecta falta de autenticación y redirige automáticamente a login. El usuario ve el mensaje 'Tu sesión ha expirado'.

---

## Dashboards por Rol

### Admin Dashboard

Ubicado en /admin/dashboard, proporciona funcionalidades de vista de métricas generales del sistema, total de estudiantes profesores y cursos activos, acceso rápido a módulos de gestión, gráficos de estadísticas académicas y configuración del sistema.

La navegación disponible incluye gestión completa de estudiantes con crear editar eliminar y buscar, gestión de profesores con CRUD completo, gestión de cursos y asignaturas, asignación de profesores a materias, y reportes con exportación de datos.

### Teacher Dashboard

Ubicado en /teacher/dashboard, ofrece funcionalidades de lista de clases asignadas, horario semanal, lista de estudiantes por materia, registro de asistencia, carga de calificaciones y comunicación con estudiantes.

La navegación disponible incluye ver detalles de clases, lista de estudiantes, gestión de calificaciones y material educativo.

### Student Dashboard

Ubicado en /student/dashboard, presenta funcionalidades de información académica personal, horario de clases, calificaciones por materia, asistencias, tareas pendientes y comunicados.

La navegación disponible incluye ver calificaciones, consultar horario, revisar asistencias y ver comunicados.

---

## Sistema de Manejo de Errores

### Nivel de Servicio

En apiService.ts se capturan errores de red como timeout y sin conexión, errores HTTP como 404 y 500, errores de parseo JSON, errores de sesión expirada y errores de validación de Odoo.

La estrategia consiste en intentar hacer la petición fetch. Si la respuesta no es ok, lanza error HTTP. Si la respuesta tiene campo error, verifica si es error de sesión expirada. Si lo es, ejecuta handleSessionExpired y retorna error con flag isSessionExpired. Si no, retorna el error tal cual. Si todo es exitoso, retorna success true con los datos. Si hay excepción en el try, la captura y retorna success false con el mensaje de error.

### Nivel de Dominio

En authService y personService se manejan errores de credenciales inválidas, permisos insuficientes, datos duplicados, validaciones de negocio, usuario sin rol asignado, respuesta de autenticación incompleta y sesión guardada corrupta.

Por ejemplo en login, primero valida campos vacíos. Si username o password están vacíos, retorna mensaje de requeridos. Luego intenta autenticar. Si no es exitoso, retorna error extraído del servidor. Verifica que authData uid y sid existan. Si falta alguno, retorna respuesta incompleta. Valida que el rol exista y no esté vacío. Si no tiene rol, destruye sesión y retorna código especial 'NO_ROLE_DEFINED'. Si todo pasa, retorna success con user.

### Nivel de UI

En componentes y pantallas se muestran alertas nativas para errores críticos, mensajes inline para errores de validación, se deshabilitan botones durante operaciones asíncronas, se muestran spinners de carga y mensajes específicos según tipo de error.

Por ejemplo al hacer submit de un formulario, se activa loading y limpia error previo. Intenta crear persona. Si es exitoso, muestra alerta de éxito y vuelve atrás. Si falla, guarda el error y muestra alerta con mensaje extraído. Finalmente desactiva loading.

### Logging Inteligente

El sistema implementa logging condicional que solo registra en modo desarrollo __DEV__, filtra errores esperados como login fallido y validaciones, usa emojis para categorizar logs como ❌ para errores y ✅ para éxito, y limita longitud de mensajes de error.

Se define una lista EXPECTED_ERRORS que incluye términos como 'sesión', 'contraseña', 'usuario', 'acceso'. La función isExpectedError verifica si el mensaje contiene alguno de estos términos. Solo se registra en consola si está en desarrollo y no es error esperado.

---

## Configuración y Desarrollo

### Requisitos Previos

Se necesita Node.js 16 o superior, npm o yarn, Expo CLI instalado globalmente mediante 'npm install -g expo-cli', backend Odoo configurado y accesible, y credenciales de API válidas.

### Instalación

Primero clonar el repositorio con 'git clone https://github.com/CharbellTrad/SchoolProject3.git'. Luego instalar dependencias navegando al directorio 'cd SchoolProject3' y ejecutando 'npm install'. Opcionalmente configurar variables de entorno editando services-odoo/apiService.ts con tu host de Odoo.

### Scripts Disponibles

'npm start' inicia servidor de desarrollo Expo.
'npm run android' ejecuta en emulador o dispositivo Android.
'npm run ios' ejecuta en simulador o dispositivo iOS.
'npm run web' ejecuta en navegador web.
'npm run lint' verifica código con ESLint.
'npm run reset-project' resetea configuración del proyecto.

### Ejecución en Desarrollo

Para iniciar el servidor ejecutar 'npm start'. Luego escanear QR con Expo Go en el móvil o presionar 'a' para Android, 'i' para iOS o 'w' para Web.

---

## Builds y Distribución

### EAS Build - Crear APK para Android

El proyecto está configurado con EAS (Expo Application Services) para crear builds nativos que funcionan sin servidor de desarrollo.

**Perfiles de Build disponibles:**

development: Crea build con herramientas de desarrollo y hot reload. Para uso durante desarrollo activo.

preview: Crea build standalone para uso interno. No requiere servidor de desarrollo. Ideal para testing y distribución interna.

production: Build final con auto-incremento de versión. Para publicar en Play Store.

**Crear build para Android:**

Para desarrollo con hot reload:
eas build --profile development --platform android

Para APK standalone sin servidor:
eas build --profile preview --platform android

Para build de producción:
eas build --profile production --platform android

**Proceso del build:**

1. EAS sube tu código a la nube
2. Compila la aplicación (5-15 minutos)
3. Genera el APK
4. Proporciona link de descarga

**Instalar el APK:**

1. Abre el link del build desde tu teléfono Android
2. Descarga el APK
3. Permite instalación desde fuentes desconocidas si es necesario
4. Instala la aplicación

### Actualizar la App sin Rebuild (EAS Update)

EAS Update permite actualizar el código JavaScript de tu app sin crear un nuevo build.

**Configuración inicial:**

npx expo install expo-updates
eas update:configure

**Publicar actualización:**

eas update --branch preview --message "Descripción de cambios"

**Cómo funciona:**

Las apps instaladas detectan automáticamente el update. La próxima vez que se abre la app, descarga los cambios. No requiere reinstalar ni descargar nuevo APK. Solo funciona para cambios de código JavaScript/TypeScript.

**Cuándo usar Update vs Rebuild:**

Usar eas update para cambios en código JS/TS, nuevas pantallas, cambios de estilos, correcciones de bugs y nuevas funcionalidades que no requieran cambios nativos.

Usar eas build para cambios en app.json, nuevos iconos o splash screen, agregar o quitar plugins nativos, cambios en permisos y primera instalación de la app.

### Comandos Útiles EAS

Ver tus builds anteriores:
eas build:list

Cancelar un build en progreso:
eas build:cancel

Ver detalles de un build:
eas build:view BUILD_ID

---

## Funcionalidades Destacadas

### Autenticación Robusta

Incluye login con validación de credenciales, validación de campos obligatorios, validación de respuesta completa del servidor, validación obligatoria de rol de usuario, verificación de salud del servidor antes de operaciones, doble verificación post-login, persistencia de sesión entre reinicios, verificación automática de validez, limpieza automática de sesiones corruptas, manejo de sesión expirada con redirección automática, prevención de alertas duplicadas y logout seguro con limpieza completa.

### Navegación Inteligente

Proporciona protección de rutas basada en roles, redirección automática según permisos, prevención de acceso no autorizado y navegación fluida con animaciones.

### Gestión de Personas

Ofrece CRUD completo de estudiantes profesores y empleados, búsqueda y filtrado avanzado, carga de imágenes de perfil, validación de datos robusta y asignación de roles dinámicos.

### Interfaz de Usuario

Presenta diseño responsive para múltiples tamaños de pantalla, animaciones suaves y fluidas, componentes reutilizables y consistentes, feedback visual inmediato y accesibilidad mejorada.

### Manejo de Errores

Implementa captura de errores en múltiples niveles, mensajes de error legibles para usuarios, mensajes específicos según tipo de error, logging inteligente para desarrollo y recuperación automática de errores temporales.

### Seguridad

Incluye encriptación de datos sensibles, validación de entrada en cliente y servidor, protección contra inyección de código, sesiones con tiempo de expiración y validación de integridad de datos de sesión.

---

## Flujos de Uso Principales

### Flujo 1: Login de Usuario

El usuario abre la app. AuthContext verifica disponibilidad del servidor. Si no hay sesión activa, ve pantalla de login. Ingresa usuario y contraseña. App valida que no estén vacíos. Verifica disponibilidad del servidor. Presiona 'Iniciar Sesión'. App valida credenciales con Odoo. Verifica que respuesta tenga datos completos. Verifica que usuario tenga rol asignado. Si no tiene rol, muestra alerta específica y destruye sesión. Si tiene rol, guarda Session ID. Verifica sesión nuevamente con servidor. Si verificación falla, logout automático. Si verificación pasa, redirige a dashboard según rol.

### Flujo 2: Usuario Sin Rol

Usuario intenta hacer login. Credenciales son correctas. Backend autentica exitosamente. authService detecta que no hay rol asignado. Destruye la sesión inmediatamente. Retorna código especial 'NO_ROLE_DEFINED'. AuthContext detecta el código especial. Limpia datos locales. Muestra alerta específica 'Usuario sin rol'. Usuario contacta al administrador.

### Flujo 3: Sesión Expirada Durante Uso

Usuario está usando la app normalmente. Sesión expira en el servidor por timeout. Usuario intenta realizar una acción. Servidor responde con error de sesión. apiService detecta el error. Limpia Session ID localmente. Notifica a AuthContext mediante callback. AuthContext verifica flag de alerta. Si no se ha mostrado, muestra alerta y actualiza flag. Limpia estado de usuario. Guardia de ruta detecta falta de autenticación. Redirige automáticamente a login. Usuario ve mensaje 'Tu sesión ha expirado'.

### Flujo 4: Verificación al Iniciar App

App se abre y renderiza app/index.tsx mostrando loading. AuthContext se inicializa. Verifica salud del servidor. Si servidor no disponible, sale sin restaurar sesión. Si servidor disponible, busca sesión guardada. Si no hay sesión, redirige a login. Si hay sesión, valida integridad de datos. Si datos incompletos, limpia y redirige a login. Si datos completos, verifica con servidor. Si servidor valida, restaura usuario y redirige a dashboard. Si servidor rechaza, limpia y redirige a login.

---

## Arquitectura del Sistema

El proyecto implementa una arquitectura en capas con separación clara de responsabilidades.

En la capa UI Components se maneja la presentación, interacción de usuario y validaciones de UI.

En la capa Context State Management se gestiona el estado global, lógica de autenticación y validaciones de contexto.

En la capa Service Business Logic se implementa la lógica de negocio mediante authService y personService, con validaciones de datos.

En la capa API Data Access se maneja la comunicación HTTP mediante apiService, gestión de sesiones y detección de errores.

Finalmente en la capa Odoo Backend API se encuentra la base de datos y lógica de servidor.

### Ventajas de esta Arquitectura

Separación de Responsabilidades permite que cada capa tenga una función específica, facilita pruebas unitarias y hace el código más mantenible.

Reutilización de Código se logra mediante servicios compartidos entre componentes, lógica centralizada y componentes desacoplados.

Escalabilidad se facilita porque es fácil agregar nuevos roles, nuevas funcionalidades y módulos independientes.

Mantenibilidad mejora porque los cambios están aislados por capa, es fácil localizar bugs y hay documentación clara.

---

## Validaciones Implementadas

### Validaciones en authService.ts

Campos Obligatorios en Login verifica que username y password no estén vacíos y retorna mensaje específico si falta alguno.

Respuesta de Autenticación Completa verifica que authData exista, que uid exista, que sid exista y retorna error si falta algún dato.

Rol Obligatorio verifica que el usuario tenga campo role, que role no esté vacío, destruye sesión si no tiene rol y retorna código especial 'NO_ROLE_DEFINED'.

Integridad de Sesión Guardada verifica que sesión guardada tenga id, username y token, y limpia sesión si está corrupta.

Verificación de UID compara UID local con UID del servidor, limpia sesión si no coinciden y previene suplantación de identidad.

### Validaciones en AuthContext.tsx

Disponibilidad del Servidor verifica servidor antes de inicializar, verifica servidor antes de login y muestra alertas específicas si no está disponible.

Usuario Sin Rol detecta código especial 'NO_ROLE_DEFINED', ejecuta logout inmediato, muestra alerta específica y limpia completamente el estado.

Doble Verificación Post-Login después de login exitoso verifica sesión, si falla ejecuta logout automático y previene sesiones inválidas.

Prevención de Alertas Duplicadas usa flag para controlar alertas, evita spam de alertas de sesión expirada y resetea flag después de cerrar alerta.

---

## Notas de Desarrollo

### Configuración de Odoo

ODOO_CONFIG define host como 'http://185.111.156.32' que debe cambiarse según tu servidor, y database como 'test' que es la base de datos a usar.

### Estructura de Session ID

El Session ID se almacena en AsyncStorage con la clave '@odoo_session_id' y se envía en cada petición mediante el header 'X-Openerp-Session-Id'.

---

### Estándares de Código

Usar TypeScript para todo el código nuevo. Seguir convenciones de nombrado existentes. Documentar funciones públicas. Agregar tests para lógica crítica. Ejecutar 'npm run lint' antes de commit.

---

## Licencia

Este proyecto es privado y pertenece a su propietario. No se permite distribución sin autorización.
