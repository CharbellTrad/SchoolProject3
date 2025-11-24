import { formatDateToDisplay } from '../../utils/formatHelpers';
import type { Inscription } from './types';

/**
 * Normaliza los campos Many2one y fechas que Odoo devuelve
 * Convierte arrays [id, nombre] a strings y normaliza valores false/null
 */
export const normalizeRecord = (record: any): any => {
  const normalized = { ...record };

  // Normalizar campos Many2one (state_id, country_id)
  if (Array.isArray(normalized.state_id)) {
    normalized.state_id = normalized.state_id[1] || '';
  } else if (normalized.state_id === false || normalized.state_id === null) {
    normalized.state_id = '';
  } else if (typeof normalized.state_id !== 'string') {
    normalized.state_id = String(normalized.state_id || '');
  }

  if (Array.isArray(normalized.country_id)) {
    normalized.country_id = normalized.country_id[1] || '';
  } else if (normalized.country_id === false || normalized.country_id === null) {
    normalized.country_id = '';
  } else if (typeof normalized.country_id !== 'string') {
    normalized.country_id = String(normalized.country_id || '');
  }

  // Normalizar fechas
  if (normalized.born_date) {
    normalized.born_date = formatDateToDisplay(normalized.born_date);
  }

  // Normalizar campos de teléfono
  if (normalized.phone === false || normalized.phone === null) {
    normalized.phone = '';
  }
  if (normalized.resident_number === false || normalized.resident_number === null) {
    normalized.resident_number = '';
  }
  if (normalized.emergency_phone_number === false || normalized.emergency_phone_number === null) {
    normalized.emergency_phone_number = '';
  }

  // Normalizar campos de tallas
  if (normalized.current_height === false || normalized.current_height === 0) {
    normalized.current_height = undefined;
  }
  if (normalized.current_weight === false || normalized.current_weight === 0) {
    normalized.current_weight = undefined;
  }
  if (normalized.current_size_shirt === false) {
    normalized.current_size_shirt = undefined;
  }
  if (normalized.current_size_pants === false || normalized.current_size_pants === 0) {
    normalized.current_size_pants = undefined;
  }
  if (normalized.current_size_shoes === false || normalized.current_size_shoes === 0) {
    normalized.current_size_shoes = undefined;
  }

  return normalized;
};

/**
 * Normaliza una inscripción desde el formato de Odoo
 */
export const normalizeInscription = (inscription: any): Inscription => {
  return {
    ...inscription,
    year_id: Array.isArray(inscription.year_id) ? inscription.year_id[1] : inscription.year_id,
    section_id: Array.isArray(inscription.section_id) ? inscription.section_id[1] : inscription.section_id,
    student_id: Array.isArray(inscription.student_id) ? inscription.student_id[0] : inscription.student_id,
    parent_id: Array.isArray(inscription.parent_id) ? inscription.parent_id[0] : inscription.parent_id,
    inscription_date: inscription.inscription_date ? formatDateToDisplay(inscription.inscription_date) : '',
    uninscription_date: inscription.uninscription_date ? formatDateToDisplay(inscription.uninscription_date) : undefined,
    parent_siganture_date: inscription.parent_siganture_date ? formatDateToDisplay(inscription.parent_siganture_date) : undefined,
  };
};

/**
 * Prepara los datos de un estudiante para enviar a Odoo
 */
export const prepareStudentForOdoo = (student: any): any => {
  const values: any = { ...student };

  // Convertir campos vacíos a false para Odoo
  if (values.phone === '') values.phone = false;
  if (values.resident_number === '') values.resident_number = false;

  // Convertir Many2many a formato de Odoo
  if (values.parents_ids) {
    values.parents_ids = [[6, 0, values.parents_ids]];
  }

  return values;
};

/**
 * Prepara los datos de un padre para enviar a Odoo
 */
export const prepareParentForOdoo = (parent: any): any => {
  const values: any = { ...parent };

  // Convertir campos vacíos a false para Odoo
  if (values.phone === '') values.phone = false;
  if (values.resident_number === '') values.resident_number = false;
  if (values.emergency_phone_number === '') values.emergency_phone_number = false;

  // Convertir Many2many a formato de Odoo
  if (values.students_ids) {
    values.students_ids = [[6, 0, values.students_ids]];
  }

  return values;
};