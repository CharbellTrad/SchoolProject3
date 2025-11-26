// ============ VALIDACIONES BASE COMPARTIDAS ============

/**
 * Validaciones comunes entre estudiantes y representantes
 */
export const validateCommonField = (field: string, value: string): string => {
  switch (field) {
    // CÉDULA (solo números, sin V- o E-)
    case 'vat':
      if (!value || !value.trim()) return 'La cédula es requerida';
      if (!/^\d{5,8}$/.test(value.trim())) {
        return 'La cédula debe tener entre 5 y 8 dígitos';
      }
      break;

    // NACIONALIDAD
    case 'nationality':
      if (!value || !value.trim()) return 'La nacionalidad es requerida';
      if (!['V', 'E', 'v', 'e'].includes(value.trim())) {
        return 'Seleccione V (Venezolano) o E (Extranjero)';
      }
      break;

    // TELÉFONOS - VALIDACIÓN MÁS FLEXIBLE
    case 'phone':
    case 'emergency_phone_number':
      if (!value || !value.trim()) return 'El teléfono es requerido';
      
      const cleanPhone = value.replace(/[\s\-\(\)\+]/g, '');
      
      if (!/^\d+$/.test(cleanPhone)) {
        return 'El teléfono solo debe contener números';
      }
      
      let phoneToValidate = cleanPhone;
      
      if (cleanPhone.startsWith('58') && cleanPhone.length > 11) {
        phoneToValidate = cleanPhone.substring(2);
      }
      
      if (phoneToValidate.length < 10 || phoneToValidate.length > 11) {
        return 'El teléfono debe tener 10-11 dígitos';
      }
      
      if (phoneToValidate.length === 11) {
        const areaCode = phoneToValidate.substring(0, 4);
        const validAreaCodes = [
          '0414', '0424', '0412', '0416', '0426', '0212', 
          '0234', '0235', '0236', '0237', '0238', '0239',
          '0241', '0242', '0243', '0244', '0245', '0246', '0247', '0248', '0249',
          '0251', '0252', '0253', '0254', '0255', '0256', '0257', '0258', '0259',
          '0261', '0262', '0263', '0264', '0265', '0266', '0267', '0268', '0269',
          '0271', '0272', '0273', '0274', '0275', '0276', '0277', '0278', '0279',
          '0281', '0282', '0283', '0284', '0285', '0286', '0287', '0288', '0289',
          '0291', '0292', '0293', '0294', '0295'
        ];
        
        if (!validAreaCodes.includes(areaCode)) {
          return 'Código de área venezolano inválido';
        }
      }
      break;

    // TELÉFONO RESIDENCIA (OPCIONAL)
    case 'resident_number':
      if (value && value.trim()) {
        const cleanResidentPhone = value.replace(/[\s\-\(\)\+]/g, '');
        
        if (!/^\d+$/.test(cleanResidentPhone)) {
          return 'El teléfono solo debe contener números';
        }
        
        let residentPhoneToValidate = cleanResidentPhone;
        
        if (cleanResidentPhone.startsWith('58') && cleanResidentPhone.length > 11) {
          residentPhoneToValidate = cleanResidentPhone.substring(2);
        }
        
        if (residentPhoneToValidate.length < 10 || residentPhoneToValidate.length > 11) {
          return 'El teléfono debe tener 10-11 dígitos';
        }
        
        if (residentPhoneToValidate.length === 11) {
          const residentAreaCode = residentPhoneToValidate.substring(0, 4);
          const validAreaCodes = [
            '0414', '0424', '0412', '0416', '0426', '0212', 
            '0234', '0235', '0236', '0237', '0238', '0239',
            '0241', '0242', '0243', '0244', '0245', '0246', '0247', '0248', '0249',
            '0251', '0252', '0253', '0254', '0255', '0256', '0257', '0258', '0259',
            '0261', '0262', '0263', '0264', '0265', '0266', '0267', '0268', '0269',
            '0271', '0272', '0273', '0274', '0275', '0276', '0277', '0278', '0279',
            '0281', '0282', '0283', '0284', '0285', '0286', '0287', '0288', '0289',
            '0291', '0292', '0293', '0294', '0295'
          ];
          
          if (!validAreaCodes.includes(residentAreaCode)) {
            return 'Código de área venezolano inválido';
          }
        }
      }
      break;

    // EMAIL
    case 'email':
      if (!value || !value.trim()) return 'El email es requerido';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Formato de email inválido';
      }
      break;

    // NOMBRE
    case 'name':
      if (!value || !value.trim()) return 'El nombre completo es requerido';
      if (value.trim().length < 3) {
        return 'El nombre debe tener al menos 3 caracteres';
      }
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/.test(value)) {
        return 'El nombre solo debe contener letras';
      }
      break;

    // GÉNERO - ACEPTAR TANTO M/F COMO Masculino/Femenino
    case 'sex':
      if (!value || !value.trim()) return 'El género es requerido';
      const normalizedSex = value.toLowerCase().trim();
      if (!['m', 'f', 'male', 'female', 'masculino', 'femenino'].includes(normalizedSex)) {
        return 'Seleccione Masculino o Femenino';
      }
      break;

    // FECHA DE NACIMIENTO BASE
    case 'born_date': {
      if (!value || !value.trim()) return 'La fecha de nacimiento es requerida';
      if (!/^\d{2}\-\d{2}\-\d{4}$/.test(value.trim())) {
        return 'Formato inválido. Use DD-MM-AAAA';
      }
      const [dayStr, monthStr, yearStr] = value.split('-');
      const day = Number(dayStr);
      const month = Number(monthStr);
      const year = Number(yearStr);
      const date = new Date(year, month - 1, day);
      
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return 'Fecha de nacimiento inválida';
      }
      
      const today = new Date();
      if (date > today) {
        return 'La fecha de nacimiento no puede ser futura';
      }
      
      const maxAgeDate = new Date();
      maxAgeDate.setFullYear(maxAgeDate.getFullYear() - 120);
      if (date < maxAgeDate) {
        return 'Fecha de nacimiento inválida';
      }
      break;
    }

    // DIRECCIÓN
    case 'street':
      if (!value || !value.trim()) return 'La dirección es requerida';
      if (value.trim().length < 5) {
        return 'La dirección debe tener al menos 5 caracteres';
      }
      break;

    // CÓDIGO POSTAL (OPCIONAL)
    case 'zip':
      if (value && value.trim() && !/^\d{4}$/.test(value.trim())) {
        return 'El código postal debe tener 4 dígitos';
      }
      break;

    default:
      return '';
  }
  return '';
};

// ============ VALIDACIONES ESPECÍFICAS PARA ESTUDIANTES ============

export const validateStudentField = (field: string, value: string): string => {
  const commonValidation = validateCommonField(field, value);
  if (commonValidation) return commonValidation;

  switch (field) {
    // VALIDACIÓN ESPECIAL: Edad mínima 5 años para estudiantes
    case 'born_date': {
      if (!value || !value.trim()) return '';
      if (!/^\d{2}\-\d{2}\-\d{4}$/.test(value.trim())) return '';
      
      const [dayStr, monthStr, yearStr] = value.split('-');
      const day = Number(dayStr);
      const month = Number(monthStr);
      const year = Number(yearStr);
      const date = new Date(year, month - 1, day);
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 5);
      if (date > minAgeDate) {
        return 'El estudiante debe tener al menos 5 años';
      }
      
      const maxAgeDate = new Date();
      maxAgeDate.setFullYear(maxAgeDate.getFullYear() - 25);
      if (date < maxAgeDate) {
        return 'Edad máxima para estudiante: 25 años';
      }
      break;
    }

    // TIPO DE SANGRE
    case 'blood_type':
      if (!value || !value.trim()) return 'El tipo de sangre es requerido';
      if (!['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].includes(value)) {
        return 'Tipo de sangre inválido';
      }
      break;

    // CON QUIÉN VIVE
    case 'student_lives':
      if (!value || !value.trim()) return 'Este campo es requerido';
      const validOptions = ['P/M', 'O', 'p/m', 'o'];
      if (!validOptions.includes(value.trim())) {
        return 'Seleccione una opción válida';
      }
      break;

    // CAMPOS SI/NO
    case 'suffer_illness_treatment':
    case 'authorize_primary_atention':
    case 'born_complication':
    case 'pregnat_finished':
      if (!value || !value.trim()) return 'Este campo es requerido';
      const normalizedValue = value.toLowerCase().trim();
      if (!['si', 'sí', 'no'].includes(normalizedValue)) {
        return 'Seleccione Sí o No';
      }
      break;

    // DETALLES DE ENFERMEDAD
    case 'what_illness_treatment':
      if (value && value.trim() && value.trim().length < 3) {
        return 'Debe dar más detalles';
      }
      break;

    // TIEMPO DE GESTACIÓN
    case 'gestation_time':
      if (!value || !value.trim()) return 'El tiempo de gestación es requerido';
      break;

    // PESO AL NACER
    case 'peso_al_nacer':
      if (!value || !value.trim()) return 'El peso al nacer es requerido';
      const pesoStr = String(value).replace(',', '.');
      const peso = parseFloat(pesoStr);
      if (isNaN(peso)) {
        return 'Debe ser un número válido';
      }
      if (peso <= 0 || peso > 10) {
        return 'Peso al nacer inválido (debe estar entre 0,5 y 10 kg)';
      }
      break;

    // COMPLICACIÓN
    case 'complication':
      if (value && value.trim() && value.trim().length < 3) {
        return 'Debe dar más detalles de la complicación';
      }
      break;

    default:
      return '';
  }
  return '';
};

// ============ VALIDACIONES ESPECÍFICAS PARA REPRESENTANTES ============

export const validateParentField = (field: string, value: string): string => {
  const commonValidation = validateCommonField(field, value);
  if (commonValidation) return commonValidation;

  switch (field) {
    // VALIDACIÓN ESPECIAL: Edad mínima 18 años para representantes
    case 'born_date': {
      if (!value || !value.trim()) return '';
      if (!/^\d{2}\-\d{2}\-\d{4}$/.test(value.trim())) return '';
      
      const [dayStr, monthStr, yearStr] = value.split('-');
      const day = Number(dayStr);
      const month = Number(monthStr);
      const year = Number(yearStr);
      const date = new Date(year, month - 1, day);
      const minAgeDate = new Date();
      minAgeDate.setFullYear(minAgeDate.getFullYear() - 18);
      if (date > minAgeDate) {
        return 'El representante debe tener al menos 18 años';
      }
      break;
    }

    // VIVE CON EL ESTUDIANTE
    case 'live_with_student':
      if (!value || !value.trim()) return 'Este campo es requerido';
      const normalizedLive = value.toLowerCase().trim();
      if (!['si', 'sí', 'no'].includes(normalizedLive)) {
        return 'Seleccione Sí o No';
      }
      break;

    // EMPLEO ACTIVO
    case 'active_job':
      if (!value || !value.trim()) return 'Este campo es requerido';
      const normalizedJob = value.toLowerCase().trim();
      if (!['si', 'sí', 'no'].includes(normalizedJob)) {
        return 'Seleccione Sí o No';
      }
      break;

    // LUGAR DE TRABAJO
    case 'job_place':
      if (!value || !value.trim()) return 'El lugar de trabajo es requerido';
      if (value.trim().length < 3) {
        return 'El lugar de trabajo debe tener al menos 3 caracteres';
      }
      break;

    // CARGO
    case 'job':
      if (!value || !value.trim()) return 'El cargo es requerido';
      if (value.trim().length < 3) {
        return 'El cargo debe tener al menos 3 caracteres';
      }
      break;


    default:
      return '';
  }
  return '';
};

// ============ HELPER: VALIDACIÓN MASIVA ============

export const validateFields = (
  requiredFields: string[],
  data: Record<string, any>,
  isParent = false
): boolean => {
  let valid = true;
  requiredFields.forEach((field) => {
    const error = isParent
      ? validateParentField(field, data[field] ?? '')
      : validateStudentField(field, data[field] ?? '');
    if (error) valid = false;
  });
  return valid;
};
