/**
 * Hook para gestión de inscripciones de estudiantes (Operaciones Diarias)
 * Maneja estado, carga, búsqueda y operaciones CRUD para school.student
 */

import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services-odoo/authService';
import type { StudentEnrollment } from '../services-odoo/studentEnrollmentService';
import * as studentEnrollmentService from '../services-odoo/studentEnrollmentService';

interface UseStudentEnrollmentsResult {
    enrollments: StudentEnrollment[];
    loading: boolean;
    initialLoading: boolean;
    refreshing: boolean;
    searchQuery: string;
    searchMode: boolean;
    totalEnrollments: number;
    isOfflineMode: boolean;
    // Conteos por estado
    countByState: { draft: number; done: number; cancel: number };
    // Funciones
    setSearchQuery: (query: string) => void;
    exitSearchMode: () => void;
    onRefresh: () => Promise<void>;
    handleDelete: (id: number) => Promise<void>;
    handleConfirm: (id: number) => Promise<void>;
}

export const useStudentEnrollments = (): UseStudentEnrollmentsResult => {
    const [enrollments, setEnrollments] = useState<StudentEnrollment[]>([]);
    const [allEnrollments, setAllEnrollments] = useState<StudentEnrollment[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [totalEnrollments, setTotalEnrollments] = useState(0);
    const [countByState, setCountByState] = useState({ draft: 0, done: 0, cancel: 0 });

    const loadInitialEnrollments = useCallback(async () => {
        try {
            if (__DEV__) {
                console.log('🔄 Cargando inscripciones de estudiantes actuales...');
            }

            const serverHealth = await authService.checkServerHealth();
            const isOffline = !serverHealth.ok;
            setIsOfflineMode(isOffline);

            const enrollmentsData = await studentEnrollmentService.loadCurrentStudentEnrollments(!isOffline);
            setAllEnrollments(enrollmentsData);
            setEnrollments(enrollmentsData);
            setTotalEnrollments(enrollmentsData.length);

            if (!isOffline) {
                const counts = await studentEnrollmentService.getCurrentEnrollmentsCountByState();
                setCountByState({ draft: counts.draft, done: counts.done, cancel: counts.cancel });
                setTotalEnrollments(counts.total);
            }

            if (__DEV__) {
                console.log(`✅ ${enrollmentsData.length} inscripciones cargadas`);
            }
        } catch (error) {
            if (__DEV__) {
                console.error('❌ Error en carga inicial:', error);
            }
            setIsOfflineMode(true);
        } finally {
            setInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialEnrollments();
    }, [loadInitialEnrollments]);

    useEffect(() => {
        const performSearch = () => {
            if (searchQuery.trim().length === 0) {
                setSearchMode(false);
                setEnrollments(allEnrollments);
                return;
            }

            setSearchMode(true);
            setLoading(true);

            try {
                const query = searchQuery.toLowerCase().trim();
                const results = allEnrollments.filter(enrollment => {
                    return enrollment.name.toLowerCase().includes(query) ||
                        enrollment.studentName.toLowerCase().includes(query) ||
                        enrollment.sectionName.toLowerCase().includes(query);
                });
                setEnrollments(results);
            } catch (error) {
                if (__DEV__) {
                    console.error('❌ Error en búsqueda:', error);
                }
                setEnrollments([]);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(performSearch, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, allEnrollments]);

    const exitSearchMode = useCallback(() => {
        setSearchQuery('');
        setSearchMode(false);
        setEnrollments(allEnrollments);
    }, [allEnrollments]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            const serverHealth = await authService.checkServerHealth();
            const isOffline = !serverHealth.ok;
            setIsOfflineMode(isOffline);

            if (isOffline) return;

            const enrollmentsData = await studentEnrollmentService.loadCurrentStudentEnrollments(true);
            setAllEnrollments(enrollmentsData);

            if (!searchMode) {
                setEnrollments(enrollmentsData);
            }

            const counts = await studentEnrollmentService.getCurrentEnrollmentsCountByState();
            setCountByState({ draft: counts.draft, done: counts.done, cancel: counts.cancel });
            setTotalEnrollments(counts.total);
        } catch (error) {
            if (__DEV__) {
                console.error('❌ Error en refresh:', error);
            }
        } finally {
            setRefreshing(false);
        }
    }, [searchMode]);

    const handleDelete = useCallback(async (id: number) => {
        try {
            const result = await studentEnrollmentService.deleteStudentEnrollment(id);

            if (result.success) {
                setAllEnrollments(prev => prev.filter(e => e.id !== id));
                setEnrollments(prev => prev.filter(e => e.id !== id));
                setTotalEnrollments(prev => prev - 1);
                await onRefresh();
            } else {
                throw new Error(result.message || 'Error al eliminar');
            }
        } catch (error: any) {
            if (__DEV__) {
                console.error('❌ Error eliminando inscripción:', error);
            }
            throw error;
        }
    }, [onRefresh]);

    const handleConfirm = useCallback(async (id: number) => {
        try {
            const result = await studentEnrollmentService.confirmStudentEnrollment(id);

            if (result.success) {
                await onRefresh();
            } else {
                throw new Error(result.message || 'Error al confirmar inscripción');
            }
        } catch (error: any) {
            if (__DEV__) {
                console.error('❌ Error confirmando inscripción:', error);
            }
            throw error;
        }
    }, [onRefresh]);

    return {
        enrollments,
        loading,
        initialLoading,
        refreshing,
        searchQuery,
        searchMode,
        totalEnrollments,
        isOfflineMode,
        countByState,
        setSearchQuery,
        exitSearchMode,
        onRefresh,
        handleDelete,
        handleConfirm,
    };
};
