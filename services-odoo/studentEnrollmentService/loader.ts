/**
 * Funciones de carga y lectura de inscripciones de estudiantes
 * Operaciones Diarias - school.student
 */

import * as odooApi from '../apiService';
import { cacheManager } from '../cache/cacheManager';
import { STUDENT_ENROLLMENT_FIELDS, STUDENT_ENROLLMENT_MODEL } from './constants';
import { normalizeStudentEnrollment, normalizeStudentEnrollments } from './normalizer';
import { StudentEnrollment, StudentEnrollmentFilters } from './types';

const CACHE_KEYS = {
    CURRENT: 'student_enrollments_current',
    ALL: 'student_enrollments_all',
    BY_SECTION: (sectionId: number) => `student_enrollments_section_${sectionId}`,
};

const CACHE_TTL = {
    ENROLLMENTS: 5 * 60 * 1000, // 5 minutos
};

/**
 * Carga inscripciones del año actual (current=True)
 */
export const loadCurrentStudentEnrollments = async (
    forceReload: boolean = false
): Promise<StudentEnrollment[]> => {
    try {
        const cacheKey = CACHE_KEYS.CURRENT;

        if (!forceReload) {
            const cached = cacheManager.get<StudentEnrollment[]>(cacheKey);
            if (cached && cached.length > 0) {
                if (__DEV__) {
                    console.log(`📦 Usando caché: ${cached.length} inscripciones actuales`);
                }
                return cached;
            }
        }

        if (__DEV__) {
            console.time('⏱️ loadCurrentStudentEnrollments');
        }

        const result = await odooApi.searchRead(
            STUDENT_ENROLLMENT_MODEL,
            [['current', '=', true]],
            STUDENT_ENROLLMENT_FIELDS,
            1000,
            0,
            'section_id asc, name asc'
        );

        if (!result.success) {
            if (__DEV__) {
                console.error('❌ Error cargando inscripciones:', result.error);
            }
            const cached = cacheManager.get<StudentEnrollment[]>(cacheKey);
            return cached || [];
        }

        const enrollments = normalizeStudentEnrollments(result.data || []);
        cacheManager.set(cacheKey, enrollments, CACHE_TTL.ENROLLMENTS);

        if (__DEV__) {
            console.timeEnd('⏱️ loadCurrentStudentEnrollments');
            console.log(`✅ ${enrollments.length} inscripciones actuales cargadas`);
        }

        return enrollments;
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en loadCurrentStudentEnrollments:', error);
        }
        return cacheManager.get<StudentEnrollment[]>(CACHE_KEYS.CURRENT) || [];
    }
};

/**
 * Carga inscripciones filtradas (con opciones)
 */
export const loadStudentEnrollments = async (
    filters: StudentEnrollmentFilters = {},
    forceReload: boolean = false
): Promise<StudentEnrollment[]> => {
    try {
        const domain: any[] = [];

        if (filters.current !== undefined) {
            domain.push(['current', '=', filters.current]);
        }
        if (filters.yearId) {
            domain.push(['year_id', '=', filters.yearId]);
        }
        if (filters.sectionId) {
            domain.push(['section_id', '=', filters.sectionId]);
        }
        if (filters.type) {
            domain.push(['type', '=', filters.type]);
        }
        if (filters.state) {
            domain.push(['state', '=', filters.state]);
        }

        const result = await odooApi.searchRead(
            STUDENT_ENROLLMENT_MODEL,
            domain,
            STUDENT_ENROLLMENT_FIELDS,
            1000,
            0,
            'section_id asc, name asc'
        );

        if (!result.success) {
            return [];
        }

        return normalizeStudentEnrollments(result.data || []);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadStudentEnrollments:', error);
        }
        return [];
    }
};

/**
 * Carga todas las inscripciones (todos los años)
 */
export const loadAllStudentEnrollments = async (
    forceReload: boolean = false
): Promise<StudentEnrollment[]> => {
    try {
        const cacheKey = CACHE_KEYS.ALL;

        if (!forceReload) {
            const cached = cacheManager.get<StudentEnrollment[]>(cacheKey);
            if (cached && cached.length > 0) {
                return cached;
            }
        }

        const result = await odooApi.searchRead(
            STUDENT_ENROLLMENT_MODEL,
            [],
            STUDENT_ENROLLMENT_FIELDS,
            5000,
            0,
            'year_id desc, section_id asc, name asc'
        );

        if (!result.success) {
            return cacheManager.get<StudentEnrollment[]>(cacheKey) || [];
        }

        const enrollments = normalizeStudentEnrollments(result.data || []);
        cacheManager.set(cacheKey, enrollments, CACHE_TTL.ENROLLMENTS);

        return enrollments;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadAllStudentEnrollments:', error);
        }
        return [];
    }
};

/**
 * Carga una inscripción por ID
 */
export const loadStudentEnrollmentById = async (
    id: number
): Promise<StudentEnrollment | null> => {
    try {
        const result = await odooApi.read(
            STUDENT_ENROLLMENT_MODEL,
            [id],
            STUDENT_ENROLLMENT_FIELDS
        );

        if (!result.success || !result.data || result.data.length === 0) {
            return null;
        }

        return normalizeStudentEnrollment(result.data[0]);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadStudentEnrollmentById:', error);
        }
        return null;
    }
};

/**
 * Busca inscripciones por nombre de estudiante
 */
export const searchStudentEnrollments = async (
    query: string,
    currentOnly: boolean = true
): Promise<StudentEnrollment[]> => {
    try {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const domain: any[] = [['name', 'ilike', query]];
        if (currentOnly) {
            domain.push(['current', '=', true]);
        }

        const result = await odooApi.searchRead(
            STUDENT_ENROLLMENT_MODEL,
            domain,
            STUDENT_ENROLLMENT_FIELDS,
            50,
            0,
            'name asc'
        );

        if (!result.success) return [];

        return normalizeStudentEnrollments(result.data || []);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en searchStudentEnrollments:', error);
        }
        return [];
    }
};

/**
 * Obtiene conteos de inscripciones por estado (año actual)
 */
export const getCurrentEnrollmentsCountByState = async (): Promise<{
    draft: number;
    done: number;
    cancel: number;
    total: number;
}> => {
    try {
        const [draftCount, doneCount, cancelCount] = await Promise.all([
            odooApi.searchCount(STUDENT_ENROLLMENT_MODEL, [['state', '=', 'draft'], ['current', '=', true]]),
            odooApi.searchCount(STUDENT_ENROLLMENT_MODEL, [['state', '=', 'done'], ['current', '=', true]]),
            odooApi.searchCount(STUDENT_ENROLLMENT_MODEL, [['state', '=', 'cancel'], ['current', '=', true]]),
        ]);

        const draft = draftCount.success ? (draftCount.data || 0) : 0;
        const done = doneCount.success ? (doneCount.data || 0) : 0;
        const cancel = cancelCount.success ? (cancelCount.data || 0) : 0;

        return {
            draft,
            done,
            cancel,
            total: draft + done + cancel,
        };
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error obteniendo conteos:', error);
        }
        return { draft: 0, done: 0, cancel: 0, total: 0 };
    }
};

/**
 * Invalida el caché de inscripciones
 */
export const invalidateStudentEnrollmentsCache = (): void => {
    cacheManager.invalidate(CACHE_KEYS.CURRENT);
    cacheManager.invalidate(CACHE_KEYS.ALL);
};
