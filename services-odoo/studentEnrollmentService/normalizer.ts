/**
 * Normalizador para inscripciones de estudiantes
 * Transforma datos de Odoo al formato de la app
 */

import { GeneralPerformanceData, StudentEnrollment } from './types';

/**
 * Normaliza un registro de inscripción de estudiante de Odoo
 */
export function normalizeStudentEnrollment(record: any): StudentEnrollment {
    // Extraer year_id
    let yearId = 0;
    let yearName = '';
    if (Array.isArray(record.year_id) && record.year_id.length >= 2) {
        yearId = record.year_id[0];
        yearName = record.year_id[1];
    }

    // Extraer section_id
    let sectionId = 0;
    let sectionName = '';
    if (Array.isArray(record.section_id) && record.section_id.length >= 2) {
        sectionId = record.section_id[0];
        sectionName = record.section_id[1];
    }

    // Extraer student_id (res.partner)
    let studentId = 0;
    let studentName = '';
    if (Array.isArray(record.student_id) && record.student_id.length >= 2) {
        studentId = record.student_id[0];
        studentName = record.student_id[1];
    }

    // Extraer parent_id
    let parentId: number | undefined;
    let parentName: string | undefined;
    if (Array.isArray(record.parent_id) && record.parent_id.length >= 2) {
        parentId = record.parent_id[0];
        parentName = record.parent_id[1];
    }

    // Extraer mention_id
    let mentionId: number | undefined;
    let mentionName: string | undefined;
    if (Array.isArray(record.mention_id) && record.mention_id.length >= 2) {
        mentionId = record.mention_id[0];
        mentionName = record.mention_id[1];
    }

    return {
        id: record.id,
        name: record.name || '',
        displayName: record.display_name || record.name || studentName,
        yearId,
        yearName,
        sectionId,
        sectionName,
        studentId,
        studentName,
        type: record.type || 'primary',
        state: record.state || 'draft',
        current: record.current || false,
        inscriptionDate: record.inscription_date || undefined,
        uninscriptionDate: record.uninscription_date || undefined,
        fromSchool: record.from_school || undefined,
        observations: record.observations || undefined,
        parentId,
        parentName,
        mentionId,
        mentionName,
        mentionState: record.mention_state || undefined,
        generalPerformanceJson: record.general_performance_json as GeneralPerformanceData | undefined,
    };
}

/**
 * Normaliza múltiples registros de inscripciones de estudiantes
 */
export function normalizeStudentEnrollments(records: any[]): StudentEnrollment[] {
    if (!Array.isArray(records)) return [];
    return records.map(normalizeStudentEnrollment);
}
