/**
 * Normalizador para evaluaciones
 * Transforma datos de Odoo al formato de la app
 */

import { Evaluation } from './types';

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
