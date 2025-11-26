import * as odooApi from '../apiService';
import { CacheKeys, cacheManager, withCache } from '../cache/cacheManager';
import { ENROLLMENT_TYPES, MODELS, PARENT_FIELDS } from './constants';
import { normalizeRecord, prepareParentForOdoo } from './normalizer';
import type { Parent, PersonServiceResult } from './types';

/**
 * Carga todos los padres/representantes (con caché)
 */
export const loadParents = async (): Promise<Parent[]> => {
  try {
    return await withCache(
      CacheKeys.parents(),
      async () => {
        const domain = [ ['type_enrollment', '=', ENROLLMENT_TYPES.PARENT], ['is_enrollment', '=', true] ];
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
      },
      5 * 60 * 1000 // 5 minutos
    );
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error obteniendo representantes:', error.message);
    }
    return [];
  }
};

/**
 * Busca padres por nombre o cédula (con caché por query)
 * ✅ SOLO busca contactos que sean PADRES (type_enrollment='parent' y is_enrollment=true)
 */
export const searchParents = async (query: string): Promise<Parent[]> => {
  try {
    if (!query || query.trim().length < 3) {
      return [];
    }

    const normalizedQuery = query.trim().toLowerCase();

    return await withCache(
      CacheKeys.parentSearch(normalizedQuery),
      async () => {
        // ✅ Dominio actualizado: SOLO buscar representantes
        const domain = [
          ['type_enrollment', '=', ENROLLMENT_TYPES.PARENT],
          ['is_enrollment', '=', true],
          '|',
          ['name', 'ilike', query],
          ['vat', 'ilike', query]
        ];
        
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
      },
      2 * 60 * 1000 // 2 minutos (búsquedas cambian frecuentemente)
    );
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en searchParents:', error);
    }
    return [];
  }
};

/**
 * Crea un nuevo padre/representante (con invalidación de caché)
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

    // ✅ Invalidar cachés relevantes
    cacheManager.invalidate(CacheKeys.parents());
    cacheManager.invalidatePattern('parent:search:'); // Invalida todas las búsquedas

    if (__DEV__) {
      console.log('✅ Padre creado, caché invalidado');
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
 * Actualiza un padre/representante existente (optimizado)
 */
export const updateParent = async (
  id: number,
  parentData: Partial<Parent>
): Promise<PersonServiceResult<Parent>> => {
  try {
    if (__DEV__) {
      console.time(`⏱️ updateParent:${id}`);
    }

    // Excluir campos calculados
    const { age, avatar_128, ...validData } = parentData;

    // Preparar datos para Odoo
    const preparedValues = prepareParentForOdoo(validData);

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

    const updatedParent = normalizeRecord(readResult.data[0]);

    // ✅ Actualización inteligente del caché
    const cachedParents = cacheManager.get<Parent[]>(CacheKeys.parents());
    if (cachedParents) {
      const index = cachedParents.findIndex(p => p.id === id);
      if (index !== -1) {
        cachedParents[index] = updatedParent;
        cacheManager.set(CacheKeys.parents(), cachedParents, 5 * 60 * 1000);
      }
    }

    // Invalidar cachés específicos
    cacheManager.invalidate(CacheKeys.parent(id));
    cacheManager.invalidatePattern('parent:search:');

    if (__DEV__) {
      console.timeEnd(`⏱️ updateParent:${id}`);
    }

    return {
      success: true,
      data: updatedParent,
      parent: updatedParent,
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
 * Elimina un padre/representante (con limpieza de caché)
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

    // ✅ Limpiar caché
    cacheManager.invalidate(CacheKeys.parents());
    cacheManager.invalidate(CacheKeys.parent(id));
    cacheManager.invalidatePattern('parent:search:');

    if (__DEV__) {
      console.log('✅ Padre eliminado, caché limpiado');
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