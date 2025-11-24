/**
 * Validadores y guardias de tipo para autenticación
 */

import { OdooEmployeeType, User, UserRole, UserSession } from './base';

/**
 * Type guard: verifica si un valor es un UserRole válido
 */
export const isUserRole = (value: any): value is UserRole => {
  return ['admin', 'teacher', 'student', 'employee'].includes(value);
};

/**
 * Type guard: verifica si un valor es un OdooEmployeeType válido
 */
export const isOdooEmployeeType = (value: any): value is OdooEmployeeType => {
  return ['administrativo', 'docente', 'obrero', 'cenar'].includes(value);
};

/**
 * Type guard: verifica si un objeto es un User
 */
export const isUser = (value: any): value is User => {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'number' &&
    typeof value.username === 'string' &&
    typeof value.email === 'string' &&
    isUserRole(value.role) &&
    typeof value.fullName === 'string' &&
    (value.active === undefined || typeof value.active === 'boolean')
  );
};

/**
 * Type guard: verifica si un objeto es un UserSession
 */
export const isUserSession = (value: any): value is UserSession => {
  return (
    value &&
    typeof value === 'object' &&
    typeof value.id === 'number' &&
    typeof value.username === 'string' &&
    typeof value.email === 'string' &&
    isUserRole(value.role) &&
    typeof value.fullName === 'string' &&
    typeof value.token === 'string' &&
    typeof value.loginTime === 'string' &&
    value.odooData &&
    typeof value.odooData === 'object' &&
    typeof value.odooData.uid === 'number'
  );
};

/**
 * Valida la estructura de un UserSession
 * @param session - Sesión a validar
 * @returns Objeto con isValid y errores
 */
export const validateUserSession = (
  session: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!session) {
    errors.push('Session is null or undefined');
    return { isValid: false, errors };
  }

  if (!session.id || typeof session.id !== 'number') {
    errors.push('Invalid or missing id');
  }

  if (!session.username || typeof session.username !== 'string') {
    errors.push('Invalid or missing username');
  }

  if (!session.token || typeof session.token !== 'string') {
    errors.push('Invalid or missing token');
  }

  if (!isUserRole(session.role)) {
    errors.push('Invalid or missing role');
  }

  if (!session.odooData || typeof session.odooData !== 'object') {
    errors.push('Invalid or missing odooData');
  } else {
    if (!session.odooData.uid || typeof session.odooData.uid !== 'number') {
      errors.push('Invalid or missing odooData.uid');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida formato de username
 */
export const isValidUsername = (username: string): boolean => {
  // Al menos 3 caracteres, solo letras, números, guiones y guiones bajos
  const usernameRegex = /^[a-zA-Z0-9_-]{3,}$/;
  return usernameRegex.test(username);
};

/**
 * Valida formato de contraseña
 */
export const isValidPassword = (password: string): boolean => {
  // Al menos 6 caracteres
  return password.length >= 6;
};