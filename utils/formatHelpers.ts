/**
 * Formatea el género de M/F a Masculino/Femenino
 */
export const formatGender = (sex: string | null | undefined): string => {
  if (!sex) return 'No especificado';
  const normalized = sex.toUpperCase().trim();
  
  switch (normalized) {
    case 'M':
      return 'Masculino';
    case 'F':
      return 'Femenino';
    default:
      return sex;
  }
};

/**
 * Formatea nacionalidad V/E
 */
export const formatNationality = (nationality: string | null | undefined): string => {
  if (!nationality) return '';
  return nationality.toUpperCase().trim();
};

/**
 * Formatea valores Yes/No de Odoo
 */
export const formatYesNo = (value: string | null | undefined): string => {
  if (!value) return 'No especificado';
  const normalized = value.toLowerCase().trim();
  
  if (normalized === 'si' || normalized === 'sí' || normalized === 'yes') {
    return 'Sí';
  }
  if (normalized === 'no') {
    return 'No';
  }
  
  return value;
};

/**
 * Formatea talla de camisa
 */
export const formatShirtSize = (size: string | null | undefined | false): string => {
  if (typeof size === 'string' && size.trim() !== '') {
    return size.toUpperCase();
  }
  return 'No especificado';
};

/**
 * Verifica si un valor es numérico válido
 */
const isValidNumber = (value: any): value is number => {
  return typeof value === 'number' && !isNaN(value) && value !== 0;
};

/**
 * Formatea números (tallas, peso, altura)
 */
export const formatNumber = (
  value: number | string | null | undefined | false, 
  decimals: number = 1
): string => {
  if (value === false || value === null || value === undefined) {
    return 'No especificado';
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return 'No especificado';
  }
  
  let num: number;
  if (typeof value === 'number') {
    num = value;
  } else if (typeof value === 'string') {
    num = parseFloat(value);
  } else {
    return 'No especificado';
  }
  
  if (!isValidNumber(num)) {
    return 'No especificado';
  }
  
  return num.toFixed(decimals);
};

/**
 * Formatea teléfonos que vienen como false desde Odoo
 */
export const formatPhone = (phone: string | false | null | undefined): string => {
  if (typeof phone === 'string' && phone.trim() !== '') {
    return phone;
  }
  return 'No especificado';
};

/**
 * Convierte fecha YYYY-MM-DD a DD-MM-YYYY
 */
export const formatDateToDisplay = (date: string | null | undefined): string => {
  if (!date || typeof date !== 'string') return 'No especificado';
  
  try {
    // Si viene en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-');
      return `${day}-${month}-${year}`;
    }
    
    // Si ya viene en DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      return date;
    }
    
    // Intentar parsear como fecha ISO
    const dateObj = new Date(date);
    if (!isNaN(dateObj.getTime())) {
      const day = dateObj.getDate().toString().padStart(2, '0');
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    return date;
  } catch (error) {
    return 'No especificado';
  }
};

/**
 * Convierte fecha DD-MM-YYYY a YYYY-MM-DD para Odoo
 */
export const formatDateToOdoo = (date: string | null | undefined): string => {
  if (!date || typeof date !== 'string') return '';
  
  try {
    // Si ya viene en formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    
    // Si viene en formato DD-MM-YYYY
    if (/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      const [day, month, year] = date.split('-');
      return `${year}-${month}-${day}`;
    }
    
    return date;
  } catch (error) {
    return '';
  }
};

/**
 * Normaliza valores "Si"/"No" para enviar a Odoo
 * Convierte "Sí" -> "si", "No" -> "no"
 */
export const normalizeYesNo = (value: string | null | undefined): string => {
  if (!value) return '';
  const normalized = value.toLowerCase().trim();
  
  if (normalized === 'sí' || normalized === 'si' || normalized === 'yes') {
    return 'si';
  }
  if (normalized === 'no') {
    return 'no';
  }
  
  return value;
};

/**
 * Normaliza género para enviar a Odoo
 * Convierte "Masculino" -> "M", "Femenino" -> "F"
 */
export const normalizeGender = (sex: string | null | undefined): string => {
  if (!sex) return '';
  const normalized = sex.toLowerCase().trim();
  
  if (normalized === 'masculino' || normalized === 'm') {
    return 'M';
  }
  if (normalized === 'femenino' || normalized === 'f') {
    return 'F';
  }
  
  return sex;
};

export const formatStudentLives = (value: string | null | undefined): string => {
  if (!value) return 'No especificado';
  
  switch (value.toUpperCase().trim()) {
    case 'P/M':
      return 'PADRE/MADRE';
    case 'O':
      return 'OTRO';
    default:
      return value;
  }
};

/**
 * Formatea el tipo de inscripción
 */
export const formatInscriptionType = (type: string | null | undefined): string => {
  if (!type) return 'No especificado';
  
  const normalized = type.toLowerCase().trim();
  
  switch (normalized) {
    case 'pre':
      return 'Preescolar';
    case 'primary':
      return 'Primaria';
    case 'secundary':
      return 'Media General';
    default:
      return type;
  }
};





/**
 * Helpers para formatear fechas
 * Convierte fechas ISO a formato legible en hora venezolana (UTC-4)
 */

/**
 * Convierte una fecha ISO a hora local venezolana
 * @param isoDate - Fecha en formato ISO (ej: "2025-11-20T02:04:51.742Z")
 * @returns Fecha formateada (ej: "19/11/2025 22:04")
 */
export const formatDateToLocal = (isoDate: string | null | undefined): string => {
  if (!isoDate) return 'No especificado';
  
  try {
    const date = new Date(isoDate);
    
    // Verificar que sea una fecha válida
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    // Convertir a hora de Venezuela (UTC-4)
    const venezuelaOffset = -4 * 60; // -4 horas en minutos
    const localOffset = date.getTimezoneOffset(); // Offset del sistema
    const totalOffset = venezuelaOffset - localOffset;
    
    const venezuelaDate = new Date(date.getTime() + totalOffset * 60 * 1000);
    
    // Formatear como DD/MM/YYYY HH:MM
    const day = venezuelaDate.getDate().toString().padStart(2, '0');
    const month = (venezuelaDate.getMonth() + 1).toString().padStart(2, '0');
    const year = venezuelaDate.getFullYear();
    const hours = venezuelaDate.getHours().toString().padStart(2, '0');
    const minutes = venezuelaDate.getMinutes().toString().padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formateando fecha:', error);
    return 'Error en fecha';
  }
};

/**
 * Convierte fecha ISO a formato solo fecha (sin hora)
 * @param isoDate - Fecha en formato ISO
 * @returns Fecha formateada (ej: "19/11/2025")
 */
export const formatDateOnlyToLocal = (isoDate: string | null | undefined): string => {
  if (!isoDate) return 'No especificado';
  
  try {
    const date = new Date(isoDate);
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    // Convertir a hora de Venezuela
    const venezuelaOffset = -4 * 60;
    const localOffset = date.getTimezoneOffset();
    const totalOffset = venezuelaOffset - localOffset;
    
    const venezuelaDate = new Date(date.getTime() + totalOffset * 60 * 1000);
    
    const day = venezuelaDate.getDate().toString().padStart(2, '0');
    const month = (venezuelaDate.getMonth() + 1).toString().padStart(2, '0');
    const year = venezuelaDate.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return 'Error en fecha';
  }
};

/**
 * Convierte fecha ISO a formato con nombre de mes
 * @param isoDate - Fecha en formato ISO
 * @returns Fecha formateada (ej: "19 de noviembre de 2025, 22:04")
 */
export const formatDateToLocalLong = (isoDate: string | null | undefined): string => {
  if (!isoDate) return 'No especificado';
  
  try {
    const date = new Date(isoDate);
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    const venezuelaOffset = -4 * 60;
    const localOffset = date.getTimezoneOffset();
    const totalOffset = venezuelaOffset - localOffset;
    
    const venezuelaDate = new Date(date.getTime() + totalOffset * 60 * 1000);
    
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const day = venezuelaDate.getDate();
    const month = months[venezuelaDate.getMonth()];
    const year = venezuelaDate.getFullYear();
    const hours = venezuelaDate.getHours().toString().padStart(2, '0');
    const minutes = venezuelaDate.getMinutes().toString().padStart(2, '0');
    
    return `${day} de ${month} de ${year}, ${hours}:${minutes}`;
  } catch (error) {
    return 'Error en fecha';
  }
};

/**
 * Calcula tiempo transcurrido desde una fecha
 * @param isoDate - Fecha en formato ISO
 * @returns Tiempo relativo (ej: "hace 2 horas", "hace 3 días")
 */
export const formatTimeAgo = (isoDate: string | null | undefined): string => {
  if (!isoDate) return 'No especificado';
  
  try {
    const date = new Date(isoDate);
    
    if (isNaN(date.getTime())) {
      return 'Fecha inválida';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    
    if (diffSeconds < 60) {
      return 'Hace un momento';
    } else if (diffMinutes < 60) {
      return `Hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 30) {
      return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    } else if (diffMonths < 12) {
      return `Hace ${diffMonths} mes${diffMonths !== 1 ? 'es' : ''}`;
    } else {
      return `Hace ${diffYears} año${diffYears !== 1 ? 's' : ''}`;
    }
  } catch (error) {
    return 'Error en fecha';
  }
};

/**
 * Convierte fecha ISO a solo hora
 * @param isoDate - Fecha en formato ISO
 * @returns Hora formateada (ej: "22:04")
 */
export const formatTimeOnly = (isoDate: string | null | undefined): string => {
  if (!isoDate) return 'No especificado';
  
  try {
    const date = new Date(isoDate);
    
    if (isNaN(date.getTime())) {
      return 'Hora inválida';
    }
    
    const venezuelaOffset = -4 * 60;
    const localOffset = date.getTimezoneOffset();
    const totalOffset = venezuelaOffset - localOffset;
    
    const venezuelaDate = new Date(date.getTime() + totalOffset * 60 * 1000);
    
    const hours = venezuelaDate.getHours().toString().padStart(2, '0');
    const minutes = venezuelaDate.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch (error) {
    return 'Error';
  }
};

/**
 * Obtiene la fecha y hora actual en Venezuela
 * @returns Fecha ISO en hora de Venezuela
 */
export const getCurrentVenezuelaTime = (): string => {
  const now = new Date();
  const venezuelaOffset = -4 * 60; // UTC-4
  const localOffset = now.getTimezoneOffset();
  const totalOffset = venezuelaOffset - localOffset;
  
  const venezuelaDate = new Date(now.getTime() + totalOffset * 60 * 1000);
  
  return venezuelaDate.toISOString();
};


/**
 * Formatea una fecha en formato completo legible
 */
export const formatFullDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };

    return date.toLocaleDateString('es-ES', options);
  } catch (error) {
    return 'Fecha inválida';
  }
};
/**
 * Ejemplos de uso:
 * 
 * const isoDate = "2025-11-20T02:04:51.742Z";
 * 
 * formatDateToLocal(isoDate)         // "19/11/2025 22:04"
 * formatDateOnlyToLocal(isoDate)     // "19/11/2025"
 * formatDateToLocalLong(isoDate)     // "19 de noviembre de 2025, 22:04"
 * formatTimeAgo(isoDate)             // "hace 2 horas"
 * formatTimeOnly(isoDate)            // "22:04"
 */