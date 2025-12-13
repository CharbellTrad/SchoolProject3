/**
 * Normalizador para profesores asignados
 * Transforma datos de Odoo al formato de la app
 */

import { Professor } from './types';

/**
 * Normaliza un registro de profesor asignado de Odoo
 */
export function normalizeProfessor(record: any): Professor {
    // Extraer IDs de Many2many
    const sectionIds = Array.isArray(record.section_ids) ? record.section_ids : [];
    const subjectIds = Array.isArray(record.subject_ids) ? record.subject_ids : [];

    // Extraer professor_id (hr.employee) - puede ser [id, name] o falso
    let professorId = 0;
    let professorName = '';
    if (Array.isArray(record.professor_id) && record.professor_id.length >= 2) {
        professorId = record.professor_id[0];
        professorName = record.professor_id[1];
    }

    // Extraer year_id
    let yearId = 0;
    let yearName = '';
    if (Array.isArray(record.year_id) && record.year_id.length >= 2) {
        yearId = record.year_id[0];
        yearName = record.year_id[1];
    }

    return {
        id: record.id,
        name: record.name || professorName,
        professorId,
        professorName,
        yearId,
        yearName,
        sectionIds,
        sectionNames: [], // Se cargan bajo demanda
        subjectIds,
        current: record.current || false,
        sectionsCount: sectionIds.length,
        subjectsCount: subjectIds.length,
    };
}

/**
 * Normaliza múltiples registros de profesores asignados
 */
export function normalizeProfessors(records: any[]): Professor[] {
    if (!Array.isArray(records)) return [];
    return records.map(normalizeProfessor);
}
