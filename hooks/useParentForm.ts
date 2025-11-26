import { useCallback, useState } from 'react';
import { showAlert } from '../components/showAlert';
import * as authService from '../services-odoo/authService'; // ✅ AGREGADO
import { Parent, searchParents } from '../services-odoo/personService';
import { formatDateToDisplay } from '../utils/formatHelpers';

const initialParentData: Partial<Parent> = {
  name: '',
  vat: '',
  nationality: '',
  born_date: '',
  sex: '',
  email: '',
  phone: '',
  resident_number: '',
  emergency_phone_number: '',
  live_with_student: '',
  active_job: '',
  job_place: '',
  job: '',
};

export const useParentForm = () => {
  const [parents, setParents] = useState<Array<Partial<Parent> & { id?: number }>>([]);
  const [currentParent, setCurrentParent] = useState<Partial<Parent>>(initialParentData);
  const [editingParentIndex, setEditingParentIndex] = useState<number | null>(null);
  const [showAddParent, setShowAddParent] = useState(false);
  const [showSearchParent, setShowSearchParent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Parent[]>([]);
  const [searching, setSearching] = useState(false);

  const updateParentField = useCallback((field: string, value: string) => {
    setCurrentParent(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * ✅ Busca representantes existentes CON VERIFICACIÓN DE CONEXIÓN
   */
  const handleSearchParents = useCallback(async (query: string) => {
    setSearchQuery(query);

    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      // 1️⃣ Verificar conexión primero
      const serverHealth = await authService.checkServerHealth();

      if (!serverHealth.ok) {
        if (__DEV__) {
          console.log('🔴 Servidor no disponible para búsqueda de representantes');
        }
        showAlert(
          'Sin conexión',
          'No se puede buscar representantes sin conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.'
        );
        setSearchResults([]);
        setSearching(false);
        return;
      }

      // 2️⃣ Realizar búsqueda
      const results = await searchParents(query);
      const filteredResults = results.filter(
        result => !parents.some(p => p.id === result.id)
      );
      setSearchResults(filteredResults);
    } catch (error) {
      if (__DEV__) {
        console.error('❌ Error buscando representantes:', error);
      }
      showAlert(
        'Error',
        'No se pudo realizar la búsqueda. Verifica tu conexión e intenta nuevamente.'
      );
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [parents]);

  const addExistingParent = useCallback((parent: Parent) => {
    if (parents.some(p => p.id === parent.id)) {
      showAlert('Ya agregado', 'Este representante ya está asociado al estudiante');
      return;
    }
    
    const parentWithFormattedDate = {
      ...parent,
      born_date: formatDateToDisplay(parent.born_date),
    };
    
    setParents(prev => [...prev, parentWithFormattedDate]);
    setShowSearchParent(false);
    setSearchQuery('');
    setSearchResults([]);
    showAlert('✅ Éxito', 'Representante agregado correctamente');
  }, [parents]);

  const addOrUpdateParent = useCallback((parentData: Partial<Parent>) => {
    if (editingParentIndex !== null) {
      const updatedParents = [...parents];
      updatedParents[editingParentIndex] = parentData;
      setParents(updatedParents);
      showAlert('✅ Éxito', 'Representante actualizado correctamente');
    } else {
      setParents(prev => [...prev, parentData]);
      showAlert('✅ Éxito', 'Representante agregado correctamente');
    }
    
    resetCurrentParent();
  }, [editingParentIndex, parents]);

  const removeParent = useCallback((index: number) => {
    setParents(prev => prev.filter((_, i) => i !== index));
    showAlert('Éxito', 'Representante eliminado');
  }, []);

  const startEditingParent = useCallback((index: number, parent: Partial<Parent>) => {
    setCurrentParent(parent);
    setEditingParentIndex(index);
    setShowAddParent(true);
  }, []);

  const resetCurrentParent = useCallback(() => {
    setCurrentParent(initialParentData);
    setShowAddParent(false);
    setEditingParentIndex(null);
  }, []);

  const closeSearch = useCallback(() => {
    setShowSearchParent(false);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  return {
    parents,
    currentParent,
    editingParentIndex,
    showAddParent,
    showSearchParent,
    searchQuery,
    searchResults,
    searching,
    updateParentField,
    handleSearchParents,
    addExistingParent,
    addOrUpdateParent,
    removeParent,
    startEditingParent,
    resetCurrentParent,
    setShowAddParent,
    setShowSearchParent,
    closeSearch,
  };
};