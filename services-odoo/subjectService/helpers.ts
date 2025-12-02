/**
 * Funciones auxiliares para materias
 */

import { Professor, Section, Subject } from './types';

/**
 * Formatea el conteo de secciones asignadas
 */
export const formatSectionCount = (count: number): string => {
  if (count === 0) return 'Sin secciones';
  if (count === 1) return '1 sección';
  return `${count} secciones`;
};

/**
 * Formatea el conteo de profesores asignados
 */
export const formatProfessorCount = (count: number): string => {
  if (count === 0) return 'Sin profesores';
  if (count === 1) return '1 profesor';
  return `${count} profesores`;
};

/**
 * Obtiene nombres de secciones desde sus IDs
 */
export const getSectionNames = (
  sectionIds: number[],
  allSections: Section[]
): string[] => {
  return sectionIds
    .map(id => allSections.find(s => s.id === id))
    .filter(s => s !== undefined)
    .map(s => s!.name);
};

/**
 * Obtiene nombres de profesores desde sus IDs
 */
export const getProfessorNames = (
  professorIds: number[],
  allProfessors: Professor[]
): string[] => {
  return professorIds
    .map(id => allProfessors.find(p => p.id === id))
    .filter(p => p !== undefined)
    .map(p => p!.name);
};

/**
 * Valida que una materia tenga datos válidos
 */
export const validateSubjectData = (subject: Partial<Subject>): string | null => {
  if (!subject.name || subject.name.trim().length < 3) {
    return 'El nombre debe tener al menos 3 caracteres';
  }

  if (!subject.section_ids || subject.section_ids.length === 0) {
    return 'Debe asignar al menos una sección';
  }

  return null;
};

/**
 * Prepara los valores para actualización en Odoo (comandos many2many)
 */
export const prepareMany2ManyCommand = (ids: number[]): any[] => {
  // Comando [6, 0, [ids]] = Reemplazar todos los registros
  return [[6, 0, ids]];
};