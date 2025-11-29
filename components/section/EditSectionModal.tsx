// Crear nuevo archivo: components/section/EditSectionModal.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import type { Section } from '../../services-odoo/sectionService';
import * as sectionService from '../../services-odoo/sectionService';
import { DropdownSelector } from '../selectors/BaseSelector';
import { showAlert } from '../showAlert';
import { Input } from '../ui/Input';

interface EditSectionModalProps {
  visible: boolean;
  section: Section | null;
  onClose: () => void;
  onSave: () => void;
}

const SECTION_TYPE_OPTIONS = [
  { label: 'Preescolar', value: 'pre' },
  { label: 'Primaria', value: 'primary' },
  { label: 'Media General', value: 'secundary' },
];

export const EditSectionModal: React.FC<EditSectionModalProps> = ({
  visible,
  section,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'pre' | 'primary' | 'secundary'>('primary');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({ name: '', type: '' });

  useEffect(() => {
    if (section) {
      setName(section.name);
      setType(section.type);
    }
  }, [section]);

  const validateForm = (): boolean => {
    const newErrors = { name: '', type: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'El nombre es requerido';
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = 'El nombre debe tener al menos 2 caracteres';
      isValid = false;
    }

    if (!type) {
      newErrors.type = 'El tipo es requerido';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSave = async () => {
    if (!validateForm() || !section) return;

    setSaving(true);

    try {
      const result = await sectionService.updateSection(section.id, {
        name: name.trim(),
        type,
      });

      if (result.success) {
        showAlert('✅ Éxito', 'Sección actualizada correctamente');
        onSave();
        onClose();
      } else {
        showAlert('❌ Error', result.message || 'No se pudo actualizar la sección');
      }
    } catch (error: any) {
      showAlert('❌ Error', error.message || 'Error inesperado');
    } finally {
      setSaving(false);
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
            setSaving(true);
            try {
              const result = await sectionService.deleteSection(section.id);
              
              if (result.success) {
                showAlert('✅ Éxito', 'Sección eliminada correctamente');
                onSave();
                onClose();
              } else {
                showAlert('❌ Error', result.message || 'No se pudo eliminar');
              }
            } catch (error: any) {
              showAlert('❌ Error', error.message || 'Error inesperado');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (!section) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={saving}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Sección</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.form}>
            <Input
              label="Nombre de la Sección"
              placeholder="Ej: 1er Grado Sección A"
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              error={errors.name}
              leftIcon="create-outline"
              autoCapitalize="words"
              editable={!saving}
            />

            <DropdownSelector
              label="Tipo de Sección"
              value={type}
              options={SECTION_TYPE_OPTIONS}
              onChange={(value) => {
                setType(value as 'pre' | 'primary' | 'secundary');
                if (errors.type) setErrors({ ...errors, type: '' });
              }}
              error={errors.type}
              icon="school"
            />
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerZone}>
            <View style={styles.dangerHeader}>
              <Ionicons name="warning" size={20} color={Colors.error} />
              <Text style={styles.dangerTitle}>Zona de Peligro</Text>
            </View>
            <Text style={styles.dangerText}>
              Esta acción eliminará permanentemente la sección y no se puede deshacer.
            </Text>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={saving}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={18} color="#fff" />
              <Text style={styles.deleteButtonText}>Eliminar Sección</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={saving}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Guardar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 60 : 70,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  dangerZone: {
    marginHorizontal: 20,
    marginTop: 32,
    padding: 20,
    backgroundColor: Colors.error + '10',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.error + '30',
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.error,
  },
  dangerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: Colors.backgroundTertiary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.6,
  },
});