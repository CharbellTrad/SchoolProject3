/**
 * Normalizador para secciones inscritas
 * Transforma datos de Odoo al formato de la app
 */

import { EnrolledSection, StudentsAverageData, SubjectsAverageData, TopStudentsData } from './types';

/**
 * Normaliza un registro de sección inscrita de Odoo
 */
export function normalizeEnrolledSection(record: any): EnrolledSection {
    // Extraer IDs de Many2many/One2many
    const professorIds = Array.isArray(record.professor_ids) ? record.professor_ids : [];
    const subjectIds = Array.isArray(record.subject_ids) ? record.subject_ids : [];
    const studentIds = Array.isArray(record.student_ids) ? record.student_ids : [];

    // Extraer year_id (puede ser [id, name] o falso)
    let yearId = 0;
    let yearName = '';
    if (Array.isArray(record.year_id) && record.year_id.length >= 2) {
        yearId = record.year_id[0];
        yearName = record.year_id[1];
    }

    // Extraer section_id base (school.register.section)
    let sectionId = 0;
    let sectionName = '';
    if (Array.isArray(record.section_id) && record.section_id.length >= 2) {
        sectionId = record.section_id[0];
        sectionName = record.section_id[1];
    }

    return {
        id: record.id,
        name: record.name || '',
        yearId,
        yearName,
        sectionId,
        sectionName,
        type: record.type || 'primary',
        current: record.current || false,
        professorIds,
        professorNames: [], // Se cargan bajo demanda
        subjectIds,
        studentIds,
        studentsCount: studentIds.length,
        subjectsCount: subjectIds.length,
        professorsCount: professorIds.length,
        subjectsAverageJson: record.subjects_average_json as SubjectsAverageData | undefined,
        studentsAverageJson: record.students_average_json as StudentsAverageData | undefined,
        topStudentsJson: record.top_students_json as TopStudentsData | undefined,
    };
}

/**
 * Normaliza múltiples registros de secciones inscritas
 */
export function normalizeEnrolledSections(records: any[]): EnrolledSection[] {
    if (!Array.isArray(records)) return [];
    return records.map(normalizeEnrolledSection);
}
