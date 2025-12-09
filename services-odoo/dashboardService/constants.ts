/**
 * Dashboard Service Constants
 * Model names and field definitions for Odoo API calls
 * Based on school.year model computed fields - Updated Dec 2024
 */

/**
 * Odoo model name
 */
export const MODELS = {
    SCHOOL_YEAR: 'school.year',
    SCHOOL_SECTION: 'school.section',
    SCHOOL_STUDENT: 'school.student',
} as const;

/**
 * Basic fields for school year
 */
export const SCHOOL_YEAR_BASE_FIELDS = [
    'id',
    'name',
    'current',
    'state',
    'start_date_real',
    'end_date_real',
    'is_locked',
] as const;

/**
 * KPI count fields
 */
export const SCHOOL_YEAR_KPI_FIELDS = [
    // Total counts
    'total_students_count',
    'approved_students_count',
    'total_sections_count',
    'total_professors_count',
    // By level - students
    'students_pre_count',
    'students_primary_count',
    'students_secundary_count',
    'students_tecnico_count',  // NEW: Técnico Medio
    // By level - approved
    'approved_pre_count',
    'approved_primary_count',
    'approved_secundary_count',
    'approved_tecnico_count',  // NEW: Técnico Medio
    // By level - sections
    'sections_pre_count',
    'sections_primary_count',
    'sections_secundary_count',
    // Evaluation type config (Many2one - returns [id, name])
    'evalution_type_secundary',
    'evalution_type_primary',
    'evalution_type_pree',
] as const;

/**
 * Dashboard General tab JSON fields
 */
export const DASHBOARD_GENERAL_FIELDS = [
    'performance_by_level_json',
    'students_distribution_json',
    'approval_rate_json',
    'sections_comparison_json',
    'top_students_year_json',
] as const;

/**
 * Level-specific performance JSON fields
 */
export const LEVEL_PERFORMANCE_FIELDS = [
    'secundary_performance_json',
    'primary_performance_json',
    'pre_performance_json',
] as const;

/**
 * Level dashboard JSON fields (Top 3 students per section)
 */
export const LEVEL_DASHBOARD_FIELDS = [
    'pre_dashboard_json',
    'primary_dashboard_json',
    'secundary_general_dashboard_json',
    'secundary_tecnico_dashboard_json',
] as const;

/**
 * Professors tab JSON fields
 */
export const PROFESSORS_TAB_FIELDS = [
    'professor_summary_json',
    'professor_detailed_stats_json',  // NEW: Stats by student type
    'difficult_subjects_json',
] as const;

/**
 * Evaluations tab JSON fields
 */
export const EVALUATIONS_TAB_FIELDS = [
    'evaluations_stats_json',
    'recent_evaluations_json',
] as const;

/**
 * All fields combined for full dashboard
 */
export const SCHOOL_YEAR_ALL_FIELDS = [
    ...SCHOOL_YEAR_BASE_FIELDS,
    ...SCHOOL_YEAR_KPI_FIELDS,
    ...DASHBOARD_GENERAL_FIELDS,
    ...LEVEL_PERFORMANCE_FIELDS,
    ...LEVEL_DASHBOARD_FIELDS,
    ...PROFESSORS_TAB_FIELDS,
    ...EVALUATIONS_TAB_FIELDS,
] as const;

/**
 * Minimal fields for light load (just KPIs)
 */
export const SCHOOL_YEAR_LIGHT_FIELDS = [
    ...SCHOOL_YEAR_BASE_FIELDS,
    ...SCHOOL_YEAR_KPI_FIELDS,
] as const;

/**
 * Section preview fields (for showing sections list)
 */
export const SECTION_PREVIEW_FIELDS = [
    'id',
    'name',
    'section_id',
    'type',
    'student_ids',
    'subject_ids',
    'professor_ids',
] as const;

/**
 * Student preview fields (for showing students list)
 */
export const STUDENT_PREVIEW_FIELDS = [
    'id',
    'student_id',
    'section_id',
    'type',
    'state',
    'inscription_date',
    'mention_id',
    'mention_state',
] as const;
