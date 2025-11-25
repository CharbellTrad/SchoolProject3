import * as odooApi from '../apiService';
import { CacheKeys, cacheManager, withCache } from '../cache/cacheManager';
import { ENROLLMENT_TYPES, INSCRIPTION_MINIMAL_FIELDS, MODELS, PARENT_FIELDS, STUDENT_FIELDS } from './constants';
import { normalizeInscription, normalizeRecord } from './normalizer';
import type { Inscription, Parent, Student } from './types';

/**
 * ⚡ CARGA OPTIMIZADA CON PAGINACIÓN Y BATCH PARALELO
 * Reduce tiempo de ~60s a ~3-5s
 */

interface PaginatedResult {
  students: Student[];
  total: number;
  hasMore: boolean;
  currentPage: number;
}

/**
 * Carga estudiantes con paginación y batch loading paralelo
 * @param page - Número de página (empezando en 1)
 * @param pageSize - Estudiantes por página (default: 10)
 * @param forceReload - Fuerza recarga desde servidor
 */
export const loadStudentsPaginated = async (
  page: number = 1,
  pageSize: number = 10,
  forceReload: boolean = false
): Promise<PaginatedResult> => {
  try {
    const offset = (page - 1) * pageSize;
    const cacheKey = `${CacheKeys.students()}_page_${page}_size_${pageSize}`;

    // Intentar caché si no es forzado
    if (!forceReload) {
      const cached = cacheManager.get<PaginatedResult>(cacheKey);
      if (cached) {
        if (__DEV__) {
          console.log(`📦 Caché HIT: Página ${page}`);
        }
        return cached;
      }
    }

    if (__DEV__) {
      console.time(`⏱️ loadStudentsPaginated - Página ${page}`);
    }

    const domain = [['type_enrollment', '=', ENROLLMENT_TYPES.STUDENT]];

    // 1️⃣ PASO 1: Obtener total y estudiantes en PARALELO
    const [countResult, studentsResult] = await Promise.all([
      odooApi.searchCount(MODELS.PARTNER, domain),
      odooApi.searchRead(
        MODELS.PARTNER,
        domain,
        STUDENT_FIELDS,
        pageSize,
        offset,
        'id desc' // Más recientes primero
      )
    ]);

    if (!studentsResult.success || !countResult.success) {
      if (studentsResult.error?.isSessionExpired || countResult.error?.isSessionExpired) {
        return { students: [], total: 0, hasMore: false, currentPage: page };
      }
      if (__DEV__) {
        console.error('Error cargando estudiantes:', studentsResult.error || countResult.error);
      }
      return { students: [], total: 0, hasMore: false, currentPage: page };
    }

    const records = studentsResult.data || [];
    const total = countResult.data || 0;

    if (records.length === 0) {
      const emptyResult = { students: [], total: 0, hasMore: false, currentPage: page };
      cacheManager.set(cacheKey, emptyResult, 5 * 60 * 1000);
      return emptyResult;
    }

    const students = records.map(normalizeRecord);

    // 2️⃣ PASO 2: Recolectar IDs únicos para batch loading
    const allParentIds = new Set<number>();
    const allInscriptionIds = new Set<number>();
    
    students.forEach(student => {
      if (student.parents_ids?.length) {
        student.parents_ids.forEach((id: number) => allParentIds.add(id));
      }
      if (student.inscription_ids?.length) {
        student.inscription_ids.forEach((id: number) => allInscriptionIds.add(id));
      }
    });

    if (__DEV__) {
      console.log(`📊 Página ${page}: ${students.length} estudiantes, ${allParentIds.size} padres, ${allInscriptionIds.size} inscripciones`);
    }

    // 3️⃣ PASO 3: Carga MASIVA en paralelo (batch)
    const [parentsData, inscriptionsData] = await Promise.all([
      allParentIds.size > 0 
        ? batchLoadParents(Array.from(allParentIds))
        : Promise.resolve([]),
      allInscriptionIds.size > 0
        ? batchLoadInscriptionsMinimal(Array.from(allInscriptionIds))
        : Promise.resolve([])
    ]);

    // 4️⃣ PASO 4: Crear mapas para asignación O(1)
    const parentsMap = new Map<number, Parent>();
    parentsData.forEach(parent => parentsMap.set(parent.id, parent));

    const inscriptionsMap = new Map<number, Inscription>();
    inscriptionsData.forEach(inscription => inscriptionsMap.set(inscription.id, inscription));

    // 5️⃣ PASO 5: Asignar datos relacionados
    students.forEach(student => {
      if (student.parents_ids?.length) {
        student.parents = student.parents_ids
          .map((id: number) => parentsMap.get(id))
          .filter((p): p is Parent => p !== undefined);
      }
      
      if (student.inscription_ids?.length) {
        student.inscriptions = student.inscription_ids
          .map((id: number) => inscriptionsMap.get(id))
          .filter((i): i is Inscription => i !== undefined);
      }
    });

    const result: PaginatedResult = {
      students,
      total,
      hasMore: offset + pageSize < total,
      currentPage: page,
    };

    // 6️⃣ PASO 6: Guardar en caché (5 minutos)
    cacheManager.set(cacheKey, result, 5 * 60 * 1000);

    if (__DEV__) {
      console.timeEnd(`⏱️ loadStudentsPaginated - Página ${page}`);
      console.log(`✅ Página ${page} cargada: ${students.length}/${total} estudiantes`);
    }

    return result;
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error en loadStudentsPaginated:', error.message);
    }
    return { students: [], total: 0, hasMore: false, currentPage: page };
  }
};

/**
 * ⚡ BÚSQUEDA GLOBAL (sin limitaciones de paginación)
 * Busca en TODOS los estudiantes, no solo en la página actual
 */
export const searchStudentsGlobal = async (
  query: string,
  limit: number = 50
): Promise<Student[]> => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `students_search_${normalizedQuery}_${limit}`;

    // Intentar caché
    const cached = cacheManager.get<Student[]>(cacheKey);
    if (cached) {
      if (__DEV__) {
        console.log(`📦 Caché HIT: Búsqueda "${query}"`);
      }
      return cached;
    }

    if (__DEV__) {
      console.time(`⏱️ searchStudentsGlobal: "${query}"`);
    }

    // Buscar por nombre O cédula
    const domain = [
      ['type_enrollment', '=', ENROLLMENT_TYPES.STUDENT],
      '|',
      ['name', 'ilike', query],
      ['vat', 'ilike', query]
    ];

    const result = await odooApi.searchRead(
      MODELS.PARTNER,
      domain,
      STUDENT_FIELDS,
      limit,
      0,
      'id desc'
    );

    if (!result.success) {
      if (__DEV__) {
        console.error('Error en búsqueda:', result.error);
      }
      return [];
    }

    const records = result.data || [];
    if (records.length === 0) {
      return [];
    }

    const students = records.map(normalizeRecord);

    // Cargar padres e inscripciones en paralelo
    const allParentIds = new Set<number>();
    const allInscriptionIds = new Set<number>();
    
    students.forEach(student => {
      if (student.parents_ids?.length) {
        student.parents_ids.forEach((id: number) => allParentIds.add(id));
      }
      if (student.inscription_ids?.length) {
        student.inscription_ids.forEach((id: number) => allInscriptionIds.add(id));
      }
    });

    const [parentsData, inscriptionsData] = await Promise.all([
      allParentIds.size > 0 ? batchLoadParents(Array.from(allParentIds)) : Promise.resolve([]),
      allInscriptionIds.size > 0 ? batchLoadInscriptionsMinimal(Array.from(allInscriptionIds)) : Promise.resolve([])
    ]);

    const parentsMap = new Map<number, Parent>();
    parentsData.forEach(parent => parentsMap.set(parent.id, parent));

    const inscriptionsMap = new Map<number, Inscription>();
    inscriptionsData.forEach(inscription => inscriptionsMap.set(inscription.id, inscription));

    students.forEach(student => {
      if (student.parents_ids?.length) {
        student.parents = student.parents_ids
          .map((id: number) => parentsMap.get(id))
          .filter((p): p is Parent => p !== undefined);
      }
      
      if (student.inscription_ids?.length) {
        student.inscriptions = student.inscription_ids
          .map((id: number) => inscriptionsMap.get(id))
          .filter((i): i is Inscription => i !== undefined);
      }
    });

    // Guardar en caché (2 minutos para búsquedas)
    cacheManager.set(cacheKey, students, 2 * 60 * 1000);

    if (__DEV__) {
      console.timeEnd(`⏱️ searchStudentsGlobal: "${query}"`);
      console.log(`✅ Búsqueda: ${students.length} resultados`);
    }

    return students;
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error en searchStudentsGlobal:', error.message);
    }
    return [];
  }
};

/**
 * ⚡ CARGA BATCH DE PADRES (chunks de 50)
 */
const batchLoadParents = async (parentIds: number[]): Promise<Parent[]> => {
  if (parentIds.length === 0) return [];

  const chunkSize = 50;
  const chunks: number[][] = [];
  
  for (let i = 0; i < parentIds.length; i += chunkSize) {
    chunks.push(parentIds.slice(i, i + chunkSize));
  }

  const results = await Promise.all(
    chunks.map(chunk => odooApi.read(MODELS.PARTNER, chunk, PARENT_FIELDS))
  );

  const allParents: Parent[] = [];
  results.forEach(result => {
    if (result.success && result.data) {
      result.data.map(normalizeRecord).forEach(parent => allParents.push(parent));
    }
  });

  return allParents;
};

/**
 * ⚡ CARGA BATCH DE INSCRIPCIONES MÍNIMAS (solo datos esenciales)
 */
const batchLoadInscriptionsMinimal = async (inscriptionIds: number[]): Promise<Inscription[]> => {
  if (inscriptionIds.length === 0) return [];

  const chunkSize = 50;
  const chunks: number[][] = [];
  
  for (let i = 0; i < inscriptionIds.length; i += chunkSize) {
    chunks.push(inscriptionIds.slice(i, i + chunkSize));
  }

  const results = await Promise.all(
    chunks.map(chunk => odooApi.read(MODELS.INSCRIPTION, chunk, INSCRIPTION_MINIMAL_FIELDS))
  );

  const allInscriptions: Inscription[] = [];
  results.forEach(result => {
    if (result.success && result.data) {
      result.data.map(normalizeInscription).forEach(inscription => allInscriptions.push(inscription));
    }
  });

  return allInscriptions;
};

/**
 * ⚡ INVALIDAR CACHÉ DE PAGINACIÓN (después de crear/editar/eliminar)
 */
export const invalidateStudentsPaginationCache = (): void => {
  cacheManager.invalidatePattern('students_page_');
  cacheManager.invalidatePattern('students_search_');
  cacheManager.invalidatePattern('student:'); // Invalida estudiantes individuales
  
  if (__DEV__) {
    console.log('🗑️ Caché de paginación y estudiantes invalidado');
  }
};

/**
 * MANTENER RETROCOMPATIBILIDAD: loadStudents para código legacy
 */
export const loadStudents = async (): Promise<Student[]> => {
  // Cargar primeras 100 para retrocompatibilidad
  const result = await loadStudentsPaginated(1, 100, false);
  return result.students;
};

/**
 * Carga los padres de un estudiante específico (con caché)
 */
export const loadStudentParents = async (studentId: number, parentIds: number[]): Promise<Parent[]> => {
  try {
    if (!parentIds || parentIds.length === 0) {
      return [];
    }

    return await withCache(
      CacheKeys.studentParents(studentId),
      async () => {
        const parentsResult = await odooApi.read(MODELS.PARTNER, parentIds, PARENT_FIELDS);

        if (!parentsResult.success || !parentsResult.data) {
          return [];
        }

        return parentsResult.data.map(normalizeRecord);
      },
      3 * 60 * 1000
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
        const inscriptionsResult = await odooApi.read(MODELS.INSCRIPTION, inscriptionIds, INSCRIPTION_MINIMAL_FIELDS);

        if (!inscriptionsResult.success || !inscriptionsResult.data) {
          return [];
        }

        return inscriptionsResult.data.map(normalizeInscription);
      },
      3 * 60 * 1000
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
          INSCRIPTION_MINIMAL_FIELDS,
          100
        );

        if (!result.success) {
          return [];
        }

        const inscriptions = result.data || [];
        const sortedInscriptions = inscriptions.sort((a: any, b: any) => b.id - a.id);

        return sortedInscriptions.map(normalizeInscription);
      },
      2 * 60 * 1000
    );
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error cargando inscripciones:', error);
    }
    return [];
  }
};