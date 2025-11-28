import { formatDateToOdoo } from '../../utils/formatHelpers';
import { compressMultipleImages } from '../../utils/imageCompression';
import * as odooApi from '../apiService';
import { CacheKeys, cacheManager } from '../cache/cacheManager';
import { optimisticManager } from '../cache/optimisticUpdates';
import { ENROLLMENT_TYPES, MODELS, STUDENT_FIELDS } from './constants';
import { invalidateStudentsPaginationCache } from './loader';
import { normalizeRecord, prepareStudentForOdoo } from './normalizer';
import type { PersonServiceResult, Student } from './types';

/**
 * Crea un nuevo estudiante con actualización optimista y compresión
 */
export const saveStudent = async (
  student: Omit<Student, 'id'>
): Promise<PersonServiceResult<Student>> => {
  // ⚡ 1. Actualización optimista - UI instantánea
  const { tempId, rollback } = optimisticManager.createStudentOptimistic(student);
  
  if (__DEV__) {
    console.time(`⏱️ saveStudent (background sync)`);
  }

  try {
    // 🗜️ 2. Comprimir imágenes en paralelo
    const imagesToCompress: Record<string, string> = {};
    
    if (student.image_1920) imagesToCompress.image_1920 = student.image_1920;
    if (student.ci_document) imagesToCompress.ci_document = student.ci_document;
    if (student.born_document) imagesToCompress.born_document = student.born_document;
    
    const compressedImages = await compressMultipleImages(imagesToCompress);

    // 3. Preparar datos para Odoo
    const values: any = {
      type_enrollment: ENROLLMENT_TYPES.STUDENT,
      is_enrollment: true,
      name: student.name,
      vat: student.vat,
      nationality: student.nationality,
      born_date: formatDateToOdoo(student.born_date),
      sex: student.sex,
      blood_type: student.blood_type,
      email: student.email,
      phone: student.phone || false,
      resident_number: student.resident_number || false,
      emergency_phone_number: student.emergency_phone_number,
      street: student.street,
      student_lives: student.student_lives,
      sizes_json: student.sizes_json || {},
      suffer_illness_treatment: student.suffer_illness_treatment,
      what_illness_treatment: student.what_illness_treatment,
      authorize_primary_atention: student.authorize_primary_atention,
      pregnat_finished: student.pregnat_finished,
      gestation_time: student.gestation_time,
      peso_al_nacer: student.peso_al_nacer,
      born_complication: student.born_complication,
      complication: student.complication,
      parents_ids: [[6, 0, student.parents_ids]],
      ci_document_filename: student.ci_document_filename,
      brown_folder: student.brown_folder,
      boletin_informative: student.boletin_informative,
      born_document_filename: student.born_document_filename,
      is_active: student.is_active,
      image_1920: compressedImages.image_1920 || false,
      ci_document: compressedImages.ci_document || false,
      born_document: compressedImages.born_document || false,
    };

    // 4. Crear en Odoo
    const createResult = await odooApi.create(MODELS.PARTNER, values);

    if (!createResult.success) {
      rollback();
      
      if (createResult.error?.isSessionExpired) {
        return { success: false, message: 'Tu sesión ha expirado' };
      }
      return { success: false, message: odooApi.extractOdooErrorMessage(createResult.error) };
    }

    // 5. Leer estudiante creado
    const newId = createResult.data;
    const readResult = await odooApi.read(MODELS.PARTNER, [newId!], STUDENT_FIELDS);

    if (!readResult.success || !readResult.data) {
      rollback();
      return { success: false, message: 'Error al leer el estudiante creado' };
    }

    const newStudent = normalizeRecord(readResult.data[0]);

    // ✅ 6. Reemplazar temporal por real
    optimisticManager.replaceTempStudent(tempId, newStudent);

    // 🔥 7. INVALIDAR CACHÉ DE PAGINACIÓN
    invalidateStudentsPaginationCache();

    if (__DEV__) {
      console.timeEnd(`⏱️ saveStudent (background sync)`);
      console.log('✅ Estudiante creado y sincronizado');
    }

    return {
      success: true,
      data: newStudent,
      student: newStudent,
      message: 'Estudiante registrado exitosamente',
    };
  } catch (error: any) {
    rollback();
    return { success: false, message: odooApi.extractOdooErrorMessage(error) };
  }
};

/**
 * ⚡ ACTUALIZA ESTUDIANTE CON INVALIDACIÓN INMEDIATA DE CACHÉ
 */
export const updateStudent = async (
  id: number,
  studentData: Partial<Student>
): Promise<PersonServiceResult<Student>> => {
  // ⚡ 1. Actualización optimista - UI instantánea
  const { rollback } = optimisticManager.updateStudentOptimistic(id, studentData);

  if (__DEV__) {
    console.time(`⏱️ updateStudent:${id}`);
  }

  try {
    // Excluir campos calculados
    const {
      parents,
      inscriptions,
      age,
      avatar_128,
      current_height,
      current_weight,
      current_size_shirt,
      current_size_pants,
      current_size_shoes,
      inscription_ids,
      ...validData
    } = studentData;

    const values: any = { ...validData };

    // Convertir fecha si existe
    if (values.born_date) {
      values.born_date = formatDateToOdoo(values.born_date);
    }

    // 🗜️ 2. Comprimir imágenes si hay nuevas
    const imagesToCompress: Record<string, string> = {};
    
    if (values.image_1920 && typeof values.image_1920 === 'string') {
      imagesToCompress.image_1920 = values.image_1920;
    }
    if (values.ci_document && typeof values.ci_document === 'string') {
      imagesToCompress.ci_document = values.ci_document;
    }
    if (values.born_document && typeof values.born_document === 'string') {
      imagesToCompress.born_document = values.born_document;
    }

    if (Object.keys(imagesToCompress).length > 0) {
      const compressedImages = await compressMultipleImages(imagesToCompress);
      
      Object.assign(values, compressedImages);
    }

    // 3. Preparar datos para Odoo
    const preparedValues = prepareStudentForOdoo(values);

    // 4. Actualización en Odoo
    const updateResult = await odooApi.update(MODELS.PARTNER, [id], preparedValues);

    if (!updateResult.success) {
      rollback();
      
      if (updateResult.error?.isSessionExpired) {
        return { success: false, message: 'Tu sesión ha expirado' };
      }
      return { success: false, message: odooApi.extractOdooErrorMessage(updateResult.error) };
    }

    // 5. Leer datos actualizados
    const readResult = await odooApi.read(MODELS.PARTNER, [id], STUDENT_FIELDS);

    if (!readResult.success || !readResult.data) {
      rollback();
      return { success: false, message: 'Error al leer el estudiante actualizado' };
    }

    const updatedStudent = normalizeRecord(readResult.data[0]);

    // ✅ 6. Actualizar caché de paginación
    const cachedResult = cacheManager.get<any>(`${CacheKeys.students()}_page_1_size_10`);
    if (cachedResult?.students) {
      const index = cachedResult.students.findIndex((s: Student) => s.id === id);
      if (index !== -1) {
        cachedResult.students[index] = updatedStudent;
        cacheManager.set(`${CacheKeys.students()}_page_1_size_10`, cachedResult, 5 * 60 * 1000);
      }
    }

    // 🔥 7. INVALIDAR TODOS LOS CACHÉS RELACIONADOS
    cacheManager.invalidate(CacheKeys.student(id));
    cacheManager.invalidate(CacheKeys.studentParents(id));
    cacheManager.invalidate(CacheKeys.studentInscriptions(id));
    invalidateStudentsPaginationCache();

    if (__DEV__) {
      console.timeEnd(`⏱️ updateStudent:${id}`);
      console.log('✅ Estudiante actualizado y caché invalidado');
    }

    return {
      success: true,
      data: updatedStudent,
      message: 'Estudiante actualizado exitosamente',
    };
  } catch (error: any) {
    rollback();
    if (__DEV__) {
      console.error('❌ Error en updateStudent:', error);
    }
    return { success: false, message: odooApi.extractOdooErrorMessage(error) };
  }
};

/**
 * Elimina un estudiante con actualización optimista
 */
export const deleteStudent = async (id: number): Promise<PersonServiceResult> => {
  try {
    if (__DEV__) {
      console.time(`⏱️ deleteStudent:${id}`);
    }

    const studentResult = await odooApi.read(MODELS.PARTNER, [id], ['inscription_ids', 'parents_ids']);

    if (!studentResult.success || !studentResult.data || studentResult.data.length === 0) {
      if (studentResult.error?.isSessionExpired) {
        return { success: false, message: 'Tu sesión ha expirado' };
      }
      return { success: false, message: 'Estudiante no encontrado' };
    }

    const student = studentResult.data[0];

    // Verificar inscripciones activas
    if (student.inscription_ids && student.inscription_ids.length > 0) {
      const inscriptionsResult = await odooApi.read(
        MODELS.INSCRIPTION,
        student.inscription_ids,
        ['id', 'state', 'name']
      );

      if (inscriptionsResult.success && inscriptionsResult.data) {
        const activeInscriptions = inscriptionsResult.data.filter((insc: any) => insc.state === 'done');

        if (activeInscriptions.length > 0) {
          const inscriptionNames = activeInscriptions.map((insc: any) => insc.name).join(', ');
          return {
            success: false,
            message: `No se puede eliminar el estudiante porque tiene ${activeInscriptions.length} inscripción(es) activa(s): ${inscriptionNames}.`,
          };
        }

        // Eliminar evaluaciones e inscripciones
        await Promise.all(student.inscription_ids.map(async (inscriptionId: number) => {
          try {
            const evaluationsResult = await odooApi.searchRead(
              'school.evaluation.score',
              [['student_id', '=', inscriptionId]],
              ['id'],
              1000
            );

            if (evaluationsResult.success && evaluationsResult.data && evaluationsResult.data.length > 0) {
              const evaluationIds = evaluationsResult.data.map((e: any) => e.id);
              await odooApi.deleteRecords('school.evaluation.score', evaluationIds);
            }
          } catch (evalError) {
            if (__DEV__) console.error(`⚠️ Error eliminando evaluaciones:`, evalError);
          }
        }));

        await odooApi.deleteRecords(MODELS.INSCRIPTION, student.inscription_ids);
      }
    }

    // Procesar padres
    if (student.parents_ids && student.parents_ids.length > 0) {
      await Promise.all(student.parents_ids.map(async (parentId: number) => {
        try {
          const parentResult = await odooApi.read(MODELS.PARTNER, [parentId], ['students_ids', 'name']);
          if (parentResult.success && parentResult.data && parentResult.data.length > 0) {
            const parentData = parentResult.data[0];
            const studentsIds = parentData.students_ids || [];
            if (studentsIds.length === 1 && studentsIds[0] === id) {
              await odooApi.deleteRecords(MODELS.PARTNER, [parentId]);
            }
          }
        } catch (parentError) {
          if (__DEV__) console.error(`⚠️ Error procesando padre:`, parentError);
        }
      }));
    }

    // ⚡ Actualización optimista ANTES de eliminar
    const { rollback } = optimisticManager.deleteStudentOptimistic(id);

    // Eliminar el estudiante
    const deleteResult = await odooApi.deleteRecords(MODELS.PARTNER, [id]);

    if (!deleteResult.success) {
      rollback();
      
      if (deleteResult.error?.isSessionExpired) {
        return { success: false, message: 'Tu sesión ha expirado' };
      }
      return { success: false, message: odooApi.extractOdooErrorMessage(deleteResult.error) };
    }

    // ✅ Limpiar caché
    cacheManager.invalidate(CacheKeys.student(id));
    cacheManager.invalidatePattern(`student:${id}:`);
    invalidateStudentsPaginationCache();

    if (__DEV__) {
      console.timeEnd(`⏱️ deleteStudent:${id}`);
      console.log('✅ Estudiante eliminado y caché limpiado');
    }

    return { success: true, message: 'Estudiante eliminado exitosamente' };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error fatal en deleteStudent:', error);
    }
    return { success: false, message: odooApi.extractOdooErrorMessage(error) };
  }
};