/**
 * Configuración y mapeo de roles
 */

import { OdooEmployeeType, UserRole } from './base';

/**
 * Mapeo de roles de Odoo a roles de la aplicación
 */
export const ROLE_MAP: Record<OdooEmployeeType, UserRole> = {
  'administrativo': 'admin',
  'docente': 'teacher',
  'obrero': 'employee',
  'cenar': 'employee',
};

/**
 * Nombres legibles de los roles
 */
export const ROLE_NAMES: Record<UserRole, string> = {
  admin: 'Administrativo',
  teacher: 'Docente',
  student: 'Estudiante',
  employee: 'Empleado',
};

/**
 * Iconos por rol (opcional, para UI)
 */
export const ROLE_ICONS: Record<UserRole, string> = {
  admin: 'shield-checkmark',
  teacher: 'school',
  student: 'person',
  employee: 'briefcase',
};

/**
 * Colores por rol (opcional, para UI)
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#dc2626',      // Rojo
  teacher: '#2563eb',    // Azul
  student: '#16a34a',    // Verde
  employee: '#9333ea',   // Púrpura
};