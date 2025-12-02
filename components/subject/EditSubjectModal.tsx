import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView, } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import * as authService from '../../services-odoo/authService';
import { deleteSubject, updateSubject, type Professor, type Section, type Subject, } from '../../services-odoo/subjectService';
import { showAlert } from '../showAlert';
import { SelectionField } from './SelectionField';

interface EditSubjectModalProps {
  visible: boolean;
  subject: Subject | null;
  sections: Section[];
  professors: Professor[];
  onClose: () => void;
  onSave: () => void;
}

export const EditSubjectModal: React.FC<EditSubjectModalProps> = ({
  visible,
  subject,
  sections,
  professors,
  onClose,
  onSave,
}) => {
  // ========== REFS ==========
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  // ========== ESTADOS ==========
  const [formData, setFormData] = useState<Partial<Subject>>({
    name: '',
    section_ids: [],
    professor_ids: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['90%'], []);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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
      setFormData({ name: '', section_ids: [], professor_ids: [] });
      setErrors({});
      return;
    }

    if (subject) {
      setFormData({
        name: subject.name,
        section_ids: [...subject.section_ids],
        professor_ids: [...subject.professor_ids],
      });
    }
  }, [visible, subject]);

  // ========== KEYBOARD LISTENERS ==========
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // ========== FUNCIONES ==========
  const updateField = (field: keyof Subject, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.name || formData.name.trim().length < 3) {
      newErrors.name = 'El nombre debe tener al menos 3 caracteres';
      isValid = false;
    }

    if (!formData.section_ids || formData.section_ids.length === 0) {
      newErrors.sections = 'Debe asignar al menos una sección';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const toggleSection = (sectionId: number) => {
    const currentIds = formData.section_ids || [];
    const newIds = currentIds.includes(sectionId)
      ? currentIds.filter((id) => id !== sectionId)
      : [...currentIds, sectionId];
    updateField('section_ids', newIds);
  };

  const toggleProfessor = (professorId: number) => {
    const currentIds = formData.professor_ids || [];
    const newIds = currentIds.includes(professorId)
      ? currentIds.filter((id) => id !== professorId)
      : [...currentIds, professorId];
    updateField('professor_ids', newIds);
  };

  const handleSave = async () => {
    if (!subject || !formData) return;

    const serverHealth = await authService.checkServerHealth();
    if (!serverHealth.ok) {
      showAlert(
        'Sin conexión',
        'No se puede actualizar la materia sin conexión a internet.'
      );
      return;
    }

    if (!validateForm()) {
      showAlert('Error', 'Complete todos los campos requeridos correctamente');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updateSubject(subject.id, {
        name: formData.name!,
        section_ids: formData.section_ids!,
        professor_ids: formData.professor_ids!,
      });

      if (result.success) {
        showAlert('Éxito', 'Materia actualizada correctamente');
        onSave();
        onClose();
      } else {
        showAlert('Error', result.message || 'No se pudo actualizar');
      }
    } catch (error: any) {
      showAlert('Error', error.message || 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!subject) return;

    showAlert(
      '¿Eliminar materia?',
      `¿Estás seguro de eliminar "${subject.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const serverHealth = await authService.checkServerHealth();
            if (!serverHealth.ok) {
              showAlert('Sin conexión', 'No se puede eliminar sin conexión.');
              return;
            }

            onClose();
            setTimeout(async () => {
              try {
                const result = await deleteSubject(subject.id);
                if (result.success) {
                  showAlert('Éxito', 'Materia eliminada correctamente');
                  onSave();
                } else {
                  showAlert('Error', result.message || 'No se pudo eliminar');
                }
              } catch (error: any) {
                showAlert('Error', error.message || 'Ocurrió un error inesperado');
              }
            }, 300);
          },
        },
      ]
    );
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

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) onClose();
    },
    [onClose]
  );

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
        topInset={insets.top}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={true}
        enableOverDrag={false}
        keyboardBehavior="fillParent"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustPan"
      >
        <View style={{ ...styles.container, paddingBottom: insets.bottom }}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="book-outline" size={22} color={Colors.primary} />
              </View>
              <Text style={styles.headerTitle}>Editar Materia</Text>
            </View>
            <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={28} color={Colors.error} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <BottomSheetScrollView
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.bodyContent,
              { paddingBottom: keyboardHeight * 1},
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Campo: Nombre */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Nombre de la materia *</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="text-outline"
                  size={20}
                  color={Colors.textSecondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, errors.name && styles.inputError]}
                  value={formData.name}
                  onChangeText={(value) => updateField('name', value)}
                  placeholder="Ej: Química, Matemática"
                  placeholderTextColor={Colors.textTertiary}
                  editable={!isLoading}
                  autoCapitalize="words"
                />
              </View>
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Campo: Secciones */}
            <View style={styles.fieldGroup}>
              <SelectionField
                label="Secciones"
                items={sections}
                selectedIds={formData.section_ids || []}
                onToggleItem={toggleSection}
                required
                error={errors.sections}
                isLoading={isLoading}
                emptyMessage="No hay secciones disponibles"
              />
            </View>

            {/* Campo: Profesores */}
            <View style={styles.fieldGroup}>
              <SelectionField
                label="Profesores"
                items={professors}
                selectedIds={formData.professor_ids || []}
                onToggleItem={toggleProfessor}
                isLoading={isLoading}
                emptyMessage="No hay profesores disponibles"
              />
            </View>

            {/* Danger Zone */}
            <View style={styles.dangerZone}>
              <View style={styles.dangerZoneHeader}>
                <Ionicons name="warning" size={24} color={Colors.error} />
                <Text style={styles.dangerZoneTitle}>Zona de Peligro</Text>
              </View>
              <Text style={styles.dangerZoneText}>
                Esta acción no se puede deshacer. Todos los datos de la materia
                serán eliminados permanentemente.
              </Text>
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.deleteButton}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.deleteButtonText}>Eliminar Materia</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            {isLoading ? (
              <View style={styles.saveBtn}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleSave}
                style={styles.saveBtn}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color="#fff"
                />
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
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  handleIndicator: {
    backgroundColor: Colors.border,
    width: 40,
    height: 4,
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
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
  iconBox: {
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
  bodyContent: {
    position: 'absolute',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 15
  },
  fieldGroup: {
    gap: 5,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }
    }),
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 16,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
    marginTop: 4,
  },
  dangerZone: {
    marginTop: 8,
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
  saveBtnLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.1,
  },
});