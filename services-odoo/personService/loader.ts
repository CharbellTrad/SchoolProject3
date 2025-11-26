import * as odooApi from '../apiService';
import { CacheKeys, cacheManager } from '../cache/cacheManager';
import { ENROLLMENT_TYPES, INSCRIPTION_FIELDS, MODELS, PARENT_FIELDS, STUDENT_FIELDS, STUDENT_SUMMARY_FIELDS } from './constants';
import { normalizeInscription, normalizeRecord } from './normalizer';
import type { Inscription, Parent, Student } from './types';

/**
 * ⚡ CARGA OPTIMIZADA DE TODOS LOS ESTUDIANTES (SOLO RESUMEN)
 * - ONLINE: Siempre obtiene datos frescos del servidor (ignora caché)
 * - OFFLINE: Usa caché si está disponible
 * - NO USA CACHÉ EN MODO ONLINE
 */
export const loadAllStudentsSummary = async (forceReload: boolean = false): Promise<Student[]> => {
  try {
    const cacheKey = CacheKeys.students();

    // ❌ NUNCA usar caché si forceReload=true
    // ✅ Solo usar caché si explícitamente NO es forceReload
    // (El hook decidirá si es offline y debe usar caché)
    if (!forceReload) {
      const cached = cacheManager.get<Student[]>(cacheKey);
      if (cached && cached.length > 0) {
        if (__DEV__) {
          console.log(`📦 Usando caché: ${cached.length} estudiantes (modo offline)`);
        }
        return cached;
      }
    }

    if (__DEV__) {
      console.time('⏱️ loadAllStudentsSummary (servidor)');
    }

    const domain = [['type_enrollment', '=', ENROLLMENT_TYPES.STUDENT]];

    // 🌐 Cargar SIEMPRE desde el servidor cuando se llama con forceReload
    const result = await odooApi.searchRead(
      MODELS.PARTNER,
      domain,
      STUDENT_SUMMARY_FIELDS, // ⚡ SOLO CAMPOS RESUMEN
      2000,
      0,
      'name asc'
    );

    if (!result.success) {
      if (__DEV__) {
        console.error('❌ Error cargando estudiantes del servidor:', result.error);
      }
      
      // Si falla la petición, intentar caché como fallback
      const cached = cacheManager.get<Student[]>(cacheKey);
      if (cached && cached.length > 0) {
        if (__DEV__) {
          console.log(`📦 Usando caché por error de red: ${cached.length} estudiantes`);
        }
        return cached;
      }
      
      return [];
    }

    const records = result.data || [];
    const students = records.map(normalizeRecord);

    // 💾 Guardar en caché para modo offline
    cacheManager.set(cacheKey, students, 24 * 60 * 60 * 1000); // 24 horas

    if (__DEV__) {
      console.timeEnd('⏱️ loadAllStudentsSummary (servidor)');
      console.log(`✅ ${students.length} estudiantes cargados desde servidor`);
    }

    return students;
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en loadAllStudentsSummary:', error.message);
    }
    
    // En caso de error, intentar caché
    const cached = cacheManager.get<Student[]>(CacheKeys.students());
    if (cached && cached.length > 0) {
      if (__DEV__) {
        console.log(`📦 Usando caché por excepción: ${cached.length} estudiantes`);
      }
      return cached;
    }
    
    return [];
  }
};


/**
 * ⚡ OBTIENE CONTEOS DE ESTUDIANTES (sin datos)
 * - Usado para carga inicial rápida
 * - Retorna: { total: número total, activeCount: número de activos }
 */
export const getStudentsTotalCount = async (): Promise<{ total: number; activeCount: number }> => {
  try {
    if (__DEV__) {
      console.time('⏱️ getStudentsTotalCount');
    }

    const baseDomain = [['type_enrollment', '=', ENROLLMENT_TYPES.STUDENT]];
    const activeDomain = [...baseDomain, ['is_active', '=', true]];
    
    // 🌐 Obtener ambos conteos en paralelo
    const [totalResult, activeResult] = await Promise.all([
      odooApi.searchCount(MODELS.PARTNER, baseDomain),
      odooApi.searchCount(MODELS.PARTNER, activeDomain)
    ]);
    
    const total = totalResult.success ? (totalResult.data || 0) : 0;
    const activeCount = activeResult.success ? (activeResult.data || 0) : 0;

    if (__DEV__) {
      console.timeEnd('⏱️ getStudentsTotalCount');
      console.log(`📊 Total: ${total} estudiantes | Activos: ${activeCount}`);
    }

    return { total, activeCount };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error obteniendo conteos:', error);
    }
    return { total: 0, activeCount: 0 };
  }
};


/**
 * ⚡ CARGA ESTUDIANTES CON PAGINACIÓN
 * - ONLINE: Obtiene página específica desde servidor Y guarda en caché
 * - OFFLINE: Usa caché de página si existe
 * - Retorna: { students, total, page, pageSize }
 */
export const loadStudentsPaginated = async (
  page: number = 1,
  pageSize: number = 5,
  isOffline: boolean = false
): Promise<{ students: Student[]; total: number; page: number; pageSize: number }> => {
  try {
    const offset = (page - 1) * pageSize;
    const pageCacheKey = CacheKeys.studentsPage(page, pageSize);
    const metaCacheKey = CacheKeys.studentsPaginationMeta();

    // ✅ MODO OFFLINE: Intentar usar caché
    if (isOffline) {
      const cachedPage = cacheManager.get<Student[]>(pageCacheKey);
      const cachedMeta = cacheManager.get<{ total: number }>(metaCacheKey);

      if (cachedPage && cachedMeta) {
        if (__DEV__) {
          console.log(`📦 [OFFLINE] Página ${page} desde caché: ${cachedPage.length} estudiantes`);
        }
        return {
          students: cachedPage,
          total: cachedMeta.total,
          page,
          pageSize
        };
      } else {
        if (__DEV__) {
          console.log(`⚠️ [OFFLINE] No hay caché para página ${page}`);
        }
        return { students: [], total: 0, page, pageSize };
      }
    }

    // 🌐 MODO ONLINE: SIEMPRE cargar desde servidor
    if (__DEV__) {
      console.time(`⏱️ loadStudentsPaginated page:${page}`);
    }

    const domain = [['type_enrollment', '=', ENROLLMENT_TYPES.STUDENT]];

    // Obtener datos de la página y total en paralelo
    const [result, countResult] = await Promise.all([
      odooApi.searchRead(
        MODELS.PARTNER,
        domain,
        STUDENT_SUMMARY_FIELDS,
        pageSize,
        offset,
        'name asc'
      ),
      odooApi.searchCount(MODELS.PARTNER, domain)
    ]);

    const total = countResult.success ? (countResult.data || 0) : 0;

    if (!result.success) {
      if (__DEV__) {
        console.error('❌ Error cargando página:', result.error);
      }
      return { students: [], total: 0, page, pageSize };
    }

    const students = (result.data || []).map(normalizeRecord);

    // 💾 GUARDAR EN CACHÉ para uso offline futuro
    cacheManager.set(pageCacheKey, students, 24 * 60 * 60 * 1000); // 24 horas
    cacheManager.set(metaCacheKey, { total }, 24 * 60 * 60 * 1000);

    if (__DEV__) {
      console.timeEnd(`⏱️ loadStudentsPaginated page:${page}`);
      console.log(`✅ [ONLINE] Página ${page}: ${students.length}/${total} estudiantes (guardado en caché)`);
    }

    return { students, total, page, pageSize };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en loadStudentsPaginated:', error);
    }
    return { students: [], total: 0, page, pageSize };
  }
};

/**
 * 🔍 BÚSQUEDA GLOBAL PAGINADA (para cuando hay filtro de búsqueda)
 */
export const searchStudentsPaginated = async (
  query: string,
  page: number = 1,
  pageSize: number = 5
): Promise<{ students: Student[]; total: number; page: number; pageSize: number }> => {
  try {
    if (!query || query.trim().length < 2) {
      return loadStudentsPaginated(page, pageSize, false);
    }

    const offset = (page - 1) * pageSize;
    
    const domain = [
      ['type_enrollment', '=', ENROLLMENT_TYPES.STUDENT],
      '|',
      ['name', 'ilike', query],
      ['vat', 'ilike', query]
    ];

    // Obtener total de coincidencias
    const countResult = await odooApi.searchCount(MODELS.PARTNER, domain);
    const total = countResult.success ? (countResult.data || 0) : 0;

    // Obtener página actual de resultados
    const result = await odooApi.searchRead(
      MODELS.PARTNER,
      domain,
      STUDENT_SUMMARY_FIELDS,
      pageSize,
      offset,
      'name asc'
    );

    if (!result.success) {
      return { students: [], total: 0, page, pageSize };
    }

    const students = (result.data || []).map(normalizeRecord);

    return { students, total, page, pageSize };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en searchStudentsPaginated:', error);
    }
    return { students: [], total: 0, page, pageSize };
  }
};


/**
 * ⚡ CARGA DETALLES COMPLETOS DE UN ESTUDIANTE
 * - Se usa al VER o EDITAR
 * - SIEMPRE obtiene datos FRESCOS del servidor (NO USA CACHÉ)
 * - Incluye TODOS los campos del estudiante
 */
export const loadStudentFullDetails = async (studentId: number): Promise<Student | null> => {
  try {
    if (__DEV__) {
      console.time(`⏱️ loadStudentFullDetails:${studentId}`);
    }

    // 🌐 SIEMPRE cargar desde servidor (sin caché)
    const result = await odooApi.read(MODELS.PARTNER, [studentId], STUDENT_FIELDS);

    if (__DEV__) {
      console.timeEnd(`⏱️ loadStudentFullDetails:${studentId}`);
    }

    if (result.success && result.data && result.data.length > 0) {
      if (__DEV__) {
        console.log(`✅ Detalles completos del estudiante ${studentId} cargados`);
      }
      return normalizeRecord(result.data[0]);
    }
    
    return null;
  } catch (error) {
    if (__DEV__) {
      console.error(`❌ Error cargando detalles del estudiante ${studentId}:`, error);
    }
    return null;
  }
};

/**
 * 🔍 BÚSQUEDA GLOBAL (sin limitaciones de paginación)
 * Busca en TODOS los estudiantes
 */
export const searchStudentsGlobal = async (
  query: string,
  limit: number = 50
): Promise<Student[]> => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

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
      console.error('❌ Error en searchStudentsGlobal:', error.message);
    }
    return [];
  }
};

/**
 * ⚡ CARGA BATCH DE PADRES
 * - SIEMPRE desde servidor (datos frescos)
 * - NO USA CACHÉ
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
 * ⚡ CARGA BATCH DE INSCRIPCIONES
 * - SIEMPRE desde servidor (datos frescos)
 * - NO USA CACHÉ
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
 * 🗑️ INVALIDAR CACHÉ
 */
export const invalidateStudentsPaginationCache = (): void => {
  cacheManager.invalidatePattern('students:page');
  cacheManager.invalidatePattern('students:pagination');
  cacheManager.invalidatePattern('student:');

  if (__DEV__) {
    console.log('🗑️ Caché de paginación invalidado');
  }
};
/**
 * Carga los padres de un estudiante específico
 * - SIEMPRE desde servidor (NO USA CACHÉ)
 */
export const loadStudentParents = async (studentId: number, parentIds: number[]): Promise<Parent[]> => {
  try {
    if (!parentIds || parentIds.length === 0) {
      return [];
    }

    if (__DEV__) {
      console.time(`⏱️ loadStudentParents:${studentId}`);
    }

    // 🌐 SIEMPRE desde servidor
    const parents = await batchLoadParents(parentIds);

    if (__DEV__) {
      console.timeEnd(`⏱️ loadStudentParents:${studentId}`);
      console.log(`✅ ${parents.length} padres cargados para estudiante ${studentId}`);
    }

    return parents;
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error cargando padres del estudiante:', error);
    }
    return [];
  }
};

/**
 * Carga las inscripciones de un estudiante específico
 * - SIEMPRE desde servidor (NO USA CACHÉ)
 */
export const loadStudentInscriptions = async (studentId: number, inscriptionIds: number[]): Promise<Inscription[]> => {
  try {
    if (!inscriptionIds || inscriptionIds.length === 0) {
      return [];
    }

    if (__DEV__) {
      console.time(`⏱️ loadStudentInscriptions:${studentId}`);
    }

    // 🌐 SIEMPRE desde servidor
    const inscriptions = await batchLoadInscriptions(inscriptionIds);

    if (__DEV__) {
      console.timeEnd(`⏱️ loadStudentInscriptions:${studentId}`);
      console.log(`✅ ${inscriptions.length} inscripciones cargadas para estudiante ${studentId}`);
    }

    return inscriptions;
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error cargando inscripciones del estudiante:', error);
    }
    return [];
  }
};

/**
 * RETROCOMPATIBILIDAD: loadStudents
 */


export const loadStudents = async (): Promise<Student[]> => {
  return await loadAllStudentsSummary(true); // Siempre forzar recarga
};
