import * as odooApi from '../apiService';
import { MODELS } from './constants';
import type { DeleteValidation } from './types';

/**
 * Verifica si un estudiante puede ser eliminado
 */
export const canDeleteStudent = async (id: number): Promise<DeleteValidation> => {
  try {
    const studentResult = await odooApi.read(MODELS.PARTNER, [id], ['inscription_ids']);

    if (!studentResult.success || !studentResult.data || studentResult.data.length === 0) {
      if (studentResult.error?.isSessionExpired) {
        return { 
          canDelete: false, 
          canUnlink: false, 
          hasOtherChildren: false,
          message: 'Tu sesión ha expirado' 
        };
      }
      return { 
        canDelete: false, 
        canUnlink: false, 
        hasOtherChildren: false,
        message: 'Estudiante no encontrado' 
      };
    }

    const student = studentResult.data[0];

    if (student.inscription_ids && student.inscription_ids.length > 0) {
      const inscriptionsResult = await odooApi.read(
        MODELS.INSCRIPTION,
        student.inscription_ids,
        ['id', 'state', 'name']
      );

      if (inscriptionsResult.success && inscriptionsResult.data) {
        const inscriptions = inscriptionsResult.data;
        const activeInscriptions = inscriptions.filter((insc: any) => insc.state === 'done');

        if (activeInscriptions.length > 0) {
          const inscriptionNames = activeInscriptions.map((insc: any) => insc.name).join(', ');
          return {
            canDelete: false,
            canUnlink: false,
            hasOtherChildren: false,
            message: `No se puede eliminar el estudiante porque tiene ${activeInscriptions.length} inscripción(es) activa(s): ${inscriptionNames}.\n\nDebe cancelar o desinscribir al estudiante primero.`,
          };
        }
      }
    }

    return { canDelete: true, canUnlink: true, hasOtherChildren: false };
  } catch (error: any) {
    return {
      canDelete: false,
      canUnlink: false,
      hasOtherChildren: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Verifica si un padre puede ser eliminado o desvinculado
 */
export const canDeleteParent = async (
  parentId: number,
  currentStudentId?: number
): Promise<DeleteValidation> => {
  try {
    const parentResult = await odooApi.read(MODELS.PARTNER, [parentId], ['students_ids', 'name']);

    if (!parentResult.success || !parentResult.data || parentResult.data.length === 0) {
      if (parentResult.error?.isSessionExpired) {
        return {
          canDelete: false,
          canUnlink: false,
          hasOtherChildren: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        canDelete: false,
        canUnlink: false,
        hasOtherChildren: false,
        message: 'Representante no encontrado',
      };
    }

    const parent = parentResult.data[0];
    const studentsIds = parent.students_ids || [];

    // Verificar inscripciones activas del estudiante actual
    if (currentStudentId) {
      const hasActiveInscriptions = await checkParentInActiveInscriptions(
        parentId, 
        currentStudentId, 
        parent.name
      );
      
      if (!hasActiveInscriptions.canUnlink) {
        return hasActiveInscriptions;
      }
    }

    // Filtrar otros estudiantes
    const otherStudentsIds = currentStudentId
      ? studentsIds.filter((id: number) => id !== currentStudentId)
      : studentsIds;

    const hasOtherChildren = otherStudentsIds.length > 0;

    if (studentsIds.length === 0) {
      return {
        canDelete: true,
        canUnlink: true,
        hasOtherChildren: false,
      };
    }

    // Verificar inscripciones activas de otros hijos
    for (const studentId of otherStudentsIds) {
      const studentResult = await odooApi.read(MODELS.PARTNER, [studentId], ['inscription_ids', 'name']);

      if (studentResult.success && studentResult.data && studentResult.data.length > 0) {
        const student = studentResult.data[0];

        if (student.inscription_ids && student.inscription_ids.length > 0) {
          const inscriptionsResult = await odooApi.read(
            MODELS.INSCRIPTION,
            student.inscription_ids,
            ['id', 'state', 'name', 'parent_id']
          );

          if (inscriptionsResult.success && inscriptionsResult.data) {
            const activeInscriptionsWithThisParent = inscriptionsResult.data.filter((insc: any) => {
              if (insc.state !== 'done') return false;
              if (!insc.parent_id) return false;

              const inscParentId = Array.isArray(insc.parent_id) ? insc.parent_id[0] : insc.parent_id;
              return inscParentId === parentId;
            });

            if (activeInscriptionsWithThisParent.length > 0) {
              return {
                canDelete: false,
                canUnlink: true,
                hasOtherChildren,
                message: `No se puede eliminar permanentemente porque ${parent.name} es el responsable en ${activeInscriptionsWithThisParent.length} inscripción(es) activa(s) de su otro hijo/a "${student.name}".`,
              };
            }
          }
        }
      }
    }

    // Tiene otros hijos pero no es responsable en inscripciones activas
    if (hasOtherChildren) {
      return {
        canDelete: false,
        canUnlink: true,
        hasOtherChildren: true,
        message: 'El representante tiene otros estudiantes asociados.',
      };
    }

    // No tiene otros hijos ni inscripciones activas
    return {
      canDelete: true,
      canUnlink: true,
      hasOtherChildren: false,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en canDeleteParent:', error);
    }
    return {
      canDelete: false,
      canUnlink: false,
      hasOtherChildren: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Verifica si un padre es responsable en inscripciones activas de un estudiante
 */
async function checkParentInActiveInscriptions(
  parentId: number,
  studentId: number,
  parentName: string
): Promise<DeleteValidation> {
  try {
    const currentStudentResult = await odooApi.read(MODELS.PARTNER, [studentId], [
      'inscription_ids',
      'name',
    ]);

    if (currentStudentResult.success && currentStudentResult.data && currentStudentResult.data.length > 0) {
      const currentStudent = currentStudentResult.data[0];

      if (currentStudent.inscription_ids && currentStudent.inscription_ids.length > 0) {
        const currentInscriptionsResult = await odooApi.read(
          MODELS.INSCRIPTION,
          currentStudent.inscription_ids,
          ['id', 'state', 'name', 'parent_id']
        );

        if (currentInscriptionsResult.success && currentInscriptionsResult.data) {
          const currentInscriptions = currentInscriptionsResult.data;

          const activeInscriptionsWithThisParent = currentInscriptions.filter((insc: any) => {
            if (insc.state !== 'done') return false;
            if (!insc.parent_id) return false;

            const inscParentId = Array.isArray(insc.parent_id) ? insc.parent_id[0] : insc.parent_id;
            return inscParentId === parentId;
          });

          if (activeInscriptionsWithThisParent.length > 0) {
            return {
              canDelete: false,
              canUnlink: false,
              hasOtherChildren: false,
              message: `No puede desvincular ni eliminar a ${parentName} porque es el responsable en ${activeInscriptionsWithThisParent.length} inscripción(es) activa(s) del estudiante.\n\nDebe cambiar el responsable o cancelar las inscripciones primero.`,
            };
          }
        }
      }
    }
  } catch (error) {
    if (__DEV__) {
      console.error('Error verificando estudiante actual:', error);
    }
  }

  return { canDelete: true, canUnlink: true, hasOtherChildren: false };
}