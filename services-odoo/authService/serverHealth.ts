/**
 * Verificación de salud del servidor Odoo
 */

import * as odooApi from '../apiService';
import { ServerHealthResult } from './types';

/**
 * Verifica si el servidor Odoo está disponible
 * @returns Objeto con estado ok y posible error
 */
export const checkServerHealth = async (): Promise<ServerHealthResult> => {
  try {
    const isConnected = await odooApi.checkOdooConnection();

    if (__DEV__) {
      if (isConnected) {
        console.log('✅ Servidor Odoo disponible');
      } else {
        console.log('❌ Servidor Odoo no disponible');
      }
    }

    return { ok: isConnected };
  } catch (error) {
    if (__DEV__) {
      console.error('❌ Error verificando servidor:', error);
    }
    return { ok: false, error };
  }
};

/**
 * Verifica conectividad con reintentos
 * @param maxRetries - Número máximo de reintentos
 * @param delayMs - Delay entre reintentos en ms
 * @returns true si conectó exitosamente
 */
export const checkServerHealthWithRetry = async (
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<boolean> => {
  for (let i = 0; i < maxRetries; i++) {
    const result = await checkServerHealth();
    
    if (result.ok) {
      return true;
    }
    
    if (i < maxRetries - 1) {
      if (__DEV__) {
        console.log(`🔄 Reintento ${i + 1}/${maxRetries}...`);
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return false;
};