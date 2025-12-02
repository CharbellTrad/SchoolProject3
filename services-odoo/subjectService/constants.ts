/**
 * Constantes para el servicio de materias
 * Modelo Odoo: school.register.subject
 */

export const MODELS = {
  SUBJECT: 'school.register.subject',
  SECTION: 'school.register.section',
  PROFESSOR: 'hr.employee',
} as const;

export const SUBJECT_FIELDS = [
  'id',
  'name',
  'section_ids',
  'professor_ids',
];

export const SECTION_FIELDS = [
  'id',
  'name',
  'type',
];

export const PROFESSOR_FIELDS = [
  'id',
  'name',
  'school_employee_type',
  'active',
];

export const CACHE_KEYS = {
  ALL: 'subjects:all',
  BY_ID: (id: number) => `subjects:id:${id}`,
  SECTIONS_SECUNDARY: 'sections:secundary',
  PROFESSORS_ACTIVE: 'professors:docentes:active',
} as const;

export const CACHE_TTL = {
  SUBJECTS: 10 * 60 * 1000, // 10 minutos
  SECTIONS: 10 * 60 * 1000, // 10 minutos
  PROFESSORS: 15 * 60 * 1000, // 15 minutos
} as const;