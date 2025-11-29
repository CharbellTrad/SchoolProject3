import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Section>>({
    name: '',
    type: 'primary',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Animación para el slide
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide up
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    } else {
      // Slide down
      slideAnim.setValue(0);
    }
  }, [visible]);

  // Cargar datos cuando el modal se abre
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

  const updateField = (field: keyof Section, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo
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

    // Verificar conexión
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
        name: formData.name,
        type: formData.type,
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

            setIsLoading(true);
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
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.overlay}>
          <Animated.View 
            style={[
              styles.content,
              { transform: [{ translateY }] }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.sectionIconBox}>
                  <Ionicons name="folder-open" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.headerTitle}>Editar Sección</Text>
              </View>
              <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                <Ionicons name="close" size={26} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Body con ScrollView */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Nombre */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Nombre de la sección</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.name && styles.inputError,
                  ]}
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
                      style={[
                        styles.typeButton,
                        formData.type === key && { borderColor: color, backgroundColor: color + '15' },
                      ]}
                      onPress={() => updateField('type', key as SectionType)}
                      disabled={isLoading}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={icon as any}
                        size={24}
                        color={formData.type === key ? color : Colors.textSecondary}
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
                  <Ionicons name="warning" size={22} color={Colors.error} />
                  <Text style={styles.dangerZoneTitle}>Zona de Peligro</Text>
                </View>
                <Text style={styles.dangerZoneText}>
                  Esta acción no se puede deshacer. Todos los datos de la sección serán eliminados permanentemente.
                </Text>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={handleDelete}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash" size={18} color="#fff" />
                  <Text style={styles.deleteButtonText}>Eliminar Sección</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              {isLoading ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveBtn, isLoading && styles.saveBtnDisabled]}
                    onPress={handleSave}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="save-outline" size={18} color="#fff" />
                    <Text style={styles.saveBtnLabel}>Guardar</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
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
    marginTop: 12,
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
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: '#f8fafc',
    gap: 12,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textSecondary,
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
