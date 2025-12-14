/**
 * Tipos e interfaces para el servicio de evaluaciones (school.evaluation)
 * Operaciones Diarias - Evaluaciones del año actual
 */

export interface Evaluation {
    id: number;
    name: string;
    description: string;
    evaluationDate: string;
    yearId: number;
    yearName: string;
    professorId: number;          // school.professor ID
    professorName: string;
    sectionId: number;            // school.section ID
    sectionName: string;
    subjectId?: number;           // school.subject ID (opcional, solo para secundary)
    subjectName?: string;
    type: 'pre' | 'primary' | 'secundary';
    state: 'all' | 'partial' | 'draft';
    stateScore: 'approve' | 'failed';
    scoreAverage: string;
    current: boolean;
    invisibleScore: boolean;
    invisibleObservation: boolean;
    invisibleLiteral: boolean;
    evaluationScoreIds: number[];
    scoresCount: number;
}

/**
 * Calificación individual de un estudiante en una evaluación
 */
export interface EvaluationScore {
    id: number;
    evaluationId: number;
    studentId: number;           // school.student ID (inscripción)
    studentName: string;         // Nombre del estudiante
    studentEnrollmentId: number; // school.student ID
    sectionId: number;
    sectionName: string;
    subjectId?: number;
    subjectName?: string;
    yearId: number;
    type: 'pre' | 'primary' | 'secundary';
    // Campos de calificación
    score: number;               // Puntaje numérico
    literalType: 'A' | 'B' | 'C' | 'D' | 'E' | null;  // Para primaria
    observation: string;         // Para preescolar
    points20: number;            // Puntaje convertido a base 20
    points100: number;           // Puntaje convertido a base 100
    // Estados
    state: 'draft' | 'qualified';
    stateScore: 'approve' | 'failed';
}

/**
 * Datos para crear/actualizar una calificación
 */
export interface UpdateScoreData {
    score?: number;
    literalType?: 'A' | 'B' | 'C' | 'D' | 'E' | null;
    observation?: string;
}

/**
 * Datos para cascada de formulario de evaluación
 */
export interface EvaluationFormData {
    // Profesores disponibles para el año
    professors: SelectOption[];
    // Secciones donde el profesor está asignado
    sections: SelectOption[];
    // Materias de la sección (solo secundary)
    subjects: SelectOption[];
}

export interface SelectOption {
    id: number;
    name: string;
}

export interface EvaluationServiceResult<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export type NewEvaluation = {
    name: string;
    description: string;
    evaluationDate: string;
    yearId: number;
    professorId: number;
    sectionId: number;
    subjectId?: number;
};

export interface EvaluationFilters {
    yearId?: number;
    professorId?: number;
    sectionId?: number;
    subjectId?: number;
    type?: 'pre' | 'primary' | 'secundary';
    state?: 'all' | 'partial' | 'draft';
    current?: boolean;
}

export const EVALUATION_STATE_LABELS: Record<string, string> = {
    all: 'Calificado',
    partial: 'Parcial',
    draft: 'Sin calificar',
};

export const EVALUATION_STATE_COLORS: Record<string, string> = {
    all: '#10b981',      // emerald/green
    partial: '#f59e0b',  // amber/orange
    draft: '#6b7280',    // gray
};

export const SCORE_STATE_LABELS: Record<string, string> = {
    draft: 'Sin calificar',
    qualified: 'Calificado',
};

export const SCORE_STATE_COLORS: Record<string, string> = {
    draft: '#6b7280',    // gray
    qualified: '#10b981', // green
};

export const LITERAL_LABELS: Record<string, string> = {
    A: 'A - Superó las expectativas',
    B: 'B - Cumplió con las expectativas',
    C: 'C - Cumplió casi con todas las expectativas',
    D: 'D - Cumplió con algunas expectativas',
    E: 'E - No cumplió con las expectativas',
};

export const LITERAL_SHORT_LABELS: Record<string, string> = {
    A: 'A',
    B: 'B',
    C: 'C',
    D: 'D',
    E: 'E',
};

export const RESULT_STATE_LABELS: Record<string, string> = {
    approve: 'Aprobado',
    failed: 'Reprobado',
};

export const RESULT_STATE_COLORS: Record<string, string> = {
    approve: '#10b981',  // green
    failed: '#ef4444',   // red
};

