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
    // Campos de desinscripción
    uninscriptionReason?: string;
    uninscriptionDoc1?: string;  // base64 o URL
    uninscriptionDoc2?: string;
    uninscriptionDoc3?: string;
    uninscriptionDoc1Name?: string;
    uninscriptionDoc2Name?: string;
    uninscriptionDoc3Name?: string;
    // Para Media General - Mención
    mentionId?: number;
    mentionName?: string;
    mentionState?: 'draft' | 'enrolled';
    mentionParentId?: number;
    mentionParentName?: string;
    mentionParentSignature?: string;  // base64
    mentionSignatureDate?: string;
    mentionObservations?: string;
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

/**
 * Datos para el wizard de desinscripción
 */
export interface UnenrollmentData {
    studentEnrollmentId: number;
    reason: string;
    document1?: {
        name: string;
        data: string;  // base64
    };
    document2?: {
        name: string;
        data: string;
    };
    document3?: {
        name: string;
        data: string;
    };
}

/**
 * Datos para el wizard de inscripción en mención
 */
export interface MentionEnrollmentData {
    studentEnrollmentId: number;
    mentionId: number;
    parentId: number;
    parentSignature: string;  // base64
    signatureDate: string;
    observations?: string;
}

/**
 * Mención disponible para seleccionar
 */
export interface Mention {
    id: number;
    name: string;
    code?: string;
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

// State labels and colors
export const ENROLLMENT_STATE_LABELS: Record<string, string> = {
    draft: 'Inscrito',
    done: 'Aprobado',
    cancel: 'Cancelado',
};

export const ENROLLMENT_STATE_COLORS: Record<string, string> = {
    draft: '#3b82f6',   // blue
    done: '#10b981',    // green
    cancel: '#ef4444',  // red
};

export const MENTION_STATE_LABELS: Record<string, string> = {
    draft: 'Sin mención',
    enrolled: 'Inscrito en mención',
};

export const MENTION_STATE_COLORS: Record<string, string> = {
    draft: '#6b7280',   // gray
    enrolled: '#8b5cf6', // purple
};

