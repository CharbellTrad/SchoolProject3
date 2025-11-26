import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { listStyles } from '../../constants/Styles';
import { useParentManagement, useStudentEdit } from '../../hooks';
import * as authService from '../../services-odoo/authService';
import { deleteParent, loadStudentFullDetails, saveParent, Student, updateParent, updateStudent } from '../../services-odoo/personService';
import { formatDateToOdoo, normalizeGender, normalizeYesNo } from '../../utils/formatHelpers';
import { validateStudentField } from '../../validators/fieldValidators';
import { showAlert } from '../showAlert';
import { EditBirthTab, EditDocumentsTab, EditGeneralTab, EditParentsTab, EditSizesTab } from './edit';

type EditTab = 'general' | 'sizes' | 'birth' | 'parents' | 'documents';

interface EditStudentModalProps {
  visible: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: () => void;
  onDelete: (student: Student) => void;
}

const TABS = [
  { id: 'general' as EditTab, label: 'General', icon: 'person' },
  { id: 'sizes' as EditTab, label: 'Tallas', icon: 'resize' },
  { id: 'birth' as EditTab, label: 'Nacimiento', icon: 'heart' },
  { id: 'parents' as EditTab, label: 'Padres', icon: 'people' },
  { id: 'documents' as EditTab, label: 'Documentos', icon: 'document' },
];

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  visible,
  student,
  onClose,
  onSave,
  onDelete
}) => {
  const [activeTab, setActiveTab] = useState<EditTab>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [fullStudent, setFullStudent] = useState<Student | null>(null);
  const [loadingFullDetails, setLoadingFullDetails] = useState(false);

  // ⚡ Cargar detalles completos cuando el modal se abre
  useEffect(() => {
    if (!visible) {
      setActiveTab('general');
      setFullStudent(null);
      return;
    }

    if (!student) return;

    // 🌐 Cargar detalles completos desde servidor (SIEMPRE)
    const loadFullDetails = async () => {
      setLoadingFullDetails(true);
      
      if (__DEV__) {
        console.log(`🔍 Cargando detalles completos para edición del estudiante ${student.id}`);
      }

      try {
        const details = await loadStudentFullDetails(student.id);
        setFullStudent(details);
        
        if (__DEV__) {
          console.log(`✅ Detalles completos cargados para editar estudiante ${student.id}`);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('❌ Error cargando detalles completos:', error);
        }
        // En caso de error, usar datos básicos
        setFullStudent(student);
      } finally {
        setLoadingFullDetails(false);
      }
    };

    loadFullDetails();
  }, [visible, student]); // ✅ Se recarga cada vez que visible o student cambian

  const {
    formData,
    sizesData,
    parents,
    originalParentIds,
    parentsToDelete,
    errors,
    updateField,
    updateSizeField,
    setParents,
    setParentsToDelete,
    setErrors,
    setImage,
    getImage,
    clearImage,
    loadingParents,
  } = useStudentEdit(fullStudent); // 👈 Usar fullStudent en lugar de student

  const parentManagement = useParentManagement(
    parents,
    setParents,
    originalParentIds,
    parentsToDelete,
    setParentsToDelete,
    setErrors,
    getImage,
    setImage,
    clearImage
  );

  // Mostrar loading mientras carga detalles
  if (loadingFullDetails || !formData) {
    return (
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={listStyles.modalOverlay}>
          <View style={listStyles.modalContent}>
            <View style={listStyles.modalHeader}>
              <Text style={listStyles.modalTitle}>Cargando...</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={28} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={{ marginTop: 16, color: Colors.textSecondary }}>
                Cargando información del estudiante...
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    const requiredFields: (keyof Student)[] = [
      'name', 'vat', 'nationality', 'born_date', 'sex', 'blood_type',
      'email', 'phone', 'emergency_phone_number', 'street',
      'student_lives', 'suffer_illness_treatment', 'authorize_primary_atention',
      'pregnat_finished', 'gestation_time', 'peso_al_nacer', 'born_complication'
    ];

    requiredFields.forEach((field) => {
      const value = formData[field];
      const stringValue = value !== null && value !== undefined ? String(value) : '';
      const error = validateStudentField(field as string, stringValue);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    const sufferIllness = formData.suffer_illness_treatment?.toLowerCase();
    if (sufferIllness === 'si' || sufferIllness === 'sí') {
      const error = validateStudentField('what_illness_treatment', formData.what_illness_treatment || '');
      if (error) {
        newErrors.what_illness_treatment = error;
        isValid = false;
      }
    }

    const bornComplication = formData.born_complication?.toLowerCase();
    if (bornComplication === 'si' || bornComplication === 'sí') {
      const error = validateStudentField('complication', formData.complication || '');
      if (error) {
        newErrors.complication = error;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    // 1️⃣ Verificar conexión PRIMERO
    const serverHealth = await authService.checkServerHealth();

    if (!serverHealth.ok) {
      if (__DEV__) {
        console.log('🔴 Servidor no disponible para actualizar');
      }
      showAlert(
        'Sin conexión',
        'No se puede actualizar el estudiante sin conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.'
      );
      return;
    }

    // 2️⃣ Validaciones
    if (!validateForm()) {
      showAlert('Error', 'Complete todos los campos requeridos correctamente');
      return;
    }

    if (parents.length === 0) {
      showAlert('Error', 'Debe tener al menos un representante');
      setActiveTab('parents');
      return;
    }

    setIsLoading(true);

    try {
      // 3️⃣ Eliminar representantes marcados para eliminación
      for (const parentId of parentsToDelete) {
        try {
          if (__DEV__) {
            console.log(`🗑️ Eliminando representante ID: ${parentId}`);
          }
          await deleteParent(parentId);
        } catch (error: any) {
          if (__DEV__) {
            console.error('❌ Error al eliminar representante:', error);
          }

          if (error?.message?.includes('Network request failed') || error?.message?.includes('Failed to fetch')) {
            showAlert(
              'Error de conexión',
              'Se perdió la conexión al intentar eliminar un representante. Por favor, verifica tu conexión e intenta nuevamente.'
            );
          } else {
            showAlert('Error al eliminar representante', error.message || 'No se pudo eliminar el representante');
          }
          setIsLoading(false);
          return;
        }
      }

      const savedParentIds: number[] = [];

      // 4️⃣ Actualizar o crear representantes
      for (const parent of parents) {
        const commonData = {
          born_date: formatDateToOdoo(parent.born_date || ''),
          sex: normalizeGender(parent.sex || ''),
          live_with_student: normalizeYesNo(parent.live_with_student || ''),
          active_job: normalizeYesNo(parent.active_job || ''),
          phone: typeof parent.phone === 'string' ? parent.phone : '',
          resident_number: typeof parent.resident_number === 'string' ? parent.resident_number : '',
          emergency_phone_number: parent.emergency_phone_number || '',
        };

        try {
          if (parent.id) {
            const parentData: Partial<typeof parent> = {
              ...parent,
              ...commonData,
            };

            if (typeof parent.id === 'number') {
              if (__DEV__) {
                console.log(`📝 Actualizando representante ID: ${parent.id}`);
              }

              const result = await updateParent(parent.id, parentData);

              if (result.success && result.parent) {
                savedParentIds.push(result.parent.id);
              } else {
                showAlert('Error al actualizar representante', result.message || 'No se pudo actualizar el representante');
                setIsLoading(false);
                return;
              }
            }
          } else {
            if (!parent.name || !parent.vat || !parent.nationality || !parent.email || !parent.phone) {
              continue;
            }

            if (__DEV__) {
              console.log(`➕ Creando nuevo representante: ${parent.name}`);
            }

            const newParentData: any = {
              name: parent.name,
              vat: parent.vat,
              nationality: parent.nationality,
              born_date: commonData.born_date,
              sex: commonData.sex,
              email: parent.email,
              phone: commonData.phone,
              resident_number: commonData.resident_number,
              emergency_phone_number: commonData.emergency_phone_number,
              live_with_student: commonData.live_with_student,
              active_job: commonData.active_job,
              job_place: parent.job_place || '',
              job: parent.job || '',
              students_ids: [formData.id],
              user_id: null,
              active: true,
              image_128: parent.image_128,
              ci_document: parent.ci_document,
              ci_document_filename: parent.ci_document_filename,
              parent_singnature: parent.parent_singnature,
              street: parent.street || '',
            };

            const result = await saveParent(newParentData);

            if (result.success && result.parent) {
              savedParentIds.push(result.parent.id);
            } else {
              showAlert('Error al crear representante', result.message || 'No se pudo crear el representante');
              setIsLoading(false);
              return;
            }
          }
        } catch (error: any) {
          if (__DEV__) {
            console.error('❌ Error procesando representante:', error);
          }

          if (error?.message?.includes('Network request failed') || error?.message?.includes('Failed to fetch')) {
            showAlert(
              'Error de conexión',
              'Se perdió la conexión al procesar los representantes. Por favor, verifica tu conexión e intenta nuevamente.'
            );
          } else {
            showAlert('Error', error.message || 'Error al procesar representante');
          }
          setIsLoading(false);
          return;
        }
      }

      // 5️⃣ Actualizar estudiante
      const updateData: Partial<Student> = {
        ...formData,
        born_date: formatDateToOdoo(formData.born_date),
        sex: normalizeGender(formData.sex),
        suffer_illness_treatment: normalizeYesNo(formData.suffer_illness_treatment),
        authorize_primary_atention: normalizeYesNo(formData.authorize_primary_atention),
        pregnat_finished: normalizeYesNo(formData.pregnat_finished),
        born_complication: normalizeYesNo(formData.born_complication),
        phone: typeof formData.phone === 'string' ? formData.phone : '',
        resident_number: typeof formData.resident_number === 'string' ? formData.resident_number : '',
        emergency_phone_number: formData.emergency_phone_number || '',
        parents_ids: savedParentIds,
        sizes_json: {
          height: typeof sizesData.height === 'string' ? parseFloat(sizesData.height) || 0 : sizesData.height || 0,
          weight: typeof sizesData.weight === 'string' ? parseFloat(sizesData.weight) || 0 : sizesData.weight || 0,
          size_shirt: sizesData.size_shirt,
          size_pants: typeof sizesData.size_pants === 'string' ? parseFloat(sizesData.size_pants) || 0 : sizesData.size_pants || 0,
          size_shoes: typeof sizesData.size_shoes === 'string' ? parseFloat(sizesData.size_shoes) || 0 : sizesData.size_shoes || 0,
        },
        image_128: getImage('student_photo')?.base64 || formData.image_128,
        ci_document: getImage('ci_document')?.base64 || formData.ci_document,
        ci_document_filename: getImage('ci_document')?.filename || formData.ci_document_filename,
        born_document: getImage('born_document')?.base64 || formData.born_document,
        born_document_filename: getImage('born_document')?.filename || formData.born_document_filename,
      };

      if (__DEV__) {
        console.log('📝 Actualizando estudiante...');
      }

      const result = await updateStudent(formData.id, updateData);

      if (result.success) {
        showAlert('Éxito', 'Estudiante actualizado correctamente');
        onSave();
      } else {
        showAlert('Error al actualizar estudiante', result.message || 'No se pudo actualizar');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('❌ Error al guardar:', error);
      }

      if (error?.message?.includes('Network request failed') || error?.message?.includes('Failed to fetch')) {
        showAlert(
          'Error de conexión',
          'Se perdió la conexión durante la actualización. Por favor, verifica tu conexión e intenta nuevamente.'
        );
      } else {
        showAlert('Error', error.message || 'Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <EditGeneralTab
            formData={formData}
            errors={errors}
            onFieldChange={updateField}
            onImageSelected={(base64, filename) => setImage('student_photo', base64, filename)}
            studentPhoto={getImage('student_photo')?.base64}
          />
        );
      case 'sizes':
        return <EditSizesTab sizesData={sizesData} onFieldChange={updateSizeField} />;
      case 'birth':
        return <EditBirthTab formData={formData} errors={errors} onFieldChange={updateField} />;
      case 'parents':
        return (
          <EditParentsTab
            parents={parents}
            showAddParent={parentManagement.showAddParent}
            showSearchParent={parentManagement.showSearchParent}
            currentParent={parentManagement.currentParent}
            editingParentIndex={parentManagement.editingParentIndex}
            searchQuery={parentManagement.searchQuery}
            searchResults={parentManagement.searchResults}
            searching={parentManagement.searching}
            errors={errors}
            onAddNewParent={() => parentManagement.setShowAddParent(true)}
            onSearchExisting={() => parentManagement.setShowSearchParent(true)}
            onParentFieldChange={parentManagement.updateParentField}
            onSearchChange={parentManagement.handleSearchParents}
            onSelectExistingParent={parentManagement.addExistingParent}
            onSaveParent={parentManagement.addOrUpdateParent}
            onEditParent={parentManagement.editParent}
            onRemoveParent={(index) => parentManagement.removeParent(index, formData.id)}
            onCancelForm={parentManagement.resetForm}
            onImageSelected={setImage}
            getImage={getImage}
            loading={loadingParents}
          />
        );
      case 'documents':
        return (
          <EditDocumentsTab
            formData={formData}
            onFieldChange={updateField}
            ciDocument={getImage('ci_document')?.base64}
            bornDocument={getImage('born_document')?.base64}
            onCiDocumentSelected={(base64, filename) => setImage('ci_document', base64, filename)}
            onBornDocumentSelected={(base64, filename) => setImage('born_document', base64, filename)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={listStyles.modalOverlay}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={listStyles.modalContent}>
          <View style={listStyles.modalHeader}>
            <Text style={listStyles.modalTitle}>Editar Estudiante</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={18}
                    color={activeTab === tab.id ? Colors.primary : Colors.textSecondary}
                  />
                  <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <ScrollView
            style={listStyles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={listStyles.scrollContent}
            nestedScrollEnabled={true}
            scrollEventThrottle={16}
          >
            {renderTabContent()}

            <View style={styles.dangerZone}>
              <View style={styles.dangerZoneHeader}>
                <Ionicons name="warning" size={24} color={Colors.error} />
                <Text style={styles.dangerZoneTitle}>Zona de Peligro</Text>
              </View>
              <Text style={styles.dangerZoneText}>
                Esta acción no se puede deshacer. Todos los datos del estudiante serán eliminados permanentemente.
              </Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  onClose();
                  setTimeout(() => onDelete(formData), 300);
                }}
              >
                <Ionicons name="trash" size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Eliminar Estudiante</Text>
              </TouchableOpacity>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          <View style={listStyles.modalFooter}>
            <TouchableOpacity
              style={listStyles.cancelButton}
              onPress={() => {
                setParentsToDelete([]);
                onClose();
              }}
            >
              <Text style={listStyles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                listStyles.saveButton,
                (isLoading || parentManagement.showAddParent) && listStyles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={isLoading || parentManagement.showAddParent}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : parentManagement.showAddParent ? (
                <>
                  <Ionicons name="alert-circle" size={20} color="#fff" />
                  <Text style={listStyles.saveButtonText}>Termine de editar</Text>
                </>
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={listStyles.saveButtonText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  activeTabText: {
    color: Colors.primary,
    fontWeight: '700',
  },
  dangerZone: {
    marginTop: 30,
    padding: 20,
    backgroundColor: Colors.error + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '30',
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dangerZoneTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.error,
    marginLeft: 8,
  },
  dangerZoneText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});