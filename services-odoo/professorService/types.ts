/**
 * Tipos e interfaces para el servicio de profesores asignados (school.professor)
 * Operaciones Diarias - Docentes Asignados del año actual
 */

export interface Professor {
    id: number;
    name: string;
    professorId: number;        // hr.employee ID
    professorName: string;      // hr.employee name
    yearId: number;             // school.year ID
    yearName: string;
    sectionIds: number[];       // Many2many school.section
    sectionNames: string[];
    subjectIds: number[];       // Materias que tiene asignadas (a través de school.subject)
    current: boolean;           // from year_id.current
    sectionsCount: number;
    subjectsCount: number;
}

export interface ProfessorServiceResult<T = any> {
    success: boolean;
    message?: string;
    data?: T;
}

export type NewProfessor = {
    professorId: number;  // hr.employee ID
    yearId: number;
    sectionIds?: number[];
};

export interface ProfessorFilters {
    yearId?: number;
    current?: boolean;
}
