/**
 * Normalizadores de datos para materias
 */

import { Professor, Section, Subject } from './types';

/**
 * Normaliza un registro de materia desde Odoo
 */
export const normalizeSubject = (record: any): Subject => {
  return {
    id: record.id,
    name: record.name || '',
    section_ids: Array.isArray(record.section_ids) ? record.section_ids : [],
    professor_ids: Array.isArray(record.professor_ids) ? record.professor_ids : [],
  };
};

/**
 * Normaliza un array de registros de materias
 */
export const normalizeSubjects = (records: any[]): Subject[] => {
  return records.map(normalizeSubject);
};

/**
 * Normaliza un registro de sección desde Odoo
 */
export const normalizeSection = (record: any): Section => {
  return {
    id: record.id,
    name: record.name || '',
    type: record.type || 'primary',
  };
};

/**
 * Normaliza un array de registros de secciones
 */
export const normalizeSections = (records: any[]): Section[] => {
  return records.map(normalizeSection);
};

/**
 * Normaliza un registro de profesor desde Odoo
 */
export const normalizeProfessor = (record: any): Professor => {
  return {
    id: record.id,
    name: record.name || '',
    school_employee_type: record.school_employee_type || '',
    active: record.active !== undefined ? record.active : true,
  };
};

/**
 * Normaliza un array de registros de profesores
 */
export const normalizeProfessors = (records: any[]): Professor[] => {
  return records.map(normalizeProfessor);
};