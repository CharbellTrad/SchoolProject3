/**
 * Operaciones CRUD para evaluaciones
 * school.evaluation - Evaluaciones en el año escolar
 */

import * as odooApi from '../apiService';
import { EVALUATION_MODEL } from './constants';
import { invalidateEvaluationsCache } from './loader';
import { EvaluationServiceResult, NewEvaluation } from './types';

/**
 * Crea una nueva evaluación
 */
export const createEvaluation = async (
    data: NewEvaluation
): Promise<EvaluationServiceResult<number>> => {
    try {
        const createData: any = {
            name: data.name,
            description: data.description,
            evaluation_date: data.evaluationDate,
            year_id: data.yearId,
            professor_id: data.professorId,
            section_id: data.sectionId,
        };

        if (data.subjectId) {
            createData.subject_id = data.subjectId;
        }

        const result = await odooApi.create(EVALUATION_MODEL, createData);

        if (!result.success) {
            // Ignorar errores de sesión - manejados por requestHandler
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al crear la evaluación',
            };
        }

        invalidateEvaluationsCache();

        return {
            success: true,
            data: result.data,
            message: 'Evaluación creada exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en createEvaluation:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al crear la evaluación',
        };
    }
};

/**
 * Actualiza una evaluación
 */
export const updateEvaluation = async (
    id: number,
    data: Partial<{
        name: string;
        description: string;
        evaluationDate: string;
        professorId: number;
        sectionId: number;
        subjectId: number;
    }>
): Promise<EvaluationServiceResult> => {
    try {
        const updateData: any = {};

        if (data.name !== undefined) {
            updateData.name = data.name;
        }
        if (data.description !== undefined) {
            updateData.description = data.description;
        }
        if (data.evaluationDate !== undefined) {
            updateData.evaluation_date = data.evaluationDate;
        }
        if (data.professorId !== undefined) {
            updateData.professor_id = data.professorId;
        }
        if (data.sectionId !== undefined) {
            updateData.section_id = data.sectionId;
        }
        if (data.subjectId !== undefined) {
            updateData.subject_id = data.subjectId;
        }

        const result = await odooApi.update(EVALUATION_MODEL, [id], updateData);

        if (!result.success) {
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al actualizar la evaluación',
            };
        }

        invalidateEvaluationsCache();

        return {
            success: true,
            message: 'Evaluación actualizada exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en updateEvaluation:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al actualizar la evaluación',
        };
    }
};

/**
 * Elimina una evaluación
 * Nota: Solo si no tiene puntajes registrados
 */
export const deleteEvaluation = async (
    id: number
): Promise<EvaluationServiceResult> => {
    try {
        const result = await odooApi.deleteRecords(EVALUATION_MODEL, [id]);

        if (!result.success) {
            if (result.error?.includes('Session expired') ||
                result.error?.includes('Odoo Session Expired')) {
                return { success: false, message: result.error };
            }
            return {
                success: false,
                message: result.error || 'Error al eliminar la evaluación',
            };
        }

        invalidateEvaluationsCache();

        return {
            success: true,
            message: 'Evaluación eliminada exitosamente',
        };
    } catch (error: any) {
        if (__DEV__) {
            console.error('❌ Error en deleteEvaluation:', error);
        }
        return {
            success: false,
            message: error?.message || 'Error al eliminar la evaluación',
        };
    }
};
