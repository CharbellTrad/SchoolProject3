/**
 * Drawer Menu Configuration
 * Menu hierarchy based on Odoo menu.xml structure
 * Exact replica of pma_public_school_ve/views/menu.xml
 */

import { Ionicons } from '@expo/vector-icons';

/**
 * Type for menu item icon
 */
export type MenuIcon = keyof typeof Ionicons.glyphMap;

/**
 * Base menu item interface
 */
export interface DrawerMenuItem {
    id: string;
    label: string;
    icon: MenuIcon;
    route?: string;
    disabled?: boolean;
    badge?: number;
}

/**
 * Expandable section with children (recursive - children can have children)
 */
export interface DrawerMenuSection extends DrawerMenuItem {
    children?: (DrawerMenuItem | DrawerMenuSection)[];
    isExpanded?: boolean;
}

/**
 * Complete drawer menu configuration
 * Matches Odoo menu.xml structure exactly
 */
export const DRAWER_MENU: DrawerMenuSection[] = [
    // ===========================================
    // Tablero - Dashboard principal (sequence 10)
    // ===========================================
    {
        id: 'dashboard',
        label: 'Tablero',
        icon: 'grid-outline',
        route: '/admin/dashboard',
    },

    // ===========================================
    // Gestión Académica (sequence 20)
    // ===========================================
    {
        id: 'academic_management',
        label: 'Gestión Académica',
        icon: 'school-outline',
        children: [
            // Operaciones Diarias (sequence 10)
            {
                id: 'daily_operations',
                label: 'Operaciones Diarias',
                icon: 'today-outline',
                children: [
                    {
                        id: 'active_sections',
                        label: 'Secciones Activas',
                        icon: 'layers-outline',
                        route: '/admin/academic-management/daily-operations/sections-list',
                    },
                    {
                        id: 'current_students',
                        label: 'Estudiantes del Año',
                        icon: 'people-outline',
                        route: '/admin/academic-management/daily-operations/students-list',
                    },
                    {
                        id: 'assigned_teachers',
                        label: 'Docentes Asignados',
                        icon: 'person-outline',
                        route: '/admin/academic-management/daily-operations/professors-list',
                    },
                    {
                        id: 'current_evaluations',
                        label: 'Evaluaciones en Curso',
                        icon: 'document-text-outline',
                        route: '/admin/academic-management/daily-operations/evaluations-list',
                    },
                ],
            } as DrawerMenuSection,

            // Registros Históricos (sequence 20)
            {
                id: 'historical_records',
                label: 'Registros Históricos',
                icon: 'time-outline',
                children: [
                    {
                        id: 'past_years',
                        label: 'Años Escolares Pasados',
                        icon: 'calendar-outline',
                        disabled: true, // TODO: Lista de school.year
                    },
                    {
                        id: 'sections_history',
                        label: 'Historial de Secciones',
                        icon: 'layers-outline',
                        disabled: true, // TODO: Todas las school.section
                    },
                    {
                        id: 'students_history',
                        label: 'Historial de Estudiantes',
                        icon: 'people-outline',
                        disabled: true, // TODO: Todos los school.student
                    },
                    {
                        id: 'teachers_history',
                        label: 'Historial de Docentes',
                        icon: 'person-outline',
                        disabled: true, // TODO: Todos los school.professor
                    },
                    {
                        id: 'evaluations_history',
                        label: 'Historial de Evaluaciones',
                        icon: 'document-text-outline',
                        disabled: true, // TODO: Todas las school.evaluation
                    },
                ],
            } as DrawerMenuSection,
        ],
    },

    // ===========================================
    // Control de Asistencias (sequence 30)
    // ===========================================
    {
        id: 'attendance',
        label: 'Asistencias',
        icon: 'checkbox-outline',
        children: [
            {
                id: 'quick_register',
                label: 'Registro Rápido',
                icon: 'flash-outline',
                disabled: true, // TODO: Wizard de registro rápido
            },
            {
                id: 'student_attendance',
                label: 'Estudiantes',
                icon: 'people-outline',
                disabled: true, // TODO: school.attendance type=student
            },
            {
                id: 'staff_attendance',
                label: 'Personal',
                icon: 'person-outline',
                disabled: true, // TODO: school.attendance type=employee
            },
            {
                id: 'all_attendance',
                label: 'Todos los Registros',
                icon: 'list-outline',
                disabled: true, // TODO: Todas las asistencias
            },
        ],
    },

    // ===========================================
    // Planificación y Horarios (sequence 40)
    // ===========================================
    {
        id: 'schedule',
        label: 'Planificación',
        icon: 'calendar-outline',
        children: [
            {
                id: 'calendar_view',
                label: 'Vista de Calendario',
                icon: 'calendar-outline',
                disabled: true, // TODO: Widget de calendario
            },
            {
                id: 'class_schedules',
                label: 'Horarios de Clase',
                icon: 'time-outline',
                disabled: true, // TODO: school.schedule
            },
            {
                id: 'time_blocks',
                label: 'Bloques Horarios',
                icon: 'grid-outline',
                disabled: true, // TODO: school.time.slot
            },
        ],
    },

    // ===========================================
    // Directorio - Personas y Entidades (sequence 50)
    // ===========================================
    {
        id: 'directory',
        label: 'Directorio',
        icon: 'folder-open-outline',
        children: [
            // Estudiantes (res.partner con type_enrollment=student)
            {
                id: 'students_directory',
                label: 'Estudiantes',
                icon: 'people-outline',
                route: '/admin/academic-management/lists-persons/students-list',
            },

            // Personal (subsección con 2 items)
            {
                id: 'staff_directory',
                label: 'Personal',
                icon: 'briefcase-outline',
                children: [
                    {
                        id: 'staff_list',
                        label: 'Personal',
                        icon: 'person-outline',
                        disabled: true, // TODO: hr.employee
                    },
                    {
                        id: 'departments',
                        label: 'Departamentos',
                        icon: 'business-outline',
                        disabled: true, // TODO: hr.department
                    },
                ],
            } as DrawerMenuSection,

            // Configuración (subsección con 4 items)
            {
                id: 'config',
                label: 'Configuración',
                icon: 'settings-outline',
                children: [
                    {
                        id: 'grades_sections',
                        label: 'Grados/Secciones Base',
                        icon: 'layers-outline',
                        route: '/admin/academic-management/section-subject/sections-list',
                    },
                    {
                        id: 'section_letters',
                        label: 'Letras de Sección',
                        icon: 'text-outline',
                        disabled: true, // TODO: school.section.letter
                    },
                    {
                        id: 'subjects_catalog',
                        label: 'Catálogo de Materias',
                        icon: 'book-outline',
                        route: '/admin/academic-management/section-subject/subjects-list',
                    },
                    {
                        id: 'technical_mentions',
                        label: 'Menciones Técnicas',
                        icon: 'ribbon-outline',
                        disabled: true, // TODO: school.mention
                    },
                ],
            } as DrawerMenuSection,
        ],
    },
];

/**
 * Flat list of all routes for quick navigation lookup
 */
export const getAllRoutes = (): { id: string; route: string; label: string }[] => {
    const routes: { id: string; route: string; label: string }[] = [];

    const extractRoutes = (items: (DrawerMenuItem | DrawerMenuSection)[]) => {
        for (const item of items) {
            if (item.route && !item.disabled) {
                routes.push({ id: item.id, route: item.route, label: item.label });
            }
            if ('children' in item && item.children) {
                extractRoutes(item.children);
            }
        }
    };

    extractRoutes(DRAWER_MENU);
    return routes;
};

/**
 * Get menu item by route
 */
export const getMenuByRoute = (route: string): DrawerMenuItem | undefined => {
    const findItem = (items: (DrawerMenuItem | DrawerMenuSection)[]): DrawerMenuItem | undefined => {
        for (const item of items) {
            if (item.route === route) return item;
            if ('children' in item && item.children) {
                const found = findItem(item.children);
                if (found) return found;
            }
        }
        return undefined;
    };
    return findItem(DRAWER_MENU);
};

/**
 * Check if a route is active (including parent sections)
 */
export const isRouteActive = (currentRoute: string, menuRoute?: string): boolean => {
    if (!menuRoute) return false;
    return currentRoute === menuRoute || currentRoute.startsWith(menuRoute + '/');
};
