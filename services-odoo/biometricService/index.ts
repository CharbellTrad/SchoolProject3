/**
 * Servicio de Biometría con Odoo Backend
 * 
 * Exporta todas las funcionalidades relacionadas con dispositivos
 * biométricos y logs de autenticación
 */

// Exportar tipos
export type {
    ApiResponse,
    AuthLogPayload,
    BiometricAuthLog,
    BiometricDeviceBackend,
    DeviceAuthStats,
    OperationResult,
    RegisterDevicePayload
} from './types';

// Exportar tipo de respuesta paginada
export type { AuthHistoryPaginatedResponse } from './biometricAuth';

// Gestión de sesiones
export { destroySession } from './sessionManagement';

// Exportar funciones de dispositivos
export {
    activateDevice,
    getDeviceById,
    getUserDevices,
    mapBiometricTypeToBackend,
    registerDevice,
    revokeDevice,
    validateDevice
} from './biometricDevice';

// Exportar funciones de autenticación/logs
export {
    createAuthLogPayload,
    endSession,
    getActiveSessions,
    getAuthHistory,
    getDeviceStats,
    logAuthentication,
    logTraditionalLogin
} from './biometricAuth';

