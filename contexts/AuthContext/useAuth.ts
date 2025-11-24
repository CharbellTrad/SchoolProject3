/**
 * Hook para usar el contexto de autenticación
 */

import { useContext } from 'react';
import { AuthContextType } from '../../types/auth';
import { AuthContext } from './AuthProvider';

/**
 * Hook para usar el contexto de autenticación
 * @throws Error si se usa fuera del AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }

  return context;
};