/**
 * Tipos base de autenticación
 */

/**
 * Roles disponibles en la aplicación
 * Mapeados desde los roles de Odoo
 */
export type UserRole = 'admin' | 'teacher' | 'student' | 'employee';

/**
 * Roles originales de Odoo
 */
export type OdooEmployeeType =
  | 'administrativo'
  | 'docente'
  | 'obrero'
  | 'cenar';

/**
 * Datos adicionales de Odoo almacenados en la sesión
 */
export interface OdooUserData {
  uid: number;
  companyId: number;
  partnerId: number;
  context: Record<string, any>;
  originalRole?: string;
}

/**
 * Interfaz base de Usuario
 */
export interface User {
  id: number;
  username: string;
  password: string;
  email: string;
  role: UserRole;
  fullName: string;
  createdAt: string;
  active?: boolean;
  imageUrl?: string; // Foto de perfil del usuario (image_1920 de res.partner)
  odooData?: OdooUserData;
}

/**
 * Sesión de usuario con token (SID de Odoo)
 */
export interface UserSession extends User {
  token: string; // Session ID de Odoo
  loginTime: string;
  odooData: OdooUserData; // Obligatorio en sesión activa
}