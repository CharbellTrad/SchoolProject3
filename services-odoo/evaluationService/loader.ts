/**
 * Funciones de carga y lectura de evaluaciones
 * Operaciones Diarias - school.evaluation y school.evaluation.score
 */

import * as odooApi from '../apiService';
import { cacheManager } from '../cache/cacheManager';
import { EVALUATION_FIELDS, EVALUATION_MODEL, EVALUATION_SCORE_FIELDS, EVALUATION_SCORE_MODEL } from './constants';
import { normalizeEvaluation, normalizeEvaluations, normalizeEvaluationScores } from './normalizer';
import { Evaluation, EvaluationFilters, EvaluationScore, SelectOption } from './types';

const CACHE_KEYS = {
    CURRENT: 'evaluations_current',
    ALL: 'evaluations_all',
};

const CACHE_TTL = {
    EVALUATIONS: 3 * 60 * 1000, // 3 minutos (más frecuente que otros)
};

/**
 * Carga evaluaciones del año actual (current=True)
 */
export const loadCurrentEvaluations = async (
    forceReload: boolean = false
): Promise<Evaluation[]> => {
    try {
        const cacheKey = CACHE_KEYS.CURRENT;

        if (!forceReload) {
            const cached = cacheManager.get<Evaluation[]>(cacheKey);
            if (cached && cached.length > 0) {
                if (__DEV__) {
                    console.log(`📦 Usando caché: ${cached.length} evaluaciones actuales`);
                }
                return cached;
            }
        }

        if (__DEV__) {
            console.time('⏱️ loadCurrentEvaluations');
        }

        const result = await odooApi.searchRead(
            EVALUATION_MODEL,
            [['current', '=', true]],
            EVALUATION_FIELDS,
            1000,
            0,
            'evaluation_date desc, name asc'
        );

        if (!result.success) {
            if (__DEV__) {
                console.error('❌ Error cargando evaluaciones:', result.error);
            }
            const cached = cacheManager.get<Evaluation[]>(cacheKey);
            return cached || [];
        }

        const evaluations = normalizeEvaluations(result.data || []);
        cacheManager.set(cacheKey, evaluations, CACHE_TTL.EVALUATIONS);

        if (__DEV__) {
            console.timeEnd('⏱️ loadCurrentEvaluations');
            console.log(`✅ ${evaluations.length} evaluaciones actuales cargadas`);
        }

        return evaluations;
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en loadCurrentEvaluations:', error);
        }
        return cacheManager.get<Evaluation[]>(CACHE_KEYS.CURRENT) || [];
    }
};

/**
 * Carga evaluaciones filtradas
 */
export const loadEvaluations = async (
    filters: EvaluationFilters = {},
    forceReload: boolean = false
): Promise<Evaluation[]> => {
    try {
        const domain: any[] = [];

        if (filters.current !== undefined) {
            domain.push(['current', '=', filters.current]);
        }
        if (filters.yearId) {
            domain.push(['year_id', '=', filters.yearId]);
        }
        if (filters.professorId) {
            domain.push(['professor_id', '=', filters.professorId]);
        }
        if (filters.sectionId) {
            domain.push(['section_id', '=', filters.sectionId]);
        }
        if (filters.subjectId) {
            domain.push(['subject_id', '=', filters.subjectId]);
        }
        if (filters.type) {
            domain.push(['type', '=', filters.type]);
        }
        if (filters.state) {
            domain.push(['state', '=', filters.state]);
        }

        const result = await odooApi.searchRead(
            EVALUATION_MODEL,
            domain,
            EVALUATION_FIELDS,
            1000,
            0,
            'evaluation_date desc, name asc'
        );

        if (!result.success) {
            return [];
        }

        return normalizeEvaluations(result.data || []);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadEvaluations:', error);
        }
        return [];
    }
};

/**
 * Carga todas las evaluaciones (todos los años)
 */
export const loadAllEvaluations = async (
    forceReload: boolean = false
): Promise<Evaluation[]> => {
    try {
        const cacheKey = CACHE_KEYS.ALL;

        if (!forceReload) {
            const cached = cacheManager.get<Evaluation[]>(cacheKey);
            if (cached && cached.length > 0) {
                return cached;
            }
        }

        const result = await odooApi.searchRead(
            EVALUATION_MODEL,
            [],
            EVALUATION_FIELDS,
            5000,
            0,
            'year_id desc, evaluation_date desc'
        );

        if (!result.success) {
            return cacheManager.get<Evaluation[]>(cacheKey) || [];
        }

        const evaluations = normalizeEvaluations(result.data || []);
        cacheManager.set(cacheKey, evaluations, CACHE_TTL.EVALUATIONS);

        return evaluations;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadAllEvaluations:', error);
        }
        return [];
    }
};

/**
 * Carga una evaluación por ID
 */
export const loadEvaluationById = async (
    id: number
): Promise<Evaluation | null> => {
    try {
        const result = await odooApi.read(
            EVALUATION_MODEL,
            [id],
            EVALUATION_FIELDS
        );

        if (!result.success || !result.data || result.data.length === 0) {
            return null;
        }

        return normalizeEvaluation(result.data[0]);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadEvaluationById:', error);
        }
        return null;
    }
};

/**
 * Busca evaluaciones por nombre
 */
export const searchEvaluations = async (
    query: string,
    currentOnly: boolean = true
): Promise<Evaluation[]> => {
    try {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const domain: any[] = [['name', 'ilike', query]];
        if (currentOnly) {
            domain.push(['current', '=', true]);
        }

        const result = await odooApi.searchRead(
            EVALUATION_MODEL,
            domain,
            EVALUATION_FIELDS,
            50,
            0,
            'evaluation_date desc'
        );

        if (!result.success) return [];

        return normalizeEvaluations(result.data || []);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en searchEvaluations:', error);
        }
        return [];
    }
};

/**
 * Obtiene conteos de evaluaciones por estado (año actual)
 */
export const getCurrentEvaluationsCountByState = async (): Promise<{
    all: number;
    partial: number;
    draft: number;
    total: number;
}> => {
    try {
        const [allCount, partialCount, draftCount] = await Promise.all([
            odooApi.searchCount(EVALUATION_MODEL, [['state', '=', 'all'], ['current', '=', true]]),
            odooApi.searchCount(EVALUATION_MODEL, [['state', '=', 'partial'], ['current', '=', true]]),
            odooApi.searchCount(EVALUATION_MODEL, [['state', '=', 'draft'], ['current', '=', true]]),
        ]);

        const all = allCount.success ? (allCount.data || 0) : 0;
        const partial = partialCount.success ? (partialCount.data || 0) : 0;
        const draft = draftCount.success ? (draftCount.data || 0) : 0;

        return {
            all,
            partial,
            draft,
            total: all + partial + draft,
        };
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error obteniendo conteos:', error);
        }
        return { all: 0, partial: 0, draft: 0, total: 0 };
    }
};

/**
 * Invalida el caché de evaluaciones
 */
export const invalidateEvaluationsCache = (): void => {
    cacheManager.invalidate(CACHE_KEYS.CURRENT);
    cacheManager.invalidate(CACHE_KEYS.ALL);
};

// =====================================================
// FUNCIONES PARA CALIFICACIONES (school.evaluation.score)
// =====================================================

/**
 * Carga las calificaciones de una evaluación específica
 */
export const loadEvaluationScores = async (
    evaluationId: number
): Promise<EvaluationScore[]> => {
    try {
        if (__DEV__) {
            console.time(`⏱️ loadEvaluationScores #${evaluationId}`);
        }

        const result = await odooApi.searchRead(
            EVALUATION_SCORE_MODEL,
            [['evaluation_id', '=', evaluationId]],
            EVALUATION_SCORE_FIELDS,
            500,
            0,
            'student_id asc'
        );

        if (!result.success) {
            if (__DEV__) {
                console.error('❌ Error cargando calificaciones:', result.error);
            }
            return [];
        }

        const scores = normalizeEvaluationScores(result.data || []);

        if (__DEV__) {
            console.timeEnd(`⏱️ loadEvaluationScores #${evaluationId}`);
            console.log(`✅ ${scores.length} calificaciones cargadas`);
        }

        return scores;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadEvaluationScores:', error);
        }
        return [];
    }
};

/**
 * Carga una calificación por ID
 */
export const loadEvaluationScoreById = async (
    id: number
): Promise<EvaluationScore | null> => {
    try {
        const result = await odooApi.read(
            EVALUATION_SCORE_MODEL,
            [id],
            EVALUATION_SCORE_FIELDS
        );

        if (!result.success || !result.data || result.data.length === 0) {
            return null;
        }

        const scores = normalizeEvaluationScores(result.data);
        return scores[0] || null;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadEvaluationScoreById:', error);
        }
        return null;
    }
};

// =====================================================
// FUNCIONES PARA FORMULARIO DE EVALUACIÓN (CASCADA)
// =====================================================

const PROFESSOR_MODEL = 'school.professor';
const SECTION_MODEL = 'school.section';
const SUBJECT_MODEL = 'school.subject';

/**
 * Carga profesores del año actual para el selector
 */
export const loadProfessorsForYear = async (): Promise<SelectOption[]> => {
    try {
        const result = await odooApi.searchRead(
            PROFESSOR_MODEL,
            [['current', '=', true]],
            ['id', 'name', 'professor_id'],
            500,
            0,
            'name asc'
        );

        if (!result.success) {
            return [];
        }

        return (result.data || []).map((record: any) => ({
            id: record.id,
            name: record.name || (Array.isArray(record.professor_id) ? record.professor_id[1] : ''),
        }));
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadProfessorsForYear:', error);
        }
        return [];
    }
};

/**
 * Carga secciones disponibles para un profesor
 * Incluye secciones donde está asignado directamente y donde tiene materias
 */
export const loadSectionsForProfessor = async (professorId: number): Promise<SelectOption[]> => {
    try {
        // Buscar secciones donde el profesor está asignado directamente (pre/primary)
        const directResult = await odooApi.searchRead(
            SECTION_MODEL,
            [
                ['professor_ids', 'in', [professorId]],
                ['current', '=', true],
            ],
            ['id', 'name'],
            500,
            0,
            'name asc'
        );

        // Buscar secciones donde el profesor tiene materias (secundary)
        const subjectResult = await odooApi.searchRead(
            SUBJECT_MODEL,
            [
                ['professor_id', '=', professorId],
            ],
            ['id', 'section_id'],
            500,
            0
        );

        // Combinar resultados únicos
        const sectionsMap = new Map<number, SelectOption>();

        if (directResult.success && directResult.data) {
            for (const record of directResult.data) {
                sectionsMap.set(record.id, { id: record.id, name: record.name || '' });
            }
        }

        if (subjectResult.success && subjectResult.data) {
            for (const record of subjectResult.data) {
                if (Array.isArray(record.section_id) && record.section_id.length >= 2) {
                    const sectionId = record.section_id[0];
                    const sectionName = record.section_id[1];
                    if (!sectionsMap.has(sectionId)) {
                        sectionsMap.set(sectionId, { id: sectionId, name: sectionName });
                    }
                }
            }
        }

        return Array.from(sectionsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadSectionsForProfessor:', error);
        }
        return [];
    }
};

/**
 * Carga materias disponibles para un profesor en una sección
 */
export const loadSubjectsForProfessorAndSection = async (
    professorId: number,
    sectionId: number
): Promise<SelectOption[]> => {
    try {
        const result = await odooApi.searchRead(
            SUBJECT_MODEL,
            [
                ['professor_id', '=', professorId],
                ['section_id', '=', sectionId],
            ],
            ['id', 'name', 'subject_id'],
            100,
            0,
            'name asc'
        );

        if (!result.success) {
            return [];
        }

        return (result.data || []).map((record: any) => {
            let name = record.name || '';
            // Si tiene subject_id (referencia al catálogo), usar ese nombre
            if (Array.isArray(record.subject_id) && record.subject_id.length >= 2) {
                name = record.subject_id[1];
            }
            return { id: record.id, name };
        });
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadSubjectsForProfessorAndSection:', error);
        }
        return [];
    }
};

/**
 * Verifica si una sección es de tipo secundary (tiene materias)
 */
export const getSectionType = async (sectionId: number): Promise<'pre' | 'primary' | 'secundary' | null> => {
    try {
        const result = await odooApi.read(
            SECTION_MODEL,
            [sectionId],
            ['type']
        );

        if (!result.success || !result.data || result.data.length === 0) {
            return null;
        }

        return result.data[0].type || null;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en getSectionType:', error);
        }
        return null;
    }
};

