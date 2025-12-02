/**
 * Operaciones CRUD para materias
 */

import * as odooApi from '../apiService';
import { cacheManager } from '../cache/cacheManager';
import { MODELS, SUBJECT_FIELDS } from './constants';
import { prepareMany2ManyCommand } from './helpers';
import { normalizeSubject } from './normalizer';
import { NewSubject, Subject, SubjectServiceResult } from './types';

/**
 * Invalida todo el caché de materias
 */
const invalidateSubjectsCache = (): void => {
  cacheManager.invalidatePattern('subject');
  if (__DEV__) {
    console.log('🗑️ Caché de materias invalidado');
  }
};

/**
 * Crea una nueva materia
 */
export const createSubject = async (
  subjectData: NewSubject
): Promise<SubjectServiceResult<Subject>> => {
  try {
    if (__DEV__) {
      console.time('⏱️ createSubject');
    }

    // Preparar valores para Odoo
    const values: any = {
      name: subjectData.name.trim(),
      section_ids: prepareMany2ManyCommand(subjectData.section_ids),
      professor_ids: prepareMany2ManyCommand(subjectData.professor_ids),
    };

    const createResult = await odooApi.create(MODELS.SUBJECT, values);

    if (!createResult.success) {
      if (createResult.error?.isSessionExpired) {
        return { success: false, message: 'Tu sesión ha expirado' };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(createResult.error),
      };
    }

    // Leer la materia creada
    const newId = createResult.data;
    const readResult = await odooApi.read(MODELS.SUBJECT, [newId!], SUBJECT_FIELDS);

    if (!readResult.success || !readResult.data) {
      return { success: false, message: 'Error al leer la materia creada' };
    }

    const newSubject = normalizeSubject(readResult.data[0]);

    // Invalidar caché
    invalidateSubjectsCache();

    if (__DEV__) {
      console.timeEnd('⏱️ createSubject');
      console.log('✅ Materia creada');
    }

    return {
      success: true,
      data: newSubject,
      subject: newSubject,
      message: 'Materia creada exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en createSubject:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Actualiza una materia existente
 */
export const updateSubject = async (
  id: number,
  subjectData: Partial<Subject>
): Promise<SubjectServiceResult<Subject>> => {
  try {
    if (__DEV__) {
      console.time(`⏱️ updateSubject:${id}`);
    }

    const values: any = {};

    if (subjectData.name !== undefined) {
      values.name = subjectData.name.trim();
    }
    
    if (subjectData.section_ids !== undefined) {
      values.section_ids = prepareMany2ManyCommand(subjectData.section_ids);
    }
    
    if (subjectData.professor_ids !== undefined) {
      values.professor_ids = prepareMany2ManyCommand(subjectData.professor_ids);
    }

    const updateResult = await odooApi.update(MODELS.SUBJECT, [id], values);

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
    const readResult = await odooApi.read(MODELS.SUBJECT, [id], SUBJECT_FIELDS);

    if (!readResult.success || !readResult.data) {
      return { success: false, message: 'Error al leer la materia actualizada' };
    }

    const updatedSubject = normalizeSubject(readResult.data[0]);

    // Invalidar caché
    invalidateSubjectsCache();

    if (__DEV__) {
      console.timeEnd(`⏱️ updateSubject:${id}`);
      console.log('✅ Materia actualizada');
    }

    return {
      success: true,
      data: updatedSubject,
      subject: updatedSubject,
      message: 'Materia actualizada exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en updateSubject:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Elimina una materia
 */
export const deleteSubject = async (id: number): Promise<SubjectServiceResult> => {
  try {
    if (__DEV__) {
      console.time(`⏱️ deleteSubject:${id}`);
    }

    const deleteResult = await odooApi.deleteRecords(MODELS.SUBJECT, [id]);

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
    invalidateSubjectsCache();

    if (__DEV__) {
      console.timeEnd(`⏱️ deleteSubject:${id}`);
      console.log('✅ Materia eliminada');
    }

    return {
      success: true,
      message: 'Materia eliminada exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en deleteSubject:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Asigna secciones a una materia (reemplaza las existentes)
 */
export const assignSectionsToSubject = async (
  subjectId: number,
  sectionIds: number[]
): Promise<SubjectServiceResult> => {
  try {
    const values = {
      section_ids: prepareMany2ManyCommand(sectionIds),
    };

    const result = await odooApi.update(MODELS.SUBJECT, [subjectId], values);

    if (!result.success) {
      if (result.error?.isSessionExpired) {
        return { success: false, message: 'Tu sesión ha expirado' };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(result.error),
      };
    }

    // Invalidar caché
    invalidateSubjectsCache();

    if (__DEV__) {
      console.log(`✅ Secciones asignadas a materia ${subjectId}`);
    }

    return {
      success: true,
      message: 'Secciones asignadas exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en assignSectionsToSubject:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Asigna profesores a una materia (reemplaza los existentes)
 */
export const assignProfessorsToSubject = async (
  subjectId: number,
  professorIds: number[]
): Promise<SubjectServiceResult> => {
  try {
    const values = {
      professor_ids: prepareMany2ManyCommand(professorIds),
    };

    const result = await odooApi.update(MODELS.SUBJECT, [subjectId], values);

    if (!result.success) {
      if (result.error?.isSessionExpired) {
        return { success: false, message: 'Tu sesión ha expirado' };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(result.error),
      };
    }

    // Invalidar caché
    invalidateSubjectsCache();

    if (__DEV__) {
      console.log(`✅ Profesores asignados a materia ${subjectId}`);
    }

    return {
      success: true,
      message: 'Profesores asignados exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en assignProfessorsToSubject:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};