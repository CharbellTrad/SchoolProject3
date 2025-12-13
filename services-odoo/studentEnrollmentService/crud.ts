/**
 * Operaciones CRUD para inscripciones de estudiantes
 * school.student - Inscripción de estudiantes en el año escolar
 */

import * as odooApi from '../apiService';
import { STUDENT_ENROLLMENT_MODEL } from './constants';
import { invalidateStudentEnrollmentsCache } from './loader';
import { NewStudentEnrollment, StudentEnrollmentServiceResult } from './types';

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
