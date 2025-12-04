import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Keyboard, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import { useParentManagement, useStudentEdit } from '../../hooks';
import * as authService from '../../services-odoo/authService';
import { deleteParent, loadStudentFullDetails, saveParent, Student, updateParent, updateStudent } from '../../services-odoo/personService';
import { formatDateToOdoo, normalizeGender, normalizeYesNo } from '../../utils/formatHelpers';
import { validateStudentField } from '../../validators/fieldValidators';
import { showAlert } from '../showAlert';
import { EditBirthTab, EditDocumentsTab, EditGeneralTab, EditParentsTab, EditSizesTab } from './edit';
import { EditGeneralTabSkeleton } from './edit/skeletons';

type EditTab = 'general' | 'sizes' | 'birth' | 'parents' | 'documents';

interface EditStudentModalProps {
  visible: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: () => void;
  onDelete: (student: Student) => void;
}

const TABS: Array<{ id: EditTab; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'general', label: 'General', icon: 'person-outline' },
  { id: 'sizes', label: 'Tallas', icon: 'resize-outline' },
  { id: 'birth', label: 'Nacimiento', icon: 'heart-outline' },
  { id: 'parents', label: 'Padres', icon: 'people-outline' },
  { id: 'documents', label: 'Documentos', icon: 'document-text-outline' },
];

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  visible,
  student,
  onClose,
  onSave,
  onDelete
}) => {
  // ========== REFS ==========
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // ========== ESTADOS ==========
  const [activeTab, setActiveTab] = useState<EditTab>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [fullStudent, setFullStudent] = useState<Student | null>(null);
  const [loadingFullDetails, setLoadingFullDetails] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Estados para animación de crossfade entre skeleton y contenido
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Obtener safe area insets para respetar áreas seguras del dispositivo
  const insets = useSafeAreaInsets();

  // ========== SNAP POINTS ==========
  const snapPoints = useMemo(() => ['90%'], []);

  // ========== KEYBOARD LISTENERS ==========
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // ========== EFECTOS ==========
  
  useEffect(() => {
    if (visible) {
      bottomSheetRef.current?.present();
    } else {
      bottomSheetRef.current?.dismiss();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setActiveTab('general');
      setFullStudent(null);
      setShowSkeleton(true);
      setKeyboardHeight(0);
      fadeAnim.setValue(1);
      return;
    }

    if (!student) return;

    const loadFullDetails = async () => {
      setLoadingFullDetails(true);
      setShowSkeleton(true);
      fadeAnim.setValue(1);

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
        setFullStudent(student);
      } finally {
        setLoadingFullDetails(false);
      }
    };

    loadFullDetails();
  }, [visible, student]);

  useEffect(() => {
    if (!loadingFullDetails && fullStudent && showSkeleton) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowSkeleton(false);
        fadeAnim.setValue(0);
        
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }
  }, [loadingFullDetails, fullStudent, showSkeleton, fadeAnim]);

  // ========== HOOKS PERSONALIZADOS ==========
  
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
  } = useStudentEdit(fullStudent);

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

  // ========== VALIDACIÓN ==========
  
  const validateForm = (): boolean => {
    if (!formData) return false;

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

  // ========== GUARDAR CAMBIOS ==========
  
  const handleSave = async () => {
    if (!formData) return;

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
      // PASO 1: Eliminar representantes
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

      // PASO 2: Guardar/actualizar representantes
      const savedParentIds: number[] = [];

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
            const parentData: Partial<Student> = {
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
            if (!parent.name || !parent.vat || !parent.nationality || !parent.email || !parent.phone || !parent.job_place || !parent.job) {
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
              image_1920: parent.image_1920,
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

      // PASO 3: Actualizar datos del estudiante
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
        image_1920: getImage('student_photo')?.base64 || formData.image_1920,
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

  // ========== CALLBACKS ==========
  
  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  );

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // ========== RENDERIZADO DE CONTENIDO ==========
  
  const renderTabContent = () => {
    if (!formData) return null;

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

  const renderSkeletonContent = () => {
    switch (activeTab) {
      case 'general':
        return <EditGeneralTabSkeleton />;
      default:
        return null;
    }
  };

  const needsSkeleton = activeTab === 'general' || activeTab === 'parents';

  // ========== RENDER ==========
  return (
    <>
      {visible && <StatusBar style="light" />}

      <BottomSheetModal
        ref={bottomSheetRef}
        index={1}
        snapPoints={snapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        handleIndicatorStyle={styles.handleIndicator}
        backgroundStyle={styles.bottomSheetBackground}
        topInset={insets.top + 20}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={true}
        enableOverDrag={false}
        keyboardBehavior="fillParent"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustPan"
      >
        <View style={[styles.contentContainer, { paddingBottom: insets.bottom }]}>
          
          {/* ========== HEADER ========== */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.studentIconBox}>
                <Ionicons name="pencil" size={24} color={Colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Editar Estudiante</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color={Colors.error} />
            </TouchableOpacity>
          </View>

          {/* ========== TABS ========== */}
          <View style={styles.tabsWrapper}>
            <BottomSheetScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsList}
            >
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                  style={[
                    styles.tabButton,
                    activeTab === tab.id && styles.tabButtonActive,
                    showSkeleton && styles.tabButtonDisabled
                  ]}
                  disabled={showSkeleton}
                >
                  <Ionicons
                    name={tab.icon}
                    size={16}
                    color={activeTab === tab.id ? Colors.primary : Colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.tabLabel,
                      activeTab === tab.id && styles.tabLabelActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </BottomSheetScrollView>
          </View>

          {/* ========== BODY CON CROSSFADE ========== */}
          <View style={styles.bodyContainer}>
            
            {/* SKELETON: Mostrado durante carga */}
            {showSkeleton && needsSkeleton && (
              <Animated.View style={[styles.absoluteFill, { opacity: fadeAnim }]}>
                <BottomSheetScrollView
                  style={styles.body}
                  contentContainerStyle={styles.bodyContent}
                >
                  {renderSkeletonContent()}
                </BottomSheetScrollView>
              </Animated.View>
            )}

            {/* CONTENIDO REAL: Mostrado después de cargar */}
            <Animated.View style={[styles.absoluteFill, { opacity: showSkeleton ? 0 : fadeAnim }]}>
              <BottomSheetScrollView
                style={styles.body}
                contentContainerStyle={[
                  styles.bodyContent,
                  { paddingBottom: keyboardHeight * 1 }
                ]}
                keyboardShouldPersistTaps="handled"
              >
                {renderTabContent()}

                {/* Danger Zone - Zona de eliminación */}
                {!showSkeleton && formData && (
                  <View style={styles.dangerZone}>
                    <View style={styles.dangerZoneHeader}>
                      <Ionicons name="warning" size={22} color={Colors.error} />
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
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                      <Text style={styles.deleteButtonText}>Eliminar Estudiante</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </BottomSheetScrollView>
            </Animated.View>
          </View>

          {/* ========== FOOTER ========== */}
          <View style={styles.footer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : parentManagement.showAddParent ? (
              <TouchableOpacity
                style={[styles.saveBtn, styles.saveBtnDisabled]}
                disabled
              >
                <Text style={styles.saveBtnLabel}>Termine de editar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.saveBtn, showSkeleton && styles.saveBtnDisabled]}
                onPress={handleSave}
                activeOpacity={0.75}
                disabled={showSkeleton}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                <Text style={styles.saveBtnLabel}>Guardar Cambios</Text>
              </TouchableOpacity>
            )}
          </View>

        </View>
      </BottomSheetModal>
    </>
  );
};

// ========== ESTILOS ==========
const styles = StyleSheet.create({
  handleIndicator: {
    backgroundColor: Colors.border,
    width: 40,
    height: 4,
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      }
    }),
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#fff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  studentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  tabsWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: '#f8fafc',
  },
  tabsList: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
    marginVertical: 4,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  tabButtonDisabled: {
    opacity: 0.5,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  bodyContainer: {
    flex: 1,
    position: 'relative',
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  dangerZone: {
    marginTop: 32,
    padding: 20,
    backgroundColor: Colors.error + '08',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.error + '20',
  },
  dangerZoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  dangerZoneTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.error,
    letterSpacing: -0.3,
  },
  dangerZoneText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#f8fafc',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 20,
    gap: 8,
  },
  saveBtnDisabled: {
    backgroundColor: Colors.textTertiary,
  },
  saveBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.1,
  },
});
