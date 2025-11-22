import { useCallback, useState } from 'react';
import { validateParentField, validateStudentField } from '../validators/fieldValidators';

export const useFormValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = useCallback((field: string, value: string, isParent = false) => {
    const error = isParent 
      ? validateParentField(field, value)
      : validateStudentField(field, value);
    
    setErrors(prev => ({ ...prev, [isParent ? `parent_${field}` : field]: error }));
    return error;
  }, []);

  const validateFields = useCallback((
    fields: string[], 
    data: Record<string, any>, 
    isParent = false
  ): boolean => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    fields.forEach(field => {
      const value = data[field];
      if (typeof value === 'string') {
        const error = isParent 
          ? validateParentField(field, value)
          : validateStudentField(field, value);
        
        if (error) {
          newErrors[isParent ? `parent_${field}` : field] = error;
          isValid = false;
        }
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const clearFieldError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  return {
    errors,
    validateField,
    validateFields,
    clearErrors,
    clearFieldError,
  };
};
