import { useCallback, useState } from 'react';
import { SizesJson } from '../services-odoo/personService';

export interface StudentFormData {
  name: string;
  vat: string;
  nationality: string;
  born_date: string;
  sex: string;
  blood_type: string;
  email: string;
  phone: string;
  resident_number: string;
  emergency_phone_number: string;
  street: string;
  student_lives: string;
  brown_folder: boolean;
  boletin_informative: boolean;
}

export interface BirthData {
  suffer_illness_treatment: string;
  what_illness_treatment: string;
  authorize_primary_atention: string;
  pregnat_finished: string;
  gestation_time: string;
  peso_al_nacer: string;
  born_complication: string;
  complication: string;
}

const initialStudentData: StudentFormData = {
  name: '',
  vat: '',
  nationality: '',
  born_date: '',
  sex: '',
  blood_type: '',
  email: '',
  phone: '',
  resident_number: '',
  emergency_phone_number: '',
  street: '',
  student_lives: '',
  brown_folder: false,
  boletin_informative: false,
};

const initialSizesData: SizesJson = {
  height: 0,
  weight: 0,
  size_shirt: '',
  size_pants: 0,
  size_shoes: 0,
};

const initialBirthData: BirthData = {
  suffer_illness_treatment: '',
  what_illness_treatment: '',
  authorize_primary_atention: '',
  pregnat_finished: '',
  gestation_time: '',
  peso_al_nacer: '',
  born_complication: '',
  complication: '',
};

export const useStudentForm = () => {
  const [studentData, setStudentData] = useState<StudentFormData>(initialStudentData);
  const [sizesData, setSizesData] = useState<SizesJson>(initialSizesData);
  const [birthData, setBirthData] = useState<BirthData>(initialBirthData);

  const updateStudentField = useCallback((field: string, value: string | boolean) => {
    setStudentData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateSizesField = useCallback((field: keyof SizesJson, value: any) => {
    setSizesData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateBirthField = useCallback((field: string, value: string) => {
    setBirthData(prev => ({ ...prev, [field]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setStudentData(initialStudentData);
    setSizesData(initialSizesData);
    setBirthData(initialBirthData);
  }, []);

  return {
    studentData,
    sizesData,
    birthData,
    updateStudentField,
    updateSizesField,
    updateBirthField,
    resetForm,
  };
};
