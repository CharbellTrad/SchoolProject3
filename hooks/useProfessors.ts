/**
 * Hook para gestión de profesores asignados (Operaciones Diarias)
 * Maneja estado, carga, búsqueda y operaciones CRUD para school.professor
 */

import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services-odoo/authService';
import type { Professor } from '../services-odoo/professorService';
import * as professorService from '../services-odoo/professorService';

interface UseProfessorsResult {
    professors: Professor[];
    loading: boolean;
    initialLoading: boolean;
    refreshing: boolean;
    searchQuery: string;
    searchMode: boolean;
    totalProfessors: number;
    isOfflineMode: boolean;
    // Funciones
    setSearchQuery: (query: string) => void;
    exitSearchMode: () => void;
    onRefresh: () => Promise<void>;
    handleDelete: (id: number) => Promise<void>;
}

export const useProfessors = (): UseProfessorsResult => {
    const [professors, setProfessors] = useState<Professor[]>([]);
    const [allProfessors, setAllProfessors] = useState<Professor[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [totalProfessors, setTotalProfessors] = useState(0);

    const loadInitialProfessors = useCallback(async () => {
        try {
            if (__DEV__) {
                console.log('🔄 Cargando profesores asignados actuales...');
            }

            const serverHealth = await authService.checkServerHealth();
            const isOffline = !serverHealth.ok;
            setIsOfflineMode(isOffline);

            const professorsData = await professorService.loadCurrentProfessors(!isOffline);
            setAllProfessors(professorsData);
            setProfessors(professorsData);
            setTotalProfessors(professorsData.length);

            if (!isOffline) {
                const count = await professorService.getCurrentProfessorsCount();
                setTotalProfessors(count);
            }

            if (__DEV__) {
                console.log(`✅ ${professorsData.length} profesores cargados`);
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
        loadInitialProfessors();
    }, [loadInitialProfessors]);

    useEffect(() => {
        const performSearch = () => {
            if (searchQuery.trim().length === 0) {
                setSearchMode(false);
                setProfessors(allProfessors);
                return;
            }

            setSearchMode(true);
            setLoading(true);

            try {
                const query = searchQuery.toLowerCase().trim();
                const results = allProfessors.filter(professor => {
                    return professor.name.toLowerCase().includes(query) ||
                        professor.professorName.toLowerCase().includes(query);
                });
                setProfessors(results);
            } catch (error) {
                if (__DEV__) {
                    console.error('❌ Error en búsqueda:', error);
                }
                setProfessors([]);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(performSearch, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, allProfessors]);

    const exitSearchMode = useCallback(() => {
        setSearchQuery('');
        setSearchMode(false);
        setProfessors(allProfessors);
    }, [allProfessors]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            const serverHealth = await authService.checkServerHealth();
            const isOffline = !serverHealth.ok;
            setIsOfflineMode(isOffline);

            if (isOffline) return;

            const professorsData = await professorService.loadCurrentProfessors(true);
            setAllProfessors(professorsData);

            if (!searchMode) {
                setProfessors(professorsData);
            }

            const count = await professorService.getCurrentProfessorsCount();
            setTotalProfessors(count);
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
            const result = await professorService.deleteProfessor(id);

            if (result.success) {
                setAllProfessors(prev => prev.filter(p => p.id !== id));
                setProfessors(prev => prev.filter(p => p.id !== id));
                setTotalProfessors(prev => prev - 1);
                await onRefresh();
            } else {
                throw new Error(result.message || 'Error al eliminar');
            }
        } catch (error: any) {
            if (__DEV__) {
                console.error('❌ Error eliminando profesor:', error);
            }
            throw error;
        }
    }, [onRefresh]);

    return {
        professors,
        loading,
        initialLoading,
        refreshing,
        searchQuery,
        searchMode,
        totalProfessors,
        isOfflineMode,
        setSearchQuery,
        exitSearchMode,
        onRefresh,
        handleDelete,
    };
};
