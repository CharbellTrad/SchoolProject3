/**
 * Operaciones CRUD para inscripciones de estudiantes
 * school.student - Inscripción de estudiantes en el año escolar
 */

import * as odooApi from '../apiService';
import { STUDENT_ENROLLMENT_MODEL } from './constants';
import { invalidateStudentEnrollmentsCache } from './loader';
import {
    Mention,
    MentionEnrollmentData,
    NewStudentEnrollment,
    StudentEnrollmentServiceResult,
    UnenrollmentData,
} from './types';

/**
 * Crea una nueva inscripción de estudiante
 */
export const createStudentEnrollment = async (
    data: NewStudentEnrollment
): Promise<StudentEnrollmentServiceResult<number>> => {
    try {
        const createData: any = {
            year_id: data.yearId,
            section_id: data.sectionId,
            student_id: data.studentId,
        };

        if (data.parentId) {
            createData.parent_id = data.parentId;
        }
        if (data.fromSchool) {
            createData.from_school = data.fromSchool;
        }
        if (data.observations) {
            createData.observations = data.observations;
        }

        const result = await odooApi.create(STUDENT_ENROLLMENT_MODEL, createData);

        if (!result.success) {
            // Ignorar errores de sesión - manejados por requestHandler
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al crear la inscripción',
            };
        }

        invalidateStudentEnrollmentsCache();

        return {
            success: true,
            data: result.data,
            message: 'Inscripción creada exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en createStudentEnrollment:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al crear la inscripción',
        };
    }
};

/**
 * Actualiza una inscripción de estudiante
 */
export const updateStudentEnrollment = async (
    id: number,
    data: Partial<{
        sectionId: number;
        parentId: number;
        fromSchool: string;
        observations: string;
    }>
): Promise<StudentEnrollmentServiceResult> => {
    try {
        const updateData: any = {};

        if (data.sectionId !== undefined) {
            updateData.section_id = data.sectionId;
        }
        if (data.parentId !== undefined) {
            updateData.parent_id = data.parentId;
        }
        if (data.fromSchool !== undefined) {
            updateData.from_school = data.fromSchool;
        }
        if (data.observations !== undefined) {
            updateData.observations = data.observations;
        }

        const result = await odooApi.update(STUDENT_ENROLLMENT_MODEL, [id], updateData);

        if (!result.success) {
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al actualizar la inscripción',
            };
        }

        invalidateStudentEnrollmentsCache();

        return {
            success: true,
            message: 'Inscripción actualizada exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en updateStudentEnrollment:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al actualizar la inscripción',
        };
    }
};

/**
 * Inscribe al estudiante (cambia estado de draft a done)
 * Llama al método validate_inscription de Odoo
 */
export const confirmStudentEnrollment = async (
    id: number
): Promise<StudentEnrollmentServiceResult> => {
    try {
        const result = await odooApi.callMethod(
            STUDENT_ENROLLMENT_MODEL,
            'validate_inscription',
            [[id]]
        );

        if (!result.success) {
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al confirmar la inscripción',
            };
        }

        invalidateStudentEnrollmentsCache();

        return {
            success: true,
            message: 'Estudiante inscrito exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en confirmStudentEnrollment:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al confirmar la inscripción',
        };
    }
};

/**
 * Elimina una inscripción (solo si está en borrador)
 */
export const deleteStudentEnrollment = async (
    id: number
): Promise<StudentEnrollmentServiceResult> => {
    try {
        const result = await odooApi.deleteRecords(STUDENT_ENROLLMENT_MODEL, [id]);

        if (!result.success) {
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al eliminar la inscripción',
            };
        }

        invalidateStudentEnrollmentsCache();

        return {
            success: true,
            message: 'Inscripción eliminada exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en deleteStudentEnrollment:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al eliminar la inscripción',
        };
    }
};

// =====================================================
// OPERACIONES DE DESINSCRIPCIÓN (Wizard)
// =====================================================

const UNINSCRIPTION_WIZARD_MODEL = 'school.uninscription.wizard';

/**
 * Ejecuta el wizard de desinscripción
 * Crea el wizard, establece los datos y ejecuta la acción
 */
export const unenrollStudent = async (
    data: UnenrollmentData
): Promise<StudentEnrollmentServiceResult> => {
    try {
        // Crear el wizard de desinscripción
        const wizardData: any = {
            student_id: data.studentEnrollmentId,
            uninscription_reason: data.reason,
        };

        if (data.document1) {
            wizardData.uninscription_doc_1 = data.document1.data;
            wizardData.uninscription_doc_1_filename = data.document1.name;
        }
        if (data.document2) {
            wizardData.uninscription_doc_2 = data.document2.data;
            wizardData.uninscription_doc_2_filename = data.document2.name;
        }
        if (data.document3) {
            wizardData.uninscription_doc_3 = data.document3.data;
            wizardData.uninscription_doc_3_filename = data.document3.name;
        }

        const createResult = await odooApi.create(UNINSCRIPTION_WIZARD_MODEL, wizardData);

        if (!createResult.success) {
            return {
                success: false,
                message: createResult.error || 'Error al crear el wizard de desinscripción',
            };
        }

        const wizardId = createResult.data;

        // Ejecutar la acción de confirmación del wizard
        const confirmResult = await odooApi.callMethod(
            UNINSCRIPTION_WIZARD_MODEL,
            'action_confirm_uninscription',
            [[wizardId]]
        );

        if (!confirmResult.success) {
            return {
                success: false,
                message: confirmResult.error || 'Error al confirmar la desinscripción',
            };
        }

        invalidateStudentEnrollmentsCache();

        return {
            success: true,
            message: 'Estudiante desinscrito exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en unenrollStudent:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al desinscribir al estudiante',
        };
    }
};

// =====================================================
// OPERACIONES DE MENCIÓN (Wizard)
// =====================================================

const MENTION_WIZARD_MODEL = 'school.mention.inscription.wizard';
const MENTION_MODEL = 'school.mention';

/**
 * Carga las menciones disponibles
 */
export const loadMentions = async (): Promise<Mention[]> => {
    try {
        const result = await odooApi.searchRead(
            MENTION_MODEL,
            [],
            ['id', 'name', 'code'],
            100,
            0,
            'name asc'
        );

        if (!result.success) {
            return [];
        }

        return (result.data || []).map((record: any) => ({
            id: record.id,
            name: record.name || '',
            code: record.code || '',
        }));
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error en loadMentions:', error);
        }
        return [];
    }
};

/**
 * Inscribe al estudiante en una mención técnica
 * Ejecuta el wizard de inscripción en mención
 */
export const enrollStudentInMention = async (
    data: MentionEnrollmentData
): Promise<StudentEnrollmentServiceResult> => {
    try {
        // Crear el wizard de inscripción en mención
        const wizardData: any = {
            student_id: data.studentEnrollmentId,
            mention_id: data.mentionId,
            parent_representative_id: data.parentId,
            parent_signature: data.parentSignature,
            signature_date: data.signatureDate,
        };

        if (data.observations) {
            wizardData.observations = data.observations;
        }

        const createResult = await odooApi.create(MENTION_WIZARD_MODEL, wizardData);

        if (!createResult.success) {
            return {
                success: false,
                message: createResult.error || 'Error al crear el wizard de inscripción en mención',
            };
        }

        const wizardId = createResult.data;

        // Ejecutar la acción de confirmación del wizard
        const confirmResult = await odooApi.callMethod(
            MENTION_WIZARD_MODEL,
            'action_confirm_inscription',
            [[wizardId]]
        );

        if (!confirmResult.success) {
            return {
                success: false,
                message: confirmResult.error || 'Error al confirmar la inscripción en mención',
            };
        }

        invalidateStudentEnrollmentsCache();

        return {
            success: true,
            message: 'Estudiante inscrito en mención exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en enrollStudentInMention:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al inscribir en mención',
        };
    }
};

/**
 * Retira al estudiante de una mención técnica
 */
export const withdrawStudentFromMention = async (
    studentEnrollmentId: number
): Promise<StudentEnrollmentServiceResult> => {
    try {
        const result = await odooApi.callMethod(
            STUDENT_ENROLLMENT_MODEL,
            'action_withdraw_mention',
            [[studentEnrollmentId]]
        );

        if (!result.success) {
            return {
                success: false,
                message: result.error || 'Error al retirar de la mención',
            };
        }

        invalidateStudentEnrollmentsCache();

        return {
            success: true,
            message: 'Estudiante retirado de la mención',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en withdrawStudentFromMention:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al retirar de la mención',
        };
    }
};

