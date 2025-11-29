/**
 * Funciones de carga y lectura de secciones
 */

import * as odooApi from '../apiService';
import { cacheManager } from '../cache/cacheManager';
import { CACHE_KEYS, CACHE_TTL, MODELS, SECTION_FIELDS } from './constants';
import { normalizeSections } from './normalizer';
import { Section, SectionType, SectionsCountByType } from './types';

/**
 * ⚡ Carga todas las secciones (con caché)
 * - ONLINE: Obtiene desde servidor y guarda en caché
 * - OFFLINE: Usa caché si existe
 */
export const loadSections = async (forceReload: boolean = false): Promise<Section[]> => {
  try {
    const cacheKey = CACHE_KEYS.ALL;

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
      'name asc' // ✨ CAMBIO: Ordenar alfabéticamente por nombre
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

    const sections = normalizeSections(result.data || []);

    // Guardar en caché
    cacheManager.set(cacheKey, sections, CACHE_TTL.SECTIONS);

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
    const cached = cacheManager.get<Section[]>(CACHE_KEYS.ALL);
    return cached || [];
  }
};

/**
 * Carga secciones filtradas por tipo
 */
export const loadSectionsByType = async (
  type: SectionType,
  forceReload: boolean = false
): Promise<Section[]> => {
  try {
    const cacheKey = CACHE_KEYS.BY_TYPE(type);

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

    const sections = normalizeSections(result.data || []);
    cacheManager.set(cacheKey, sections, CACHE_TTL.SECTIONS);

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
      'name asc' // ✨ CAMBIO: Ordenar alfabéticamente por nombre
    );

    if (!result.success) return [];

    return normalizeSections(result.data || []);
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
export const getSectionsCountByType = async (): Promise<SectionsCountByType> => {
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
