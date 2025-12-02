/**
 * Hook para gestión de materias
 * Maneja estado, carga, búsqueda y operaciones CRUD
 */

import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services-odoo/authService';
import type { Professor, Section, Subject } from '../services-odoo/subjectService';
import * as subjectService from '../services-odoo/subjectService';

interface UseSubjectsResult {
  subjects: Subject[];
  loading: boolean;
  initialLoading: boolean;
  refreshing: boolean;
  searchQuery: string;
  searchMode: boolean;
  totalSubjects: number;
  isOfflineMode: boolean;
  // Datos relacionados
  secundarySections: Section[];
  activeProfessors: Professor[];
  sectionsLoading: boolean;
  professorsLoading: boolean;
  // Funciones
  setSearchQuery: (query: string) => void;
  exitSearchMode: () => void;
  onRefresh: () => Promise<void>;
  handleDelete: (id: number) => Promise<void>;
  loadRelatedData: () => Promise<void>;
}

export const useSubjects = (): UseSubjectsResult => {
  // ========== ESTADO PRINCIPAL ==========
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [totalSubjects, setTotalSubjects] = useState(0);

  // ========== DATOS RELACIONADOS ==========
  const [secundarySections, setSecundarySections] = useState<Section[]>([]);
  const [activeProfessors, setActiveProfessors] = useState<Professor[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [professorsLoading, setProfessorsLoading] = useState(false);

  /**
   * Carga inicial de materias
   */
  const loadInitialSubjects = useCallback(async () => {
    try {
      if (__DEV__) {
        console.log('🔄 Cargando materias iniciales...');
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

      // Cargar materias (con caché en offline)
      const subjectsData = await subjectService.loadSubjects(!isOffline);
      setAllSubjects(subjectsData);
      setSubjects(subjectsData);
      setTotalSubjects(subjectsData.length);

      // Cargar conteo si está online
      if (!isOffline) {
        const count = await subjectService.getSubjectsCount();
        setTotalSubjects(count);
      }

      if (__DEV__) {
        console.log(`✅ ${subjectsData.length} materias cargadas`);
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
   * Carga datos relacionados (secciones y profesores)
   */
  const loadRelatedData = useCallback(async () => {
    try {
      if (__DEV__) {
        console.log('🔄 Cargando datos relacionados...');
      }

      // Verificar conectividad
      const serverHealth = await authService.checkServerHealth();
      const isOffline = !serverHealth.ok;

      // Cargar secciones secundarias
      setSectionsLoading(true);
      const sections = await subjectService.loadSecundarySections(!isOffline);
      setSecundarySections(sections);
      setSectionsLoading(false);

      // Cargar profesores activos
      setProfessorsLoading(true);
      const professors = await subjectService.loadActiveProfessors(!isOffline);
      setActiveProfessors(professors);
      setProfessorsLoading(false);

      if (__DEV__) {
        console.log(`✅ ${sections.length} secciones y ${professors.length} profesores cargados`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error cargando datos relacionados:', error);
      }
      setSectionsLoading(false);
      setProfessorsLoading(false);
    }
  }, []);

  /**
   * Efecto de carga inicial
   */
  useEffect(() => {
    loadInitialSubjects();
  }, [loadInitialSubjects]);

  /**
   * Búsqueda de materias
   */
  useEffect(() => {
    const performSearch = () => {
      if (searchQuery.trim().length === 0) {
        setSearchMode(false);
        setSubjects(allSubjects);
        return;
      }

      setSearchMode(true);
      setLoading(true);

      try {
        const query = searchQuery.toLowerCase().trim();

        // Buscar por nombre
        const results = allSubjects.filter(subject => {
          const matchesName = subject.name.toLowerCase().includes(query);
          return matchesName;
        });

        setSubjects(results);
      } catch (error) {
        if (__DEV__) {
          console.error('❌ Error en búsqueda:', error);
        }
        setSubjects([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, allSubjects]);

  /**
   * Salir del modo búsqueda
   */
  const exitSearchMode = useCallback(() => {
    setSearchQuery('');
    setSearchMode(false);
    setSubjects(allSubjects);
  }, [allSubjects]);

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
      const subjectsData = await subjectService.loadSubjects(true);
      setAllSubjects(subjectsData);

      // Si está en búsqueda, mantener resultados
      if (!searchMode) {
        setSubjects(subjectsData);
      }

      // Actualizar conteo
      const count = await subjectService.getSubjectsCount();
      setTotalSubjects(count);

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
   * Eliminar una materia
   */
  const handleDelete = useCallback(
    async (id: number) => {
      try {
        if (__DEV__) {
          console.log(`🗑️ Eliminando materia ${id}...`);
        }

        const result = await subjectService.deleteSubject(id);

        if (result.success) {
          // Actualizar estado local
          setAllSubjects((prev) => prev.filter((s) => s.id !== id));
          setSubjects((prev) => prev.filter((s) => s.id !== id));
          setTotalSubjects((prev) => prev - 1);

          // Actualizar conteos
          await onRefresh();

          if (__DEV__) {
            console.log('✅ Materia eliminada');
          }
        } else {
          throw new Error(result.message || 'Error al eliminar');
        }
      } catch (error: any) {
        if (__DEV__) {
          console.error('❌ Error eliminando materia:', error);
        }
        throw error;
      }
    },
    [onRefresh]
  );

  return {
    subjects,
    loading,
    initialLoading,
    refreshing,
    searchQuery,
    searchMode,
    totalSubjects,
    isOfflineMode,
    secundarySections,
    activeProfessors,
    sectionsLoading,
    professorsLoading,
    setSearchQuery,
    exitSearchMode,
    onRefresh,
    handleDelete,
    loadRelatedData,
  };
};