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
