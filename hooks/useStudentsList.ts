import { useCallback, useMemo, useState } from 'react';
import { showAlert } from '../components/showAlert';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services-odoo/authService';
import { CacheKeys, cacheManager } from '../services-odoo/cache';
import { Student, canDeleteStudent, deleteStudent, loadStudents } from '../services-odoo/personService';

export const useStudentsList = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOfflineMode, setIsOfflineMode] = useState(false); // 👈 NUEVO estado
  const { handleSessionExpired } = useAuth();

  // ✅ Búsqueda optimizada con useMemo
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

  /**
   * Carga inicial de datos
   * Usa caché automáticamente si está disponible
   * ✅ Verifica conexión antes de cargar
   */
  const loadData = useCallback(async (forceReload: boolean = false) => {
    if (forceReload) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      if (__DEV__) {
        console.log('🔄 Cargando estudiantes...');
      }

      // 1️⃣ Verificar conexión al servidor primero
      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        if (__DEV__) {
          console.log('🔴 Servidor no disponible');
        }
        
        // 🔴 ACTIVAR MODO OFFLINE
        setIsOfflineMode(true);
        
        // Intentar cargar desde caché si está disponible
        const cachedData = cacheManager.get<Student[]>(CacheKeys.students());
        if (cachedData && cachedData.length > 0) {
          if (__DEV__) {
            console.log(`📦 Cargando ${cachedData.length} estudiantes desde caché (modo offline)`);
          }
          setStudents(cachedData);
          showAlert(
            'Modo sin conexión',
            `Se han cargado ${cachedData.length} estudiantes desde el almacenamiento local. Conecta a internet para actualizar los datos.`
          );
        } else {
          if (__DEV__) {
            console.log('📭 No hay datos en caché');
          }
          setStudents([]);
          showAlert(
            'Sin conexión',
            'No se puede conectar con el servidor y no hay datos guardados localmente. Por favor, verifica tu conexión a internet.'
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

      // 3️⃣ Cargar datos (HAY CONEXIÓN)
      setIsOfflineMode(false); // 🟢 DESACTIVAR modo offline

      if (forceReload) {
        cacheManager.invalidate(CacheKeys.students());
        if (__DEV__) {
          console.log('🗑️ Caché de estudiantes invalidado');
        }
      }
      const data = await loadStudents();
      setStudents(data);

      if (__DEV__) {
        console.timeEnd('⏱️ loadData');
        console.log(`✅ ${data.length} estudiantes cargados ${forceReload ? '(desde servidor)' : '(caché/servidor)'}`);
      }

      if (__DEV__) {
        console.log(`✅ ${data.length} estudiantes cargados desde servidor`);
      }
    } catch (error) {
      if (__DEV__) console.error('❌ Error loading students:', error);
      
      // 🔴 ACTIVAR MODO OFFLINE en caso de error
      setIsOfflineMode(true);
      
      // Intentar cargar desde caché en caso de error
      const cachedData = cacheManager.get<Student[]>(CacheKeys.students());
      if (cachedData && cachedData.length > 0) {
        if (__DEV__) {
          console.log(`📦 Cargando ${cachedData.length} estudiantes desde caché (error de red)`);
        }
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
      if (forceReload) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [handleSessionExpired]);

  /**
   * Elimina un estudiante con validación
   */
  const handleDelete = useCallback(async (student: Student) => {
    // 🔴 No permitir eliminar en modo offline
    if (isOfflineMode) {
      showAlert(
        'Modo sin conexión',
        'No puedes eliminar estudiantes sin conexión a internet. Conecta e intenta nuevamente.'
      );
      return;
    }

    // Verificar conexión antes de intentar eliminar
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
            // ⚡ UI se actualiza instantáneamente (optimistic update dentro de deleteStudent)
            const result = await deleteStudent(student.id);
            
            if (result.success) {
              // Refrescar lista desde caché actualizado
              const updatedStudents = cacheManager.get<Student[]>(CacheKeys.students()) || [];
              setStudents(updatedStudents);
              
              showAlert('Éxito', 'Estudiante eliminado correctamente');
            } else {
              // Si falla, recargar todo
              showAlert('Error', result.message || 'No se pudo eliminar');
              loadData();
            }
          },
        },
      ]
    );
  }, [loadData, isOfflineMode]);

  /**
   * 🔥 PULL-TO-REFRESH MEJORADO
   * Fuerza recarga COMPLETA desde servidor (ignorando caché)
   * Incluye padres, inscripciones, TODO
   * ✅ Verifica conexión y sesión antes de recargar
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    try {
      if (__DEV__) {
        console.log('🔄 FORCE REFRESH: Recarga completa desde servidor...');
        console.time('⏱️ Full Refresh');
      }

      // 1️⃣ Verificar conexión al servidor primero
      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        if (__DEV__) {
          console.log('🔴 Servidor no disponible durante refresh');
        }
        
        // Mantener modo offline
        setIsOfflineMode(true);
        
        showAlert(
          'Sin conexión',
          'No se puede conectar con el servidor. Por favor, verifica tu conexión a internet e intenta nuevamente.'
        );
        return;
      }

      // 2️⃣ Verificar sesión
      const validSession = await authService.verifySession();

      if (!validSession) {
        if (__DEV__) {
          console.log('❌ Sesión no válida durante refresh');
        }
        handleSessionExpired();
        return;
      }

      // 3️⃣ 🗑️ LIMPIAR TODO EL CACHÉ (fuerza recarga total)
      cacheManager.clear();
      
      if (__DEV__) {
        console.log('🗑️ TODO el caché eliminado - forzando recarga completa');
      }

      // 4️⃣ 🔥 Cargar datos FRESCOS desde servidor
      const freshData = await loadStudents();
      
      // 5️⃣ 📊 Actualizar estado con datos frescos
      setStudents(freshData);
      setIsOfflineMode(false); // 🟢 DESACTIVAR modo offline

      if (__DEV__) {
        console.timeEnd('⏱️ Full Refresh');
        console.log(`✅ Recarga completa: ${freshData.length} estudiantes con TODOS sus datos`);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error en force refresh:', error);
      }
      
      setIsOfflineMode(true); // 🔴 ACTIVAR modo offline por error
      
      showAlert(
        'Error',
        'No se pudo actualizar la información. Verifica tu conexión e intenta nuevamente.'
      );
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
    isOfflineMode, // 👈 EXPORTAR estado offline
    setSearchQuery,
    loadData,
    handleDelete,
    onRefresh,
  };
};