/**
 * Funciones auxiliares para secciones
 */

import { SECTION_TYPE_LABELS } from './constants';

/**
 * Formatea el tipo de sección para visualización
 */
export const formatSectionType = (type: string | null | undefined): string => {
  if (!type) return 'No especificado';
  return SECTION_TYPE_LABELS[type] || type;
};
