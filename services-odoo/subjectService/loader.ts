/**
 * Funciones de carga y lectura de materias
 */

import * as odooApi from '../apiService';
import { cacheManager } from '../cache/cacheManager';
import {
    CACHE_KEYS,
    CACHE_TTL,
    MODELS,
    PROFESSOR_FIELDS,
    SECTION_FIELDS,
    SUBJECT_FIELDS,
} from './constants';
import {
    normalizeProfessors,
    normalizeSections,
    normalizeSubject,
    normalizeSubjects,
} from './normalizer';
import { Professor, Section, Subject, SubjectWithDetails } from './types';

/**
 * ⚡ Carga todas las materias (con caché)
 * - ONLINE: Obtiene desde servidor y guarda en caché
 * - OFFLINE: Usa caché si existe
 */
export const loadSubjects = async (forceReload: boolean = false): Promise<Subject[]> => {
  try {
    const cacheKey = CACHE_KEYS.ALL;

    // Solo usar caché si no es reload forzado
    if (!forceReload) {
      const cached = cacheManager.get<Subject[]>(cacheKey);
      if (cached && cached.length > 0) {
        if (__DEV__) {
          console.log(`📦 Usando caché: ${cached.length} materias`);
        }
        return cached;
      }
    }

    if (__DEV__) {
      console.time('⏱️ loadSubjects');
    }

    const result = await odooApi.searchRead(
      MODELS.SUBJECT,
      [],
      SUBJECT_FIELDS,
      1000,
      0,
      'name asc'
    );

    if (!result.success) {
      if (__DEV__) {
        console.error('❌ Error cargando materias:', result.error);
      }

      // Fallback a caché en caso de error
      const cached = cacheManager.get<Subject[]>(cacheKey);
      if (cached) {
        if (__DEV__) {
          console.log(`📦 Usando caché por error: ${cached.length} materias`);
        }
        return cached;
      }

      return [];
    }

    const subjects = normalizeSubjects(result.data || []);

    // Guardar en caché
    cacheManager.set(cacheKey, subjects, CACHE_TTL.SUBJECTS);

    if (__DEV__) {
      console.timeEnd('⏱️ loadSubjects');
      console.log(`✅ ${subjects.length} materias cargadas`);
    }

    return subjects;
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en loadSubjects:', error);
    }

    // Fallback a caché
    const cached = cacheManager.get<Subject[]>(CACHE_KEYS.ALL);
    return cached || [];
  }
};

/**
 * Carga una materia específica por ID con detalles completos
 */
export const loadSubjectById = async (
  id: number,
  forceReload: boolean = false
): Promise<SubjectWithDetails | null> => {
  try {
    const cacheKey = CACHE_KEYS.BY_ID(id);

    if (!forceReload) {
      const cached = cacheManager.get<SubjectWithDetails>(cacheKey);
      if (cached) {
        if (__DEV__) {
          console.log(`📦 Usando caché: materia ${id}`);
        }
        return cached;
      }
    }

    // Leer la materia
    const subjectResult = await odooApi.read(MODELS.SUBJECT, [id], SUBJECT_FIELDS);

    if (!subjectResult.success || !subjectResult.data || subjectResult.data.length === 0) {
      return null;
    }

    const subject = normalizeSubject(subjectResult.data[0]);

    // Cargar detalles de secciones y profesores
    const [sections, professors] = await Promise.all([
      loadSectionsByIds(subject.section_ids),
      loadProfessorsByIds(subject.professor_ids),
    ]);

    const subjectWithDetails: SubjectWithDetails = {
      ...subject,
      sections,
      professors,
    };

    // Guardar en caché
    cacheManager.set(cacheKey, subjectWithDetails, CACHE_TTL.SUBJECTS);

    return subjectWithDetails;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error en loadSubjectById:', error);
    }
    return null;
  }
};

/**
 * Busca materias por nombre
 */
export const searchSubjects = async (query: string): Promise<Subject[]> => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const domain = [['name', 'ilike', query]];

    const result = await odooApi.searchRead(
      MODELS.SUBJECT,
      domain,
      SUBJECT_FIELDS,
      50,
      0,
      'name asc'
    );

    if (!result.success) return [];

    return normalizeSubjects(result.data || []);
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error en searchSubjects:', error);
    }
    return [];
  }
};

/**
 * Obtiene el conteo total de materias
 */
export const getSubjectsCount = async (): Promise<number> => {
  try {
    const result = await odooApi.searchCount(MODELS.SUBJECT, []);
    return result.success ? (result.data || 0) : 0;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error obteniendo conteo de materias:', error);
    }
    return 0;
  }
};

/**
 * ⚡ Carga secciones de tipo "secundary" (con caché)
 * Solo estas secciones pueden tener materias asignadas
 */
export const loadSecundarySections = async (
  forceReload: boolean = false
): Promise<Section[]> => {
  try {
    const cacheKey = CACHE_KEYS.SECTIONS_SECUNDARY;

    if (!forceReload) {
      const cached = cacheManager.get<Section[]>(cacheKey);
      if (cached && cached.length > 0) {
        if (__DEV__) {
          console.log(`📦 Usando caché: ${cached.length} secciones secundarias`);
        }
        return cached;
      }
    }

    const result = await odooApi.searchRead(
      MODELS.SECTION,
      [['type', '=', 'secundary']],
      SECTION_FIELDS,
      1000,
      0,
      'name asc'
    );

    if (!result.success) {
      const cached = cacheManager.get<Section[]>(cacheKey);
      return cached || [];
    }

    const sections = normalizeSections(result.data || []);
    cacheManager.set(cacheKey, sections, CACHE_TTL.SECTIONS);

    if (__DEV__) {
      console.log(`✅ ${sections.length} secciones secundarias cargadas`);
    }

    return sections;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error en loadSecundarySections:', error);
    }
    const cached = cacheManager.get<Section[]>(CACHE_KEYS.SECTIONS_SECUNDARY);
    return cached || [];
  }
};

/**
 * ⚡ Carga profesores activos de tipo "docente" (con caché)
 */
export const loadActiveProfessors = async (
  forceReload: boolean = false
): Promise<Professor[]> => {
  try {
    const cacheKey = CACHE_KEYS.PROFESSORS_ACTIVE;

    if (!forceReload) {
      const cached = cacheManager.get<Professor[]>(cacheKey);
      if (cached && cached.length > 0) {
        if (__DEV__) {
          console.log(`📦 Usando caché: ${cached.length} profesores`);
        }
        return cached;
      }
    }

    const result = await odooApi.searchRead(
      MODELS.PROFESSOR,
      [
        ['school_employee_type', '=', 'docente'],
        ['active', '=', true],
      ],
      PROFESSOR_FIELDS,
      1000,
      0,
      'name asc'
    );

    if (!result.success) {
      const cached = cacheManager.get<Professor[]>(cacheKey);
      return cached || [];
    }

    const professors = normalizeProfessors(result.data || []);
    cacheManager.set(cacheKey, professors, CACHE_TTL.PROFESSORS);

    if (__DEV__) {
      console.log(`✅ ${professors.length} profesores cargados`);
    }

    return professors;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error en loadActiveProfessors:', error);
    }
    const cached = cacheManager.get<Professor[]>(CACHE_KEYS.PROFESSORS_ACTIVE);
    return cached || [];
  }
};

/**
 * Carga secciones específicas por sus IDs
 */
const loadSectionsByIds = async (ids: number[]): Promise<Section[]> => {
  if (ids.length === 0) return [];

  try {
    const result = await odooApi.read(MODELS.SECTION, ids, SECTION_FIELDS);
    if (!result.success) return [];
    return normalizeSections(result.data || []);
  } catch (error) {
    return [];
  }
};

/**
 * Carga profesores específicos por sus IDs
 */
const loadProfessorsByIds = async (ids: number[]): Promise<Professor[]> => {
  if (ids.length === 0) return [];

  try {
    const result = await odooApi.read(MODELS.PROFESSOR, ids, PROFESSOR_FIELDS);
    if (!result.success) return [];
    return normalizeProfessors(result.data || []);
  } catch (error) {
    return [];
  }
};