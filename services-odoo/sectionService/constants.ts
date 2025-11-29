/**
 * Constantes para el servicio de secciones
 * Modelo Odoo: school.register.section
 */

export const MODELS = {
  SECTION: 'school.register.section',
  SUBJECT: 'school.register.subject',
} as const;

export const SECTION_FIELDS = [
  'id',
  'name',
  'type',
];

export const SECTION_TYPE_LABELS: Record<string, string> = {
  pre: 'Preescolar',
  primary: 'Primaria',
  secundary: 'Media General',
};

export const CACHE_KEYS = {
  ALL: 'sections:all',
  BY_TYPE: (type: string) => `sections:type:${type}`,
} as const;

export const CACHE_TTL = {
  SECTIONS: 10 * 60 * 1000, // 10 minutos
} as const;
