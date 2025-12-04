import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { showAlert } from '../../../../components/showAlert';
import { Button } from '../../../../components/ui/Button';
import Colors from '../../../../constants/Colors';
import * as authService from '../../../../services-odoo/authService';
import { createSection, type SectionType } from '../../../../services-odoo/sectionService';

export default function RegisterSectionScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'primary' as SectionType,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const insets = useSafeAreaInsets();

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

  const handleSubmit = async () => {
    const serverHealth = await authService.checkServerHealth();
    if (!serverHealth.ok) {
      if (__DEV__) {
        console.log('🔴 Servidor no disponible para guardar');
      }
      showAlert(
        'Sin conexión',
        'No se puede crear la sección sin conexión a internet. Por favor, verifica tu conexión e intenta nuevamente.'
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
        console.log('📝 Creando sección...');
      }

      const result = await createSection({
        name: formData.name.trim(),
        type: formData.type,
      });

      setIsLoading(false);

      if (result.success) {
        showAlert('✅ Registro Exitoso', 'Sección creada correctamente', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else {
        showAlert('❌ Error', result.message || 'No se pudo crear la sección');
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
        showAlert('❌ Error', 'Ocurrió un error inesperado al crear la sección');
      }
    }
  };

  return (
    <>
      <Head>
        <title>Registrar Sección</title>
      </Head>
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
              <Text style={styles.headerTitle}>Nueva Sección</Text>
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
                    <Ionicons name="folder-open" size={40} color={Colors.primary} />
                  </View>
                  <Text style={styles.instructionTitle}>Registrar nueva sección</Text>
                  <Text style={styles.instructionText}>
                    Complete la información básica para crear una nueva sección en el sistema
                  </Text>
                </View>

                {/* Formulario */}
                <View style={styles.formContainer}>
                  {/* Nombre de la sección */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      Nombre de la sección *
                    </Text>
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
                        placeholder="Ej: 1er Grado A, 4to año B"
                        placeholderTextColor={Colors.textTertiary}
                        autoCapitalize="words"
                        editable={!isLoading}
                      />
                    </View>
                    {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                    <Text style={styles.fieldHint}>
                      Ingresa un nombre descriptivo para la sección
                    </Text>
                  </View>

                  {/* Tipo de sección */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>
                      Tipo de sección *
                    </Text>
                    <View style={styles.typeGrid}>
                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          formData.type === 'pre' && {
                            borderColor: '#ec4899',
                            backgroundColor: '#ec489915',
                          },
                        ]}
                        onPress={() => updateField('type', 'pre')}
                        disabled={isLoading}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.typeIconContainer,
                            { backgroundColor: '#ec489915' },
                          ]}
                        >
                          <Ionicons
                            name="color-palette"
                            size={32}
                            color={formData.type === 'pre' ? '#ec4899' : Colors.textSecondary}
                          />
                        </View>
                        <Text
                          style={[
                            styles.typeLabel,
                            formData.type === 'pre' && {
                              color: '#ec4899',
                              fontWeight: '700',
                            },
                          ]}
                        >
                          Preescolar
                        </Text>
                        <Text style={styles.typeDescription}>Educación inicial</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          formData.type === 'primary' && {
                            borderColor: '#3b82f6',
                            backgroundColor: '#3b82f615',
                          },
                        ]}
                        onPress={() => updateField('type', 'primary')}
                        disabled={isLoading}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.typeIconContainer,
                            { backgroundColor: '#3b82f615' },
                          ]}
                        >
                          <Ionicons
                            name="book"
                            size={32}
                            color={formData.type === 'primary' ? '#3b82f6' : Colors.textSecondary}
                          />
                        </View>
                        <Text
                          style={[
                            styles.typeLabel,
                            formData.type === 'primary' && {
                              color: '#3b82f6',
                              fontWeight: '700',
                            },
                          ]}
                        >
                          Primaria
                        </Text>
                        <Text style={styles.typeDescription}>1° a 6° grado</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.typeButton,
                          formData.type === 'secundary' && {
                            borderColor: '#10b981',
                            backgroundColor: '#10b98115',
                          },
                        ]}
                        onPress={() => updateField('type', 'secundary')}
                        disabled={isLoading}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.typeIconContainer,
                            { backgroundColor: '#10b98115' },
                          ]}
                        >
                          <Ionicons
                            name="school"
                            size={32}
                            color={formData.type === 'secundary' ? '#10b981' : Colors.textSecondary}
                          />
                        </View>
                        <Text
                          style={[
                            styles.typeLabel,
                            formData.type === 'secundary' && {
                              color: '#10b981',
                              fontWeight: '700',
                            },
                          ]}
                        >
                          Media General
                        </Text>
                        <Text style={styles.typeDescription}>1° a 5° año</Text>
                      </TouchableOpacity>
                    </View>
                    {errors.type && <Text style={styles.errorText}>{errors.type}</Text>}
                  </View>
                </View>

                <View style={{ height: 120 }} />
              </ScrollView>
            </KeyboardAvoidingView>

            {/* Botón flotante */}
            <View style={{...styles.floatingButtonContainer, paddingBottom: insets.bottom }}>
              <Button
                title={isLoading ? 'Guardando...' : 'Crear Sección'}
                onPress={handleSubmit}
                loading={isLoading}
                icon={isLoading ? undefined : 'add-circle'}
                iconPosition="left"
                variant="primary"
                size="large"
                disabled={isLoading}
              />
            </View>
          </View>
        </SafeAreaProvider>
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
      }
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
      }
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
      }
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
  typeGrid: {
    gap: 12,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      }
    }),
  },
  typeIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  typeDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
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
      }
    }),
  },
});