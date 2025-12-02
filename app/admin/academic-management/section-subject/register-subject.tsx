import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import SelectionChips from '../../../../components/subject/SelectionChips';
import SelectionModal from '../../../../components/subject/SelectionModal';
import { Button } from '../../../../components/ui/Button';
import Colors from '../../../../constants/Colors';
import { useSubjects } from '../../../../hooks';
import * as authService from '../../../../services-odoo/authService';
import { createSubject } from '../../../../services-odoo/subjectService';

export default function RegisterSubjectScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    section_ids: [] as number[],
    professor_ids: [] as number[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sectionsModalVisible, setSectionsModalVisible] = useState(false);
  const [professorsModalVisible, setProfessorsModalVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const {
    secundarySections,
    activeProfessors,
    sectionsLoading,
    professorsLoading,
    loadRelatedData,
  } = useSubjects();

  // Cargar secciones y profesores al montar
  useEffect(() => {
    loadRelatedData();
  }, []);

  const updateField = (field: keyof typeof formData, value: any) => {
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

    if (formData.section_ids.length === 0) {
      newErrors.sections = 'Debe asignar al menos una sección';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    const serverHealth = await authService.checkServerHealth();
    if (!serverHealth.ok) {
      if (__DEV__) {
        console.log('🔴 Servidor no disponible para guardar');
      }
      showAlert(
        'Sin conexión',
        'No se puede crear la materia sin conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.'
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
        console.log('📝 Creando materia...');
      }

      const result = await createSubject({
        name: formData.name.trim(),
        section_ids: formData.section_ids,
        professor_ids: formData.professor_ids,
      });

      setIsLoading(false);

      if (result.success) {
        showAlert('✅ Registro Exitoso', 'Materia creada correctamente', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        showAlert('❌ Error', result.message || 'No se pudo crear la materia');
      }
    } catch (error: any) {
      setIsLoading(false);

      if (__DEV__) {
        console.error('❌ Error al guardar:', error);
      }

      if (
        error?.message?.includes('Network request failed') ||
        error?.message?.includes('Failed to fetch')
      ) {
        showAlert(
          'Error de conexión',
          'Se perdió la conexión durante el guardado. Por favor, verifica tu conexión e intenta nuevamente.'
        );
      } else {
        showAlert('❌ Error', 'Ocurrió un error inesperado al crear la materia');
      }
    }
  };

  return (
    <>
      <Head>
        <title>Registrar Materia</title>
      </Head>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <BottomSheetModalProvider>
          <SafeAreaProvider>
            <StatusBar style="light" translucent />
            <View style={styles.container}>
          {/* Header */}
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nueva Materia</Text>
            <View style={{ width: 40 }} />
          </LinearGradient>

          {/* Contenido */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* Instrucciones */}
              <View style={styles.instructionCard}>
                <View style={styles.instructionIconContainer}>
                  <Ionicons name="book" size={40} color={Colors.primary} />
                </View>
                <Text style={styles.instructionTitle}>Registrar nueva materia</Text>
                <Text style={styles.instructionText}>
                  Complete la información para crear una nueva materia y asignarla a secciones y
                  profesores
                </Text>
              </View>

              {/* Formulario */}
              <View style={styles.formContainer}>
                {/* Nombre de la materia */}
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
                      placeholder="Ej: Química, Matemática, Historia"
                      placeholderTextColor={Colors.textTertiary}
                      autoCapitalize="words"
                      editable={!isLoading}
                    />
                  </View>
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                  <Text style={styles.fieldHint}>Ingresa el nombre de la materia</Text>
                </View>

                {/* Secciones con Chips */}
                <SelectionChips
                  label="Secciones"
                  items={secundarySections}
                  selectedIds={formData.section_ids}
                  onOpenModal={() => setSectionsModalVisible(true)}
                  required
                  error={errors.sections}
                  icon="grid-outline"
                />

                {/* Profesores con Chips */}
                <SelectionChips
                  label="Profesores"
                  items={activeProfessors}
                  selectedIds={formData.professor_ids}
                  onOpenModal={() => setProfessorsModalVisible(true)}
                  icon="people-outline"
                />
              </View>

              <View style={{ height: 120 }} />
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Botón flotante */}
          <View style={{ ...styles.floatingButtonContainer, paddingBottom: insets.bottom }}>
            <Button
              title={isLoading ? 'Guardando...' : 'Crear Materia'}
              onPress={handleSubmit}
              loading={isLoading}
              icon={isLoading ? undefined : 'add-circle'}
              iconPosition="left"
              variant="primary"
              size="large"
              disabled={isLoading}
            />
          </View>

          {/* Modal de Secciones */}
          <SelectionModal
            visible={sectionsModalVisible}
            onClose={() => setSectionsModalVisible(false)}
            title="Seleccionar Secciones"
            items={secundarySections}
            selectedIds={formData.section_ids}
            onConfirm={(ids: number[]) => updateField('section_ids', ids)}
            loading={sectionsLoading}
            emptyMessage="No hay secciones de Media General disponibles"
            icon="grid"
          />

          {/* Modal de Profesores */}
          <SelectionModal
            visible={professorsModalVisible}
            onClose={() => setProfessorsModalVisible(false)}
            title="Seleccionar Profesores"
            items={activeProfessors}
            selectedIds={formData.professor_ids}
            onConfirm={(ids: number[]) => updateField('professor_ids', ids)}
            loading={professorsLoading}
            emptyMessage="No hay profesores activos disponibles"
            icon="people"
          />
        </View>
        </SafeAreaProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
    </>
  );
}

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
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
  },
  instructionCard: {
    alignItems: 'center',
    padding: 28,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
    }),
  },
  instructionIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  instructionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  instructionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  formContainer: {
    gap: 24,
  },
  fieldGroup: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      },
    }),
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
  fieldHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
    }),
  },
});