/**
 * Dashboard Service Loader
 * Fetches dashboard data from Odoo school.year model
 * Matches structure from school_year_view.xml tabs - Updated Dec 2024
 */

import * as odooApi from '../apiService';
import { MODELS, SCHOOL_YEAR_ALL_FIELDS, SCHOOL_YEAR_LIGHT_FIELDS, SECTION_PREVIEW_FIELDS, STUDENT_PREVIEW_FIELDS } from './constants';
import {
    ApprovalRate,
    ApprovedByLevel,
    DashboardData,
    DashboardKPIs,
    DashboardServiceResult,
    DifficultSubjects,
    EvaluationConfigs,
    EvaluationsStats,
    LevelDashboard,
    LevelPerformanceJson,
    PerformanceByLevel,
    ProfessorDetailedStats,
    ProfessorSummary,
    RecentEvaluations,
    SchoolYear,
    SectionPreview,
    SectionsByLevel,
    SectionsComparison,
    StudentPreview,
    StudentsByLevel,
    StudentsDistribution,
    TopStudentsYear,
} from './types';

/**
 * Parses Many2one field to extract id and name
 */
const parseMany2one = (field: any): { id: number; name: string } | undefined => {
    if (!field) return undefined;
    if (Array.isArray(field) && field.length >= 2) {
        return { id: field[0], name: field[1] };
    }
    if (typeof field === 'number') {
        return { id: field, name: '' };
    }
    return undefined;
};

/**
 * Safely parse JSON field from Odoo
 */
const parseJsonField = <T>(field: any): T | undefined => {
    if (!field) return undefined;
    if (typeof field === 'object') return field as T;
    if (typeof field === 'string') {
        try {
            return JSON.parse(field) as T;
        } catch {
            return undefined;
        }
    }
    return undefined;
};

/**
 * Normalizes raw Odoo response to DashboardData
 */
const normalizeDashboardData = (raw: any): DashboardData => {
    if (__DEV__) {
        console.log('🔄 Normalizing dashboard data...');
    }

    const schoolYear: SchoolYear = {
        id: raw.id,
        name: raw.name || '',
        current: raw.current || false,
        state: raw.state || 'draft',
        startDateReal: raw.start_date_real || undefined,
        endDateReal: raw.end_date_real || undefined,
        isLocked: raw.is_locked || false,
    };

    const kpis: DashboardKPIs = {
        totalStudentsCount: raw.total_students_count || 0,
        approvedStudentsCount: raw.approved_students_count || 0,
        totalSectionsCount: raw.total_sections_count || 0,
        totalProfessorsCount: raw.total_professors_count || 0,
    };

    const studentsByLevel: StudentsByLevel = {
        preCount: raw.students_pre_count || 0,
        primaryCount: raw.students_primary_count || 0,
        secundaryCount: raw.students_secundary_count || 0,
        tecnicoCount: raw.students_tecnico_count || 0,
    };

    const approvedByLevel: ApprovedByLevel = {
        preCount: raw.approved_pre_count || 0,
        primaryCount: raw.approved_primary_count || 0,
        secundaryCount: raw.approved_secundary_count || 0,
        tecnicoCount: raw.approved_tecnico_count || 0,
    };

    const sectionsByLevel: SectionsByLevel = {
        preCount: raw.sections_pre_count || 0,
        primaryCount: raw.sections_primary_count || 0,
        secundaryCount: raw.sections_secundary_count || 0,
    };

    // Parse evaluation type configs
    const evaluationConfigs: EvaluationConfigs = {
        secundary: parseMany2one(raw.evalution_type_secundary),
        primary: parseMany2one(raw.evalution_type_primary),
        pre: parseMany2one(raw.evalution_type_pree),
    };

    // Dashboard General tab
    const performanceByLevel = parseJsonField<PerformanceByLevel>(raw.performance_by_level_json);
    const studentsDistribution = parseJsonField<StudentsDistribution>(raw.students_distribution_json);
    const approvalRate = parseJsonField<ApprovalRate>(raw.approval_rate_json);
    const sectionsComparison = parseJsonField<SectionsComparison>(raw.sections_comparison_json);
    const topStudentsYear = parseJsonField<TopStudentsYear>(raw.top_students_year_json);

    // Level-specific performance
    const secundaryPerformance = parseJsonField<LevelPerformanceJson>(raw.secundary_performance_json);
    const primaryPerformance = parseJsonField<LevelPerformanceJson>(raw.primary_performance_json);
    const prePerformance = parseJsonField<LevelPerformanceJson>(raw.pre_performance_json);

    // Level dashboards (Top 3 students per section)
    const preDashboard = parseJsonField<LevelDashboard>(raw.pre_dashboard_json);
    const primaryDashboard = parseJsonField<LevelDashboard>(raw.primary_dashboard_json);
    const secundaryGeneralDashboard = parseJsonField<LevelDashboard>(raw.secundary_general_dashboard_json);
    const secundaryTecnicoDashboard = parseJsonField<LevelDashboard>(raw.secundary_tecnico_dashboard_json);

    // Professors tab
    const professorSummary = parseJsonField<ProfessorSummary>(raw.professor_summary_json);
    const professorDetailedStats = parseJsonField<ProfessorDetailedStats>(raw.professor_detailed_stats_json);
    const difficultSubjects = parseJsonField<DifficultSubjects>(raw.difficult_subjects_json);

    // Evaluations tab
    const evaluationsStats = parseJsonField<EvaluationsStats>(raw.evaluations_stats_json);
    const recentEvaluations = parseJsonField<RecentEvaluations>(raw.recent_evaluations_json);

    if (__DEV__) {
        console.log('📊 Parsed KPIs:', kpis);
        console.log('📋 Eval configs:', evaluationConfigs);
    }

    return {
        schoolYear,
        kpis,
        studentsByLevel,
        approvedByLevel,
        sectionsByLevel,
        evaluationConfigs,
        performanceByLevel,
        studentsDistribution,
        approvalRate,
        sectionsComparison,
        topStudentsYear,
        secundaryPerformance,
        primaryPerformance,
        prePerformance,
        preDashboard,
        primaryDashboard,
        secundaryGeneralDashboard,
        secundaryTecnicoDashboard,
        professorSummary,
        professorDetailedStats,
        difficultSubjects,
        evaluationsStats,
        recentEvaluations,
    };
};

/**
 * Fetches section previews for a specific level
 */
const fetchSectionPreviews = async (yearId: number, levelType: string, limit: number = 5): Promise<SectionPreview[]> => {
    try {
        const result = await odooApi.searchRead(
            MODELS.SCHOOL_SECTION,
            [['year_id', '=', yearId], ['type', '=', levelType]],
            SECTION_PREVIEW_FIELDS as unknown as string[],
            limit
        );

        if (!result.success || !result.data) return [];

        return result.data.map((s: any) => ({
            id: s.id,
            name: s.name || '',
            sectionName: Array.isArray(s.section_id) ? s.section_id[1] : s.name,
            studentsCount: Array.isArray(s.student_ids) ? s.student_ids.length : 0,
            subjectsCount: Array.isArray(s.subject_ids) ? s.subject_ids.length : 0,
            professorsCount: Array.isArray(s.professor_ids) ? s.professor_ids.length : 0,
        }));
    } catch (error) {
        if (__DEV__) console.error(`❌ Error fetching sections ${levelType}:`, error);
        return [];
    }
};

/**
 * Fetches student previews for the year
 */
const fetchStudentPreviews = async (yearId: number, limit: number = 5): Promise<StudentPreview[]> => {
    try {
        const result = await odooApi.searchRead(
            MODELS.SCHOOL_STUDENT,
            [['year_id', '=', yearId], ['current', '=', true]],
            STUDENT_PREVIEW_FIELDS as unknown as string[],
            limit
        );

        if (!result.success || !result.data) return [];

        return result.data.map((s: any) => ({
            id: s.id,
            studentName: Array.isArray(s.student_id) ? s.student_id[1] : 'Sin nombre',
            sectionName: Array.isArray(s.section_id) ? s.section_id[1] : '',
            type: s.type || '',
            state: s.state || 'draft',
            inscriptionDate: s.inscription_date,
            mentionName: Array.isArray(s.mention_id) ? s.mention_id[1] : undefined,
            mentionState: s.mention_state,
        }));
    } catch (error) {
        if (__DEV__) console.error('❌ Error fetching students:', error);
        return [];
    }
};

/**
 * Fetches Técnico Medio students (students with mention enrolled)
 */
const fetchTecnicoStudentPreviews = async (yearId: number, limit: number = 5): Promise<StudentPreview[]> => {
    try {
        const result = await odooApi.searchRead(
            MODELS.SCHOOL_STUDENT,
            [['year_id', '=', yearId], ['current', '=', true], ['mention_state', '=', 'enrolled']],
            STUDENT_PREVIEW_FIELDS as unknown as string[],
            limit
        );

        if (!result.success || !result.data) return [];

        return result.data.map((s: any) => ({
            id: s.id,
            studentName: Array.isArray(s.student_id) ? s.student_id[1] : 'Sin nombre',
            sectionName: Array.isArray(s.section_id) ? s.section_id[1] : '',
            type: s.type || '',
            state: s.state || 'draft',
            inscriptionDate: s.inscription_date,
            mentionName: Array.isArray(s.mention_id) ? s.mention_id[1] : undefined,
            mentionState: s.mention_state,
        }));
    } catch (error) {
        if (__DEV__) console.error('❌ Error fetching tecnico students:', error);
        return [];
    }
};

/**
 * Gets the current school year dashboard data
 */
export const getCurrentSchoolYearDashboard = async (
    includeAllTabs: boolean = true
): Promise<DashboardServiceResult<DashboardData>> => {
    try {
        if (__DEV__) {
            console.time('⏱️ getCurrentSchoolYearDashboard');
            console.log('📡 Fetching dashboard data...');
        }

        const fields = includeAllTabs ? SCHOOL_YEAR_ALL_FIELDS : SCHOOL_YEAR_LIGHT_FIELDS;

        const searchResult = await odooApi.searchRead(
            MODELS.SCHOOL_YEAR,
            [['current', '=', true]],
            fields as unknown as string[],
            1
        );

        if (__DEV__) {
            console.log('📦 Search result:', {
                success: searchResult.success,
                hasData: !!searchResult.data,
                dataLength: searchResult.data?.length || 0,
            });
        }

        if (!searchResult.success) {
            if (searchResult.error?.isSessionExpired) {
                return { success: false, message: '' };
            }
            return {
                success: false,
                message: odooApi.extractOdooErrorMessage(searchResult.error),
            };
        }

        if (!searchResult.data || searchResult.data.length === 0) {
            if (__DEV__) console.log('📭 No hay año escolar actual configurado');
            return {
                success: false,
                message: 'No hay un año escolar activo configurado',
            };
        }

        const rawData = searchResult.data[0];
        const dashboardData = normalizeDashboardData(rawData);

        // Fetch section and student previews in parallel
        if (includeAllTabs && dashboardData.schoolYear.id) {
            const [secPreviews, primPreviews, prePreviews, studentPreviews, tecnicoStudents] = await Promise.all([
                fetchSectionPreviews(dashboardData.schoolYear.id, 'secundary'),
                fetchSectionPreviews(dashboardData.schoolYear.id, 'primary'),
                fetchSectionPreviews(dashboardData.schoolYear.id, 'pre'),
                fetchStudentPreviews(dashboardData.schoolYear.id),
                fetchTecnicoStudentPreviews(dashboardData.schoolYear.id),
            ]);

            dashboardData.sectionPreviews = {
                secundary: secPreviews,
                primary: primPreviews,
                pre: prePreviews,
            };
            dashboardData.studentPreviews = studentPreviews;
            dashboardData.tecnicoStudentPreviews = tecnicoStudents;

            if (__DEV__) {
                console.log('📦 Previews loaded:', {
                    secundary: secPreviews.length,
                    primary: primPreviews.length,
                    pre: prePreviews.length,
                    students: studentPreviews.length,
                    tecnico: tecnicoStudents.length,
                });
            }
        }

        if (__DEV__) {
            console.timeEnd('⏱️ getCurrentSchoolYearDashboard');
            console.log('✅ Dashboard data loaded:', {
                year: dashboardData.schoolYear.name,
                state: dashboardData.schoolYear.state,
                students: dashboardData.kpis.totalStudentsCount,
                sections: dashboardData.kpis.totalSectionsCount,
            });
        }

        return {
            success: true,
            data: dashboardData,
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en getCurrentSchoolYearDashboard:', error);
        }
        return {
            success: false,
            message: odooApi.extractOdooErrorMessage(error),
        };
    }
};

/**
 * Gets just the KPI counts (lighter payload for quick refresh)
 */
export const getDashboardKPIs = async (): Promise<DashboardServiceResult<DashboardKPIs>> => {
    try {
        const result = await getCurrentSchoolYearDashboard(false);
        if (!result.success || !result.data) {
            return { success: false, message: result.message };
        }
        return { success: true, data: result.data.kpis };
    } catch (error: any) {
        return { success: false, message: odooApi.extractOdooErrorMessage(error) };
    }
};
