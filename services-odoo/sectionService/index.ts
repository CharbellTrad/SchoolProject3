/**
 * Servicio para gestión de secciones escolares
 * Modelo Odoo: school.register.section
 */

import * as odooApi from '../apiService';
import { cacheManager } from '../cache/cacheManager';

// ============ CONSTANTES ============

const MODELS = {
  SECTION: 'school.register.section',
  SUBJECT: 'school.register.subject',
} as const;

const SECTION_FIELDS = [
  'id',
  'name',
  'type',
];

const SECTION_TYPE_LABELS: Record<string, string> = {
  pre: 'Preescolar',
  primary: 'Primaria',
  secundary: 'Media General',
};

// ============ TIPOS ============

export interface Section {
  id: number;
  name: string;
  type: 'pre' | 'primary' | 'secundary';
}

export interface SectionServiceResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  section?: Section;
}

export type NewSection = Omit<Section, 'id' | 'subjects'>;

// ============ NORMALIZACIÓN ============

const normalizeSection = (record: any): Section => {
  return {
    id: record.id,
    name: record.name || '',
    type: record.type || 'primary',
  };
};

// ============ HELPERS ============

/**
 * Formatea el tipo de sección para visualización
 */
export const formatSectionType = (type: string | null | undefined): string => {
  if (!type) return 'No especificado';
  return SECTION_TYPE_LABELS[type] || type;
};

/**
 * Invalida todo el caché de secciones
 */
const invalidateSectionsCache = (): void => {
  cacheManager.invalidatePattern('section');
  if (__DEV__) {
    console.log('🗑️ Caché de secciones invalidado');
  }
};

// ============ OPERACIONES DE LECTURA ============

/**
 * ⚡ Carga todas las secciones (con caché)
 * - ONLINE: Obtiene desde servidor y guarda en caché
 * - OFFLINE: Usa caché si existe
 */
export const loadSections = async (forceReload: boolean = false): Promise<Section[]> => {
  try {
    const cacheKey = 'sections:all';

    // Solo usar caché si no es reload forzado
    if (!forceReload) {
      const cached = cacheManager.get<Section[]>(cacheKey);
      if (cached && cached.length > 0) {
        if (__DEV__) {
          console.log(`📦 Usando caché: ${cached.length} secciones`);
        }
        return cached;
      }
    }

    if (__DEV__) {
      console.time('⏱️ loadSections');
    }

    const result = await odooApi.searchRead(
      MODELS.SECTION,
      [],
      SECTION_FIELDS,
      1000,
      0,
      'type asc, name asc'
    );

    if (!result.success) {
      if (__DEV__) {
        console.error('❌ Error cargando secciones:', result.error);
      }
      
      // Fallback a caché en caso de error
      const cached = cacheManager.get<Section[]>(cacheKey);
      if (cached) {
        if (__DEV__) {
          console.log(`📦 Usando caché por error: ${cached.length} secciones`);
        }
        return cached;
      }
      
      return [];
    }

    const sections = (result.data || []).map(normalizeSection);

    // Guardar en caché
    cacheManager.set(cacheKey, sections, 10 * 60 * 1000); // 10 minutos

    if (__DEV__) {
      console.timeEnd('⏱️ loadSections');
      console.log(`✅ ${sections.length} secciones cargadas`);
    }

    return sections;
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en loadSections:', error);
    }
    
    // Fallback a caché
    const cached = cacheManager.get<Section[]>('sections:all');
    return cached || [];
  }
};

/**
 * Carga secciones filtradas por tipo
 */
export const loadSectionsByType = async (
  type: 'pre' | 'primary' | 'secundary',
  forceReload: boolean = false
): Promise<Section[]> => {
  try {
    const cacheKey = `sections:type:${type}`;

    if (!forceReload) {
      const cached = cacheManager.get<Section[]>(cacheKey);
      if (cached) {
        if (__DEV__) {
          console.log(`📦 Usando caché: ${cached.length} secciones tipo ${type}`);
        }
        return cached;
      }
    }

    const result = await odooApi.searchRead(
      MODELS.SECTION,
      [['type', '=', type]],
      SECTION_FIELDS,
      1000,
      0,
      'name asc'
    );

    if (!result.success) {
      const cached = cacheManager.get<Section[]>(cacheKey);
      return cached || [];
    }

    const sections = (result.data || []).map(normalizeSection);
    cacheManager.set(cacheKey, sections, 10 * 60 * 1000);

    return sections;
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error en loadSectionsByType:', error);
    }
    return [];
  }
};
/**
 * Busca secciones por nombre
 */
export const searchSections = async (query: string): Promise<Section[]> => {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const domain = [['name', 'ilike', query]];

    const result = await odooApi.searchRead(
      MODELS.SECTION,
      domain,
      SECTION_FIELDS,
      50,
      0,
      'type asc, name asc'
    );

    if (!result.success) return [];

    return (result.data || []).map(normalizeSection);
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error en searchSections:', error);
    }
    return [];
  }
};

/**
 * Obtiene el conteo de secciones por tipo
 */
export const getSectionsCountByType = async (): Promise<{
  pre: number;
  primary: number;
  secundary: number;
  total: number;
}> => {
  try {
    const [preCount, primaryCount, secundaryCount] = await Promise.all([
      odooApi.searchCount(MODELS.SECTION, [['type', '=', 'pre']]),
      odooApi.searchCount(MODELS.SECTION, [['type', '=', 'primary']]),
      odooApi.searchCount(MODELS.SECTION, [['type', '=', 'secundary']]),
    ]);

    const pre = preCount.success ? (preCount.data || 0) : 0;
    const primary = primaryCount.success ? (primaryCount.data || 0) : 0;
    const secundary = secundaryCount.success ? (secundaryCount.data || 0) : 0;

    return {
      pre,
      primary,
      secundary,
      total: pre + primary + secundary,
    };
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error obteniendo conteos:', error);
    }
    return { pre: 0, primary: 0, secundary: 0, total: 0 };
  }
};

// ============ OPERACIONES DE ESCRITURA ============

/**
 * Crea una nueva sección con actualización optimista
 */
export const createSection = async (
  sectionData: NewSection
): Promise<SectionServiceResult<Section>> => {
  // ⚡ Actualización optimista - UI instantánea
  const tempId = Date.now();
  const tempSection: Section = {
    ...sectionData,
    id: tempId,
  };

  try {
    if (__DEV__) {
      console.time('⏱️ createSection');
    }

    const values: any = {
      name: sectionData.name,
      type: sectionData.type,
    };

    const createResult = await odooApi.create(MODELS.SECTION, values);

    if (!createResult.success) {
      if (createResult.error?.isSessionExpired) {
        return { success: false, message: 'Tu sesión ha expirado' };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(createResult.error),
      };
    }

    // Leer la sección creada
    const newId = createResult.data;
    const readResult = await odooApi.read(MODELS.SECTION, [newId!], SECTION_FIELDS);

    if (!readResult.success || !readResult.data) {
      return { success: false, message: 'Error al leer la sección creada' };
    }

    const newSection = normalizeSection(readResult.data[0]);

    // Invalidar caché
    invalidateSectionsCache();

    if (__DEV__) {
      console.timeEnd('⏱️ createSection');
      console.log('✅ Sección creada');
    }

    return {
      success: true,
      data: newSection,
      section: newSection,
      message: 'Sección creada exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en createSection:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Actualiza una sección existente
 */
export const updateSection = async (
  id: number,
  sectionData: Partial<Section>
): Promise<SectionServiceResult<Section>> => {
  try {
    if (__DEV__) {
      console.time(`⏱️ updateSection:${id}`);
    }

    const values: any = {};

    if (sectionData.name !== undefined) values.name = sectionData.name;
    if (sectionData.type !== undefined) values.type = sectionData.type;

    const updateResult = await odooApi.update(MODELS.SECTION, [id], values);

    if (!updateResult.success) {
      if (updateResult.error?.isSessionExpired) {
        return { success: false, message: 'Tu sesión ha expirado' };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(updateResult.error),
      };
    }

    // Leer datos actualizados
    const readResult = await odooApi.read(MODELS.SECTION, [id], SECTION_FIELDS);

    if (!readResult.success || !readResult.data) {
      return { success: false, message: 'Error al leer la sección actualizada' };
    }

    const updatedSection = normalizeSection(readResult.data[0]);

    // Invalidar caché
    invalidateSectionsCache();

    if (__DEV__) {
      console.timeEnd(`⏱️ updateSection:${id}`);
      console.log('✅ Sección actualizada');
    }

    return {
      success: true,
      data: updatedSection,
      section: updatedSection,
      message: 'Sección actualizada exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en updateSection:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Elimina una sección
 */
export const deleteSection = async (id: number): Promise<SectionServiceResult> => {
  try {
    if (__DEV__) {
      console.time(`⏱️ deleteSection:${id}`);
    }

    const deleteResult = await odooApi.deleteRecords(MODELS.SECTION, [id]);

    if (!deleteResult.success) {
      if (deleteResult.error?.isSessionExpired) {
        return { success: false, message: 'Tu sesión ha expirado' };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(deleteResult.error),
      };
    }

    // Invalidar caché
    invalidateSectionsCache();

    if (__DEV__) {
      console.timeEnd(`⏱️ deleteSection:${id}`);
      console.log('✅ Sección eliminada');
    }

    return {
      success: true,
      message: 'Sección eliminada exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en deleteSection:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

// ============ EXPORTACIONES ============

export default {
  loadSections,
  loadSectionsByType,
  searchSections,
  getSectionsCountByType,
  createSection,
  updateSection,
  deleteSection,
  formatSectionType,
};