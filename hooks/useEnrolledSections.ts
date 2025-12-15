/**
 * Hook para gestión de secciones inscritas (Operaciones Diarias)
 * Maneja estado, carga, búsqueda y paginación del servidor para school.section
 */

import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services-odoo/authService';
import type { EnrolledSection } from '../services-odoo/enrolledSectionService';
import * as enrolledSectionService from '../services-odoo/enrolledSectionService';

const ITEMS_PER_PAGE = 5;

type SectionTypeFilter = 'pre' | 'primary' | 'secundary' | 'all';

interface UseEnrolledSectionsResult {
    sections: EnrolledSection[];
    loading: boolean;
    initialLoading: boolean;
    refreshing: boolean;
    searchQuery: string;
    searchMode: boolean;
    totalSections: number;
    serverTotal: number;
    isOfflineMode: boolean;
    // Conteos por tipo
    countByType: { pre: number; primary: number; secundary: number };
    // Paginación del servidor
    currentPage: number;
    totalPages: number;
    // Funciones
    setSearchQuery: (query: string) => void;
    exitSearchMode: () => void;
    loadPage: (page: number, filter?: SectionTypeFilter) => Promise<void>;
    loadCounts: () => Promise<void>;
    onRefresh: () => Promise<void>;
    handleDelete: (id: number) => Promise<void>;
}

export const useEnrolledSections = (): UseEnrolledSectionsResult => {
    // Estado principal
    const [sections, setSections] = useState<EnrolledSection[]>([]);
    const [allSectionsForSearch, setAllSectionsForSearch] = useState<EnrolledSection[]>([]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [totalSections, setTotalSections] = useState(0);
    const [serverTotal, setServerTotal] = useState(0);
    const [countByType, setCountByType] = useState({ pre: 0, primary: 0, secundary: 0 });
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [currentFilter, setCurrentFilter] = useState<SectionTypeFilter>('all');

    /**
     * Carga una página específica desde el servidor
     */
    const loadPage = useCallback(async (page: number, filter: SectionTypeFilter = 'all') => {
        // Update page and filter immediately for instant UI feedback
        setCurrentPage(page);
        setCurrentFilter(filter);
        setLoading(true);

        try {
            if (__DEV__) {
                console.log(`🔄 Cargando página ${page} con filtro ${filter}...`);
            }

            const result = await enrolledSectionService.loadEnrolledSectionsPaginated(
                page,
                ITEMS_PER_PAGE,
                filter
            );

            setSections(result.sections);
            setServerTotal(result.total);
            setTotalPages(Math.ceil(result.total / ITEMS_PER_PAGE));

            if (__DEV__) {
                console.log(`✅ Página ${page}: ${result.sections.length}/${result.total} secciones`);
            }
        } catch (error) {
            if (__DEV__) {
                console.error('❌ Error cargando página:', error);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Carga inicial de conteos (llamar desde el componente cuando sea necesario)
     */
    const loadCounts = useCallback(async () => {
        try {
            const serverHealth = await authService.checkServerHealth();
            const isOffline = !serverHealth.ok;
            setIsOfflineMode(isOffline);

            if (!isOffline) {
                const counts = await enrolledSectionService.getEnrolledSectionsCountByType();
                setCountByType({ pre: counts.pre, primary: counts.primary, secundary: counts.secundary });
                setTotalSections(counts.total);
            }
        } catch (error) {
            if (__DEV__) {
                console.error('❌ Error cargando conteos:', error);
            }
            setIsOfflineMode(true);
        } finally {
            setInitialLoading(false);
        }
    }, []);

    // Búsqueda de secciones (carga todo para buscar)
    useEffect(() => {
        // Skip search logic if query is empty - component handles normal page loading
        if (searchQuery.trim().length === 0) {
            if (searchMode) {
                setSearchMode(false);
            }
            return;
        }

        if (searchQuery.trim().length < 3) {
            return;
        }

        const performSearch = async () => {
            setSearchMode(true);
            setLoading(true);

            try {
                // Para búsqueda, necesitamos cargar todas las secciones
                let searchData: EnrolledSection[];

                if (allSectionsForSearch.length > 0) {
                    searchData = allSectionsForSearch;
                } else {
                    // Cargar todas las secciones para búsqueda
                    searchData = await enrolledSectionService.loadCurrentEnrolledSections(false);
                    setAllSectionsForSearch(searchData);
                }

                const query = searchQuery.toLowerCase().trim();
                const results = searchData.filter(section => {
                    return section.name.toLowerCase().includes(query) ||
                        section.sectionName.toLowerCase().includes(query);
                });
                setSections(results);
                setServerTotal(results.length);
                setTotalPages(1); // Sin paginación en búsqueda
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
    }, [searchQuery, allSectionsForSearch, searchMode]);

    const exitSearchMode = useCallback(() => {
        setSearchQuery('');
        setSearchMode(false);
        loadPage(1, currentFilter);
    }, [loadPage, currentFilter]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);

        try {
            const serverHealth = await authService.checkServerHealth();
            const isOffline = !serverHealth.ok;
            setIsOfflineMode(isOffline);

            if (isOffline) {
                return;
            }

            // Limpiar caché de búsqueda
            setAllSectionsForSearch([]);

            // Recargar conteos
            const counts = await enrolledSectionService.getEnrolledSectionsCountByType();
            setCountByType({ pre: counts.pre, primary: counts.primary, secundary: counts.secundary });
            setTotalSections(counts.total);

            // Recargar página 1
            await loadPage(1, currentFilter);
        } catch (error) {
            if (__DEV__) {
                console.error('❌ Error en refresh:', error);
            }
        } finally {
            setRefreshing(false);
        }
    }, [loadPage, currentFilter]);

    const handleDelete = useCallback(async (id: number) => {
        try {
            const result = await enrolledSectionService.deleteEnrolledSection(id);

            if (result.success) {
                // Invalidar caché de búsqueda
                setAllSectionsForSearch([]);
                // Recargar página actual
                await loadPage(currentPage, currentFilter);
                // Actualizar conteos
                const counts = await enrolledSectionService.getEnrolledSectionsCountByType();
                setCountByType({ pre: counts.pre, primary: counts.primary, secundary: counts.secundary });
                setTotalSections(counts.total);
            } else {
                throw new Error(result.message || 'Error al eliminar');
            }
        } catch (error: any) {
            if (__DEV__) {
                console.error('❌ Error eliminando sección:', error);
            }
            throw error;
        }
    }, [loadPage, currentPage, currentFilter]);

    return {
        sections,
        loading,
        initialLoading,
        refreshing,
        searchQuery,
        searchMode,
        totalSections,
        serverTotal,
        isOfflineMode,
        countByType,
        currentPage,
        totalPages,
        setSearchQuery,
        exitSearchMode,
        loadPage,
        loadCounts,
        onRefresh,
        handleDelete,
    };
};
