/**
 * Constantes y campos para consultas de Odoo
 */

export const STUDENT_FIELDS = [
  'id', 'name', 'vat', 'nationality', 'born_date', 'age', 'sex', 'blood_type',
  'email', 'phone', 'resident_number', 'emergency_phone_number',
  'street', 'student_lives', 'sizes_json',
  'current_height', 'current_weight', 'current_size_shirt',
  'current_size_pants', 'current_size_shoes',
  'suffer_illness_treatment', 'what_illness_treatment',
  'authorize_primary_atention', 'pregnat_finished', 'gestation_time',
  'peso_al_nacer', 'born_complication', 'complication',
  'parents_ids', 'inscription_ids',
  'brown_folder', 'ci_document', 'ci_document_filename',
  'boletin_informative', 'born_document', 'born_document_filename',
  'image_1920', 'avatar_128',
  'user_id', 'is_active',
];

export const STUDENT_SUMMARY_FIELDS = [
  'id', 'name', 'vat', 'nationality', 'image_1920', 'is_active',
  'parents_ids', 'inscription_ids'
];

export const PARENT_FIELDS = [
  'id', 'name', 'vat', 'nationality', 'born_date', 'age', 'sex',
  'email', 'phone', 'resident_number', 'emergency_phone_number',
  'street', 'live_with_student', 'active_job', 'job_place', 'job',
  'students_ids', 'ci_document', 'ci_document_filename',
  'image_1920', 'avatar_128', 'parent_singnature',
  'user_id', 'active',
];

export const INSCRIPTION_FIELDS = [
  'id', 'name', 'year_id', 'section_id', 'type', 'student_id', 'inscription_date',
  'uninscription_date', 'state', 'from_school', 'observations',
  'parent_name', 'parent_id', 'parent_singnature', 'parent_siganture_date',
  'height', 'weight', 'size_shirt', 'size_pants', 'size_shoes',
];

export const INSCRIPTION_MINIMAL_FIELDS = [
  'id', 'year_id', 'section_id', 'height', 'weight',
  'size_shirt', 'size_pants', 'size_shoes',
];

export const MODELS = {
  PARTNER: 'res.partner',
  INSCRIPTION: 'school.student',
  EVALUATION: 'school.evaluation.score',
} as const;

export const ENROLLMENT_TYPES = {
  STUDENT: 'student',
  PARENT: 'parent',
} as const;