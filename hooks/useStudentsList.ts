import { useCallback, useMemo, useState } from 'react';
import { showAlert } from '../components/showAlert';
import * as authService from '../services-odoo/authService';
import { CacheKeys, cacheManager } from '../services-odoo/cache';
import { Student, canDeleteStudent, deleteStudent, loadAllStudentsSummary } from '../services-odoo/personService';

export const useStudentsList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // ✅ Búsqueda local optimizada
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;

    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.name?.toLowerCase().includes(query) ||
        `${student.nationality}-${student.vat}`.toLowerCase().includes(query)
    );
  }, [searchQuery, students]);

  /**
   * ⚡ CARGA DATOS DE ESTUDIANTES
   * - ONLINE: Siempre obtiene datos FRESCOS del servidor (ignora caché)
   * - OFFLINE: Usa caché si está disponible
   */
  const loadData = useCallback(async (forceReload: boolean = false) => {
    if (forceReload) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      if (__DEV__) {
        console.log('🔄 Cargando lista de estudiantes...');
      }

      // 1️⃣ Verificar conexión
      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        if (__DEV__) {
          console.log('🔴 Servidor no disponible - Modo Offline');
        }

        setIsOfflineMode(true);

        // 📦 Intentar caché (Modo Offline)
        const cachedData = cacheManager.get<Student[]>(CacheKeys.students());
        if (cachedData && cachedData.length > 0) {
          if (__DEV__) {
            console.log(`📦 ${cachedData.length} estudiantes cargados desde caché (offline)`);
          }
          setStudents(cachedData);
          showAlert(
            'Modo sin conexión',
            `Se han cargado ${cachedData.length} estudiantes desde el almacenamiento local. Conecta a internet para actualizar los datos.`
          );
        } else {
          setStudents([]);
          showAlert(
            'Sin conexión',
            'No se puede conectar con el servidor y no hay datos guardados localmente. Por favor, verifica tu conexión a internet.'
          );
        }

        // ✅ CRÍTICO: Detener el loading/refreshing ANTES de hacer return
        if (forceReload) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
        return;
      }

      // 2️⃣ Verificar sesión
      const validSession = await authService.verifySession();

      if (!validSession) {
        if (__DEV__) {
          console.log('❌ Sesión inválida - El API ya manejó la expiración');
        }
        // ⚠️ NO llamar handleSessionExpired() aquí - el API ya lo hace automáticamente
        // cuando detecta sesión expirada en requestHandler.ts

        // ✅ CRÍTICO: Detener el loading/refreshing antes de return
        if (forceReload) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
        return;
      }

      // 3️⃣ MODO ONLINE: Cargar datos SIEMPRE desde el servidor
      setIsOfflineMode(false);

      if (__DEV__) {
        console.log('🌐 Modo Online - Cargando desde servidor...');
      }

      // ✅ SIEMPRE forzar recarga cuando estamos online
      const data = await loadAllStudentsSummary(true);
      setStudents(data);

      if (__DEV__) {
        console.log(`✅ ${data.length} estudiantes cargados desde servidor`);
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Error loading students:', error);

      setIsOfflineMode(true);

      // Intentar caché en caso de error
      const cachedData = cacheManager.get<Student[]>(CacheKeys.students());
      if (cachedData && cachedData.length > 0) {
        setStudents(cachedData);
        showAlert(
          'Error de conexión',
          `Se han cargado ${cachedData.length} estudiantes guardados. Algunos datos pueden estar desactualizados.`
        );
      } else {
        setStudents([]);
        showAlert(
          'Error',
          'No se pudieron cargar los estudiantes y no hay datos guardados. Verifica tu conexión e intenta nuevamente.'
        );
      }
    } finally {
      // ✅ Siempre detener loading/refreshing al final
      if (forceReload) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, []);

  /**
   * Elimina un estudiante con validación
   */
  const handleDelete = useCallback(async (student: Student) => {
    if (isOfflineMode) {
      showAlert(
        'Modo sin conexión',
        'No puedes eliminar estudiantes sin conexión a internet. Conecta e intenta nuevamente.'
      );
      return;
    }

    const serverHealth = await authService.checkServerHealth();

    if (!serverHealth.ok) {
      showAlert(
        'Sin conexión',
        'No se puede conectar con el servidor. Por favor, verifica tu conexión a internet para eliminar estudiantes.'
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
      `¿Estás seguro de eliminar a ${student.name}?\n\nSe eliminarán también todas sus inscripciones inactivas y representantes que no tengan otros hijos.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteStudent(student.id);

            if (result.success) {
              // 🔄 Recargar lista desde servidor
              loadData(true);
              showAlert('Éxito', 'Estudiante eliminado correctamente');
            } else {
              showAlert('Error', result.message || 'No se pudo eliminar');
            }
          },
        },
      ]
    );
  }, [isOfflineMode, loadData]);

  /**
   * 🔄 Pull-to-refresh: Recarga completa desde servidor
   */
  const onRefresh = useCallback(async () => {
    await loadData(true);
  }, [loadData]);

  return {
    loading,
    refreshing,
    students,
    searchQuery,
    filteredStudents,
    isOfflineMode,
    setSearchQuery,
    loadData,
    handleDelete,
    onRefresh,
  };
};