import { useCallback, useMemo, useState } from 'react';
import { showAlert } from '../components/showAlert';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services-odoo/authService';
import { Student, canDeleteStudent, deleteStudent, loadStudents } from '../services-odoo/personService';

export const useStudentsList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { logout } = useAuth();

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.name?.toLowerCase().includes(query) ||
        `${student.nationality}-${student.vat}`.toLowerCase().includes(query)
    );
  }, [searchQuery, students]);

  const activeStudentsCount = useMemo(() => {
    return students.filter((s) => s.is_active).length;
  }, [students]);

  const loadData = useCallback(async (isRefreshing: boolean = false) => {
    if (!isRefreshing) setLoading(true);
    
    try {
      const data = await loadStudents();
      setStudents(data);
    } catch (error) {
      if (__DEV__) console.error('Error loading students:', error);
    } finally {
      if (!isRefreshing) setLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (student: Student) => {
    const validation = await canDeleteStudent(student.id);
    
    if (!validation.canDelete) {
      showAlert('No se puede eliminar', validation.message || 'Error al verificar el estudiante');
      return;
    }
    
    showAlert(
      'Eliminar Estudiante',
      `¿Estás seguro de eliminar a ${student.name}?\n\nSe eliminarán también todas sus inscripciones inactivas y representantes que no tengan otros hijos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteStudent(student.id);
            if (result.success) {
              showAlert('Éxito', 'Estudiante eliminado correctamente');
              loadData();
            } else {
              showAlert('Error', result.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (__DEV__) {
        console.log('🔄 Refrescando students list...');
      }

      const validSession = await authService.verifySession();

      if (!validSession) {
        if (__DEV__) {
          console.log('❌ Sesión no válida durante refresh');
        }
        await logout();
        return;
      } else {
        await loadData(true);
      }

      if (__DEV__) {
        console.log('✅ Students list actualizado');
      }
    } catch (error) {
      if (__DEV__) {
        console.log('❌ Error al refrescar:', error);
      }
      showAlert(
        'Error',
        'No se pudo actualizar la información. Verifica tu conexión.'
      );
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  return {
    students,
    loading,
    refreshing,
    searchQuery,
    filteredStudents,
    activeStudentsCount,
    setSearchQuery,
    loadData,
    handleDelete,
    onRefresh,
  };
};
