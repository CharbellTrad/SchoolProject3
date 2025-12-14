/**
 * Loader para empleados (hr.employee)
 * Usado para obtener empleados que pueden ser asignados como docentes
 */

import * as odooApi from '../apiService';

export const EMPLOYEE_MODEL = 'hr.employee';

export interface Employee {
    id: number;
    name: string;
    workEmail?: string;
    imageUrl?: string;
    departmentName?: string;
    jobTitle?: string;
}

interface EmployeeRaw {
    id: number;
    name: string;
    work_email: string | false;
    image_128: string | false;
    department_id: [number, string] | false;
    job_title: string | false;
}

const EMPLOYEE_FIELDS = [
    'id',
    'name',
    'work_email',
    'image_128',
    'department_id',
    'job_title',
];

/**
 * Normaliza un empleado de Odoo
 */
const normalizeEmployee = (raw: EmployeeRaw): Employee => ({
    id: raw.id,
    name: raw.name || '',
    workEmail: raw.work_email || undefined,
    imageUrl: raw.image_128
        ? `data:image/png;base64,${raw.image_128}`
        : undefined,
    departmentName: Array.isArray(raw.department_id) ? raw.department_id[1] : undefined,
    jobTitle: raw.job_title || undefined,
});

/**
 * Carga todos los empleados activos
 */
export const loadEmployees = async (forceRefresh: boolean = false): Promise<Employee[]> => {
    try {
        const result = await odooApi.searchRead(EMPLOYEE_MODEL, [], EMPLOYEE_FIELDS);

        if (!result.success || !Array.isArray(result.data)) {
            if (__DEV__) {
                console.error('❌ Error loading employees:', result.error);
            }
            return [];
        }

        return result.data.map(normalizeEmployee);
    } catch (error) {
        if (__DEV__) {
            console.error('❌ Error in loadEmployees:', error);
        }
        return [];
    }
};
