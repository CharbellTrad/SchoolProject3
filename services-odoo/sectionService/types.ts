/**
 * Tipos y interfaces para el servicio de secciones
 */

export interface Section {
  id: number;
  name: string;
  type: 'pre' | 'primary' | 'secundary';
}

export interface SectionServiceResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  section?: Section;
}

export type NewSection = Omit<Section, 'id'>;

export interface SectionsCountByType {
  pre: number;
  primary: number;
  secundary: number;
  total: number;
}

export type SectionType = 'pre' | 'primary' | 'secundary';
