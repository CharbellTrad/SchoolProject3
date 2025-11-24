/**
 * Tipos e interfaces para el servicio de personas (estudiantes y padres)
 */

export interface SizesJson {
  height?: number;
  weight?: number;
  size_shirt?: string;
  size_pants?: number;
  size_shoes?: number;
}

export interface Inscription {
  id: number;
  name: string;
  year_id: [number, string] | string;
  section_id: [number, string] | string;
  type: string;
  student_id: [number, string] | number;
  inscription_date: string;
  uninscription_date?: string;
  state: 'draft' | 'done' | 'cancel';
  from_school?: string;
  observations?: string;
  parent_name?: [number, string] | number;
  parent_id: number;
  parent_singnature?: string;
  parent_siganture_date?: string;
  height?: number | false;
  weight?: number | false;
  size_shirt?: string | false;
  size_pants?: number | false;
  size_shoes?: number | false;
}

export interface Parent {
  id: number;
  name: string;
  vat: string;
  nationality: string;
  born_date: string;
  age?: number;
  sex: string;
  email: string;
  phone: string;
  resident_number?: string;
  emergency_phone_number: string;
  street?: string;
  live_with_student: string;
  active_job: string;
  job_place?: string;
  job?: string;
  students_ids: number[];
  ci_document?: string;
  ci_document_filename?: string;
  image_1920?: string;
  avatar_128?: string;
  parent_singnature?: string;
  user_id: number | null;
  active: boolean;
}

export interface Student {
  id: number;
  name: string;
  vat: string;
  nationality: string;
  born_date: string;
  age?: number;
  sex: string;
  blood_type: string;
  email: string;
  phone: string;
  resident_number?: string;
  emergency_phone_number: string;
  street: string;
  student_lives: string;
  sizes_json?: SizesJson;
  current_height?: number | false;
  current_weight?: number | false;
  current_size_shirt?: string | false;
  current_size_pants?: number | false;
  current_size_shoes?: number | false;
  suffer_illness_treatment: string;
  what_illness_treatment?: string;
  authorize_primary_atention: string;
  pregnat_finished: string;
  gestation_time: string;
  peso_al_nacer: string;
  born_complication: string;
  complication?: string;
  parents_ids: number[];
  parents?: Parent[];
  inscription_ids?: number[];
  inscriptions?: Inscription[];
  brown_folder?: boolean;
  ci_document?: string;
  ci_document_filename?: string;
  boletin_informative?: boolean;
  born_document?: string;
  born_document_filename?: string;
  image_1920?: string;
  avatar_128?: string;
  user_id: number | null;
  is_active: boolean;
}

export type NewParent = Omit<Parent, 'id' | 'age' | 'avatar_128'>;
export type NewStudent = Omit<Student, 'id' | 'age' | 'avatar_128' | 'parents' | 'inscriptions'>;

export type ParentFormData = Partial<Parent> & {
  id?: number;
  name?: string;
  vat?: string;
  nationality?: string;
  born_date?: string;
  sex?: string;
  email?: string;
  phone?: string;
  emergency_phone_number?: string;
  live_with_student?: string;
  active_job?: string;
};

export interface PersonServiceResult<T = any> {
  success: boolean;
  message?: string;
  student?: T extends Student ? T : never;
  parent?: T extends Parent ? T : never;
  data?: T;
}

export interface DeleteValidation {
  canDelete: boolean;
  canUnlink: boolean;
  hasOtherChildren: boolean;
  message?: string;
}