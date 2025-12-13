/**
 * Hook para gestión de evaluaciones (Operaciones Diarias)
 * Maneja estado, carga, búsqueda y operaciones CRUD para school.evaluation
 */

import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services-odoo/authService';
import type { Evaluation } from '../services-odoo/evaluationService';
import * as evaluationService from '../services-odoo/evaluationService';

interface UseEvaluationsResult {
    evaluations: Evaluation[];
    loading: boolean;
    initialLoading: boolean;
    refreshing: boolean;
    searchQuery: string;
    searchMode: boolean;
    totalEvaluations: number;
    isOfflineMode: boolean;
    // Conteos por estado
    countByState: { all: number; partial: number; draft: number };
    // Funciones
    setSearchQuery: (query: string) => void;
    exitSearchMode: () => void;
    onRefresh: () => Promise<void>;
    handleDelete: (id: number) => Promise<void>;
}

export const useEvaluations = (): UseEvaluationsResult => {
    const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
    const [allEvaluations, setAllEvaluations] = useState<Evaluation[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [totalEvaluations, setTotalEvaluations] = useState(0);
    const [countByState, setCountByState] = useState({ all: 0, partial: 0, draft: 0 });

    const loadInitialEvaluations = useCallback(async () => {
        try {
            if (__DEV__) {
                console.log('🔄 Cargando evaluaciones actuales...');
            }

            const serverHealth = await authService.checkServerHealth();
            const isOffline = !serverHealth.ok;
            setIsOfflineMode(isOffline);

            const evaluationsData = await evaluationService.loadCurrentEvaluations(!isOffline);
            setAllEvaluations(evaluationsData);
            setEvaluations(evaluationsData);
            setTotalEvaluations(evaluationsData.length);

            if (!isOffline) {
                const counts = await evaluationService.getCurrentEvaluationsCountByState();
                setCountByState({ all: counts.all, partial: counts.partial, draft: counts.draft });
                setTotalEvaluations(counts.total);
            }

            if (__DEV__) {
                console.log(`✅ ${evaluationsData.length} evaluaciones cargadas`);
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
        loadInitialEvaluations();
    }, [loadInitialEvaluations]);

    useEffect(() => {
        const performSearch = () => {
            if (searchQuery.trim().length === 0) {
                setSearchMode(false);
                setEvaluations(allEvaluations);
                return;
            }

            setSearchMode(true);
            setLoading(true);

            try {
                const query = searchQuery.toLowerCase().trim();
                const results = allEvaluations.filter(evaluation => {
                    return evaluation.name.toLowerCase().includes(query) ||
                        evaluation.professorName.toLowerCase().includes(query) ||
                        evaluation.sectionName.toLowerCase().includes(query) ||
                        (evaluation.subjectName && evaluation.subjectName.toLowerCase().includes(query));
                });
                setEvaluations(results);
            } catch (error) {
                if (__DEV__) {
                    console.error('❌ Error en búsqueda:', error);
                }
                setEvaluations([]);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(performSearch, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, allEvaluations]);

    const exitSearchMode = useCallback(() => {
        setSearchQuery('');
        setSearchMode(false);
        setEvaluations(allEvaluations);
    }, [allEvaluations]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            const serverHealth = await authService.checkServerHealth();
            const isOffline = !serverHealth.ok;
            setIsOfflineMode(isOffline);

            if (isOffline) return;

            const evaluationsData = await evaluationService.loadCurrentEvaluations(true);
            setAllEvaluations(evaluationsData);

            if (!searchMode) {
                setEvaluations(evaluationsData);
            }

            const counts = await evaluationService.getCurrentEvaluationsCountByState();
            setCountByState({ all: counts.all, partial: counts.partial, draft: counts.draft });
            setTotalEvaluations(counts.total);
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
            const result = await evaluationService.deleteEvaluation(id);

            if (result.success) {
                setAllEvaluations(prev => prev.filter(e => e.id !== id));
                setEvaluations(prev => prev.filter(e => e.id !== id));
                setTotalEvaluations(prev => prev - 1);
                await onRefresh();
            } else {
                throw new Error(result.message || 'Error al eliminar');
            }
        } catch (error: any) {
            if (__DEV__) {
                console.error('❌ Error eliminando evaluación:', error);
            }
            throw error;
        }
    }, [onRefresh]);

    return {
        evaluations,
        loading,
        initialLoading,
        refreshing,
        searchQuery,
        searchMode,
        totalEvaluations,
        isOfflineMode,
        countByState,
        setSearchQuery,
        exitSearchMode,
        onRefresh,
        handleDelete,
    };
};
