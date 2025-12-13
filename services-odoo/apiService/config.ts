/**
 * Configuración de conexión con Odoo
 */
export const ODOO_CONFIG = {
  // host: 'http://185.111.156.32',
  host: 'https://ominous-trout-x5gpvpg4jrqph6p64-8069.app.github.dev',
  // database: 'test',
  database: 'odooo',
};

export const SESSION_KEY = '@odoo_session_id';

/**
 * Lista de errores esperados que no requieren logging extensivo
 */
export const EXPECTED_ERRORS = [
  'sesión',
  'session',
  'contraseña',
  'password',
  'usuario',
  'user',
  'acceso',
  'access',
  'denied',
  'denegado',
  'inválido',
  'invalid',
];