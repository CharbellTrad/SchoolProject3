/**
 * Rutas y navegación por rol
 */

import { UserRole } from './base';

/**
 * Rutas de dashboard por rol
 */
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  employee: '/employee/dashboard',
};

/**
 * Obtiene la ruta del dashboard para un rol
 * @param role - Rol del usuario
 * @returns Ruta del dashboard
 */
export const getDashboardRoute = (role: UserRole): string => {
  return ROLE_DASHBOARDS[role];
};

/**
 * Verifica si una ruta corresponde a un rol específico
 * @param route - Ruta a verificar
 * @param role - Rol del usuario
 * @returns true si la ruta corresponde al rol
 */
export const isRouteForRole = (route: string, role: UserRole): boolean => {
  return route.startsWith(`/${role}/`);
};

/**
 * Rutas públicas (sin autenticación requerida)
 */
export const PUBLIC_ROUTES = [
  '/login',
  '/',
  '/_sitemap',
] as const;

/**
 * Verifica si una ruta es pública
 * @param route - Ruta a verificar
 * @returns true si es pública
 */
export const isPublicRoute = (route: string): boolean => {
  return PUBLIC_ROUTES.some(publicRoute => route === publicRoute);
};

/**
 * Rutas protegidas que requieren roles específicos
 */
export const PROTECTED_ROUTES: Record<string, UserRole[]> = {
  '/admin': ['admin'],
  '/teacher': ['teacher'],
  '/student': ['student'],
  '/employee': ['employee'],
};

/**
 * Verifica si un usuario puede acceder a una ruta
 * @param route - Ruta a verificar
 * @param userRole - Rol del usuario
 * @returns true si puede acceder
 */
export const canAccessRoute = (route: string, userRole: UserRole): boolean => {
  // Rutas públicas son accesibles por todos
  if (isPublicRoute(route)) {
    return true;
  }

  // Verificar rutas protegidas
  for (const [protectedRoute, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (route.startsWith(protectedRoute)) {
      return allowedRoles.includes(userRole);
    }
  }

  // Por defecto, permitir acceso
  return true;
};