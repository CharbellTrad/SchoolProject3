/**
 * Tipos e interfaces para el servicio de inscripción de estudiantes (school.student)
 * Operaciones Diarias - Estudiantes del Año actual
 */

export interface StudentEnrollment {
    id: number;
    name: string;
    displayName: string;
    yearId: number;
    yearName: string;
    sectionId: number;
    sectionName: string;
    studentId: number;           // res.partner ID (estudiante persona)
    studentName: string;         // Nombre del estudiante
    type: 'pre' | 'primary' | 'secundary';
    state: 'draft' | 'done' | 'cancel';
    current: boolean;            // from year_id.current
    inscriptionDate?: string;
    uninscriptionDate?: string;
    fromSchool?: string;
    observations?: string;
    parentId?: number;
    parentName?: string;
    // Para Media General
    mentionId?: number;
    mentionName?: string;
    mentionState?: 'draft' | 'enrolled';
    // JSON de rendimiento
    generalPerformanceJson?: GeneralPerformanceData;
}

export interface GeneralPerformanceData {
    evaluation_type: '20' | '100' | 'literal' | 'observation';
    section_type: 'pre' | 'primary' | 'secundary';
    total_subjects: number;
    subjects_approved: number;
    subjects_failed: number;
    general_average: number;
    general_state: 'approve' | 'failed';
    use_literal: boolean;
    literal_average?: string;
}

export interface StudentEnrollmentServiceResult<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export type NewStudentEnrollment = {
    yearId: number;
    sectionId: number;
    studentId: number;        // res.partner ID
    parentId?: number;
    fromSchool?: string;
    observations?: string;
};

export interface StudentEnrollmentFilters {
    yearId?: number;
    sectionId?: number;
    type?: 'pre' | 'primary' | 'secundary';
    state?: 'draft' | 'done' | 'cancel';
    current?: boolean;
}
