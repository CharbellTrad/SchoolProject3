/**
 * Contexto para controlar cuando la app está lista (animación finalizada)
 */

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AppReadyContextType {
  isAppReady: boolean;
  setAppReady: (ready: boolean) => void;
}

const AppReadyContext = createContext<AppReadyContextType | undefined>(undefined);

// Variable global para persistir el estado entre re-renders
let globalAppReady = false;

export function AppReadyProvider({ children }: { children: ReactNode }) {
  // Inicializar con el valor global persistido
  const [isAppReady, setIsAppReadyState] = useState(globalAppReady);

  const setAppReady = (ready: boolean) => {
    if (__DEV__) {
      console.log(`🔄 [AppReadyContext] setAppReady(${ready})`);
    }
    
    // Actualizar tanto el estado como la variable global
    globalAppReady = ready;
    setIsAppReadyState(ready);
  };

  // Al montar, verificar si ya está listo globalmente
  useEffect(() => {
    if (globalAppReady && !isAppReady) {
      if (__DEV__) {
        console.log('🔄 [AppReadyContext] Restaurando estado global: true');
      }
      setIsAppReadyState(true);
    }
  }, [isAppReady]);

  return (
    <AppReadyContext.Provider value={{ isAppReady, setAppReady }}>
      {children}
    </AppReadyContext.Provider>
  );
}

export function useAppReady() {
  const context = useContext(AppReadyContext);
  if (context === undefined) {
    throw new Error('useAppReady debe usarse dentro de AppReadyProvider');
  }
  return context;
}