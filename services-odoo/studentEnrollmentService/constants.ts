/**
 * Constantes para el servicio de inscripción de estudiantes
 */

export const STUDENT_ENROLLMENT_MODEL = 'school.student';

export const STUDENT_ENROLLMENT_FIELDS = [
    'id',
    'name',
    'display_name',
    'year_id',
    'section_id',
    'student_id',
    'type',
    'state',
    'current',
    'inscription_date',
    'uninscription_date',
    'from_school',
    'observations',
    'parent_id',
    'mention_id',
    'mention_state',
    'general_performance_json',
];

export const ENROLLMENT_STATE_LABELS: Record<string, string> = {
    draft: 'Borrador',
    done: 'Inscrito',
    cancel: 'Desinscrito',
};

export const ENROLLMENT_STATE_COLORS: Record<string, string> = {
    draft: '#3b82f6',    // blue
    done: '#10b981',     // emerald/green
    cancel: '#ef4444',   // red
};
