import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors from '../../constants/Colors';
import * as authService from '../../services-odoo/authService';
import { deleteSection, updateSection, type Section, type SectionType } from '../../services-odoo/sectionService';
import { showAlert } from '../showAlert';


interface EditSectionModalProps {
  visible: boolean;
  section: Section | null;
  onClose: () => void;
  onSave: () => void;
}

export const EditSectionModal: React.FC<EditSectionModalProps> = ({
  visible,
  section,
  onClose,
  onSave,
}) => {

  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const [formData, setFormData] = useState<Partial<Section>>({ name: '', type: 'primary', });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const snapPoints = useMemo(() => ['90%'], []);
  const { height } = Dimensions.get('window');
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
      setFormData({ name: '', type: 'primary' });
      setErrors({});
      return;
    }

    if (section) {
      setFormData({
        name: section.name,
        type: section.type,
      });
    }
  }, [visible, section]);

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

  // ========== FUNCIONES ==========
  const updateField = (field: keyof Section, value: any) => {
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

    if (!formData.name || formData.name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
      isValid = false;
    }

    if (!formData.type) {
      newErrors.type = 'Debe seleccionar un tipo de sección';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!section || !formData) return;

    const serverHealth = await authService.checkServerHealth();
    if (!serverHealth.ok) {
      if (__DEV__) {
        console.log('🔴 Servidor no disponible para actualizar');
      }
      showAlert(
        'Sin conexión',
        'No se puede actualizar la sección sin conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.'
      );
      return;
    }

    if (!validateForm()) {
      showAlert('Error', 'Complete todos los campos requeridos correctamente');
      return;
    }

    setIsLoading(true);

    try {
      if (__DEV__) {
        console.log('📝 Actualizando sección...');
      }

      const result = await updateSection(section.id, {
        name: formData.name!,
        type: formData.type!,
      });

      if (result.success) {
        showAlert('Éxito', 'Sección actualizada correctamente');
        onSave();
        onClose(); 
      } else {
        showAlert('Error al actualizar sección', result.message || 'No se pudo actualizar');
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

  const handleDelete = async () => {
    if (!section) return;

    showAlert(
      '¿Eliminar sección?',
      `¿Estás seguro de eliminar "${section.name}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const serverHealth = await authService.checkServerHealth();
            if (!serverHealth.ok) {
              showAlert(
                'Sin conexión',
                'No se puede eliminar la sección sin conexión a internet.'
              );
              return;
            }

            onClose();
            setTimeout(async () => {
              try {
                const result = await deleteSection(section.id);
                if (result.success) {
                  showAlert('Éxito', 'Sección eliminada correctamente');
                  onSave();
                  onClose(); 
                } else {
                  showAlert('Error', result.message || 'No se pudo eliminar la sección');
                }
              } catch (error: any) {
                if (__DEV__) {
                  console.error('❌ Error al eliminar:', error);
                }
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

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
    }
  }, [onClose]);

  // ========== RENDER CONTENIDO ==========
  const renderContent = () => (
    <>
      {/* ========== HEADER ========== */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.sectionIconBox}>
            <Ionicons name="layers-outline" size={22} color={Colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Editar Sección</Text>
        </View>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={28} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* ========== BODY ========== */}
      <BottomSheetScrollView
        contentContainerStyle={[
          styles.bodyContent,
          { paddingBottom: keyboardHeight * 1 }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Nombre */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nombre de la sección</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={formData.name}
            onChangeText={(value) => updateField('name', value)}
            placeholder="Ej: 1er Grado A"
            placeholderTextColor={Colors.textTertiary}
            autoCapitalize="words"
            editable={!isLoading}
          />
          {errors.name && (
            <Text style={styles.errorText}>{errors.name}</Text>
          )}
        </View>

        {/* Tipo */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Tipo de sección</Text>
          <View style={styles.typeGrid}>
            {[
              { key: 'pre', label: 'Preescolar', icon: 'color-palette', color: '#ec4899' },
              { key: 'primary', label: 'Primaria', icon: 'book', color: '#3b82f6' },
              { key: 'secundary', label: 'Media', icon: 'school', color: '#10b981' },
            ].map(({ key, label, icon, color }) => (
              <TouchableOpacity
                key={key}
                onPress={() => updateField('type', key as SectionType)}
                activeOpacity={0.7}
                disabled={isLoading}
                style={[
                  styles.typeButton,
                  formData.type === key && {
                    borderColor: color,
                    backgroundColor: color + '15',
                  },
                ]}
              >
                <Ionicons
                  name={icon as any}
                  size={28}
                  color={formData.type === key ? color : Colors.textTertiary}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    formData.type === key && { color, fontWeight: '700' },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.type && (
            <Text style={styles.errorText}>{errors.type}</Text>
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerZone}>
          <View style={styles.dangerZoneHeader}>
            <Ionicons name="warning" size={24} color={Colors.error} />
            <Text style={styles.dangerZoneTitle}>Zona de Peligro</Text>
          </View>
          <Text style={styles.dangerZoneText}>
            Esta acción no se puede deshacer. Todos los datos de la sección serán eliminados permanentemente.
          </Text>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.deleteButton}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Ionicons name="trash-outline" size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Eliminar Sección</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetScrollView>

      {/* ========== FOOTER ========== */}
      <View style={[
        styles.footer,
        // { paddingBottom: Math.max(insets.bottom + 16, 16) }
      ]}>
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
            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
            <Text style={styles.saveBtnLabel}>Guardar Cambios</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
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
        <View style={{...styles.container, paddingBottom: insets.bottom}}>
          {renderContent()}
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
    }),
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
  sectionIconBox: {
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
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: Colors.backgroundTertiary,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  typeGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    gap: 8,
  },
  typeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
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
    paddingTop: 16,
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