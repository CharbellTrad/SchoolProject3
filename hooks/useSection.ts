/**
 * Hook para gestión de secciones escolares
 * Maneja estado, carga, búsqueda y operaciones CRUD
 */

import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services-odoo/authService';
import type { Section } from '../services-odoo/sectionService';
import * as sectionService from '../services-odoo/sectionService';

interface UseSectionsResult {
  sections: Section[];
  loading: boolean;
  initialLoading: boolean;
  refreshing: boolean;
  searchQuery: string;
  searchMode: boolean;
  totalSections: number;
  isOfflineMode: boolean;
  countByType: {
    pre: number;
    primary: number;
    secundary: number;
    total: number;
  };
  setSearchQuery: (query: string) => void;
  exitSearchMode: () => void;
  onRefresh: () => Promise<void>;
  handleDelete: (id: number) => Promise<void>;
}

export const useSections = (): UseSectionsResult => {
  const [sections, setSections] = useState<Section[]>([]);
  const [allSections, setAllSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [countByType, setCountByType] = useState({
    pre: 0,
    primary: 0,
    secundary: 0,
    total: 0,
  });

  /**
   * Carga inicial de secciones
   */
  const loadInitialSections = useCallback(async () => {
    try {
      if (__DEV__) {
        console.log('🔄 Cargando secciones iniciales...');
      }

      // Verificar conectividad
      const serverHealth = await authService.checkServerHealth();
      const isOffline = !serverHealth.ok;
      setIsOfflineMode(isOffline);

      if (isOffline) {
        if (__DEV__) {
          console.log('📡 Modo offline - usando caché');
        }
      }

      // Cargar secciones (con caché en offline)
      const sectionsData = await sectionService.loadSections(!isOffline);
      setAllSections(sectionsData);
      setSections(sectionsData);

      // Cargar conteos si está online
      if (!isOffline) {
        const counts = await sectionService.getSectionsCountByType();
        setCountByType(counts);
      } else {
        // En offline, calcular desde datos en caché
        const pre = sectionsData.filter(s => s.type === 'pre').length;
        const primary = sectionsData.filter(s => s.type === 'primary').length;
        const secundary = sectionsData.filter(s => s.type === 'secundary').length;
        setCountByType({
          pre,
          primary,
          secundary,
          total: pre + primary + secundary,
        });
      }

      if (__DEV__) {
        console.log(`✅ ${sectionsData.length} secciones cargadas`);
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

  /**
   * Efecto de carga inicial
   */
  useEffect(() => {
    loadInitialSections();
  }, [loadInitialSections]);

  /**
   * Búsqueda de secciones
   */
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
        
        // Buscar por nombre o por tipo
        const results = allSections.filter(section => {
            const matchesName = section.name.toLowerCase().includes(query);
            const matchesType = 
            (query.includes('pre') && section.type === 'pre') ||
            (query.includes('prim') && section.type === 'primary') ||
            (query.includes('media') && section.type === 'secundary') ||
            (query.includes('secund') && section.type === 'secundary');
            
            return matchesName || matchesType;
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

  /**
   * Salir del modo búsqueda
   */
  const exitSearchMode = useCallback(() => {
    setSearchQuery('');
    setSearchMode(false);
    setSections(allSections);
  }, [allSections]);

  /**
   * Refrescar datos
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const serverHealth = await authService.checkServerHealth();
      const isOffline = !serverHealth.ok;
      setIsOfflineMode(isOffline);

      if (isOffline) {
        if (__DEV__) {
          console.log('⚠️ Sin conexión durante refresh');
        }
        return;
      }

      // Forzar recarga desde servidor
      const sectionsData = await sectionService.loadSections(true);
      setAllSections(sectionsData);

      // Si está en búsqueda, mantener resultados
      if (!searchMode) {
        setSections(sectionsData);
      }

      // Actualizar conteos
      const counts = await sectionService.getSectionsCountByType();
      setCountByType(counts);

      if (__DEV__) {
        console.log('✅ Datos actualizados');
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error en refresh:', error);
      }
    } finally {
      setRefreshing(false);
    }
  }, [searchMode]);

  /**
   * Eliminar una sección
   */
  const handleDelete = useCallback(async (id: number) => {
    try {
      if (__DEV__) {
        console.log(`🗑️ Eliminando sección ${id}...`);
      }

      const result = await sectionService.deleteSection(id);

      if (result.success) {
        // Actualizar estado local
        setAllSections(prev => prev.filter(s => s.id !== id));
        setSections(prev => prev.filter(s => s.id !== id));

        // Actualizar conteos
        await onRefresh();

        if (__DEV__) {
          console.log('✅ Sección eliminada');
        }
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
    totalSections: countByType.total,
    isOfflineMode,
    countByType,
    setSearchQuery,
    exitSearchMode,
    onRefresh,
    handleDelete,
  };
};