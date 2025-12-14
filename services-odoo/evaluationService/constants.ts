/**
 * Constantes para el servicio de evaluaciones
 */

export const EVALUATION_MODEL = 'school.evaluation';
export const EVALUATION_SCORE_MODEL = 'school.evaluation.score';

export const EVALUATION_FIELDS = [
    'id',
    'name',
    'description',
    'evaluation_date',
    'year_id',
    'professor_id',
    'section_id',
    'subject_id',
    'type',
    'state',
    'state_score',
    'score_average',
    'current',
    'invisible_score',
    'invisible_observation',
    'invisible_literal',
    'evaluation_score_ids',
];

export const EVALUATION_SCORE_FIELDS = [
    'id',
    'evaluation_id',
    'student_id',
    'section_id',
    'subject_id',
    'year_id',
    'type',
    'score',
    'literal_type',
    'observation',
    'points_20',
    'points_100',
    'state',
    'state_score',
];

