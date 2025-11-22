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

/**
 * Contexto de autenticación
 */
export interface AuthContextType {
  user: UserSession | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  updateUser?: (updates: Partial<UserSession>) => Promise<void>;
}

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
 * Permisos por rol
 */
export interface RolePermissions {
  canManageUsers: boolean;
  canManageGrades: boolean;
  canViewReports: boolean;
  canEditSchedule: boolean;
  canManageAttendance: boolean;
}

/**
 * Define los permisos de cada rol
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canManageUsers: true,
    canManageGrades: true,
    canViewReports: true,
    canEditSchedule: true,
    canManageAttendance: true,
  },
  teacher: {
    canManageUsers: false,
    canManageGrades: true,
    canViewReports: true,
    canEditSchedule: false,
    canManageAttendance: true,
  },
  student: {
    canManageUsers: false,
    canManageGrades: false,
    canViewReports: false,
    canEditSchedule: false,
    canManageAttendance: false,
  },
  employee: {
    canManageUsers: false,
    canManageGrades: false,
    canViewReports: false,
    canEditSchedule: false,
    canManageAttendance: false,
  },
};

/**
 * Rutas de dashboard por rol
 */
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
  employee: '/employee/dashboard',
};