import { useCallback, useState } from 'react';
import { showAlert } from '../components/showAlert';
import { canDeleteParent, Parent, ParentFormData, searchParents } from '../services-odoo/personService';
import { formatDateToDisplay } from '../utils/formatHelpers';
import { validateParentField } from '../validators/fieldValidators';

export const useParentManagement = (
  parents: Array<Partial<Parent> & { id?: number }>,
  setParents: (parents: Array<Partial<Parent> & { id?: number }>) => void,
  originalParentIds: number[],
  parentsToDelete: number[],
  setParentsToDelete: (ids: number[]) => void,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>, // ✅ Tipo correcto
  getImage: (key: string) => { base64?: string; filename?: string } | undefined,
  setImage: (key: string, base64: string, filename: string) => void,
  clearImage: (key: string) => void
) => {
  const [showAddParent, setShowAddParent] = useState(false);
  const [showSearchParent, setShowSearchParent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Parent[]>([]);
  const [searching, setSearching] = useState(false);
  const [editingParentIndex, setEditingParentIndex] = useState<number | null>(null);
  const [currentParent, setCurrentParent] = useState<ParentFormData>({
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
  });

  const updateParentField = useCallback((field: string, value: string) => {
    setCurrentParent(prev => ({ ...prev, [field]: value }));
    const error = validateParentField(field, value);
    setErrors((prev: Record<string, string>) => ({ ...prev, [`parent_${field}`]: error })); // ✅ Tipo explícito
  }, [setErrors]);

  const handleSearchParents = useCallback(async (query: string) => {
    setSearchQuery(query);
    
    if (query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    const results = await searchParents(query);
    const filteredResults = results.filter(
      result => !parents.some(p => p.id === result.id)
    );
    setSearchResults(filteredResults);
    setSearching(false);
  }, [parents]);

  const addExistingParent = useCallback((parent: Parent) => {
    if (parents.some(p => p.id === parent.id)) {
      showAlert('Ya agregado', 'Este representante ya está asociado al estudiante');
      return;
    }
    
    setParents([...parents, parent]);
    setShowSearchParent(false);
    setSearchQuery('');
    setSearchResults([]);
    showAlert('✅ Éxito', 'Representante agregado correctamente');
  }, [parents, setParents]);

  const addOrUpdateParent = useCallback(() => {
    const requiredFields = ['name', 'vat', 'nationality', 'born_date', 'sex', 'email', 'phone', 'emergency_phone_number', 'live_with_student', 'active_job'];
    let isValid = true;

    requiredFields.forEach(field => {
      const error = validateParentField(field, currentParent[field as keyof typeof currentParent] as string);
      if (error) {
        setErrors((prev: Record<string, string>) => ({ ...prev, [`parent_${field}`]: error })); // ✅ Tipo explícito
        isValid = false;
      }
    });

    if (!isValid) {
      showAlert('Error', 'Complete todos los campos requeridos del representante');
      return;
    }

    const parentWithImages: ParentFormData = {
      ...currentParent,
      image_1920: getImage('parent_photo')?.base64 || currentParent.image_1920,
      ci_document: getImage('parent_ci_document')?.base64 || currentParent.ci_document,
      ci_document_filename: getImage('parent_ci_document')?.filename || currentParent.ci_document_filename,
      parent_singnature: getImage('parent_signature')?.base64 || currentParent.parent_singnature,
    };

    if (editingParentIndex !== null) {
      const updatedParents = [...parents];
      updatedParents[editingParentIndex] = parentWithImages;
      setParents(updatedParents);
      showAlert('✅ Éxito', 'Representante actualizado correctamente');
    } else {
      setParents([...parents, parentWithImages]);
      showAlert('✅ Éxito', 'Representante agregado correctamente');
    }

    resetForm();
  }, [currentParent, parents, editingParentIndex, setParents, setErrors, getImage]);

  const editParent = useCallback((index: number) => {
    const parentToEdit = parents[index];
    const formattedParent = {
      ...parentToEdit,
      born_date: formatDateToDisplay(parentToEdit.born_date),
    };
    setCurrentParent(formattedParent);
    
    if (parentToEdit.image_1920) {
      setImage('parent_photo', parentToEdit.image_1920, 'parent_photo.jpg');
    } else {
      clearImage('parent_photo');
    }
    
    if (parentToEdit.ci_document) {
      setImage('parent_ci_document', parentToEdit.ci_document, parentToEdit.ci_document_filename || 'ci.jpg');
    } else {
      clearImage('parent_ci_document');
    }
    
    if (parentToEdit.parent_singnature) {
      setImage('parent_signature', parentToEdit.parent_singnature, 'signature.jpg');
    } else {
      clearImage('parent_signature');
    }
    
    setEditingParentIndex(index);
    setShowAddParent(true);
  }, [parents, setImage, clearImage]);

  const removeParent = useCallback(async (index: number, studentId: number) => {
    const parentToRemove = parents[index];
    
    if (!parentToRemove.id) {
      setParents(parents.filter((_, i) => i !== index));
      showAlert('Éxito', 'Representante eliminado');
      return;
    }
    
    const wasOriginallyAssociated = originalParentIds.includes(parentToRemove.id);
    
    if (!wasOriginallyAssociated) {
      setParents(parents.filter((_, i) => i !== index));
      showAlert('Éxito', 'Representante eliminado');
      return;
    }
    
    const validation = await canDeleteParent(parentToRemove.id, studentId);
    
    if (!validation.canUnlink) {
      showAlert('No se puede realizar esta acción', validation.message || 'Error al verificar el representante');
      return;
    }
    
    if (!validation.canDelete) {
      showAlert(
        validation.hasOtherChildren ? 'Desvincular Representante' : 'No se puede eliminar',
        `${validation.message}\n\nSe desvinculará del estudiante actual.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desvincular',
            onPress: () => {
              setParents(parents.filter((_, i) => i !== index));
              showAlert('Éxito', 'El representante será desvinculado al guardar');
            },
          },
        ]
      );
      return;
    }
    
    showAlert(
      'Eliminar Representante',
      `¿Qué desea hacer con ${parentToRemove.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Solo Desvincular',
          onPress: () => {
            setParents(parents.filter((_, i) => i !== index));
            showAlert('Éxito', 'El representante será desvinculado al guardar');
          },
        },
        {
          text: 'Eliminar Permanentemente',
          style: 'destructive',
          onPress: () => {
            showAlert(
              '⚠️ Confirmar Eliminación',
              `Esta acción eliminará a ${parentToRemove.name} COMPLETAMENTE del sistema al guardar.\n\n¿Está seguro?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sí, Eliminar',
                  style: 'destructive',
                  onPress: () => {
                    setParentsToDelete([...parentsToDelete, parentToRemove.id!]);
                    setParents(parents.filter((_, i) => i !== index));
                    showAlert('Éxito', 'El representante será eliminado permanentemente al guardar');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [parents, originalParentIds, parentsToDelete, setParents, setParentsToDelete]);

  const resetForm = useCallback(() => {
    setCurrentParent({
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
    });
    clearImage('parent_photo');
    clearImage('parent_ci_document');
    clearImage('parent_signature');
    setShowAddParent(false);
    setEditingParentIndex(null);
    
    setErrors((prev: Record<string, string>) => { // ✅ Tipo explícito
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('parent_')) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  }, [clearImage, setErrors]);

  return {
    showAddParent,
    showSearchParent,
    currentParent,
    editingParentIndex,
    searchQuery,
    searchResults,
    searching,
    setShowAddParent,
    setShowSearchParent,
    updateParentField,
    handleSearchParents,
    addExistingParent,
    addOrUpdateParent,
    editParent,
    removeParent,
    resetForm,
  };
};
