import * as odooApi from '../apiService';
import { ENROLLMENT_TYPES, MODELS, PARENT_FIELDS } from './constants';
import { normalizeRecord, prepareParentForOdoo } from './normalizer';
import type { Parent, PersonServiceResult } from './types';

/**
 * Carga todos los padres/representantes
 */
export const loadParents = async (): Promise<Parent[]> => {
  try {
    const domain = [['type_enrollment', '=', ENROLLMENT_TYPES.PARENT]];
    const result = await odooApi.searchRead(MODELS.PARTNER, domain, PARENT_FIELDS, 1000);

    if (!result.success) {
      if (result.error?.isSessionExpired) {
        return [];
      }
      if (__DEV__) {
        console.error('Error obteniendo representantes:', result.error);
      }
      return [];
    }

    const records = result.data || [];
    return records.map(normalizeRecord);
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error obteniendo representantes:', error.message);
    }
    return [];
  }
};

/**
 * Busca padres por nombre o cédula
 */
export const searchParents = async (query: string): Promise<Parent[]> => {
  try {
    const domain = ['|', ['name', 'ilike', query], ['vat', 'ilike', query]];
    const searchResult = await odooApi.search(MODELS.PARTNER, domain, 20);

    if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
      return [];
    }

    const parentIds = searchResult.data;
    const parentsResult = await odooApi.read(MODELS.PARTNER, parentIds, PARENT_FIELDS);

    if (!parentsResult.success || !parentsResult.data) {
      return [];
    }

    return parentsResult.data.map(normalizeRecord);
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en searchParents:', error);
    }
    return [];
  }
};

/**
 * Crea un nuevo padre/representante
 */
export const saveParent = async (
  parent: Omit<Parent, 'id'>
): Promise<PersonServiceResult<Parent>> => {
  try {
    const values: any = {
      type_enrollment: ENROLLMENT_TYPES.PARENT,
      is_enrollment: true,
      name: parent.name,
      vat: parent.vat,
      nationality: parent.nationality,
      born_date: parent.born_date,
      sex: parent.sex,
      email: parent.email,
      phone: parent.phone || false,
      resident_number: parent.resident_number || false,
      emergency_phone_number: parent.emergency_phone_number || false,
      street: parent.street,
      live_with_student: parent.live_with_student,
      active_job: parent.active_job,
      job_place: parent.job_place,
      job: parent.job,
      students_ids: [[6, 0, parent.students_ids]],
      ci_document: parent.ci_document,
      ci_document_filename: parent.ci_document_filename,
      image_1920: parent.image_1920,
      parent_singnature: parent.parent_singnature,
      active: parent.active,
    };

    const createResult = await odooApi.create(MODELS.PARTNER, values);

    if (!createResult.success) {
      if (createResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(createResult.error),
      };
    }

    const newId = createResult.data;
    const readResult = await odooApi.read(MODELS.PARTNER, [newId!], PARENT_FIELDS);

    if (!readResult.success || !readResult.data) {
      return {
        success: false,
        message: 'Error al leer el representante creado',
      };
    }

    return {
      success: true,
      data: normalizeRecord(readResult.data[0]),
      parent: normalizeRecord(readResult.data[0]),
      message: 'Representante registrado exitosamente',
    };
  } catch (error: any) {
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Actualiza un padre/representante existente
 */
export const updateParent = async (
  id: number,
  parentData: Partial<Parent>
): Promise<PersonServiceResult<Parent>> => {
  try {
    if (__DEV__) {
      console.log('📝 Datos recibidos para actualizar padre:', Object.keys(parentData));
    }

    // Excluir campos calculados localmente
    const { age, avatar_128, ...validData } = parentData;

    if (__DEV__) {
      console.log('✅ Campos válidos para Odoo:', Object.keys(validData));
    }

    // Preparar datos para Odoo
    const preparedValues = prepareParentForOdoo(validData);

    if (__DEV__) {
      console.log('🚀 Enviando a Odoo:', Object.keys(preparedValues));
    }

    const updateResult = await odooApi.update(MODELS.PARTNER, [id], preparedValues);

    if (!updateResult.success) {
      if (updateResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(updateResult.error),
      };
    }

    const readResult = await odooApi.read(MODELS.PARTNER, [id], PARENT_FIELDS);

    if (!readResult.success || !readResult.data) {
      return {
        success: false,
        message: 'Error al leer el representante actualizado',
      };
    }

    return {
      success: true,
      data: normalizeRecord(readResult.data[0]),
      parent: normalizeRecord(readResult.data[0]),
      message: 'Representante actualizado exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en updateParent:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Elimina un padre/representante
 */
export const deleteParent = async (id: number): Promise<PersonServiceResult> => {
  try {
    const deleteResult = await odooApi.deleteRecords(MODELS.PARTNER, [id]);

    if (!deleteResult.success) {
      if (deleteResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(deleteResult.error),
      };
    }

    return {
      success: true,
      message: 'Representante eliminado exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en deleteParent:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};