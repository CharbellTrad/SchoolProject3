/**
 * Tipos y interfaces para el servicio de materias
 */

export interface Subject {
  id: number;
  name: string;
  section_ids: number[];
  professor_ids: number[];
  sections?: Section[];      // Opcional: objetos completos de secciones
  professors?: Professor[];  // Opcional: objetos completos de profesores
}

export interface Section {
  id: number;
  name: string;
  type: 'pre' | 'primary' | 'secundary';
}

export interface Professor {
  id: number;
  name: string;
  school_employee_type: string;
  active: boolean;
}

export interface SubjectServiceResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  subject?: Subject;
}

export type NewSubject = Omit<Subject, 'id'>;

export interface SubjectWithDetails extends Subject {
  sections: Section[];
  professors: Professor[];
}