import { useCallback, useEffect, useState } from 'react';
import { useImagePicker } from '../components/ImagePicker';
import { Parent, SizesJson, Student, loadStudentParents } from '../services-odoo/personService';
import { validateStudentField } from '../validators/fieldValidators';

export const useStudentEdit = (student: Student | null) => {
  const [formData, setFormData] = useState<Student | null>(null);
  const [sizesData, setSizesData] = useState<SizesJson>({
    height: 0,
    weight: 0,
    size_shirt: '',
    size_pants: 0,
    size_shoes: 0,
  });
  const [parents, setParents] = useState<Array<Partial<Parent> & { id?: number }>>([]);
  const [originalParentIds, setOriginalParentIds] = useState<number[]>([]);
  const [parentsToDelete, setParentsToDelete] = useState<number[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingParents, setLoadingParents] = useState(false);

  const { images, setImage, getImage, clearImage, clearAll } = useImagePicker();

  useEffect(() => {
    if (student) {
      setFormData({ ...student });
      setErrors({});
      clearAll();
      setParentsToDelete([]);

      const initialSizes: SizesJson = {
        height: student.sizes_json?.height ||
          (typeof student.current_height === 'number' ? student.current_height : 0),
        weight: student.sizes_json?.weight ||
          (typeof student.current_weight === 'number' ? student.current_weight : 0),
        size_shirt: student.sizes_json?.size_shirt ||
          (typeof student.current_size_shirt === 'string' ? student.current_size_shirt : ''),
        size_pants: student.sizes_json?.size_pants ||
          (typeof student.current_size_pants === 'number' ? student.current_size_pants : 0),
        size_shoes: student.sizes_json?.size_shoes ||
          (typeof student.current_size_shoes === 'number' ? student.current_size_shoes : 0),
      };
      setSizesData(initialSizes);

      // Lógica para cargar padres si faltan
      if (student.parents && student.parents.length > 0) {
        setParents(student.parents);
        setOriginalParentIds(student.parents.map(p => p.id).filter((id): id is number => id !== undefined));
      } else if (student.parents_ids && student.parents_ids.length > 0) {
        setLoadingParents(true);
        loadStudentParents(student.id, student.parents_ids)
          .then(loadedParents => {
            setParents(loadedParents);
            setOriginalParentIds(loadedParents.map(p => p.id));
          })
          .catch(err => console.error("Error loading parents for edit:", err))
          .finally(() => setLoadingParents(false));
      } else {
        setParents([]);
        setOriginalParentIds([]);
      }

      // ✅ CORREGIDO: Ahora pasamos el 4to parámetro (thumbnail) como undefined
      // Esto fuerza a que el hook detecte el tipo correctamente y lo preserve
      if (student.image_1920) {
        setImage('student_photo', student.image_1920, 'photo.jpg', undefined);
      }
      
      // ✅ CRÍTICO: Para PDFs, pasar thumbnail como undefined pero asegurar filename correcto
      if (student.ci_document) {
        const filename = student.ci_document_filename || 'ci_document.pdf';
        setImage('ci_document', student.ci_document, filename, undefined);
      }
      
      if (student.born_document) {
        const filename = student.born_document_filename || 'born_document.pdf';
        setImage('born_document', student.born_document, filename, undefined);
      }
    }
  }, [student]);

  const updateField = useCallback((field: keyof Student, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
    const error = validateStudentField(field as string, value as string);
    setErrors((prev) => ({ ...prev, [field]: error }));
  }, []);

  const updateSizeField = useCallback((field: keyof SizesJson, value: any) => {
    setSizesData(prev => ({ ...prev, [field]: value }));
  }, []);

  return {
    formData,
    sizesData,
    parents,
    originalParentIds,
    parentsToDelete,
    errors,
    images,
    loadingParents,
    updateField,
    updateSizeField,
    setParents,
    setParentsToDelete,
    setErrors,
    setImage,
    getImage,
    clearImage,
  };
};