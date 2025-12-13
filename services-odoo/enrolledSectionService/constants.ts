/**
 * Constantes para el servicio de secciones inscritas
 */

export const ENROLLED_SECTION_MODEL = 'school.section';

export const ENROLLED_SECTION_FIELDS = [
    'id',
    'name',
    'year_id',
    'section_id',
    'type',
    'current',
    'professor_ids',
    'subject_ids',
    'student_ids',
    'subjects_average_json',
    'students_average_json',
    'top_students_json',
];

export const SECTION_TYPE_LABELS: Record<string, string> = {
    pre: 'Preescolar',
    primary: 'Primaria',
    secundary: 'Media General',
};

export const SECTION_TYPE_COLORS: Record<string, string> = {
    pre: '#f59e0b',      // amber
    primary: '#10b981',  // emerald
    secundary: '#3b82f6', // blue
};
