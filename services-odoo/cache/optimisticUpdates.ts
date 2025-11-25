/**
 * Sistema de actualizaciones optimistas
 * Actualiza la UI inmediatamente y sincroniza en segundo plano
 */

import { Student } from '../personService/types';
import { CacheKeys, cacheManager } from './cacheManager';

interface OptimisticOperation<T> {
  type: 'create' | 'update' | 'delete';
  entity: 'student' | 'parent';
  data: T;
  tempId?: string;
  rollback: () => void;
}

class OptimisticUpdateManager {
  private pendingOperations: Map<string, OptimisticOperation<any>> = new Map();

  /**
   * Actualización optimista de estudiante
   * Retorna ID temporal y función de rollback
   */
  updateStudentOptimistic(
    id: number,
    updates: Partial<Student>
  ): { tempId: string; rollback: () => void } {
    const tempId = `optimistic-${Date.now()}`;
    
    // Obtener caché actual
    const cachedStudents = cacheManager.get<Student[]>(CacheKeys.students()) || [];
    const index = cachedStudents.findIndex(s => s.id === id);
    
    if (index === -1) {
      return {
        tempId,
        rollback: () => {},
      };
    }

    // Guardar estado original
    const originalStudent = { ...cachedStudents[index] };
    
    // Aplicar actualización optimista
    cachedStudents[index] = {
      ...cachedStudents[index],
      ...updates,
    };
    
    // Actualizar caché inmediatamente
    cacheManager.set(CacheKeys.students(), cachedStudents, 10 * 60 * 1000);
    
    if (__DEV__) {
      console.log(`⚡ Actualización optimista aplicada para estudiante ${id}`);
    }
    
    // Función de rollback
    const rollback = () => {
      const current = cacheManager.get<Student[]>(CacheKeys.students()) || [];
      const idx = current.findIndex(s => s.id === id);
      if (idx !== -1) {
        current[idx] = originalStudent;
        cacheManager.set(CacheKeys.students(), current, 10 * 60 * 1000);
        
        if (__DEV__) {
          console.log(`↩️ Rollback ejecutado para estudiante ${id}`);
        }
      }
      this.pendingOperations.delete(tempId);
    };
    
    // Guardar operación pendiente
    this.pendingOperations.set(tempId, {
      type: 'update',
      entity: 'student',
      data: updates,
      tempId,
      rollback,
    });
    
    return { tempId, rollback };
  }

  /**
   * Creación optimista de estudiante
   */
  createStudentOptimistic(
    studentData: Partial<Student>
  ): { tempId: number; rollback: () => void } {
    const tempId = -Date.now(); // ID temporal negativo
    
    // Crear estudiante temporal
    const tempStudent: Student = {
      id: tempId,
      name: studentData.name || '',
      vat: studentData.vat || '',
      nationality: studentData.nationality || '',
      born_date: studentData.born_date || '',
      sex: studentData.sex || '',
      blood_type: studentData.blood_type || '',
      email: studentData.email || '',
      phone: studentData.phone || '',
      emergency_phone_number: studentData.emergency_phone_number || '',
      street: studentData.street || '',
      student_lives: studentData.student_lives || '',
      suffer_illness_treatment: studentData.suffer_illness_treatment || '',
      authorize_primary_atention: studentData.authorize_primary_atention || '',
      pregnat_finished: studentData.pregnat_finished || '',
      gestation_time: studentData.gestation_time || '',
      peso_al_nacer: studentData.peso_al_nacer || '',
      born_complication: studentData.born_complication || '',
      parents_ids: studentData.parents_ids || [],
      user_id: null,
      is_active: true,
      ...studentData,
    };
    
    // Agregar al caché
    const cachedStudents = cacheManager.get<Student[]>(CacheKeys.students()) || [];
    cachedStudents.unshift(tempStudent); // Agregar al inicio
    cacheManager.set(CacheKeys.students(), cachedStudents, 10 * 60 * 1000);
    
    if (__DEV__) {
      console.log(`⚡ Estudiante temporal creado con ID ${tempId}`);
    }
    
    // Función de rollback
    const rollback = () => {
      const current = cacheManager.get<Student[]>(CacheKeys.students()) || [];
      const filtered = current.filter(s => s.id !== tempId);
      cacheManager.set(CacheKeys.students(), filtered, 10 * 60 * 1000);
      
      if (__DEV__) {
        console.log(`↩️ Rollback: estudiante temporal ${tempId} eliminado`);
      }
    };
    
    return { tempId, rollback };
  }

  /**
   * Eliminación optimista
   */
  deleteStudentOptimistic(id: number): { rollback: () => void } {
    const cachedStudents = cacheManager.get<Student[]>(CacheKeys.students()) || [];
    const index = cachedStudents.findIndex(s => s.id === id);
    
    if (index === -1) {
      return { rollback: () => {} };
    }
    
    // Guardar estudiante original
    const deletedStudent = { ...cachedStudents[index] };
    
    // Eliminar del caché
    cachedStudents.splice(index, 1);
    cacheManager.set(CacheKeys.students(), cachedStudents, 10 * 60 * 1000);
    
    if (__DEV__) {
      console.log(`⚡ Estudiante ${id} eliminado optimísticamente`);
    }
    
    // Función de rollback
    const rollback = () => {
      const current = cacheManager.get<Student[]>(CacheKeys.students()) || [];
      current.splice(index, 0, deletedStudent);
      cacheManager.set(CacheKeys.students(), current, 10 * 60 * 1000);
      
      if (__DEV__) {
        console.log(`↩️ Rollback: estudiante ${id} restaurado`);
      }
    };
    
    return { rollback };
  }

  /**
   * Confirma una operación optimista
   */
  confirmOperation(tempId: string): void {
    this.pendingOperations.delete(tempId);
    
    if (__DEV__) {
      console.log(`✅ Operación ${tempId} confirmada`);
    }
  }

  /**
   * Reemplaza un estudiante temporal por el real
   */
  replaceTempStudent(tempId: number, realStudent: Student): void {
    const cachedStudents = cacheManager.get<Student[]>(CacheKeys.students()) || [];
    const index = cachedStudents.findIndex(s => s.id === tempId);
    
    if (index !== -1) {
      cachedStudents[index] = realStudent;
      cacheManager.set(CacheKeys.students(), cachedStudents, 10 * 60 * 1000);
      
      if (__DEV__) {
        console.log(`🔄 Estudiante temporal ${tempId} reemplazado por ID real ${realStudent.id}`);
      }
    }
  }

  /**
   * Obtiene operaciones pendientes
   */
  getPendingOperations(): OptimisticOperation<any>[] {
    return Array.from(this.pendingOperations.values());
  }
}

// Instancia singleton
export const optimisticManager = new OptimisticUpdateManager();