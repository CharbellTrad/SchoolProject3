/**
 * Hook para gestión de secciones inscritas (Operaciones Diarias)
 * Maneja estado, carga, búsqueda y operaciones CRUD para school.section
 */

import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services-odoo/authService';
import type { EnrolledSection } from '../services-odoo/enrolledSectionService';
import * as enrolledSectionService from '../services-odoo/enrolledSectionService';

interface UseEnrolledSectionsResult {
    sections: EnrolledSection[];
    loading: boolean;
    initialLoading: boolean;
    refreshing: boolean;
    searchQuery: string;
    searchMode: boolean;
    totalSections: number;
    isOfflineMode: boolean;
    // Conteos por tipo
    countByType: { pre: number; primary: number; secundary: number };
    // Funciones
    setSearchQuery: (query: string) => void;
    exitSearchMode: () => void;
    onRefresh: () => Promise<void>;
    handleDelete: (id: number) => Promise<void>;
}

export const useEnrolledSections = (): UseEnrolledSectionsResult => {
    // Estado principal
    const [sections, setSections] = useState<EnrolledSection[]>([]);
    const [allSections, setAllSections] = useState<EnrolledSection[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [totalSections, setTotalSections] = useState(0);
    const [countByType, setCountByType] = useState({ pre: 0, primary: 0, secundary: 0 });

    /**
     * Carga inicial de secciones inscritas del año actual
     */
    const loadInitialSections = useCallback(async () => {
        try {
            if (__DEV__) {
                console.log('🔄 Cargando secciones inscritas actuales...');
            }

            const serverHealth = await authService.checkServerHealth();
            const isOffline = !serverHealth.ok;
            setIsOfflineMode(isOffline);

            const sectionsData = await enrolledSectionService.loadCurrentEnrolledSections(!isOffline);
            setAllSections(sectionsData);
            setSections(sectionsData);
            setTotalSections(sectionsData.length);

            if (!isOffline) {
                const counts = await enrolledSectionService.getEnrolledSectionsCountByType();
                setCountByType({ pre: counts.pre, primary: counts.primary, secundary: counts.secundary });
                setTotalSections(counts.total);
            }

            if (__DEV__) {
                console.log(`✅ ${sectionsData.length} secciones inscritas cargadas`);
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
        loadInitialSections();
    }, [loadInitialSections]);

    // Búsqueda de secciones
    useEffect(() => {
        const performSearch = () => {
            if (searchQuery.trim().length === 0) {
                setSearchMode(false);
                setSections(allSections);
                return;
            }

            setSearchMode(true);
            setLoading(true);

            try {
                const query = searchQuery.toLowerCase().trim();
                const results = allSections.filter(section => {
                    return section.name.toLowerCase().includes(query) ||
                        section.sectionName.toLowerCase().includes(query);
                });
                setSections(results);
            } catch (error) {
                if (__DEV__) {
                    console.error('❌ Error en búsqueda:', error);
                }
                setSections([]);
            } finally {
                setLoading(false);
            }
        };

        const debounceTimer = setTimeout(performSearch, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, allSections]);

    const exitSearchMode = useCallback(() => {
        setSearchQuery('');
        setSearchMode(false);
        setSections(allSections);
    }, [allSections]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            const serverHealth = await authService.checkServerHealth();
            const isOffline = !serverHealth.ok;
            setIsOfflineMode(isOffline);

            if (isOffline) {
                return;
            }

            const sectionsData = await enrolledSectionService.loadCurrentEnrolledSections(true);
            setAllSections(sectionsData);

            if (!searchMode) {
                setSections(sectionsData);
            }

            const counts = await enrolledSectionService.getEnrolledSectionsCountByType();
            setCountByType({ pre: counts.pre, primary: counts.primary, secundary: counts.secundary });
            setTotalSections(counts.total);
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
            const result = await enrolledSectionService.deleteEnrolledSection(id);

            if (result.success) {
                setAllSections(prev => prev.filter(s => s.id !== id));
                setSections(prev => prev.filter(s => s.id !== id));
                setTotalSections(prev => prev - 1);
                await onRefresh();
            } else {
                throw new Error(result.message || 'Error al eliminar');
            }
        } catch (error: any) {
            if (__DEV__) {
                console.error('❌ Error eliminando sección:', error);
            }
            throw error;
        }
    }, [onRefresh]);

    return {
        sections,
        loading,
        initialLoading,
        refreshing,
        searchQuery,
        searchMode,
        totalSections,
        isOfflineMode,
        countByType,
        setSearchQuery,
        exitSearchMode,
        onRefresh,
        handleDelete,
    };
};
