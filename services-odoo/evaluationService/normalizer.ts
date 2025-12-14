/**
 * Normalizador para evaluaciones y calificaciones
 * Transforma datos de Odoo al formato de la app
 */

import { Evaluation, EvaluationScore } from './types';

/**
 * Normaliza un registro de evaluación de Odoo
 */
export function normalizeEvaluation(record: any): Evaluation {
    // Extraer year_id
    let yearId = 0;
    let yearName = '';
    if (Array.isArray(record.year_id) && record.year_id.length >= 2) {
        yearId = record.year_id[0];
        yearName = record.year_id[1];
    }

    // Extraer professor_id (school.professor)
    let professorId = 0;
    let professorName = '';
    if (Array.isArray(record.professor_id) && record.professor_id.length >= 2) {
        professorId = record.professor_id[0];
        professorName = record.professor_id[1];
    }

    // Extraer section_id
    let sectionId = 0;
    let sectionName = '';
    if (Array.isArray(record.section_id) && record.section_id.length >= 2) {
        sectionId = record.section_id[0];
        sectionName = record.section_id[1];
    }

    // Extraer subject_id (opcional)
    let subjectId: number | undefined;
    let subjectName: string | undefined;
    if (Array.isArray(record.subject_id) && record.subject_id.length >= 2) {
        subjectId = record.subject_id[0];
        subjectName = record.subject_id[1];
    }

    // Extraer IDs de scores
    const evaluationScoreIds = Array.isArray(record.evaluation_score_ids)
        ? record.evaluation_score_ids
        : [];

    return {
        id: record.id,
        name: record.name || '',
        description: record.description || '',
        evaluationDate: record.evaluation_date || '',
        yearId,
        yearName,
        professorId,
        professorName,
        sectionId,
        sectionName,
        subjectId,
        subjectName,
        type: record.type || 'primary',
        state: record.state || 'draft',
        stateScore: record.state_score || 'failed',
        scoreAverage: record.score_average || '',
        current: record.current || false,
        invisibleScore: record.invisible_score || false,
        invisibleObservation: record.invisible_observation || false,
        invisibleLiteral: record.invisible_literal || false,
        evaluationScoreIds,
        scoresCount: evaluationScoreIds.length,
    };
}

/**
 * Normaliza múltiples registros de evaluaciones
 */
export function normalizeEvaluations(records: any[]): Evaluation[] {
    if (!Array.isArray(records)) return [];
    return records.map(normalizeEvaluation);
}

/**
 * Normaliza un registro de calificación de Odoo
 */
export function normalizeEvaluationScore(record: any): EvaluationScore {
    // Extraer evaluation_id
    let evaluationId = 0;
    if (Array.isArray(record.evaluation_id) && record.evaluation_id.length >= 2) {
        evaluationId = record.evaluation_id[0];
    } else if (typeof record.evaluation_id === 'number') {
        evaluationId = record.evaluation_id;
    }

    // Extraer student_id (school.student = inscripción)
    let studentId = 0;
    let studentName = '';
    if (Array.isArray(record.student_id) && record.student_id.length >= 2) {
        studentId = record.student_id[0];
        studentName = record.student_id[1];
    }

    // Extraer section_id
    let sectionId = 0;
    let sectionName = '';
    if (Array.isArray(record.section_id) && record.section_id.length >= 2) {
        sectionId = record.section_id[0];
        sectionName = record.section_id[1];
    }

    // Extraer subject_id (opcional)
    let subjectId: number | undefined;
    let subjectName: string | undefined;
    if (Array.isArray(record.subject_id) && record.subject_id.length >= 2) {
        subjectId = record.subject_id[0];
        subjectName = record.subject_id[1];
    }

    // Extraer year_id
    let yearId = 0;
    if (Array.isArray(record.year_id) && record.year_id.length >= 2) {
        yearId = record.year_id[0];
    } else if (typeof record.year_id === 'number') {
        yearId = record.year_id;
    }

    return {
        id: record.id,
        evaluationId,
        studentId,
        studentName,
        studentEnrollmentId: studentId, // Es el mismo, school.student es la inscripción
        sectionId,
        sectionName,
        subjectId,
        subjectName,
        yearId,
        type: record.type || 'primary',
        score: record.score || 0,
        literalType: record.literal_type || null,
        observation: record.observation || '',
        points20: record.points_20 || 0,
        points100: record.points_100 || 0,
        state: record.state || 'draft',
        stateScore: record.state_score || 'failed',
    };
}

/**
 * Normaliza múltiples registros de calificaciones
 */
export function normalizeEvaluationScores(records: any[]): EvaluationScore[] {
    if (!Array.isArray(records)) return [];
    return records.map(normalizeEvaluationScore);
}

