/**
 * Funciones de carga y lectura de secciones inscritas
 * Operaciones Diarias - school.section
 */

import * as odooApi from '../apiService';
import { cacheManager } from '../cache/cacheManager';
import { ENROLLED_SECTION_FIELDS, ENROLLED_SECTION_MODEL } from './constants';
import { normalizeEnrolledSection, normalizeEnrolledSections } from './normalizer';
import { EnrolledSection } from './types';

const CACHE_KEYS = {
    CURRENT: 'enrolled_sections_current',
    ALL: 'enrolled_sections_all',
    BY_TYPE: (type: string) => `enrolled_sections_${type}`,
};

const CACHE_TTL = {
    SECTIONS: 5 * 60 * 1000, // 5 minutos
};

/**
 * Carga secciones inscritas del año actual (current=True)
 */
export const loadCurrentEnrolledSections = async (
    forceReload: boolean = false
): Promise<EnrolledSection[]> => {
    try {
        const cacheKey = CACHE_KEYS.CURRENT;

        if (!forceReload) {
            const cached = cacheManager.get<EnrolledSection[]>(cacheKey);
            if (cached && cached.length > 0) {
                if (__DEV__) {
                    console.log(`📦 Usando caché: ${cached.length} secciones inscritas actuales`);
                }
                return cached;
            }
        }

        if (__DEV__) {
            console.time('⏱️ loadCurrentEnrolledSections');
        }

        const result = await odooApi.searchRead(
            ENROLLED_SECTION_MODEL,
            [['current', '=', true]],
            ENROLLED_SECTION_FIELDS,
            1000,
            0,
            'id asc'
        );

        if (!result.success) {
            if (__DEV__) {
                console.error('❌ Error cargando secciones inscritas:', result.error);
            }

            // Fallback a caché en caso de error
            const cached = cacheManager.get<EnrolledSection[]>(cacheKey);
            if (cached) {
                return cached;
            }

            return [];
        }

        const sections = normalizeEnrolledSections(result.data || []);

        // Guardar en caché
        cacheManager.set(cacheKey, sections, CACHE_TTL.SECTIONS);

        if (__DEV__) {
            console.timeEnd('⏱️ loadCurrentEnrolledSections');
            console.log(`✅ ${sections.length} secciones inscritas actuales cargadas`);
        }

        return sections;
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en loadCurrentEnrolledSections:', error);
        }

        const cached = cacheManager.get<EnrolledSection[]>(CACHE_KEYS.CURRENT);
        return cached || [];
    }
};

/**
 * Carga todas las secciones inscritas (todos los años)
 */
export const loadAllEnrolledSections = async (
    forceReload: boolean = false
): Promise<EnrolledSection[]> => {
    try {
        const cacheKey = CACHE_KEYS.ALL;

        if (!forceReload) {
            const cached = cacheManager.get<EnrolledSection[]>(cacheKey);
            if (cached && cached.length > 0) {
                return cached;
            }
        }

        const result = await odooApi.searchRead(
            ENROLLED_SECTION_MODEL,
            [],
            ENROLLED_SECTION_FIELDS,
            1000,
            0,
            'year_id desc, id asc'
        );

        if (!result.success) {
            const cached = cacheManager.get<EnrolledSection[]>(cacheKey);
            return cached || [];
        }

        const sections = normalizeEnrolledSections(result.data || []);
        cacheManager.set(cacheKey, sections, CACHE_TTL.SECTIONS);

        return sections;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadAllEnrolledSections:', error);
        }
        return [];
    }
};

/**
 * Carga secciones inscritas filtradas por tipo
 */
export const loadEnrolledSectionsByType = async (
    type: 'pre' | 'primary' | 'secundary',
    currentOnly: boolean = true
): Promise<EnrolledSection[]> => {
    try {
        const domain: any[] = [['type', '=', type]];
        if (currentOnly) {
            domain.push(['current', '=', true]);
        }

        const result = await odooApi.searchRead(
            ENROLLED_SECTION_MODEL,
            domain,
            ENROLLED_SECTION_FIELDS,
            1000,
            0,
            'id asc'
        );

        if (!result.success) {
            return [];
        }

        return normalizeEnrolledSections(result.data || []);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadEnrolledSectionsByType:', error);
        }
        return [];
    }
};

/**
 * Carga una sección inscrita por ID
 */
export const loadEnrolledSectionById = async (
    id: number
): Promise<EnrolledSection | null> => {
    try {
        const result = await odooApi.read(
            ENROLLED_SECTION_MODEL,
            [id],
            ENROLLED_SECTION_FIELDS
        );

        if (!result.success || !result.data || result.data.length === 0) {
            return null;
        }

        return normalizeEnrolledSection(result.data[0]);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadEnrolledSectionById:', error);
        }
        return null;
    }
};

/**
 * Busca secciones inscritas por nombre
 */
export const searchEnrolledSections = async (
    query: string,
    currentOnly: boolean = true
): Promise<EnrolledSection[]> => {
    try {
        if (!query || query.trim().length < 2) {
            return [];
        }

        const domain: any[] = [['name', 'ilike', query]];
        if (currentOnly) {
            domain.push(['current', '=', true]);
        }

        const result = await odooApi.searchRead(
            ENROLLED_SECTION_MODEL,
            domain,
            ENROLLED_SECTION_FIELDS,
            50,
            0,
            'id asc'
        );

        if (!result.success) return [];

        return normalizeEnrolledSections(result.data || []);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en searchEnrolledSections:', error);
        }
        return [];
    }
};

/**
 * Obtiene conteos de secciones inscritas por tipo (año actual)
 */
export const getEnrolledSectionsCountByType = async (): Promise<{
    pre: number;
    primary: number;
    secundary: number;
    total: number;
}> => {
    try {
        const [preCount, primaryCount, secundaryCount] = await Promise.all([
            odooApi.searchCount(ENROLLED_SECTION_MODEL, [['type', '=', 'pre'], ['current', '=', true]]),
            odooApi.searchCount(ENROLLED_SECTION_MODEL, [['type', '=', 'primary'], ['current', '=', true]]),
            odooApi.searchCount(ENROLLED_SECTION_MODEL, [['type', '=', 'secundary'], ['current', '=', true]]),
        ]);

        const pre = preCount.success ? (preCount.data || 0) : 0;
        const primary = primaryCount.success ? (primaryCount.data || 0) : 0;
        const secundary = secundaryCount.success ? (secundaryCount.data || 0) : 0;

        return {
            pre,
            primary,
            secundary,
            total: pre + primary + secundary,
        };
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error obteniendo conteos:', error);
        }
        return { pre: 0, primary: 0, secundary: 0, total: 0 };
    }
};

/**
 * Interface for subject with professor info
 */
export interface SubjectWithProfessor {
    subjectId: number;
    subjectName: string;
    professorId: number | null;
    professorName: string | null;
}

/**
 * Carga las materias de una sección con información del profesor
 */
export const loadSubjectsForSection = async (sectionId: number): Promise<SubjectWithProfessor[]> => {
    try {
        if (__DEV__) {
            console.log(`🔄 Cargando materias para sección ${sectionId}...`);
        }

        // school.subject tiene section_id, subject_id (Many2one), professor_id (Many2one)
        const result = await odooApi.searchRead(
            'school.subject',
            [['section_id', '=', sectionId]],
            ['id', 'subject_id', 'professor_id'],
            100,
            0,
            'id asc'
        );

        if (!result.success || !result.data) {
            return [];
        }

        const subjects: SubjectWithProfessor[] = result.data.map((record: any) => {
            let professorId: number | null = null;
            let professorName: string | null = null;

            if (Array.isArray(record.professor_id) && record.professor_id.length >= 2) {
                professorId = record.professor_id[0];
                professorName = record.professor_id[1];
            }

            // subject_id is Many2one [id, name]
            let subjectName = '';
            if (Array.isArray(record.subject_id) && record.subject_id.length >= 2) {
                subjectName = record.subject_id[1];
            }

            return {
                subjectId: record.id,
                subjectName,
                professorId,
                professorName,
            };
        });

        if (__DEV__) {
            console.log(`✅ ${subjects.length} materias cargadas para sección ${sectionId}`);
        }

        return subjects;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error cargando materias para sección:', error);
        }
        return [];
    }
};

/**
 * Interface for student data
 */
export interface StudentForSection {
    studentId: number;
    studentName: string;
    state: 'draft' | 'done' | 'cancel';
}

/**
 * Carga los estudiantes de una sección con nombre e estado
 */
export const loadStudentsForSection = async (sectionId: number): Promise<StudentForSection[]> => {
    try {
        if (__DEV__) {
            console.log(`🔄 Cargando estudiantes para sección ${sectionId}...`);
        }

        // school.student tiene section_id, name, student_id (Many2one), state
        const result = await odooApi.searchRead(
            'school.student',
            [['section_id', '=', sectionId]],
            ['id', 'name', 'student_id', 'state'],
            100,
            0,
            'student_id asc'
        );

        if (!result.success || !result.data) {
            return [];
        }

        const students: StudentForSection[] = result.data.map((record: any) => {
            // Use record.name directly - it's computed as "Estudiante {student_id.name}" in Odoo
            // Do NOT use student_id[1] as it may contain parent info from res.partner
            const studentName = record.name || 'Estudiante';

            return {
                studentId: record.id,
                studentName,
                state: record.state || 'draft',
            };
        });

        if (__DEV__) {
            console.log(`✅ ${students.length} estudiantes cargados para sección ${sectionId}`);
        }

        return students;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error cargando estudiantes para sección:', error);
        }
        return [];
    }
};

/**
 * Interface for professor data
 */
export interface ProfessorForSection {
    professorId: number;
    professorName: string;
}

/**
 * Carga los profesores asignados a una sección (para pre y primaria)
 */
export const loadProfessorsForSection = async (sectionId: number): Promise<ProfessorForSection[]> => {
    try {
        if (__DEV__) {
            console.log(`🔄 Cargando profesores para sección ${sectionId}...`);
        }

        // school.professor tiene section_ids Many2many - buscar profesores que tienen esta sección
        const result = await odooApi.searchRead(
            'school.professor',
            [['section_ids', 'in', [sectionId]]],
            ['id', 'name'],
            100,
            0,
            'name asc'
        );

        if (!result.success || !result.data) {
            return [];
        }

        const professors: ProfessorForSection[] = result.data.map((record: any) => ({
            professorId: record.id,
            professorName: record.name || 'Docente',
        }));

        if (__DEV__) {
            console.log(`✅ ${professors.length} profesores cargados para sección ${sectionId}`);
        }

        return professors;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error cargando profesores para sección:', error);
        }
        return [];
    }
};

/**
 * Carga todos los profesores disponibles del año actual (para asignar a secciones pre/primaria)
 */
export const loadAvailableProfessors = async (): Promise<ProfessorForSection[]> => {
    try {
        if (__DEV__) {
            console.log('🔄 Cargando profesores disponibles...');
        }

        // Buscar todos los profesores del año actual
        const result = await odooApi.searchRead(
            'school.professor',
            [['current', '=', true]],
            ['id', 'name'],
            200,
            0,
            'name asc'
        );

        if (!result.success || !result.data) {
            return [];
        }

        const professors: ProfessorForSection[] = result.data.map((record: any) => ({
            professorId: record.id,
            professorName: record.name || 'Docente',
        }));

        if (__DEV__) {
            console.log(`✅ ${professors.length} profesores disponibles cargados`);
        }

        return professors;
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error cargando profesores disponibles:', error);
        }
        return [];
    }
};

/**
 * Invalida el caché de secciones inscritas
 */
export const invalidateEnrolledSectionsCache = (): void => {
    cacheManager.invalidate(CACHE_KEYS.CURRENT);
    cacheManager.invalidate(CACHE_KEYS.ALL);
};

