import { formatDateToOdoo } from '../../utils/formatHelpers';
import * as odooApi from '../apiService';
import { ENROLLMENT_TYPES, MODELS, STUDENT_FIELDS } from './constants';
import { normalizeRecord, prepareStudentForOdoo } from './normalizer';
import type { PersonServiceResult, Student } from './types';

/**
 * Crea un nuevo estudiante en Odoo
 */
export const saveStudent = async (
  student: Omit<Student, 'id'>
): Promise<PersonServiceResult<Student>> => {
  try {
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
      ci_document: student.ci_document,
      ci_document_filename: student.ci_document_filename,
      brown_folder: student.brown_folder,
      boletin_informative: student.boletin_informative,
      born_document: student.born_document,
      born_document_filename: student.born_document_filename,
      image_1920: student.image_1920,
      is_active: student.is_active,
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
    const readResult = await odooApi.read(MODELS.PARTNER, [newId!], STUDENT_FIELDS);

    if (!readResult.success || !readResult.data) {
      return {
        success: false,
        message: 'Error al leer el estudiante creado',
      };
    }

    return {
      success: true,
      data: normalizeRecord(readResult.data[0]),
      student: normalizeRecord(readResult.data[0]),
      message: 'Estudiante registrado exitosamente',
    };
  } catch (error: any) {
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Actualiza un estudiante existente
 */
export const updateStudent = async (
  id: number,
  studentData: Partial<Student>
): Promise<PersonServiceResult<Student>> => {
  try {
    if (__DEV__) {
      console.log('📝 Datos recibidos para actualizar:', Object.keys(studentData));
    }

    // Excluir campos que no existen en Odoo o son calculados localmente
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

    if (__DEV__) {
      console.log('✅ Campos válidos para Odoo:', Object.keys(validData));
    }

    const values: any = { ...validData };

    // Convertir fecha si existe
    if (values.born_date) {
      values.born_date = formatDateToOdoo(values.born_date);
    }

    // Preparar datos para Odoo
    const preparedValues = prepareStudentForOdoo(values);

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

    const readResult = await odooApi.read(MODELS.PARTNER, [id], STUDENT_FIELDS);

    if (!readResult.success || !readResult.data) {
      return {
        success: false,
        message: 'Error al leer el estudiante actualizado',
      };
    }

    return {
      success: true,
      data: normalizeRecord(readResult.data[0]),
      message: 'Estudiante actualizado exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en updateStudent:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Elimina un estudiante y sus datos relacionados
 */
export const deleteStudent = async (id: number): Promise<PersonServiceResult> => {
  try {
    // Leer información del estudiante
    const studentResult = await odooApi.read(MODELS.PARTNER, [id], ['inscription_ids', 'parents_ids']);

    if (!studentResult.success || !studentResult.data || studentResult.data.length === 0) {
      if (studentResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: 'Estudiante no encontrado',
      };
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
            message: `No se puede eliminar el estudiante porque tiene ${activeInscriptions.length} inscripción(es) activa(s): ${inscriptionNames}.\n\nDebe cancelar o desinscribir al estudiante primero.`,
          };
        }

        // Eliminar evaluaciones de cada inscripción en paralelo
        const evaluationDeletions = student.inscription_ids.map(async (inscriptionId: number) => {
          try {
            const evaluationsResult = await odooApi.searchRead(
              MODELS.EVALUATION,
              [['student_id', '=', inscriptionId]],
              ['id'],
              1000
            );

            if (evaluationsResult.success && evaluationsResult.data && evaluationsResult.data.length > 0) {
              const evaluationIds = evaluationsResult.data.map((e: any) => e.id);
              if (__DEV__) {
                console.log(`🗑️ Eliminando ${evaluationIds.length} evaluaciones de inscripción ${inscriptionId}...`);
              }
              await odooApi.deleteRecords(MODELS.EVALUATION, evaluationIds);
            }
          } catch (evalError) {
            if (__DEV__) {
              console.error(`⚠️ Error eliminando evaluaciones de inscripción ${inscriptionId}:`, evalError);
            }
          }
        });

        await Promise.all(evaluationDeletions);

        // Eliminar inscripciones
        if (__DEV__) {
          console.log(`📋 Eliminando ${student.inscription_ids.length} inscripciones...`);
        }
        await odooApi.deleteRecords(MODELS.INSCRIPTION, student.inscription_ids);
      }
    }

    // Verificar y eliminar padres sin otros hijos en paralelo
    if (student.parents_ids && student.parents_ids.length > 0) {
      const parentDeletions = student.parents_ids.map(async (parentId: number) => {
        try {
          const parentResult = await odooApi.read(MODELS.PARTNER, [parentId], ['students_ids', 'name']);

          if (parentResult.success && parentResult.data && parentResult.data.length > 0) {
            const parentData = parentResult.data[0];
            const studentsIds = parentData.students_ids || [];

            if (studentsIds.length === 1 && studentsIds[0] === id) {
              await odooApi.deleteRecords(MODELS.PARTNER, [parentId]);
              if (__DEV__) {
                console.log(`✅ Padre ${parentData.name} eliminado (no tenía otros hijos)`);
              }
            }
          }
        } catch (parentError) {
          if (__DEV__) {
            console.error(`⚠️ Error procesando padre ${parentId}:`, parentError);
          }
        }
      });

      await Promise.all(parentDeletions);
    }

    // Eliminar el estudiante
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

    if (__DEV__) {
      console.log('✅ Estudiante eliminado');
    }

    return {
      success: true,
      message: 'Estudiante eliminado exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error fatal en deleteStudent:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};