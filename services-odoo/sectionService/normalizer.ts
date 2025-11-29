/**
 * Normalizadores de datos para secciones
 */

import { Section } from './types';

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
