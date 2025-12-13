/**
 * Funciones de carga y lectura de profesores asignados
 * Operaciones Diarias - school.professor
 */

import * as odooApi from '../apiService';
import { cacheManager } from '../cache/cacheManager';
import { PROFESSOR_FIELDS, PROFESSOR_MODEL } from './constants';
import { normalizeProfessor, normalizeProfessors } from './normalizer';
import { Professor } from './types';

const CACHE_KEYS = {
    CURRENT: 'professors_current',
    ALL: 'professors_all',
};

const CACHE_TTL = {
    PROFESSORS: 5 * 60 * 1000, // 5 minutos
};

/**
 * Carga profesores asignados del año actual (current=True)
 */
export const loadCurrentProfessors = async (
    forceReload: boolean = false
): Promise<Professor[]> => {
    try {
        const cacheKey = CACHE_KEYS.CURRENT;

        if (!forceReload) {
            const cached = cacheManager.get<Professor[]>(cacheKey);
            if (cached && cached.length > 0) {
                if (__DEV__) {
                    console.log(`📦 Usando caché: ${cached.length} profesores actuales`);
                }
                return cached;
            }
        }

        if (__DEV__) {
            console.time('⏱️ loadCurrentProfessors');
        }

        const result = await odooApi.searchRead(
            PROFESSOR_MODEL,
            [['current', '=', true]],
            PROFESSOR_FIELDS,
            1000,
            0,
            'name asc'
        );

        if (!result.success) {
            if (__DEV__) {
                console.error('❌ Error cargando profesores:', result.error);
            }
            const cached = cacheManager.get<Professor[]>(cacheKey);
            return cached || [];
        }

        const professors = normalizeProfessors(result.data || []);
        cacheManager.set(cacheKey, professors, CACHE_TTL.PROFESSORS);

        if (__DEV__) {
            console.timeEnd('⏱️ loadCurrentProfessors');
            console.log(`✅ ${professors.length} profesores actuales cargados`);
        }

        return professors;
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en loadCurrentProfessors:', error);
        }
        return cacheManager.get<Professor[]>(CACHE_KEYS.CURRENT) || [];
    }
};

/**
 * Carga todos los profesores asignados (todos los años)
 */
export const loadAllProfessors = async (
    forceReload: boolean = false
): Promise<Professor[]> => {
    try {
        const cacheKey = CACHE_KEYS.ALL;

        if (!forceReload) {
            const cached = cacheManager.get<Professor[]>(cacheKey);
            if (cached && cached.length > 0) {
                return cached;
            }
        }

        const result = await odooApi.searchRead(
            PROFESSOR_MODEL,
            [],
            PROFESSOR_FIELDS,
            1000,
            0,
            'year_id desc, name asc'
        );

        if (!result.success) {
            return cacheManager.get<Professor[]>(cacheKey) || [];
        }

        const professors = normalizeProfessors(result.data || []);
        cacheManager.set(cacheKey, professors, CACHE_TTL.PROFESSORS);

        return professors;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadAllProfessors:', error);
        }
        return [];
    }
};

/**
 * Carga un profesor asignado por ID
 */
export const loadProfessorById = async (
    id: number
): Promise<Professor | null> => {
    try {
        const result = await odooApi.read(
            PROFESSOR_MODEL,
            [id],
            PROFESSOR_FIELDS
        );

        if (!result.success || !result.data || result.data.length === 0) {
            return null;
        }

        return normalizeProfessor(result.data[0]);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadProfessorById:', error);
        }
        return null;
    }
};

/**
 * Busca profesores asignados por nombre
 */
export const searchProfessors = async (
    query: string,
    currentOnly: boolean = true
): Promise<Professor[]> => {
    try {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const domain: any[] = [['name', 'ilike', query]];
        if (currentOnly) {
            domain.push(['current', '=', true]);
        }

        const result = await odooApi.searchRead(
            PROFESSOR_MODEL,
            domain,
            PROFESSOR_FIELDS,
            50,
            0,
            'name asc'
        );

        if (!result.success) return [];

        return normalizeProfessors(result.data || []);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en searchProfessors:', error);
        }
        return [];
    }
};

/**
 * Obtiene conteo de profesores actuales
 */
export const getCurrentProfessorsCount = async (): Promise<number> => {
    try {
        const result = await odooApi.searchCount(PROFESSOR_MODEL, [['current', '=', true]]);
        return result.success ? (result.data || 0) : 0;
    } catch (error) {
        return 0;
    }
};

/**
 * Invalida el caché de profesores
 */
export const invalidateProfessorsCache = (): void => {
    cacheManager.invalidate(CACHE_KEYS.CURRENT);
    cacheManager.invalidate(CACHE_KEYS.ALL);
};
