/**
 * Operaciones CRUD para secciones inscritas
 * school.section - Inscripción de secciones en el año escolar
 */

import * as odooApi from '../apiService';
import { ENROLLED_SECTION_MODEL } from './constants';
import { invalidateEnrolledSectionsCache } from './loader';
import { EnrolledSectionServiceResult, NewEnrolledSection } from './types';

/**
 * Inscribe una nueva sección en el año escolar actual
 */
export const enrollSection = async (
    data: NewEnrolledSection
): Promise<EnrolledSectionServiceResult<number>> => {
    try {
        const createData: any = {
            year_id: data.yearId,
            section_id: data.sectionId,
        };

        // Add professor_ids if provided (for pre/primary sections)
        if (data.professorIds && data.professorIds.length > 0) {
            createData.professor_ids = [[6, 0, data.professorIds]]; // Replace all
        }

        const result = await odooApi.create(ENROLLED_SECTION_MODEL, createData);

        if (!result.success) {
            // Ignorar errores de sesión - manejados por requestHandler
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al inscribir la sección',
            };
        }

        invalidateEnrolledSectionsCache();

        return {
            success: true,
            data: result.data,
            message: 'Sección inscrita exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en enrollSection:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al inscribir la sección',
        };
    }
};

/**
 * Actualiza una sección inscrita
 * Nota: Generalmente solo se puede cambiar profesores/materias
 */
export const updateEnrolledSection = async (
    id: number,
    data: Partial<{
        professorIds: number[];
    }>
): Promise<EnrolledSectionServiceResult> => {
    try {
        const updateData: any = {};

        // Solo permitir actualizar profesores (para pre/primary)
        if (data.professorIds !== undefined) {
            updateData.professor_ids = [[6, 0, data.professorIds]]; // Replace all
        }

        const result = await odooApi.update(ENROLLED_SECTION_MODEL, [id], updateData);

        if (!result.success) {
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al actualizar la sección',
            };
        }

        invalidateEnrolledSectionsCache();

        return {
            success: true,
            message: 'Sección actualizada exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en updateEnrolledSection:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al actualizar la sección',
        };
    }
};

/**
 * Elimina una sección inscrita
 * Nota: Solo si no tiene estudiantes/materias/evaluaciones
 */
export const deleteEnrolledSection = async (
    id: number
): Promise<EnrolledSectionServiceResult> => {
    try {
        const result = await odooApi.deleteRecords(ENROLLED_SECTION_MODEL, [id]);

        if (!result.success) {
            // result.error is now a string from requestHandler
            const errorMessage = result.error || 'Error al eliminar la sección';

            if (__DEV__) {
                console.error('❌ Error de Odoo:', errorMessage);
            }

            // Check for session errors
            if (typeof errorMessage === 'string' && (
                errorMessage.includes('Session expired') ||
                errorMessage.includes('Odoo Session Expired'))) {
                return { success: false, message: errorMessage };
            }

            return {
                success: false,
                message: typeof errorMessage === 'string' ? errorMessage : 'Error al eliminar la sección',
            };
        }

        invalidateEnrolledSectionsCache();

        return {
            success: true,
            message: 'Sección eliminada exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en deleteEnrolledSection:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al eliminar la sección',
        };
    }
};

