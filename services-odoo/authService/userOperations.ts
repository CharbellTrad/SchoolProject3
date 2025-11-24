/**
 * Operaciones relacionadas con el usuario
 */

import * as odooApi from '../apiService';
import { getSavedUserSession } from './sessionManager';
import { OperationResult } from './types';

/**
 * Obtiene información adicional del usuario desde Odoo
 * @returns Información del partner asociado
 */
export const getUserInfo = async (): Promise<OperationResult> => {
  try {
    const session = await getSavedUserSession();

    if (!session || !session.odooData) {
      return {
        success: false,
        error: { message: 'No hay sesión activa' },
      };
    }

    // Leer información del partner
    const result = await odooApi.read(
      'res.partner',
      [session.odooData.partnerId],
      ['name', 'email', 'phone', 'mobile', 'street', 'city']
    );

    return result;
  } catch (error: any) {
    return {
      success: false,
      error: { message: error.message },
    };
  }
};

/**
 * Cambia la contraseña del usuario actual
 * @param currentPassword - Contraseña actual
 * @param newPassword - Nueva contraseña
 * @returns Resultado de la operación
 */
export const changePassword = async (
  currentPassword: string,
  newPassword: string
): Promise<OperationResult> => {
  try {
    const session = await getSavedUserSession();

    if (!session) {
      return {
        success: false,
        message: 'No hay sesión activa',
      };
    }

    // Validar nueva contraseña
    if (!newPassword || newPassword.trim().length < 6) {
      return {
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres',
      };
    }

    // Validar contraseña actual intentando autenticar
    const authResult = await odooApi.authenticate(session.username, currentPassword);

    if (!authResult.success) {
      return {
        success: false,
        message: 'Contraseña actual incorrecta',
      };
    }

    // Cambiar contraseña
    const changeResult = await odooApi.callMethod(
      'res.users',
      'change_password',
      [[session.id], newPassword],
      {}
    );

    if (!changeResult.success) {
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(changeResult.error),
      };
    }

    if (__DEV__) {
      console.log('✅ Contraseña cambiada exitosamente');
    }

    return {
      success: true,
      message: 'Contraseña cambiada exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error cambiando contraseña:', error);
    }
    
    return {
      success: false,
      message: error.message || 'Error al cambiar contraseña',
    };
  }
};

/**
 * Actualiza el perfil del usuario
 * @param updates - Campos a actualizar
 * @returns Resultado de la operación
 */
export const updateUserProfile = async (
  updates: {
    name?: string;
    email?: string;
    phone?: string;
    mobile?: string;
  }
): Promise<OperationResult> => {
  try {
    const session = await getSavedUserSession();

    if (!session || !session.odooData) {
      return {
        success: false,
        message: 'No hay sesión activa',
      };
    }

    // Actualizar en Odoo usando callMethod con write
    const result = await odooApi.callMethod(
      'res.partner',
      'write',
      [[session.odooData.partnerId], updates],
      {}
    );

    if (!result.success) {
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(result.error),
      };
    }

    if (__DEV__) {
      console.log('✅ Perfil actualizado');
    }

    return {
      success: true,
      message: 'Perfil actualizado correctamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error actualizando perfil:', error);
    }
    
    return {
      success: false,
      message: error.message || 'Error al actualizar perfil',
    };
  }
};