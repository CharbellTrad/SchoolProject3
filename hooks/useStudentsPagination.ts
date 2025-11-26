import { useCallback, useEffect, useMemo, useState } from 'react';
import { showAlert } from '../components/showAlert';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services-odoo/authService';
import {
    Student,
    canDeleteStudent,
    deleteStudent,
    loadStudentsPaginated,
    searchStudentsPaginated
} from '../services-odoo/personService';

const ITEMS_PER_PAGE = 5;

export const useStudentsPagination = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const { handleSessionExpired } = useAuth();

  // ✅ Calcular total de páginas
  const totalPages = Math.ceil(totalStudents / ITEMS_PER_PAGE);

  // ✅ Estadísticas (basadas en datos actuales de la página)
  const activeStudents = useMemo(
    () => students.filter(s => s.is_active).length,
    [students]
  );

  // 🔄 Cargar página actual
  const loadCurrentPage = useCallback(async (forceReload = false) => {
    if (forceReload) setRefreshing(true);
    else setLoading(true);

    try {
      // 1️⃣ Verificar conexión
      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        setIsOfflineMode(true);
        showAlert(
          'Sin conexión',
          'No se puede conectar con el servidor. Verifica tu conexión.'
        );
        setStudents([]);
        setTotalStudents(0);
        return;
      }

      // 2️⃣ Verificar sesión
      const validSession = await authService.verifySession();
      if (!validSession) {
        handleSessionExpired();
        return;
      }

      setIsOfflineMode(false);

      // 3️⃣ Cargar según si hay búsqueda o no
      let result;
      if (searchQuery.trim().length >= 2) {
        result = await searchStudentsPaginated(searchQuery, currentPage, ITEMS_PER_PAGE);
      } else {
        result = await loadStudentsPaginated(currentPage, ITEMS_PER_PAGE, forceReload);
      }

      setStudents(result.students);
      setTotalStudents(result.total);

      if (__DEV__) {
        console.log(`✅ Página ${currentPage}: ${result.students.length}/${result.total}`);
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Error loading page:', error);
      setIsOfflineMode(true);
      setStudents([]);
      setTotalStudents(0);
    } finally {
      if (forceReload) setRefreshing(false);
      else setLoading(false);
    }
  }, [currentPage, searchQuery, handleSessionExpired]);

  // ⚡ Cargar al montar o cambiar página/búsqueda
  useEffect(() => {
    loadCurrentPage();
  }, [loadCurrentPage]);

  // 📄 Cambiar página
  const goToPage = useCallback((page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  }, [totalPages, currentPage]);

  // 🔍 Al buscar, volver a página 1
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery]);

  // 🔄 Refresh
  const onRefresh = useCallback(async () => {
    await loadCurrentPage(true);
  }, [loadCurrentPage]);

  // 🗑️ Eliminar estudiante
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
              await loadCurrentPage(true);
              showAlert('Éxito', 'Estudiante eliminado correctamente');
            } else {
              showAlert('Error', result.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  }, [isOfflineMode, loadCurrentPage]);

  return {
    students,
    loading,
    refreshing,
    searchQuery,
    totalStudents,
    activeStudents,
    currentPage,
    totalPages,
    isOfflineMode,
    setSearchQuery,
    goToPage,
    onRefresh,
    handleDelete,
  };
};