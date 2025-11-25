import * as odooApi from '../apiService';
import { CacheKeys, cacheManager, withCache } from '../cache/cacheManager';
import { ENROLLMENT_TYPES, INSCRIPTION_FIELDS, MODELS, PARENT_FIELDS, STUDENT_FIELDS } from './constants';
import { normalizeInscription, normalizeRecord } from './normalizer';
import type { Inscription, Parent, Student } from './types';

/**
 * Carga estudiantes con caché y carga paralela optimizada
 * Reduce tiempo de ~60s a ~5-8s
 */
export const loadStudents = async (): Promise<Student[]> => {
  try {
    // Intentar obtener del caché primero
    const cachedStudents = cacheManager.get<Student[]>(CacheKeys.students());
    if (cachedStudents) {
      return cachedStudents;
    }

    if (__DEV__) {
      console.time('⏱️ loadStudents');
    }

    const domain = [['type_enrollment', '=', ENROLLMENT_TYPES.STUDENT]];

    // 1. Cargar estudiantes base
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
    
    if (records.length === 0) {
      return [];
    }

    const students = records.map(normalizeRecord);

    // 2. Recolectar IDs únicos para batch loading
    const allParentIds = new Set<number>();
    const allInscriptionIds = new Set<number>();
    
    students.forEach(student => {
      if (student.parents_ids && Array.isArray(student.parents_ids)) {
        student.parents_ids.forEach((id: number) => allParentIds.add(id));
      }
      if (student.inscription_ids && Array.isArray(student.inscription_ids)) {
        student.inscription_ids.forEach((id: number) => allInscriptionIds.add(id));
      }
    });

    if (__DEV__) {
      console.log(`📊 Estudiantes: ${students.length}, Padres únicos: ${allParentIds.size}, Inscripciones: ${allInscriptionIds.size}`);
    }

    // 3. Carga paralela masiva (batch)
    const [parentsResult, inscriptionsResult] = await Promise.all([
      allParentIds.size > 0 
        ? batchLoadParents(Array.from(allParentIds))
        : Promise.resolve({ success: true, data: [] }),
      allInscriptionIds.size > 0
        ? batchLoadInscriptions(Array.from(allInscriptionIds))
        : Promise.resolve({ success: true, data: [] })
    ]);

    // 4. Crear mapas para acceso O(1)
    const parentsMap = new Map<number, Parent>();
    if (parentsResult.success && parentsResult.data) {
      parentsResult.data.forEach(parent => {
        parentsMap.set(parent.id, parent);
      });
    }

    const inscriptionsMap = new Map<number, Inscription>();
    if (inscriptionsResult.success && inscriptionsResult.data) {
      inscriptionsResult.data.forEach(inscription => {
        inscriptionsMap.set(inscription.id, inscription);
      });
    }

    // 5. Asignar datos relacionados (operación muy rápida con Maps)
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

    // 6. Guardar en caché (5 minutos)
    cacheManager.set(CacheKeys.students(), students, 5 * 60 * 1000);

    if (__DEV__) {
      console.timeEnd('⏱️ loadStudents');
      console.log(`✅ ${students.length} estudiantes cargados con éxito`);
    }

    return students;
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error obteniendo estudiantes:', error.message);
    }
    return [];
  }
};

/**
 * Carga padres en batch (más eficiente que llamadas individuales)
 */
const batchLoadParents = async (parentIds: number[]) => {
  if (parentIds.length === 0) {
    return { success: true, data: [] };
  }

  // Dividir en chunks de 50 para evitar timeouts
  const chunkSize = 50;
  const chunks: number[][] = [];
  
  for (let i = 0; i < parentIds.length; i += chunkSize) {
    chunks.push(parentIds.slice(i, i + chunkSize));
  }

  if (__DEV__) {
    console.log(`📦 Cargando ${parentIds.length} padres en ${chunks.length} batch(es)`);
  }

  // Cargar chunks en paralelo
  const results = await Promise.all(
    chunks.map(chunk => odooApi.read(MODELS.PARTNER, chunk, PARENT_FIELDS))
  );

  // Combinar resultados
  const allParents: Parent[] = [];
  results.forEach(result => {
    if (result.success && result.data) {
      result.data.map(normalizeRecord).forEach(parent => allParents.push(parent));
    }
  });

  return { success: true, data: allParents };
};

/**
 * Carga inscripciones en batch
 */
const batchLoadInscriptions = async (inscriptionIds: number[]) => {
  if (inscriptionIds.length === 0) {
    return { success: true, data: [] };
  }

  const chunkSize = 50;
  const chunks: number[][] = [];
  
  for (let i = 0; i < inscriptionIds.length; i += chunkSize) {
    chunks.push(inscriptionIds.slice(i, i + chunkSize));
  }

  if (__DEV__) {
    console.log(`📦 Cargando ${inscriptionIds.length} inscripciones en ${chunks.length} batch(es)`);
  }

  const results = await Promise.all(
    chunks.map(chunk => odooApi.read(MODELS.INSCRIPTION, chunk, INSCRIPTION_FIELDS))
  );

  const allInscriptions: Inscription[] = [];
  results.forEach(result => {
    if (result.success && result.data) {
      result.data.map(normalizeInscription).forEach(inscription => allInscriptions.push(inscription));
    }
  });

  return { success: true, data: allInscriptions };
};

/**
 * Carga los padres de un estudiante específico (con caché)
 */
export const loadStudentParents = async (studentId: number, parentIds: number[]): Promise<Parent[]> => {
  try {
    if (!parentIds || parentIds.length === 0) {
      return [];
    }

    // Usar caché para estudiante específico
    return await withCache(
      CacheKeys.studentParents(studentId),
      async () => {
        const parentsResult = await odooApi.read(MODELS.PARTNER, parentIds, PARENT_FIELDS);

        if (!parentsResult.success || !parentsResult.data) {
          return [];
        }

        return parentsResult.data.map(normalizeRecord);
      },
      3 * 60 * 1000 // 3 minutos
    );
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error cargando padres del estudiante:', error);
    }
    return [];
  }
};

/**
 * Carga las inscripciones de un estudiante específico (con caché)
 */
export const loadStudentInscriptions = async (studentId: number, inscriptionIds: number[]): Promise<Inscription[]> => {
  try {
    if (!inscriptionIds || inscriptionIds.length === 0) {
      return [];
    }

    return await withCache(
      CacheKeys.studentInscriptions(studentId),
      async () => {
        const inscriptionsResult = await odooApi.read(MODELS.INSCRIPTION, inscriptionIds, INSCRIPTION_FIELDS);

        if (!inscriptionsResult.success || !inscriptionsResult.data) {
          return [];
        }

        return inscriptionsResult.data.map(normalizeInscription);
      },
      3 * 60 * 1000 // 3 minutos
    );
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error cargando inscripciones del estudiante:', error);
    }
    return [];
  }
};

/**
 * Carga todas las inscripciones de un estudiante por búsqueda (con caché)
 */
export const loadInscriptions = async (studentId: number): Promise<Inscription[]> => {
  try {
    return await withCache(
      CacheKeys.studentInscriptions(studentId),
      async () => {
        const domain = [['student_id', '=', studentId]];
        const result = await odooApi.searchRead(
          MODELS.INSCRIPTION,
          domain,
          INSCRIPTION_FIELDS,
          100
        );

        if (!result.success) {
          return [];
        }

        const inscriptions = result.data || [];
        const sortedInscriptions = inscriptions.sort((a: any, b: any) => b.id - a.id);

        return sortedInscriptions.map(normalizeInscription);
      },
      2 * 60 * 1000 // 2 minutos
    );
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error cargando inscripciones:', error);
    }
    return [];
  }
};