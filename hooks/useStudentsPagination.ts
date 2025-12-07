import { useCallback, useEffect, useState } from 'react';
import { showAlert } from '../components/showAlert';
import * as odooApi from '../services-odoo/apiService';
import * as authService from '../services-odoo/authService';
import {
  Student,
  canDeleteStudent,
  deleteStudent,
  loadStudentsPaginated,
  searchStudentsGlobal,
} from '../services-odoo/personService';

const ITEMS_PER_PAGE = 5;

export const useStudentsPagination = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const totalPages = Math.ceil(totalStudents / ITEMS_PER_PAGE);

  // ⚡ Carga inicial: obtiene solo el total
  const loadInitialData = useCallback(async () => {
    setInitialLoading(true);

    try {
      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        setIsOfflineMode(true);

        // ✅ Intentar cargar página 1 desde caché
        const result = await loadStudentsPaginated(1, ITEMS_PER_PAGE, true);

        if (result.students.length > 0) {
          setStudents(result.students);
          setTotalStudents(result.total);
          setCurrentPage(1);

          if (__DEV__) {
            console.log(`📦 [OFFLINE] Cargado desde caché: ${result.students.length} estudiantes`);
          }
        } else {
          showAlert(
            'Sin conexión',
            'No hay datos guardados. Conecta a internet para cargar estudiantes.'
          );
        }

        setInitialLoading(false);
        return;
      }

      const validSession = await authService.verifySession();
      if (!validSession) {
        if (__DEV__) {
          console.log('❌ Sesión inválida - El API ya manejó la expiración');
        }
        // ⚠️ NO llamar handleSessionExpired() - el API lo hace automáticamente
        setInitialLoading(false);
        return;
      }

      setIsOfflineMode(false);

      const domain = [['type_enrollment', '=', 'student']];
      const countResult = await odooApi.searchCount('res.partner', domain);
      const total = countResult.success ? (countResult.data || 0) : 0;

      setTotalStudents(total);

      if (__DEV__) {
        console.log(`✅ Carga inicial completa: ${total} estudiantes totales`);
      }

      setInitialLoading(false);
    } catch (error) {
      if (__DEV__) console.error('❌ Error en carga inicial:', error);
      setIsOfflineMode(true);
      setInitialLoading(false);
    }
  }, []);

  // 📄 Cargar página actual (modo paginación)
  const loadCurrentPage = useCallback(async (forceReload = false) => {
    if (initialLoading && !forceReload) return;
    if (searchMode) return; // No cargar páginas en modo búsqueda

    if (forceReload) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setStudents([]);
    }

    try {
      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        setIsOfflineMode(true);

        // ✅ MODO OFFLINE: Intentar cargar desde caché
        const result = await loadStudentsPaginated(currentPage, ITEMS_PER_PAGE, true);

        setStudents(result.students);

        if (result.students.length === 0) {
          showAlert(
            'Sin conexión',
            `No hay datos guardados para la página ${currentPage}. Solo puedes ver páginas que hayas visitado anteriormente con conexión.`
          );
        }

        return;
      }

      const validSession = await authService.verifySession();
      if (!validSession) {
        if (__DEV__) {
          console.log('❌ Sesión inválida - El API ya manejó la  expiración');
        }
        // ⚠️ NO llamar handleSessionExpired() - el API lo hace automáticamente
        return;
      }

      setIsOfflineMode(false);

      // 🌐 MODO ONLINE: Cargar desde servidor (automáticamente guardará en caché)
      const result = await loadStudentsPaginated(currentPage, ITEMS_PER_PAGE, false);
      setStudents(result.students);

      if (forceReload) {
        setTotalStudents(result.total);
      }

      if (__DEV__) {
        console.log(`✅ Página ${currentPage}: ${result.students.length}/${result.total || totalStudents}`);
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Error loading page:', error);
      setIsOfflineMode(true);
      setStudents([]);
    } finally {
      if (forceReload) setRefreshing(false);
      else setLoading(false);
    }
  }, [currentPage, initialLoading, totalStudents, searchMode]);

  // 🔍 Búsqueda global (sin paginación) - SOLO ONLINE
  const performSearch = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setStudents([]);
      return;
    }

    setLoading(true);

    try {
      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        setIsOfflineMode(true);
        showAlert(
          'Sin conexión',
          'No se puede buscar sin conexión a internet.'
        );
        setStudents([]);
        setLoading(false);
        return;
      }

      const validSession = await authService.verifySession();
      if (!validSession) {
        if (__DEV__) {
          console.log('❌ Sesión inválida - El API ya manejó la expiración');
        }
        // ⚠️ NO llamar handleSessionExpired() - el API lo hace automáticamente
        setLoading(false);
        return;
      }

      setIsOfflineMode(false);

      const results = await searchStudentsGlobal(query, 50);
      setStudents(results);

      if (__DEV__) {
        console.log(`🔍 Búsqueda: ${results.length} resultados para "${query}"`);
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Error en búsqueda:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Entrar en modo búsqueda
  const enterSearchMode = useCallback(() => {
    setSearchMode(true);
    setStudents([]);
    if (__DEV__) {
      console.log('🔍 Modo búsqueda activado');
    }
  }, []);

  // ✅ Salir del modo búsqueda
  const exitSearchMode = useCallback(() => {
    setSearchMode(false);
    setSearchQuery('');
    setStudents([]);
    setCurrentPage(1);
    if (__DEV__) {
      console.log('📄 Modo paginación restaurado');
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Cargar página (solo en modo paginación)
  useEffect(() => {
    if (!initialLoading && !searchMode) {
      loadCurrentPage();
    }
  }, [currentPage, initialLoading, searchMode]);

  // Manejar cambios en searchQuery
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      // Entrar en modo búsqueda
      if (!searchMode) {
        enterSearchMode();
      }
      // Realizar búsqueda si hay 3+ caracteres
      if (searchQuery.trim().length >= 3) {
        performSearch(searchQuery);
      } else {
        setStudents([]);
      }
    } else if (searchMode) {
      // Si se borra todo el query, salir del modo búsqueda
      exitSearchMode();
    }
  }, [searchQuery, searchMode, enterSearchMode, exitSearchMode, performSearch]);

  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages || page === currentPage || searchMode) return;
    setCurrentPage(page);
  }, [totalPages, currentPage, searchMode]);

  const onRefresh = useCallback(async () => {
    if (searchMode) {
      // En modo búsqueda, rehacer la búsqueda
      if (searchQuery.trim().length >= 3) {
        await performSearch(searchQuery);
      }
    } else {
      // En modo paginación, recargar página
      await loadCurrentPage(true);
    }
  }, [searchMode, searchQuery, performSearch, loadCurrentPage]);

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
      showAlert('Sin conexión', 'No se puede conectar con el servidor.');
      return;
    }

    const validation = await canDeleteStudent(student.id);

    if (!validation.canDelete) {
      showAlert('No se puede eliminar', validation.message || 'Error al verificar');
      return;
    }

    showAlert(
      'Eliminar Estudiante',
      `¿Estás seguro de eliminar a ${student.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteStudent(student.id);

            if (result.success) {
              if (searchMode && searchQuery.trim().length >= 3) {
                await performSearch(searchQuery);
              } else {
                await loadCurrentPage(true);
              }
              showAlert('Éxito', 'Estudiante eliminado correctamente');
            } else {
              showAlert('Error', result.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  }, [isOfflineMode, searchMode, searchQuery, performSearch, loadCurrentPage]);

  return {
    students,
    loading,
    initialLoading,
    refreshing,
    searchQuery,
    searchMode,
    totalStudents,
    currentPage,
    totalPages,
    isOfflineMode,
    setSearchQuery,
    exitSearchMode,
    goToPage,
    onRefresh,
    handleDelete,
  };
};
