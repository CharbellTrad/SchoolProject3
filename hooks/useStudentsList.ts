import { useCallback, useMemo, useState } from 'react';
import { showAlert } from '../components/showAlert';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services-odoo/authService';
import { CacheKeys, cacheManager } from '../services-odoo/cache';
import { Student, canDeleteStudent, deleteStudent, invalidateStudentsPaginationCache, loadStudentsPaginated, searchStudentsGlobal } from '../services-odoo/personService';

const PAGE_SIZE = 5; // Estudiantes por página

export const useStudentsList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  
  // 🔥 NUEVO: Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const { handleSessionExpired } = useAuth();

  // ✅ Búsqueda optimizada (global, no limitada a página actual)
  const filteredStudents = useMemo(() => {
    return students;
  }, [students]);

  const activeStudentsCount = useMemo(() => {
    return students.filter((s) => s.is_active).length;
  }, [students]);

  /**
   * 🔥 CARGA INICIAL DE PÁGINA
   */
  const loadData = useCallback(async (forceReload: boolean = false) => {
    if (forceReload) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      if (__DEV__) {
        console.log('🔄 Cargando página 1...');
      }

      // 1️⃣ Verificar conexión
      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        if (__DEV__) {
          console.log('🔴 Servidor no disponible');
        }
        
        setIsOfflineMode(true);
        
        // Intentar caché
        const cachedResult = cacheManager.get<any>(`${CacheKeys.students()}_page_1_size_${PAGE_SIZE}`);
        if (cachedResult?.students?.length > 0) {
          if (__DEV__) {
            console.log(`📦 Cargando ${cachedResult.students.length} estudiantes desde caché (modo offline)`);
          }
          setStudents(cachedResult.students);
          setTotalStudents(cachedResult.total);
          setHasMore(cachedResult.hasMore);
          setCurrentPage(1);
          showAlert(
            'Modo sin conexión',
            `Se han cargado ${cachedResult.students.length} estudiantes desde el almacenamiento local.`
          );
        } else {
          setStudents([]);
          setTotalStudents(0);
          setHasMore(false);
          showAlert(
            'Sin conexión',
            'No se puede conectar con el servidor y no hay datos guardados localmente.'
          );
        }
        return;
      }

      // 2️⃣ Verificar sesión
      const validSession = await authService.verifySession();

      if (!validSession) {
        if (__DEV__) {
          console.log('❌ Sesión no válida al cargar');
        }
        handleSessionExpired();
        return;
      }

      // 3️⃣ Cargar datos paginados
      setIsOfflineMode(false);

      if (forceReload) {
        invalidateStudentsPaginationCache();
        if (__DEV__) {
          console.log('🗑️ Caché de paginación invalidado');
        }
      }

      const result = await loadStudentsPaginated(1, PAGE_SIZE, forceReload);
      
      setStudents(result.students);
      setTotalStudents(result.total);
      setHasMore(result.hasMore);
      setCurrentPage(1);

      if (__DEV__) {
        console.log(`✅ Página 1 cargada: ${result.students.length}/${result.total} estudiantes`);
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Error loading students:', error);
      
      setIsOfflineMode(true);
      
      const cachedResult = cacheManager.get<any>(`${CacheKeys.students()}_page_1_size_${PAGE_SIZE}`);
      if (cachedResult?.students?.length > 0) {
        setStudents(cachedResult.students);
        setTotalStudents(cachedResult.total);
        setHasMore(cachedResult.hasMore);
        showAlert(
          'Error de conexión',
          `Se han cargado ${cachedResult.students.length} estudiantes guardados.`
        );
      } else {
        setStudents([]);
        setTotalStudents(0);
        setHasMore(false);
        showAlert('Error', 'No se pudieron cargar los estudiantes.');
      }
    } finally {
      if (forceReload) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [handleSessionExpired]);

  /**
   * 🔥 CARGAR MÁS ESTUDIANTES (paginación infinita)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || isSearching || searchQuery.trim()) {
      return;
    }

    setLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      
      if (__DEV__) {
        console.log(`🔄 Cargando página ${nextPage}...`);
      }

      const result = await loadStudentsPaginated(nextPage, PAGE_SIZE, false);
      
      // Agregar nuevos estudiantes sin duplicados
      setStudents(prev => {
        const existingIds = new Set(prev.map(s => s.id));
        const newStudents = result.students.filter(s => !existingIds.has(s.id));
        return [...prev, ...newStudents];
      });
      
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);

      if (__DEV__) {
        console.log(`✅ Página ${nextPage} cargada: +${result.students.length} estudiantes`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error loadMore:', error);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, currentPage, isSearching, searchQuery]);

  /**
   * 🔥 BÚSQUEDA GLOBAL (en TODOS los estudiantes)
   */
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (!query || query.trim().length < 2) {
      // Restaurar página 1 al limpiar búsqueda
      loadData(false);
      return;
    }

    setIsSearching(true);

    try {
      if (__DEV__) {
        console.log(`🔍 Buscando globalmente: "${query}"`);
      }

      const results = await searchStudentsGlobal(query, 50);
      
      setStudents(results);
      setTotalStudents(results.length);
      setHasMore(false); // No hay "más" en búsquedas

      if (__DEV__) {
        console.log(`✅ Búsqueda: ${results.length} resultados`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error en búsqueda:', error);
      }
    } finally {
      setIsSearching(false);
    }
  }, [loadData]);

  /**
   * Elimina un estudiante con validación
   */
  const handleDelete = useCallback(async (student: Student) => {
    if (isOfflineMode) {
      showAlert(
        'Modo sin conexión',
        'No puedes eliminar estudiantes sin conexión a internet.'
      );
      return;
    }

    const serverHealth = await authService.checkServerHealth();

    if (!serverHealth.ok) {
      showAlert(
        'Sin conexión',
        'No se puede conectar con el servidor para eliminar estudiantes.'
      );
      return;
    }

    const validation = await canDeleteStudent(student.id);
    
    if (!validation.canDelete) {
      showAlert('No se puede eliminar', validation.message || 'Error al verificar el estudiante');
      return;
    }
    
    showAlert(
      'Eliminar Estudiante',
      `¿Estás seguro de eliminar a ${student.name}?\n\nSe eliminarán también todas sus inscripciones inactivas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteStudent(student.id);
            
            if (result.success) {
              // ✅ ACTUALIZAR INMEDIATAMENTE
              invalidateStudentsPaginationCache();
              loadData(true); // Recargar desde página 1
              
              showAlert('Éxito', 'Estudiante eliminado correctamente');
            } else {
              showAlert('Error', result.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  }, [loadData, isOfflineMode]);

  /**
   * 🔥 PULL-TO-REFRESH MEJORADO
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setSearchQuery(''); // Limpiar búsqueda al refrescar
    
    try {
      if (__DEV__) {
        console.log('🔄 FORCE REFRESH: Recarga completa...');
        console.time('⏱️ Full Refresh');
      }

      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        if (__DEV__) {
          console.log('🔴 Servidor no disponible durante refresh');
        }
        
        setIsOfflineMode(true);
        
        showAlert(
          'Sin conexión',
          'No se puede conectar con el servidor.'
        );
        return;
      }

      const validSession = await authService.verifySession();

      if (!validSession) {
        if (__DEV__) {
          console.log('❌ Sesión no válida durante refresh');
        }
        handleSessionExpired();
        return;
      }

      // 🗑️ LIMPIAR TODO EL CACHÉ
      cacheManager.clear();
      
      if (__DEV__) {
        console.log('🗑️ TODO el caché eliminado');
      }

      // 🔥 Cargar página 1 fresca
      const freshData = await loadStudentsPaginated(1, PAGE_SIZE, true);
      
      setStudents(freshData.students);
      setTotalStudents(freshData.total);
      setHasMore(freshData.hasMore);
      setCurrentPage(1);
      setIsOfflineMode(false);

      if (__DEV__) {
        console.timeEnd('⏱️ Full Refresh');
        console.log(`✅ Recarga completa: ${freshData.students.length}/${freshData.total} estudiantes`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error en refresh:', error);
      }
      
      setIsOfflineMode(true);
      
      showAlert('Error', 'No se pudo actualizar la información.');
    } finally {
      setRefreshing(false);
    }
  }, [handleSessionExpired]);

  return {
    students,
    loading,
    refreshing,
    searchQuery,
    filteredStudents,
    activeStudentsCount,
    isOfflineMode,
    totalStudents,
    hasMore,
    loadingMore,
    isSearching,
    setSearchQuery: handleSearch,
    loadData,
    handleDelete,
    onRefresh,
    loadMore, // 🔥 NUEVO: para scroll infinito
  };
};