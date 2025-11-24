import * as odooApi from '../apiService';
import { ENROLLMENT_TYPES, INSCRIPTION_FIELDS, MODELS, PARENT_FIELDS, STUDENT_FIELDS } from './constants';
import { normalizeInscription, normalizeRecord } from './normalizer';
import type { Inscription, Parent, Student } from './types';

/**
 * Carga estudiantes con todos sus datos relacionados de forma optimizada
 * Usa carga en paralelo y batch requests para maximizar la velocidad
 */
export const loadStudents = async (): Promise<Student[]> => {
  try {
    const domain = [['type_enrollment', '=', ENROLLMENT_TYPES.STUDENT]];

    // Cargar estudiantes base
    const result = await odooApi.searchRead(MODELS.PARTNER, domain, STUDENT_FIELDS, 1000);

    if (!result.success) {
      if (result.error?.isSessionExpired) {
        return [];
      }
      if (__DEV__) {
        console.error('Error obteniendo estudiantes:', result.error);
      }
      return [];
    }

    const records = result.data || [];
    const students = records.map(normalizeRecord);

    // Agrupar todos los IDs únicos
    const allParentIds = new Set<number>();
    const allInscriptionIds = new Set<number>();
    
    students.forEach(student => {
      if (student.parents_ids) {
        student.parents_ids.forEach((id: number) => allParentIds.add(id));
      }
      if (student.inscription_ids) {
        student.inscription_ids.forEach((id: number) => allInscriptionIds.add(id));
      }
    });

    // Carga paralela de padres e inscripciones
    const [parentsResult, inscriptionsResult] = await Promise.all([
      allParentIds.size > 0 
        ? odooApi.read(MODELS.PARTNER, Array.from(allParentIds), PARENT_FIELDS)
        : Promise.resolve({ success: true, data: [] }),
      allInscriptionIds.size > 0
        ? odooApi.read(MODELS.INSCRIPTION, Array.from(allInscriptionIds), INSCRIPTION_FIELDS)
        : Promise.resolve({ success: true, data: [] })
    ]);

    // Crear mapas para acceso rápido O(1)
    const parentsMap = new Map<number, Parent>();
    if (parentsResult.success && parentsResult.data) {
      parentsResult.data.map(normalizeRecord).forEach(parent => {
        parentsMap.set(parent.id, parent);
      });
    }

    const inscriptionsMap = new Map<number, Inscription>();
    if (inscriptionsResult.success && inscriptionsResult.data) {
      inscriptionsResult.data.forEach((inscription: any) => {
        const normalized = normalizeInscription(inscription);
        inscriptionsMap.set(normalized.id, normalized);
      });
    }

    // Asignar padres e inscripciones a cada estudiante
    students.forEach(student => {
      if (student.parents_ids && student.parents_ids.length > 0) {
        student.parents = student.parents_ids
          .map((id: number) => parentsMap.get(id))
          .filter((parent: Parent | undefined): parent is Parent => parent !== undefined);
      }
      
      if (student.inscription_ids && student.inscription_ids.length > 0) {
        student.inscriptions = student.inscription_ids
          .map((id: number) => inscriptionsMap.get(id))
          .filter((inscription: Inscription | undefined): inscription is Inscription => inscription !== undefined);
      }
    });

    return students;
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error obteniendo estudiantes:', error.message);
    }
    return [];
  }
};

/**
 * Carga los padres de un estudiante específico (carga diferida)
 */
export const loadStudentParents = async (studentId: number, parentIds: number[]): Promise<Parent[]> => {
  try {
    if (!parentIds || parentIds.length === 0) {
      return [];
    }

    const parentsResult = await odooApi.read(MODELS.PARTNER, parentIds, PARENT_FIELDS);

    if (!parentsResult.success || !parentsResult.data) {
      if (parentsResult.error?.isSessionExpired) {
        return [];
      }
      if (__DEV__) {
        console.error('Error cargando padres del estudiante:', studentId);
      }
      return [];
    }

    return parentsResult.data.map(normalizeRecord);
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error cargando padres del estudiante:', error);
    }
    return [];
  }
};

/**
 * Carga las inscripciones de un estudiante específico (carga diferida)
 */
export const loadStudentInscriptions = async (studentId: number, inscriptionIds: number[]): Promise<Inscription[]> => {
  try {
    if (!inscriptionIds || inscriptionIds.length === 0) {
      return [];
    }

    const inscriptionsResult = await odooApi.read(MODELS.INSCRIPTION, inscriptionIds, INSCRIPTION_FIELDS);

    if (!inscriptionsResult.success || !inscriptionsResult.data) {
      if (inscriptionsResult.error?.isSessionExpired) {
        return [];
      }
      if (__DEV__) {
        console.error('Error cargando inscripciones del estudiante:', studentId);
      }
      return [];
    }

    return inscriptionsResult.data.map(normalizeInscription);
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error cargando inscripciones del estudiante:', error);
    }
    return [];
  }
};

/**
 * Carga todas las inscripciones de un estudiante por búsqueda
 */
export const loadInscriptions = async (studentId: number): Promise<Inscription[]> => {
  try {
    const domain = [['student_id', '=', studentId]];
    const result = await odooApi.searchRead(
      MODELS.INSCRIPTION,
      domain,
      INSCRIPTION_FIELDS,
      100
    );

    if (!result.success) {
      if (result.error?.isSessionExpired) {
        return [];
      }
      if (__DEV__) {
        console.error('Error cargando inscripciones:', result.error);
      }
      return [];
    }

    const inscriptions = result.data || [];
    const sortedInscriptions = inscriptions.sort((a: any, b: any) => b.id - a.id);

    return sortedInscriptions.map(normalizeInscription);
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error cargando inscripciones:', error);
    }
    return [];
  }
};