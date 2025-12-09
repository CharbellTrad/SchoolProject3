/**
 * Dashboard Service Types
 * Types for dashboard statistics from school.year model in Odoo
 * Based on school_year_view.xml tabs structure - Updated Dec 2024
 */

/**
 * KPI counts from school.year model
 */
export interface DashboardKPIs {
    totalStudentsCount: number;
    approvedStudentsCount: number;
    totalSectionsCount: number;
    totalProfessorsCount: number;
}

/**
 * Students by level counts (including Técnico Medio)
 */
export interface StudentsByLevel {
    preCount: number;
    primaryCount: number;
    secundaryCount: number;  // Media General (sin mención)
    tecnicoCount: number;    // Técnico Medio (con mención)
}

/**
 * Approved students by level
 */
export interface ApprovedByLevel {
    preCount: number;
    primaryCount: number;
    secundaryCount: number;
    tecnicoCount: number;
}

/**
 * Sections by level counts
 */
export interface SectionsByLevel {
    preCount: number;
    primaryCount: number;
    secundaryCount: number;
}

/**
 * Evaluation type config (from Many2one field)
 */
export interface EvaluationTypeConfig {
    id: number;
    name: string;
}

/**
 * Evaluation configs for all levels
 */
export interface EvaluationConfigs {
    secundary?: EvaluationTypeConfig;
    primary?: EvaluationTypeConfig;
    pre?: EvaluationTypeConfig;
}

// ===== Dashboard General Tab =====

/**
 * Performance data for a single level
 */
export interface LevelPerformance {
    type: 'pre' | 'primary' | 'secundary';
    name: string;
    total_students: number;
    approved_students: number;
    failed_students: number;
    average: number;
    approval_rate: number;
}

/**
 * Performance by level JSON (year_performance_overview widget)
 */
export interface PerformanceByLevel {
    levels: LevelPerformance[];
}

/**
 * Students distribution for pie chart (students_distribution_chart widget)
 */
export interface StudentsDistribution {
    labels: string[];
    data: number[];
    total: number;
}

/**
 * Approval rate data (approval_rate_gauge widget)
 */
export interface ApprovalRate {
    total: number;
    approved: number;
    failed: number;
    rate: number;
}

/**
 * Section comparison item (sections_comparison_chart widget)
 */
export interface SectionComparison {
    section_id: number;
    section_name: string;
    type: string;
    average: number;
    total_students: number;
    approved_students: number;
    failed_students: number;
    approval_rate: number;
}

export interface SectionsComparison {
    sections: SectionComparison[];
}

/**
 * Top student item (top_students_list widget)
 */
export interface TopStudent {
    student_id: number;
    student_name: string;
    section: string;
    average: number;
    literal_average?: string;
    state: string;
    use_literal: boolean;
}

export interface TopStudentsYear {
    top_students: TopStudent[];
}

// ===== Section/Student Previews =====

/**
 * Section preview for level tabs
 */
export interface SectionPreview {
    id: number;
    name: string;
    sectionName: string;
    studentsCount: number;
    subjectsCount: number;
    professorsCount: number;
}

/**
 * Student preview for students tab
 */
export interface StudentPreview {
    id: number;
    studentName: string;
    sectionName: string;
    type: string;
    state: string;
    inscriptionDate?: string;
    mentionName?: string;
    mentionState?: string;
}

// ===== Level-specific Performance =====

/**
 * General performance for a level (general_performance_graph widget)
 */
export interface LevelPerformanceJson {
    evaluation_type: string;
    section_type: string;
    total_subjects: number;
    subjects_approved: number;
    subjects_failed: number;
    general_average: number;
    general_state: string;
    use_literal: boolean;
    literal_average?: string;
    approval_percentage: number;
}

/**
 * Top 3 students per section data (level_dashboard widget)
 * Matches Odoo _build_top_students_by_section output
 */
export interface TopStudentItem {
    student_id: number;
    student_name: string;
    enrollment_id: number;
    average: string | number;  // Can be "A" or "15/20" or number
    sort_value: number;
    state: string;
    use_literal: boolean;
}

export interface SectionTopStudents {
    section_id: number;
    section_name: string;
    top_3: TopStudentItem[];  // Odoo uses "top_3" not "students"
}

/**
 * Level dashboard JSON - full structure from Odoo
 */
export interface LevelDashboard {
    total_students: number;
    approved_count: number;
    failed_count: number;
    approval_rate: number;
    performance_data: any[];
    top_students_by_section: SectionTopStudents[];  // Odoo uses this field name
    evaluation_type: string;
    use_literal: boolean;
}

// ===== Professors Tab =====

/**
 * Professor summary item
 */
export interface ProfessorSummaryItem {
    professor_id: number;
    professor_name: string;
    sections_count: number;
    subjects_count: number;
    evaluations_count: number;
}

export interface ProfessorSummary {
    professors: ProfessorSummaryItem[];
    total: number;
}

/**
 * Professor stats by student type - matches Odoo _compute_professor_detailed_stats_json
 */
export interface ProfessorStatsByType {
    pre: { count: number; average: number };
    primary: { count: number; average: number };
    secundary_general: { count: number; average: number };
    secundary_tecnico: { count: number; average: number };
}

export interface ProfessorDetailedItem {
    professor_id: number;
    professor_name: string;
    total_evaluations: number;
    sections_count: number;
    stats_by_type: ProfessorStatsByType;
}

export interface ProfessorDetailedStats {
    professors: ProfessorDetailedItem[];
    total: number;
}

/**
 * Difficult subject item
 */
export interface DifficultSubject {
    subject_id: number;
    subject_name: string;
    total_students: number;
    failed_students: number;
    failure_rate: number;
    average: number;
}

export interface DifficultSubjects {
    subjects: DifficultSubject[];
}

// ===== Evaluations Tab =====

/**
 * Evaluations stats
 */
export interface EvaluationsStats {
    total: number;
    qualified: number;
    partial: number;
    draft: number;
    by_type: {
        secundary: number;
        primary: number;
        pre: number;
    };
}

/**
 * Recent evaluation item
 */
export interface RecentEvaluation {
    id: number;
    name: string;
    date: string;
    professor: string;
    section: string;
    subject: string;
    state: string;
    average: number;
}

export interface RecentEvaluations {
    evaluations: RecentEvaluation[];
}

/**
 * Current school year data
 */
export interface SchoolYear {
    id: number;
    name: string;
    current: boolean;
    state: 'draft' | 'active' | 'finished';
    startDateReal?: string;
    endDateReal?: string;
    isLocked: boolean;
}

/**
 * Complete dashboard data - mirrors all fields from school.year model
 * Updated to include 8 tabs with Técnico Medio
 */
export interface DashboardData {
    schoolYear: SchoolYear;
    kpis: DashboardKPIs;
    studentsByLevel: StudentsByLevel;
    approvedByLevel: ApprovedByLevel;
    sectionsByLevel: SectionsByLevel;
    evaluationConfigs: EvaluationConfigs;
    // Dashboard General tab
    performanceByLevel?: PerformanceByLevel;
    studentsDistribution?: StudentsDistribution;
    approvalRate?: ApprovalRate;
    sectionsComparison?: SectionsComparison;
    topStudentsYear?: TopStudentsYear;
    // Level-specific performance
    secundaryPerformance?: LevelPerformanceJson;
    primaryPerformance?: LevelPerformanceJson;
    prePerformance?: LevelPerformanceJson;
    // Level dashboards (Top 3 students per section)
    preDashboard?: LevelDashboard;
    primaryDashboard?: LevelDashboard;
    secundaryGeneralDashboard?: LevelDashboard;
    secundaryTecnicoDashboard?: LevelDashboard;
    // Section previews by level
    sectionPreviews?: {
        secundary: SectionPreview[];
        primary: SectionPreview[];
        pre: SectionPreview[];
    };
    // Student previews
    studentPreviews?: StudentPreview[];
    tecnicoStudentPreviews?: StudentPreview[];  // Students with mention enrolled
    // Professors tab
    professorSummary?: ProfessorSummary;
    professorDetailedStats?: ProfessorDetailedStats;
    difficultSubjects?: DifficultSubjects;
    // Evaluations tab
    evaluationsStats?: EvaluationsStats;
    recentEvaluations?: RecentEvaluations;
}

/**
 * Service result type
 */
export interface DashboardServiceResult<T = DashboardData> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        message: string;
        isSessionExpired?: boolean;
    };
}
