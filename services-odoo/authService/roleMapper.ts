/**
 * Mapeo de roles de Odoo a roles de la aplicación
 */

type AppRole = 'admin' | 'teacher' | 'student' | 'employee';

/**
 * Mapeo de roles Odoo → App
 */
const ROLE_MAPPING: Record<string, AppRole> = {
  'administrativo': 'admin',
  'docente': 'teacher',
  'obrero': 'employee',
  'cenar': 'employee',
};

/**
 * Mapea un rol de Odoo al rol correspondiente de la app
 * @param odooRole - Rol desde Odoo
 * @returns Rol de la aplicación
 */
export const mapOdooRoleToAppRole = (odooRole: string): AppRole => {
  return ROLE_MAPPING[odooRole] || 'employee';
};

/**
 * Valida si un rol de Odoo es válido
 * @param odooRole - Rol a validar
 * @returns true si el rol existe en el mapeo
 */
export const isValidOdooRole = (odooRole: string): boolean => {
  return odooRole in ROLE_MAPPING;
};

/**
 * Obtiene todos los roles válidos de Odoo
 * @returns Array de roles válidos
 */
export const getValidOdooRoles = (): string[] => {
  return Object.keys(ROLE_MAPPING);
};