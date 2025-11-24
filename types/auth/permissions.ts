/**
 * Sistema de permisos por rol
 */

import { UserRole } from './base';

/**
 * Permisos disponibles en el sistema
 */
export interface RolePermissions {
  canManageUsers: boolean;
  canManageGrades: boolean;
  canViewReports: boolean;
  canEditSchedule: boolean;
  canManageAttendance: boolean;
  canManageStudents: boolean;
  canManageTeachers: boolean;
  canManageEmployees: boolean;
  canViewOwnGrades: boolean;
  canEditOwnProfile: boolean;
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
    canManageStudents: true,
    canManageTeachers: true,
    canManageEmployees: true,
    canViewOwnGrades: false,
    canEditOwnProfile: true,
  },
  teacher: {
    canManageUsers: false,
    canManageGrades: true,
    canViewReports: true,
    canEditSchedule: false,
    canManageAttendance: true,
    canManageStudents: false,
    canManageTeachers: false,
    canManageEmployees: false,
    canViewOwnGrades: false,
    canEditOwnProfile: true,
  },
  student: {
    canManageUsers: false,
    canManageGrades: false,
    canViewReports: false,
    canEditSchedule: false,
    canManageAttendance: false,
    canManageStudents: false,
    canManageTeachers: false,
    canManageEmployees: false,
    canViewOwnGrades: true,
    canEditOwnProfile: true,
  },
  employee: {
    canManageUsers: false,
    canManageGrades: false,
    canViewReports: false,
    canEditSchedule: false,
    canManageAttendance: false,
    canManageStudents: false,
    canManageTeachers: false,
    canManageEmployees: false,
    canViewOwnGrades: false,
    canEditOwnProfile: true,
  },
};

/**
 * Verifica si un usuario tiene un permiso específico
 * @param role - Rol del usuario
 * @param permission - Permiso a verificar
 * @returns true si tiene el permiso
 */
export const hasPermission = (
  role: UserRole,
  permission: keyof RolePermissions
): boolean => {
  return ROLE_PERMISSIONS[role][permission];
};

/**
 * Obtiene todos los permisos de un rol
 * @param role - Rol del usuario
 * @returns Objeto con todos los permisos
 */
export const getRolePermissions = (role: UserRole): RolePermissions => {
  return ROLE_PERMISSIONS[role];
};

/**
 * Verifica si un rol puede acceder a una sección
 * @param role - Rol del usuario
 * @param section - Sección a verificar
 * @returns true si puede acceder
 */
export const canAccessSection = (
  role: UserRole,
  section: 'users' | 'grades' | 'reports' | 'schedule' | 'attendance' | 'students' | 'teachers' | 'employees'
): boolean => {
  const permissionMap: Record<string, keyof RolePermissions> = {
    users: 'canManageUsers',
    grades: 'canManageGrades',
    reports: 'canViewReports',
    schedule: 'canEditSchedule',
    attendance: 'canManageAttendance',
    students: 'canManageStudents',
    teachers: 'canManageTeachers',
    employees: 'canManageEmployees',
  };

  return hasPermission(role, permissionMap[section]);
};