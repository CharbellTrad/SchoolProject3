/**
 * Funciones auxiliares para autenticación
 */

import { UserRole, UserSession } from './base';
import { ROLE_COLORS, ROLE_ICONS, ROLE_NAMES } from './roles';

/**
 * Obtiene el nombre legible de un rol
 */
export const getRoleName = (role: UserRole): string => {
  return ROLE_NAMES[role];
};

/**
 * Obtiene el icono de un rol
 */
export const getRoleIcon = (role: UserRole): string => {
  return ROLE_ICONS[role];
};

/**
 * Obtiene el color de un rol
 */
export const getRoleColor = (role: UserRole): string => {
  return ROLE_COLORS[role];
};

/**
 * Obtiene las iniciales del nombre completo
 */
export const getUserInitials = (fullName: string): string => {
  const names = fullName.trim().split(' ');
  if (names.length === 0) return '?';
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  
  return (
    names[0].charAt(0).toUpperCase() + 
    names[names.length - 1].charAt(0).toUpperCase()
  );
};

/**
 * Formatea el nombre para mostrar
 */
export const formatUserDisplayName = (user: UserSession): string => {
  if (user.fullName) {
    return user.fullName;
  }
  return user.username;
};

/**
 * Calcula el tiempo desde el login
 */
export const getLoginDuration = (loginTime: string): string => {
  const login = new Date(loginTime).getTime();
  const now = new Date().getTime();
  const diffMs = now - login;
  
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return `${diffDays} día${diffDays > 1 ? 's' : ''}`;
  }
  if (diffHours > 0) {
    return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
  }
  if (diffMins > 0) {
    return `${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
  }
  return 'Ahora';
};

/**
 * Verifica si la sesión está cerca de expirar
 */
export const isSessionNearExpiry = (
  loginTime: string,
  expiryHours: number = 24,
  warningHours: number = 2
): boolean => {
  const login = new Date(loginTime).getTime();
  const now = new Date().getTime();
  const ageHours = (now - login) / (1000 * 60 * 60);
  
  return ageHours >= (expiryHours - warningHours);
};

/**
 * Genera un saludo basado en la hora del día
 */
export const getGreeting = (fullName?: string): string => {
  const hour = new Date().getHours();
  let greeting = '';
  
  if (hour < 12) {
    greeting = 'Buenos días';
  } else if (hour < 18) {
    greeting = 'Buenas tardes';
  } else {
    greeting = 'Buenas noches';
  }
  
  return fullName ? `${greeting}, ${fullName.split(' ')[0]}` : greeting;
};

/**
 * Sanitiza datos de usuario para logging (remueve información sensible)
 */
export const sanitizeUserForLog = (user: UserSession): Record<string, any> => {
  return {
    id: user.id,
    username: user.username,
    role: user.role,
    fullName: user.fullName,
    loginTime: user.loginTime,
    odooUid: user.odooData?.uid,
    // Omitimos: password, token, email completo
  };
};