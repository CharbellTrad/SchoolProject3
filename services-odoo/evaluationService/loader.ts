/**
 * Funciones de carga y lectura de evaluaciones
 * Operaciones Diarias - school.evaluation
 */

import * as odooApi from '../apiService';
import { cacheManager } from '../cache/cacheManager';
import { EVALUATION_FIELDS, EVALUATION_MODEL } from './constants';
import { normalizeEvaluation, normalizeEvaluations } from './normalizer';
import { Evaluation, EvaluationFilters } from './types';

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
