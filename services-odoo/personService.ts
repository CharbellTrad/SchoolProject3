import { formatDateToDisplay, formatDateToOdoo } from '../utils/formatHelpers';
import * as odooApi from './apiService';

// ============ INTERFACES ============

export interface Inscription {
  id: number;
  year_id: [number, string] | string;
  section_id: [number, string] | string;
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

export type NewParent = Omit<Parent, 'id' | 'age' | 'avatar_128'>;

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


export interface SizesJson {
  height?: number;
  weight?: number;
  size_shirt?: string;
  size_pants?: number;
  size_shoes?: number;
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
  parents?: Parent[]; // Campo LOCAL (no existe en Odoo)
  inscription_ids?: number[];
  inscriptions?: Inscription[]; // Campo LOCAL (no existe en Odoo)
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

const INSCRIPTION_FIELDS = [
  'id', 'name', 'year_id', 'section_id', 'type', 'student_id', 'inscription_date',
  'uninscription_date', 'state', 'from_school', 'observations',
  'parent_name', 'parent_id', 'parent_singnature', 'parent_siganture_date',
  'height', 'weight', 'size_shirt', 'size_pants', 'size_shoes',
];

const STUDENT_FIELDS = [
  'id', 'name', 'vat', 'nationality', 'born_date', 'age', 'sex', 'blood_type',
  'email', 'phone', 'resident_number', 'emergency_phone_number',
  'street', 'student_lives', 'sizes_json',
  'current_height', 'current_weight', 'current_size_shirt',
  'current_size_pants', 'current_size_shoes',
  'suffer_illness_treatment', 'what_illness_treatment',
  'authorize_primary_atention', 'pregnat_finished', 'gestation_time',
  'peso_al_nacer', 'born_complication', 'complication',
  'parents_ids', 'inscription_ids',
  'brown_folder', 'ci_document', 'ci_document_filename',
  'boletin_informative', 'born_document', 'born_document_filename',
  'image_1920', 'avatar_128',
  'user_id', 'is_active',
];

const PARENT_FIELDS = [
  'id', 'name', 'vat', 'nationality', 'born_date', 'age', 'sex',
  'email', 'phone', 'resident_number', 'emergency_phone_number',
  'street', 'live_with_student', 'active_job', 'job_place', 'job',
  'students_ids', 'ci_document', 'ci_document_filename',
  'image_1920', 'avatar_128', 'parent_singnature',
  'user_id', 'active',
];

/**
 * Normaliza los campos Many2one y fechas que Odoo devuelve
 * Convierte arrays [id, nombre] a strings y normaliza valores false/null
 */
const normalizeRecord = (record: any): any => {
  const normalized = { ...record };

  /**
   * Convierte campos Many2one de formato [id, nombre] a solo el nombre
   */
  if (Array.isArray(normalized.state_id)) {
    normalized.state_id = normalized.state_id[1] || '';
  } else if (normalized.state_id === false || normalized.state_id === null) {
    normalized.state_id = '';
  } else if (typeof normalized.state_id !== 'string') {
    normalized.state_id = String(normalized.state_id || '');
  }

  if (Array.isArray(normalized.country_id)) {
    normalized.country_id = normalized.country_id[1] || '';
  } else if (normalized.country_id === false || normalized.country_id === null) {
    normalized.country_id = '';
  } else if (typeof normalized.country_id !== 'string') {
    normalized.country_id = String(normalized.country_id || '');
  }

  /**
   * Normaliza fechas de formato YYYY-MM-DD a DD-MM-YYYY para mostrar
   */
  if (normalized.born_date) {
    normalized.born_date = formatDateToDisplay(normalized.born_date);
  }

  /**
   * Normaliza campos de teléfono que vienen como false o null a strings vacíos
   */
  if (normalized.phone === false || normalized.phone === null) {
    normalized.phone = '';
  }
  if (normalized.resident_number === false || normalized.resident_number === null) {
    normalized.resident_number = '';
  }
  if (normalized.emergency_phone_number === false || normalized.emergency_phone_number === null) {
    normalized.emergency_phone_number = '';
  }

  /**
   * Normaliza campos de tallas que vienen como false o 0 a undefined
   */
  if (normalized.current_height === false || normalized.current_height === 0) {
    normalized.current_height = undefined;
  }
  if (normalized.current_weight === false || normalized.current_weight === 0) {
    normalized.current_weight = undefined;
  }
  if (normalized.current_size_shirt === false) {
    normalized.current_size_shirt = undefined;
  }
  if (normalized.current_size_pants === false || normalized.current_size_pants === 0) {
    normalized.current_size_pants = undefined;
  }
  if (normalized.current_size_shoes === false || normalized.current_size_shoes === 0) {
    normalized.current_size_shoes = undefined;
  }

  return normalized;
};

// ============ ESTUDIANTES ============

/**
 * Carga todas las inscripciones de un estudiante (usado en el modal de visualización)
 */
export const loadInscriptions = async (studentId: number): Promise<Inscription[]> => {
  try {
    const domain = [['student_id', '=', studentId]];
    const result = await odooApi.searchRead(
      'school.student',
      domain,
      INSCRIPTION_FIELDS,
      100
    );

    // Verificar si la sesión expiró
    if (!result.success) {
      if (result.error?.isSessionExpired) {
        return []; // AuthContext manejará la redirección
      }
      if (__DEV__) {
        console.error('Error cargando inscripciones:', result.error);
      }
      return [];
    }

    const inscriptions = result.data || [];
    const sortedInscriptions = inscriptions.sort((a: any, b: any) => b.id - a.id);

    return sortedInscriptions.map((inscription: any) => ({
      ...inscription,
      year_id: Array.isArray(inscription.year_id) ? inscription.year_id[1] : inscription.year_id,
      section_id: Array.isArray(inscription.section_id)
        ? inscription.section_id[1]
        : inscription.section_id,
      student_id: Array.isArray(inscription.student_id)
        ? inscription.student_id[0]
        : inscription.student_id,
      parent_id: Array.isArray(inscription.parent_id)
        ? inscription.parent_id[0]
        : inscription.parent_id,
      inscription_date: inscription.inscription_date
        ? formatDateToDisplay(inscription.inscription_date)
        : '',
      uninscription_date: inscription.uninscription_date
        ? formatDateToDisplay(inscription.uninscription_date)
        : undefined,
      parent_siganture_date: inscription.parent_siganture_date
        ? formatDateToDisplay(inscription.parent_siganture_date)
        : undefined,
    }));
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error cargando inscripciones:', error);
    }
    return [];
  }
};

/**
 * Carga estudiantes con todos sus datos relacionados de forma optimizada
 * Usa carga en paralelo para maximizar la velocidad
 */
export const loadStudents = async (): Promise<Student[]> => {
  try {
    const domain = [['type_enrollment', '=', 'student']];

    // Cargar estudiantes con todos los campos necesarios
    const result = await odooApi.searchRead('res.partner', domain, STUDENT_FIELDS, 1000);

    // Verificar si la sesión expiró
    if (!result.success) {
      if (result.error?.isSessionExpired) {
        return []; // AuthContext manejará la redirección
      }
      if (__DEV__) {
        console.error('Error obteniendo estudiantes:', result.error);
      }
      return [];
    }

    const records = result.data || [];
    const students = records.map(normalizeRecord);

    /**
     * Agrupa todos los IDs únicos de padres e inscripciones para hacer batch requests
     */
    const allParentIds = new Set<number>();
    const allInscriptionIds = new Set<number>();
    
    students.forEach(student => {
      if (student.parents_ids) {
        student.parents_ids.forEach((id: number) => allParentIds.add(id));
      }
      if (student.inscription_ids) {
        student.inscription_ids.forEach((id: number) => allInscriptionIds.add(id));
      }
    });

    /**
     * Carga todos los padres e inscripciones en paralelo usando Promise.all
     * Esto reduce las peticiones de N*2 a solo 2 peticiones totales
     */
    const [parentsResult, inscriptionsResult] = await Promise.all([
      allParentIds.size > 0 
        ? odooApi.read('res.partner', Array.from(allParentIds), PARENT_FIELDS)
        : Promise.resolve({ success: true, data: [] }),
      allInscriptionIds.size > 0
        ? odooApi.read('school.student', Array.from(allInscriptionIds), [
            'id', 'name', 'year_id', 'section_id', 'type', 'student_id', 'inscription_date',
            'uninscription_date', 'state', 'from_school', 'observations',
            'parent_name', 'parent_id', 'parent_singnature', 'parent_siganture_date',
            'height', 'weight', 'size_shirt', 'size_pants', 'size_shoes'
          ])
        : Promise.resolve({ success: true, data: [] })
    ]);

    /**
     * Crea mapas para acceso rápido O(1) en lugar de búsquedas lineales O(n)
     */
    const parentsMap = new Map<number, Parent>();
    if (parentsResult.success && parentsResult.data) {
      parentsResult.data.map(normalizeRecord).forEach(parent => {
        parentsMap.set(parent.id, parent);
      });
    }

    const inscriptionsMap = new Map<number, Inscription>();
    if (inscriptionsResult.success && inscriptionsResult.data) {
      inscriptionsResult.data.forEach((inscription: any) => {
        // Normalizar campos Many2one y fechas
        const normalized: Inscription = {
          ...inscription,
          year_id: Array.isArray(inscription.year_id) ? inscription.year_id[1] : inscription.year_id,
          section_id: Array.isArray(inscription.section_id) ? inscription.section_id[1] : inscription.section_id,
          student_id: Array.isArray(inscription.student_id) ? inscription.student_id[0] : inscription.student_id,
          parent_id: Array.isArray(inscription.parent_id) ? inscription.parent_id[0] : inscription.parent_id,
          inscription_date: inscription.inscription_date ? formatDateToDisplay(inscription.inscription_date) : '',
          uninscription_date: inscription.uninscription_date ? formatDateToDisplay(inscription.uninscription_date) : undefined,
          parent_siganture_date: inscription.parent_siganture_date ? formatDateToDisplay(inscription.parent_siganture_date) : undefined,
        };
        inscriptionsMap.set(normalized.id, normalized);
      });
    }

    /**
     * Asigna padres e inscripciones a cada estudiante usando los mapas
     * Complejidad: O(n) donde n es el número de estudiantes
     */
    students.forEach(student => {
      if (student.parents_ids && student.parents_ids.length > 0) {
        student.parents = student.parents_ids
          .map((id: number) => parentsMap.get(id))
          .filter((parent: Parent | undefined): parent is Parent => parent !== undefined);
      }
      
      if (student.inscription_ids && student.inscription_ids.length > 0) {
        student.inscriptions = student.inscription_ids
          .map((id: number) => inscriptionsMap.get(id))
          .filter((inscription: Inscription | undefined): inscription is Inscription => inscription !== undefined);
      }
    });

    return students;
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error obteniendo estudiantes:', error.message);
    }
    return [];
  }
};

/**
 * Carga los padres de un estudiante específico (carga diferida)
 */
export const loadStudentParents = async (studentId: number, parentIds: number[]): Promise<Parent[]> => {
  try {
    if (!parentIds || parentIds.length === 0) {
      return [];
    }

    const parentsResult = await odooApi.read('res.partner', parentIds, PARENT_FIELDS);

    if (!parentsResult.success || !parentsResult.data) {
      if (parentsResult.error?.isSessionExpired) {
        return [];
      }
      if (__DEV__) {
        console.error('Error cargando padres del estudiante:', studentId);
      }
      return [];
    }

    return parentsResult.data.map(normalizeRecord);
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error cargando padres del estudiante:', error);
    }
    return [];
  }
};

/**
 * Carga las inscripciones de un estudiante específico (carga diferida)
 */
export const loadStudentInscriptions = async (studentId: number, inscriptionIds: number[]): Promise<Inscription[]> => {
  try {
    if (!inscriptionIds || inscriptionIds.length === 0) {
      return [];
    }

    const inscriptionsResult = await odooApi.read(
      'school.student',
      inscriptionIds,
      ['id', 'year_id', 'section_id', 'height', 'weight', 'size_shirt', 'size_pants', 'size_shoes']
    );

    if (!inscriptionsResult.success || !inscriptionsResult.data) {
      if (inscriptionsResult.error?.isSessionExpired) {
        return [];
      }
      if (__DEV__) {
        console.error('Error cargando inscripciones del estudiante:', studentId);
      }
      return [];
    }

    return inscriptionsResult.data;
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error cargando inscripciones del estudiante:', error);
    }
    return [];
  }
};

export const saveStudent = async (
  student: Omit<Student, 'id'>
): Promise<{ success: boolean; message?: string; student?: Student }> => {
  try {
    const values: any = {
      type_enrollment: 'student',
      is_enrollment: true,
      name: student.name,
      vat: student.vat,
      nationality: student.nationality,
      born_date: formatDateToOdoo(student.born_date),
      sex: student.sex,
      blood_type: student.blood_type,
      email: student.email,
      phone: student.phone || false,
      resident_number: student.resident_number || false,
      emergency_phone_number: student.emergency_phone_number,
      street: student.street,
      student_lives: student.student_lives,
      sizes_json: student.sizes_json || {},
      suffer_illness_treatment: student.suffer_illness_treatment,
      what_illness_treatment: student.what_illness_treatment,
      authorize_primary_atention: student.authorize_primary_atention,
      pregnat_finished: student.pregnat_finished,
      gestation_time: student.gestation_time,
      peso_al_nacer: student.peso_al_nacer,
      born_complication: student.born_complication,
      complication: student.complication,
      parents_ids: [[6, 0, student.parents_ids]],
      ci_document: student.ci_document,
      ci_document_filename: student.ci_document_filename,
      brown_folder: student.brown_folder,
      boletin_informative: student.boletin_informative,
      born_document: student.born_document,
      born_document_filename: student.born_document_filename,
      image_1920: student.image_1920,
      is_active: student.is_active,
    };

    const createResult = await odooApi.create('res.partner', values);

    if (!createResult.success) {
      if (createResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(createResult.error),
      };
    }

    const newId = createResult.data;
    const readResult = await odooApi.read('res.partner', [newId!], STUDENT_FIELDS);

    if (!readResult.success || !readResult.data) {
      return {
        success: false,
        message: 'Error al leer el estudiante creado',
      };
    }

    return {
      success: true,
      student: normalizeRecord(readResult.data[0]),
      message: 'Estudiante registrado exitosamente',
    };
  } catch (error: any) {
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

export const updateStudent = async (
  id: number,
  studentData: Partial<Student>
): Promise<{ success: boolean; message?: string; student?: Student }> => {
  try {
    if (__DEV__) {
      console.log('🔍 Datos recibidos para actualizar:', Object.keys(studentData));
    }

    /**
     * Excluye campos que no existen en Odoo o son calculados localmente
     */
    const {
      parents,
      inscriptions,
      age,
      avatar_128,
      current_height,
      current_weight,
      current_size_shirt,
      current_size_pants,
      current_size_shoes,
      inscription_ids,
      ...validData
    } = studentData;

    if (__DEV__) {
      console.log('✅ Campos válidos para Odoo:', Object.keys(validData));
    }

    const values: any = { ...validData };

    // Convertir fecha si existe
    if (values.born_date) {
      values.born_date = formatDateToOdoo(values.born_date);
    }

    // Convertir parents_ids al formato de Odoo Many2many
    if (values.parents_ids) {
      values.parents_ids = [[6, 0, values.parents_ids]];
    }

    if (values.phone === '') values.phone = false;
    if (values.resident_number === '') values.resident_number = false;

    if (__DEV__) {
      console.log('🚀 Enviando a Odoo:', Object.keys(values));
    }

    const updateResult = await odooApi.update('res.partner', [id], values);

    if (!updateResult.success) {
      if (updateResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(updateResult.error),
      };
    }

    const readResult = await odooApi.read('res.partner', [id], STUDENT_FIELDS);

    if (!readResult.success || !readResult.data) {
      return {
        success: false,
        message: 'Error al leer el estudiante actualizado',
      };
    }

    return {
      success: true,
      student: normalizeRecord(readResult.data[0]),
      message: 'Estudiante actualizado exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en updateStudent:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

export const deleteStudent = async (id: number): Promise<{ success: boolean; message?: string }> => {
  try {
    // Leer información del estudiante
    const studentResult = await odooApi.read('res.partner', [id], ['inscription_ids', 'parents_ids']);

    if (!studentResult.success || !studentResult.data || studentResult.data.length === 0) {
      if (studentResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: 'Estudiante no encontrado',
      };
    }

    const student = studentResult.data[0];

    // Verificar si tiene inscripciones activas
    if (student.inscription_ids && student.inscription_ids.length > 0) {
      try {
        const inscriptionsResult = await odooApi.read(
          'school.student',
          student.inscription_ids,
          ['id', 'state', 'name']
        );

        if (inscriptionsResult.success && inscriptionsResult.data) {
          const inscriptions = inscriptionsResult.data;
          const activeInscriptions = inscriptions.filter((insc: any) => insc.state === 'done');

          if (activeInscriptions.length > 0) {
            const inscriptionNames = activeInscriptions.map((insc: any) => insc.name).join(', ');
            return {
              success: false,
              message: `No se puede eliminar el estudiante porque tiene ${activeInscriptions.length} inscripción(es) activa(s): ${inscriptionNames}.\n\nDebe cancelar o desinscribir al estudiante primero.`,
            };
          }

          // Eliminar evaluaciones de cada inscripción
          for (const inscriptionId of student.inscription_ids) {
            try {
              const evaluationsResult = await odooApi.searchRead(
                'school.evaluation.score',
                [['student_id', '=', inscriptionId]],
                ['id'],
                1000
              );

              if (evaluationsResult.success && evaluationsResult.data && evaluationsResult.data.length > 0) {
                const evaluationIds = evaluationsResult.data.map((e: any) => e.id);
                if (__DEV__) {
                  console.log(
                    `🗑️ Eliminando ${evaluationIds.length} evaluaciones de inscripción ${inscriptionId}...`
                  );
                }
                await odooApi.deleteRecords('school.evaluation.score', evaluationIds);
                if (__DEV__) {
                  console.log(`✅ Evaluaciones eliminadas`);
                }
              }
            } catch (evalError) {
              if (__DEV__) {
                console.error(`⚠️ Error eliminando evaluaciones de inscripción ${inscriptionId}:`, evalError);
              }
            }
          }

          /**
           * Elimina todas las inscripciones inactivas del estudiante
           */
          if (__DEV__) {
            console.log(`📋 Eliminando ${student.inscription_ids.length} inscripciones...`);
          }
          await odooApi.deleteRecords('school.student', student.inscription_ids);
          if (__DEV__) {
            console.log('✅ Inscripciones eliminadas');
          }
        }
      } catch (inscError) {
        if (__DEV__) {
          console.error('⚠️ Error procesando inscripciones:', inscError);
        }
        return {
          success: false,
          message: 'Error al verificar las inscripciones del estudiante',
        };
      }
    }

    // Verificar y eliminar padres que no tienen otros hijos
    if (student.parents_ids && student.parents_ids.length > 0) {
      for (const parentId of student.parents_ids) {
        try {
          const parentResult = await odooApi.read('res.partner', [parentId], ['students_ids', 'name']);

          if (parentResult.success && parentResult.data && parentResult.data.length > 0) {
            const parentData = parentResult.data[0];
            const studentsIds = parentData.students_ids || [];

            if (studentsIds.length === 1 && studentsIds[0] === id) {
              await odooApi.deleteRecords('res.partner', [parentId]);
              if (__DEV__) {
                console.log(`✅ Padre ${parentData.name} eliminado (no tenía otros hijos)`);
              }
            } else {
              if (__DEV__) {
                console.log(`ℹ️ Padre ${parentData.name} tiene otros estudiantes, se mantendrá`);
              }
            }
          }
        } catch (parentError) {
          if (__DEV__) {
            console.error(`⚠️ Error procesando padre ${parentId}:`, parentError);
          }
        }
      }
    }

    // Eliminar el estudiante
    const deleteResult = await odooApi.deleteRecords('res.partner', [id]);

    if (!deleteResult.success) {
      if (deleteResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(deleteResult.error),
      };
    }

    if (__DEV__) {
      console.log('✅ Estudiante eliminado');
    }

    return {
      success: true,
      message: 'Estudiante eliminado exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error fatal en deleteStudent:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

// ============ REPRESENTANTES ============

export const loadParents = async (): Promise<Parent[]> => {
  try {
    const domain = [['type_enrollment', '=', 'parent']];

    const result = await odooApi.searchRead('res.partner', domain, PARENT_FIELDS, 1000);

    if (!result.success) {
      if (result.error?.isSessionExpired) {
        return [];
      }
      if (__DEV__) {
        console.error('Error obteniendo representantes:', result.error);
      }
      return [];
    }

    const records = result.data || [];
    return records.map(normalizeRecord);
  } catch (error: any) {
    if (__DEV__) {
      console.error('Error obteniendo representantes:', error.message);
    }
    return [];
  }
};

export const searchParents = async (query: string): Promise<Parent[]> => {
  try {
    const domain = ['|', ['name', 'ilike', query], ['vat', 'ilike', query]];

    const searchResult = await odooApi.search('res.partner', domain, 20);

    if (!searchResult.success || !searchResult.data || searchResult.data.length === 0) {
      return [];
    }

    const parentIds = searchResult.data;
    const parentsResult = await odooApi.read('res.partner', parentIds, PARENT_FIELDS);

    if (!parentsResult.success || !parentsResult.data) {
      return [];
    }

    return parentsResult.data.map((parent: any) => ({
      id: parent.id,
      name: parent.name || '',
      vat: parent.vat || '',
      nationality: parent.nationality || '',
      born_date: parent.born_date || '',
      age: parent.age,
      sex: parent.sex || '',
      email: parent.email || '',
      phone: parent.phone || '',
      resident_number: parent.resident_number,
      emergency_phone_number: parent.emergency_phone_number || '',
      street: parent.street,
      live_with_student: parent.live_with_student || '',
      active_job: parent.active_job || '',
      job_place: parent.job_place,
      job: parent.job,
      students_ids: parent.students_ids || [],
      image_1920: parent.image_1920,
      avatar_128: parent.avatar_128,
      ci_document: parent.ci_document,
      ci_document_filename: parent.ci_document_filename,
      parent_singnature: parent.parent_singnature,
      user_id: parent.user_id,
      active: parent.active,
    }));
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en searchParents:', error);
    }
    return [];
  }
};

export const saveParent = async (
  parent: Omit<Parent, 'id'>
): Promise<{ success: boolean; message?: string; parent?: Parent }> => {
  try {
    const values: any = {
      type_enrollment: 'parent',
      is_enrollment: true,
      name: parent.name,
      vat: parent.vat,
      nationality: parent.nationality,
      born_date: parent.born_date,
      sex: parent.sex,
      email: parent.email,
      phone: parent.phone || false,
      resident_number: parent.resident_number || false,
      emergency_phone_number: parent.emergency_phone_number || false,
      street: parent.street,
      live_with_student: parent.live_with_student,
      active_job: parent.active_job,
      job_place: parent.job_place,
      job: parent.job,
      students_ids: [[6, 0, parent.students_ids]],
      ci_document: parent.ci_document,
      ci_document_filename: parent.ci_document_filename,
      image_1920: parent.image_1920,
      parent_singnature: parent.parent_singnature,
      active: parent.active,
    };

    const createResult = await odooApi.create('res.partner', values);

    if (!createResult.success) {
      if (createResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(createResult.error),
      };
    }

    const newId = createResult.data;
    const readResult = await odooApi.read('res.partner', [newId!], PARENT_FIELDS);

    if (!readResult.success || !readResult.data) {
      return {
        success: false,
        message: 'Error al leer el representante creado',
      };
    }

    return {
      success: true,
      parent: normalizeRecord(readResult.data[0]),
      message: 'Representante registrado exitosamente',
    };
  } catch (error: any) {
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

export const updateParent = async (
  id: number,
  parentData: Partial<Parent>
): Promise<{ success: boolean; message?: string; parent?: Parent }> => {
  try {
    if (__DEV__) {
      console.log('🔍 Datos recibidos para actualizar padre:', Object.keys(parentData));
    }

    /**
     * Excluye campos calculados localmente que no existen en Odoo
     */
    const { age, avatar_128, ...validData } = parentData;

    if (__DEV__) {
      console.log('✅ Campos válidos para Odoo:', Object.keys(validData));
    }

    const values: any = { ...validData };

    // Convertir strings vacíos a false para Odoo
    if (values.phone === '') values.phone = false;
    if (values.resident_number === '') values.resident_number = false;
    if (values.emergency_phone_number === '') values.emergency_phone_number = false;

    if (values.students_ids) {
      values.students_ids = [[6, 0, values.students_ids]];
    }

    if (__DEV__) {
      console.log('🚀 Enviando a Odoo:', Object.keys(values));
    }

    const updateResult = await odooApi.update('res.partner', [id], values);

    if (!updateResult.success) {
      if (updateResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(updateResult.error),
      };
    }

    const readResult = await odooApi.read('res.partner', [id], PARENT_FIELDS);

    if (!readResult.success || !readResult.data) {
      return {
        success: false,
        message: 'Error al leer el representante actualizado',
      };
    }

    return {
      success: true,
      parent: normalizeRecord(readResult.data[0]),
      message: 'Representante actualizado exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en updateParent:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

export const deleteParent = async (id: number): Promise<{ success: boolean; message?: string }> => {
  try {
    const deleteResult = await odooApi.deleteRecords('res.partner', [id]);

    if (!deleteResult.success) {
      if (deleteResult.error?.isSessionExpired) {
        return {
          success: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        success: false,
        message: odooApi.extractOdooErrorMessage(deleteResult.error),
      };
    }

    return {
      success: true,
      message: 'Representante eliminado exitosamente',
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en deleteParent:', error);
    }
    return {
      success: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Verificar si un estudiante puede ser eliminado
 */
export const canDeleteStudent = async (
  id: number
): Promise<{ canDelete: boolean; message?: string }> => {
  try {
    const studentResult = await odooApi.read('res.partner', [id], ['inscription_ids']);

    if (!studentResult.success || !studentResult.data || studentResult.data.length === 0) {
      if (studentResult.error?.isSessionExpired) {
        return { canDelete: false, message: 'Tu sesión ha expirado' };
      }
      return { canDelete: false, message: 'Estudiante no encontrado' };
    }

    const student = studentResult.data[0];

    if (student.inscription_ids && student.inscription_ids.length > 0) {
      const inscriptionsResult = await odooApi.read(
        'school.student',
        student.inscription_ids,
        ['id', 'state', 'name']
      );

      if (inscriptionsResult.success && inscriptionsResult.data) {
        const inscriptions = inscriptionsResult.data;
        const activeInscriptions = inscriptions.filter((insc: any) => insc.state === 'done');

        if (activeInscriptions.length > 0) {
          const inscriptionNames = activeInscriptions.map((insc: any) => insc.name).join(', ');
          return {
            canDelete: false,
            message: `No se puede eliminar el estudiante porque tiene ${activeInscriptions.length} inscripción(es) activa(s): ${inscriptionNames}.\n\nDebe cancelar o desinscribir al estudiante primero.`,
          };
        }
      }
    }

    return { canDelete: true };
  } catch (error: any) {
    return {
      canDelete: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};

/**
 * Verificar si un padre puede ser eliminado
 */
export const canDeleteParent = async (
  parentId: number,
  currentStudentId?: number
): Promise<{
  canDelete: boolean;
  canUnlink: boolean;
  hasOtherChildren: boolean;
  message?: string;
}> => {
  try {
    const parentResult = await odooApi.read('res.partner', [parentId], ['students_ids', 'name']);

    if (!parentResult.success || !parentResult.data || parentResult.data.length === 0) {
      if (parentResult.error?.isSessionExpired) {
        return {
          canDelete: false,
          canUnlink: false,
          hasOtherChildren: false,
          message: 'Tu sesión ha expirado',
        };
      }
      return {
        canDelete: false,
        canUnlink: false,
        hasOtherChildren: false,
        message: 'Representante no encontrado',
      };
    }

    const parent = parentResult.data[0];
    const studentsIds = parent.students_ids || [];

    /**
     * Paso 1: Verifica si este padre específico es responsable en inscripciones activas del estudiante actual
     */
    if (currentStudentId) {
      try {
        const currentStudentResult = await odooApi.read('res.partner', [currentStudentId], [
          'inscription_ids',
          'name',
        ]);

        if (currentStudentResult.success && currentStudentResult.data && currentStudentResult.data.length > 0) {
          const currentStudent = currentStudentResult.data[0];

          if (currentStudent.inscription_ids && currentStudent.inscription_ids.length > 0) {
            const currentInscriptionsResult = await odooApi.read(
              'school.student',
              currentStudent.inscription_ids,
              ['id', 'state', 'name', 'parent_id']
            );

            if (currentInscriptionsResult.success && currentInscriptionsResult.data) {
              const currentInscriptions = currentInscriptionsResult.data;

              // ✅ Filtrar inscripciones activas donde ESTE padre es el responsable
              const activeInscriptionsWithThisParent = currentInscriptions.filter((insc: any) => {
                if (insc.state !== 'done') return false;
                if (!insc.parent_id) return false;

                // parent_id puede ser [id, "nombre"] o solo id
                const inscParentId = Array.isArray(insc.parent_id) ? insc.parent_id[0] : insc.parent_id;
                return inscParentId === parentId;
              });

              if (activeInscriptionsWithThisParent.length > 0) {
                /**
                 * Este padre es responsable en inscripciones activas
                 * No se puede desvincular ni eliminar
                 */
                return {
                  canDelete: false,
                  canUnlink: false,
                  hasOtherChildren: studentsIds.length > 1,
                  message: `No puede desvincular ni eliminar a ${parent.name} porque es el responsable en ${activeInscriptionsWithThisParent.length} inscripción(es) activa(s) del estudiante.\n\nDebe cambiar el responsable o cancelar las inscripciones primero.`,
                };
              }
            }
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error verificando estudiante actual:', error);
        }
      }
    }

    /**
     * Paso 2: Filtra otros estudiantes excluyendo el actual
     */
    const otherStudentsIds = currentStudentId
      ? studentsIds.filter((id: number) => id !== currentStudentId)
      : studentsIds;

    const hasOtherChildren = otherStudentsIds.length > 0;

    if (studentsIds.length === 0) {
      return {
        canDelete: true,
        canUnlink: true,
        hasOtherChildren: false,
      };
    }

    /**
     * Paso 3: Verifica si este padre es responsable en inscripciones activas de otros hijos
     */
    for (const studentId of otherStudentsIds) {
      try {
        const studentResult = await odooApi.read('res.partner', [studentId], ['inscription_ids', 'name']);

        if (studentResult.success && studentResult.data && studentResult.data.length > 0) {
          const student = studentResult.data[0];

          if (student.inscription_ids && student.inscription_ids.length > 0) {
            const inscriptionsResult = await odooApi.read(
              'school.student',
              student.inscription_ids,
              ['id', 'state', 'name', 'parent_id']
            );

            if (inscriptionsResult.success && inscriptionsResult.data) {
              const inscriptions = inscriptionsResult.data;

              // ✅ Filtrar inscripciones activas donde ESTE padre es el responsable
              const activeInscriptionsWithThisParent = inscriptions.filter((insc: any) => {
                if (insc.state !== 'done') return false;
                if (!insc.parent_id) return false;

                // parent_id puede ser [id, "nombre"] o solo id
                const inscParentId = Array.isArray(insc.parent_id) ? insc.parent_id[0] : insc.parent_id;
                return inscParentId === parentId;
              });

              if (activeInscriptionsWithThisParent.length > 0) {
                /**
                 * Se puede desvincular pero no eliminar
                 * Tiene inscripciones activas en otros hijos
                 */
                return {
                  canDelete: false,
                  canUnlink: true,
                  hasOtherChildren,
                  message: `No se puede eliminar permanentemente porque ${parent.name} es el responsable en ${activeInscriptionsWithThisParent.length} inscripción(es) activa(s) de su otro hijo/a "${student.name}".`,
                };
              }
            }
          }
        }
      } catch (studentError) {
        if (__DEV__) {
          console.error(`Error verificando estudiante ${studentId}:`, studentError);
        }
      }
    }

    /**
     * Paso 4: Si tiene otros hijos sin ser responsable en inscripciones activas
     */
    if (hasOtherChildren) {
      return {
        canDelete: false, // No se puede eliminar porque tiene otros hijos
        canUnlink: true, // SÍ se puede desvincular
        hasOtherChildren: true,
        message: 'El representante tiene otros estudiantes asociados.',
      };
    }

    /**
     * Paso 5: No tiene otros hijos ni es responsable en inscripciones activas
     * Se puede eliminar completamente
     */
    return {
      canDelete: true,
      canUnlink: true,
      hasOtherChildren: false,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('❌ Error en canDeleteParent:', error);
    }
    return {
      canDelete: false,
      canUnlink: false,
      hasOtherChildren: false,
      message: odooApi.extractOdooErrorMessage(error),
    };
  }
};