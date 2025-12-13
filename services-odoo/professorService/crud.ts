/**
 * Operaciones CRUD para profesores asignados
 * school.professor - Asignación de docentes en el año escolar
 */

import * as odooApi from '../apiService';
import { PROFESSOR_MODEL } from './constants';
import { invalidateProfessorsCache } from './loader';
import { NewProfessor, ProfessorServiceResult } from './types';

/**
 * Asigna un nuevo profesor al año escolar actual
 */
export const assignProfessor = async (
    data: NewProfessor
): Promise<ProfessorServiceResult<number>> => {
    try {
        const createData: any = {
            professor_id: data.professorId,
            year_id: data.yearId,
        };

        // Agregar secciones si se especifican
        if (data.sectionIds && data.sectionIds.length > 0) {
            createData.section_ids = [[6, 0, data.sectionIds]];
        }

        const result = await odooApi.create(PROFESSOR_MODEL, createData);

        if (!result.success) {
            // Ignorar errores de sesión - manejados por requestHandler
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al asignar el profesor',
            };
        }

        invalidateProfessorsCache();

        return {
            success: true,
            data: result.data,
            message: 'Profesor asignado exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en assignProfessor:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al asignar el profesor',
        };
    }
};

/**
 * Actualiza un profesor asignado (secciones)
 */
export const updateProfessor = async (
    id: number,
    data: Partial<{
        sectionIds: number[];
    }>
): Promise<ProfessorServiceResult> => {
    try {
        const updateData: any = {};

        if (data.sectionIds !== undefined) {
            updateData.section_ids = [[6, 0, data.sectionIds]]; // Replace all
        }

        const result = await odooApi.update(PROFESSOR_MODEL, [id], updateData);

        if (!result.success) {
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al actualizar el profesor',
            };
        }

        invalidateProfessorsCache();

        return {
            success: true,
            message: 'Profesor actualizado exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en updateProfessor:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al actualizar el profesor',
        };
    }
};

/**
 * Elimina un profesor asignado
 * Nota: Solo si no tiene materias/evaluaciones asignadas
 */
export const deleteProfessor = async (
    id: number
): Promise<ProfessorServiceResult> => {
    try {
        const result = await odooApi.deleteRecords(PROFESSOR_MODEL, [id]);

        if (!result.success) {
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al eliminar el profesor',
            };
        }

        invalidateProfessorsCache();

        return {
            success: true,
            message: 'Profesor eliminado exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en deleteProfessor:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al eliminar el profesor',
        };
    }
};
