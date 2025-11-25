import * as odooApi from '../apiService';
import { CacheKeys, cacheManager, withCache } from '../cache/cacheManager';
import { ENROLLMENT_TYPES, INSCRIPTION_FIELDS, INSCRIPTION_MINIMAL_FIELDS, MODELS, PARENT_FIELDS, STUDENT_FIELDS, STUDENT_SUMMARY_FIELDS } from './constants';
import { normalizeInscription, normalizeRecord } from './normalizer';
import type { Inscription, Parent, Student } from './types';

/**
 * ⚡ CARGA OPTIMIZADA DE TODOS LOS ESTUDIANTES (SOLO RESUMEN)
 * Carga todos los estudiantes de una vez, pero solo datos esenciales para la lista.
 * NO carga padres ni inscripciones (se cargan on-demand).
 */
export const loadAllStudentsSummary = async (forceReload: boolean = false): Promise<Student[]> => {
  try {
    const cacheKey = CacheKeys.students();

    // 1️⃣ Intentar caché si no es forzado (SOLO si estamos offline o explícitamente se pide)
    // Nota: La lógica de "solo offline" se maneja en el hook, aquí permitimos leer si existe
    // para velocidad, pero el hook decidirá si usarlo o no.
    if (!forceReload) {
      const cached = cacheManager.get<Student[]>(cacheKey);
      if (cached && cached.length > 0) {
        if (__DEV__) {
          console.log(`📦 Caché HIT: ${cached.length} estudiantes (resumen)`);
        }
        return cached;
      }
    }

    if (__DEV__) {
      console.time('⏱️ loadAllStudentsSummary');
    }

    const domain = [['type_enrollment', '=', ENROLLMENT_TYPES.STUDENT]];

    // 2️⃣ Cargar TODOS los estudiantes (solo campos necesarios)
    // Usamos un limit alto (ej. 2000) para traer todos.
    const result = await odooApi.searchRead(
      MODELS.PARTNER,
      domain,
      STUDENT_SUMMARY_FIELDS, // ⚡ SOLO CAMPOS RESUMEN
      2000,
      0,
      'name asc' // Ordenar alfabéticamente
    );

    if (!result.success) {
      if (__DEV__) {
        console.error('Error cargando estudiantes:', result.error);
      }
      return [];
    }

    const records = result.data || [];
    const students = records.map(normalizeRecord);

    // 3️⃣ Guardar en caché
    cacheManager.set(cacheKey, students, 24 * 60 * 60 * 1000); // 24 horas (se actualiza al recargar)

    if (__DEV__) {
      console.timeEnd('⏱️ loadAllStudentsSummary');
      console.log(`✅ Cargados ${students.length} estudiantes (resumen)`);
    }

    return students;
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error en loadAllStudentsSummary:', error.message);
    }
    return [];
  }
};

/**
 * ⚡ CARGA DETALLES COMPLETOS DE UN ESTUDIANTE
 * Se usa al entrar a ver o editar. NO usa caché para garantizar datos frescos.
 */
export const loadStudentFullDetails = async (studentId: number): Promise<Student | null> => {
  try {
    const result = await odooApi.read(MODELS.PARTNER, [studentId], STUDENT_FIELDS);

    if (result.success && result.data && result.data.length > 0) {
      return normalizeRecord(result.data[0]);
    }
    return null;
  } catch (error) {
    console.error('Error loading full student details:', error);
    return null;
  }
};

/**
 * ⚡ CARGA OPTIMIZADA CON PAGINACIÓN Y BATCH PARALELO
 * @deprecated Usar loadAllStudentsSummary para la lista principal
 */
interface PaginatedResult {
  students: Student[];
  total: number;
  hasMore: boolean;
  currentPage: number;
}

export const loadStudentsPaginated = async (
  page: number = 1,
  pageSize: number = 10,
  forceReload: boolean = false
): Promise<PaginatedResult> => {
  // Mantener implementación legacy por si acaso, pero simplificada o redirigida si fuera necesario.
  // Por ahora dejamos la implementación original pero marcada como deprecated.
  try {
    const offset = (page - 1) * pageSize;
    const cacheKey = `${CacheKeys.students()}_page_${page}_size_${pageSize}`;

    if (!forceReload) {
      const cached = cacheManager.get<PaginatedResult>(cacheKey);
      if (cached) return cached;
    }

    const domain = [['type_enrollment', '=', ENROLLMENT_TYPES.STUDENT]];
    const [countResult, studentsResult] = await Promise.all([
      odooApi.searchCount(MODELS.PARTNER, domain),
      odooApi.searchRead(MODELS.PARTNER, domain, STUDENT_FIELDS, pageSize, offset, 'id desc')
    ]);

    if (!studentsResult.success || !countResult.success) {
      return { students: [], total: 0, hasMore: false, currentPage: page };
    }

    const students = (studentsResult.data || []).map(normalizeRecord);
    const total = countResult.data || 0;

    const result: PaginatedResult = {
      students,
      total,
      hasMore: offset + pageSize < total,
      currentPage: page,
    };

    cacheManager.set(cacheKey, result, 5 * 60 * 1000);
    return result;
  } catch (error) {
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
    // Usar caché local si ya tenemos todos los estudiantes cargados podría ser una opción,
    // pero aquí mantenemos la búsqueda en servidor.

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

    if (!result.success) return [];

    const students = (result.data || []).map(normalizeRecord);
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
 * ⚡ CARGA BATCH DE INSCRIPCIONES (datos completos)
 */
const batchLoadInscriptions = async (inscriptionIds: number[]): Promise<Inscription[]> => {
  if (inscriptionIds.length === 0) return [];

  const chunkSize = 50;
  const chunks: number[][] = [];

  for (let i = 0; i < inscriptionIds.length; i += chunkSize) {
    chunks.push(inscriptionIds.slice(i, i + chunkSize));
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

  return allInscriptions;
};

/**
 * ⚡ INVALIDAR CACHÉ
 */
export const invalidateStudentsPaginationCache = (): void => {
  cacheManager.invalidatePattern('students_'); // Invalida todo lo relacionado con estudiantes
  cacheManager.invalidatePattern('student:');

  if (__DEV__) {
    console.log('🗑️ Caché de estudiantes invalidado');
  }
};

/**
 * MANTENER RETROCOMPATIBILIDAD: loadStudents para código legacy
 */
export const loadStudents = async (): Promise<Student[]> => {
  return await loadAllStudentsSummary();
};

/**
 * Carga los padres de un estudiante específico (con caché)
 */
export const loadStudentParents = async (studentId: number, parentIds: number[]): Promise<Parent[]> => {
  try {
    if (!parentIds || parentIds.length === 0) {
      return [];
    }

    // Usar caché por ID de estudiante para agrupar
    const cacheKey = CacheKeys.studentParents(studentId);

    // Intentar leer caché primero
    const cached = cacheManager.get<Parent[]>(cacheKey);
    if (cached) return cached;

    // Si no está en caché, cargar
    const parents = await batchLoadParents(parentIds);

    // Guardar en caché
    if (parents.length > 0) {
      cacheManager.set(cacheKey, parents, 10 * 60 * 1000);
    }

    return parents;
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

    const cacheKey = CacheKeys.studentInscriptions(studentId);
    const cached = cacheManager.get<Inscription[]>(cacheKey);
    if (cached) return cached;

    const inscriptions = await batchLoadInscriptions(inscriptionIds);

    if (inscriptions.length > 0) {
      cacheManager.set(cacheKey, inscriptions, 10 * 60 * 1000);
    }

    return inscriptions;
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