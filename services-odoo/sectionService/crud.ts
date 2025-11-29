/**
 * Operaciones CRUD para secciones
 */

import * as odooApi from '../apiService';
import { cacheManager } from '../cache/cacheManager';
import { MODELS, SECTION_FIELDS } from './constants';
import { normalizeSection } from './normalizer';
import { NewSection, Section, SectionServiceResult } from './types';

/**
 * Invalida todo el caché de secciones
 */
const invalidateSectionsCache = (): void => {
  cacheManager.invalidatePattern('section');
  if (__DEV__) {
    console.log('🗑️ Caché de secciones invalidado');
  }
};

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
