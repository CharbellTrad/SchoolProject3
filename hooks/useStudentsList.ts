import { useCallback, useMemo, useState } from 'react';
import { showAlert } from '../components/showAlert';
import { Student, canDeleteStudent, deleteStudent, loadStudents } from '../services-odoo/personService';

export const useStudentsList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    await loadData(true);
    setRefreshing(false);
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
