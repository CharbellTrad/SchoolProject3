/**
 * Tipos e interfaces para el servicio de secciones inscritas (school.section)
 * Operaciones Diarias - Secciones Activas del año actual
 */

export interface EnrolledSection {
    id: number;
    name: string;
    yearId: number;
    yearName: string;
    sectionId: number;        // school.register.section ID (base section)
    sectionName: string;      // Nombre de la sección base
    type: 'pre' | 'primary' | 'secundary';
    current: boolean;         // from year_id.current
    professorIds: number[];   // Many2many school.professor
    professorNames: string[]; // For display
    subjectIds: number[];     // One2many school.subject (only for secundary)
    studentIds: number[];     // One2many school.student
    studentsCount: number;
    subjectsCount: number;
    professorsCount: number;
    // Computed JSON fields for performance
    subjectsAverageJson?: SubjectsAverageData;
    studentsAverageJson?: StudentsAverageData;
    topStudentsJson?: TopStudentsData;
}

export interface SubjectsAverageData {
    evaluation_type: '20' | '100';
    subjects: SubjectAverage[];
    general_average: number;
}

export interface SubjectAverage {
    subject_id: number;
    subject_name: string;
    average: number;
    total_students: number;
    approved_students: number;
    failed_students: number;
}

export interface StudentsAverageData {
    evaluation_type: '20' | '100' | 'literal';
    section_type: 'pre' | 'primary' | 'secundary';
    total_students: number;
    approved_students: number;
    failed_students: number;
    general_average: number;
    students: StudentAverage[];
}

export interface StudentAverage {
    student_id: number;
    student_name: string;
    average: number;
    state: 'approve' | 'failed';
}

export interface TopStudentsData {
    evaluation_type: '20' | '100' | 'literal';
    section_type: 'pre' | 'primary' | 'secundary';
    top_students: TopStudent[];
}

export interface TopStudent {
    student_id: number;
    student_name: string;
    average: number;
    literal_average?: string;
    state: 'approve' | 'failed';
    use_literal: boolean;
}

export interface EnrolledSectionServiceResult<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export type NewEnrolledSection = {
    yearId: number;
    sectionId: number;  // school.register.section ID
    professorIds?: number[];  // Optional professors to assign (for pre/primary)
};

export interface EnrolledSectionFilters {
    yearId?: number;
    type?: 'pre' | 'primary' | 'secundary';
    current?: boolean;
}
