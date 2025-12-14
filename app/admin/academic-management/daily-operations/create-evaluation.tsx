import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
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

import { Button } from '../../../../components/ui/Button';
import Colors from '../../../../constants/Colors';
import { useEvaluations } from '../../../../hooks/useEvaluations';
import * as authService from '../../../../services-odoo/authService';
import {
    createEvaluation,
    getSectionType,
    loadProfessorsForYear,
    loadSectionsForProfessor,
    loadSubjectsForProfessorAndSection,
    SelectOption,
} from '../../../../services-odoo/evaluationService';

export default function CreateEvaluationScreen() {
    const insets = useSafeAreaInsets();

    // Get current year from evaluations hook
    const { currentYear, onRefresh } = useEvaluations();

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [evaluationDate, setEvaluationDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Cascade selectors state
    const [professors, setProfessors] = useState<SelectOption[]>([]);
    const [sections, setSections] = useState<SelectOption[]>([]);
    const [subjects, setSubjects] = useState<SelectOption[]>([]);

    const [selectedProfessor, setSelectedProfessor] = useState<SelectOption | null>(null);
    const [selectedSection, setSelectedSection] = useState<SelectOption | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<SelectOption | null>(null);

    const [loadingProfessors, setLoadingProfessors] = useState(false);
    const [loadingSections, setLoadingSections] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const [sectionType, setSectionType] = useState<'pre' | 'primary' | 'secundary' | null>(null);
    const [requiresSubject, setRequiresSubject] = useState(false);

    const [saving, setSaving] = useState(false);

    // Validation
    const [errors, setErrors] = useState<{
        name?: string;
        professor?: string;
        section?: string;
        subject?: string;
    }>({});

    // Load professors on mount
    useEffect(() => {
        if (currentYear) {
            loadProfessors();
        }
    }, [currentYear]);

    const loadProfessors = async () => {
        if (!currentYear) return;

        setLoadingProfessors(true);
        try {
            const data = await loadProfessorsForYear();
            setProfessors(data);
        } catch (error) {
            if (__DEV__) console.error('Error loading professors:', error);
        } finally {
            setLoadingProfessors(false);
        }
    };

    const handleProfessorSelect = async (professor: SelectOption) => {
        setSelectedProfessor(professor);
        setSelectedSection(null);
        setSelectedSubject(null);
        setSections([]);
        setSubjects([]);
        setSectionType(null);
        setRequiresSubject(false);
        setErrors(prev => ({ ...prev, professor: undefined }));

        if (professor) {
            setLoadingSections(true);
            try {
                const data = await loadSectionsForProfessor(professor.id);
                setSections(data);
            } catch (error) {
                if (__DEV__) console.error('Error loading sections:', error);
            } finally {
                setLoadingSections(false);
            }
        }
    };

    const handleSectionSelect = async (section: SelectOption) => {
        setSelectedSection(section);
        setSelectedSubject(null);
        setSubjects([]);
        setErrors(prev => ({ ...prev, section: undefined }));

        if (section) {
            // Get section type
            const type = await getSectionType(section.id);
            setSectionType(type);

            if (type === 'secundary' && selectedProfessor) {
                setRequiresSubject(true);
                setLoadingSubjects(true);
                try {
                    const data = await loadSubjectsForProfessorAndSection(selectedProfessor.id, section.id);
                    setSubjects(data);
                } catch (error) {
                    if (__DEV__) console.error('Error loading subjects:', error);
                } finally {
                    setLoadingSubjects(false);
                }
            } else {
                setRequiresSubject(false);
            }
        }
    };

    const handleSubjectSelect = (subject: SelectOption) => {
        setSelectedSubject(subject);
        setErrors(prev => ({ ...prev, subject: undefined }));
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEvaluationDate(selectedDate);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!name.trim()) {
            newErrors.name = 'El nombre es requerido';
        }
        if (!selectedProfessor) {
            newErrors.professor = 'Debe seleccionar un profesor';
        }
        if (!selectedSection) {
            newErrors.section = 'Debe seleccionar una sección';
        }
        if (requiresSubject && !selectedSubject) {
            newErrors.subject = 'Debe seleccionar una materia';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!currentYear) {
            showAlert('Error', 'No se pudo determinar el año escolar actual');
            return;
        }

        if (!validateForm()) return;

        const serverHealth = await authService.checkServerHealth();
        if (!serverHealth.ok) {
            showAlert('Sin conexión', 'No se puede crear la evaluación sin conexión a internet.');
            return;
        }

        Keyboard.dismiss();
        setSaving(true);

        try {
            const result = await createEvaluation({
                name: name.trim(),
                description: description.trim(),
                evaluationDate: evaluationDate.toISOString().split('T')[0],
                yearId: currentYear.id,
                professorId: selectedProfessor!.id,
                sectionId: selectedSection!.id,
                subjectId: requiresSubject && selectedSubject ? selectedSubject.id : undefined,
            });

            if (result.success) {
                await onRefresh();
                showAlert('✅ Evaluación Creada', 'La evaluación ha sido creada exitosamente', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                showAlert('❌ Error', result.message || 'No se pudo crear la evaluación');
            }
        } catch (error: any) {
            showAlert('❌ Error', error.message || 'Ocurrió un error inesperado');
        } finally {
            setSaving(false);
        }
    };

    const renderSelectBox = (
        label: string,
        options: SelectOption[],
        selected: SelectOption | null,
        onSelect: (option: SelectOption) => void,
        loading: boolean,
        error?: string,
        disabled?: boolean,
        placeholder?: string
    ) => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{label} *</Text>
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.loadingText}>Cargando...</Text>
                </View>
            ) : options.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                        {disabled ? placeholder || 'Seleccione una opción previa' : 'No hay opciones disponibles'}
                    </Text>
                </View>
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                    <View style={styles.optionsContainer}>
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.optionChip,
                                    selected?.id === option.id && styles.optionChipSelected,
                                ]}
                                onPress={() => onSelect(option)}
                                activeOpacity={0.7}
                                disabled={saving}
                            >
                                <Ionicons
                                    name={selected?.id === option.id ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={18}
                                    color={selected?.id === option.id ? Colors.primary : Colors.textTertiary}
                                />
                                <Text
                                    style={[
                                        styles.optionChipText,
                                        selected?.id === option.id && styles.optionChipTextSelected,
                                    ]}
                                    numberOfLines={1}
                                >
                                    {option.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );

    return (
        <>
            <Head>
                <title>Nueva Evaluación</title>
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
                                <View style={styles.headerTitleContainer}>
                                    <Text style={styles.headerTitle}>Nueva Evaluación</Text>
                                    <Text style={styles.headerSubtitle}>{currentYear?.name || 'Año actual'}</Text>
                                </View>
                                <View style={{ width: 40 }} />
                            </LinearGradient>

                            {/* Content */}
                            <ScrollView
                                style={styles.content}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollContent}
                                keyboardShouldPersistTaps="handled"
                            >
                                {/* Instruction Card */}
                                <View style={styles.instructionCard}>
                                    <View style={styles.instructionIconContainer}>
                                        <Ionicons name="clipboard" size={40} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.instructionTitle}>Nueva evaluación</Text>
                                    <Text style={styles.instructionText}>
                                        Complete los datos para crear una nueva evaluación. Seleccione el profesor, sección y materia (si aplica).
                                    </Text>
                                </View>

                                {/* Form */}
                                <View style={styles.formContainer}>
                                    {/* Professor Selector */}
                                    {renderSelectBox(
                                        'Profesor',
                                        professors,
                                        selectedProfessor,
                                        handleProfessorSelect,
                                        loadingProfessors,
                                        errors.professor
                                    )}

                                    {/* Section Selector */}
                                    {renderSelectBox(
                                        'Sección',
                                        sections,
                                        selectedSection,
                                        handleSectionSelect,
                                        loadingSections,
                                        errors.section,
                                        !selectedProfessor,
                                        'Primero seleccione un profesor'
                                    )}

                                    {/* Subject Selector (only for secundary) */}
                                    {requiresSubject && (
                                        renderSelectBox(
                                            'Materia',
                                            subjects,
                                            selectedSubject,
                                            handleSubjectSelect,
                                            loadingSubjects,
                                            errors.subject
                                        )
                                    )}

                                    {/* Divider */}
                                    <View style={styles.divider} />

                                    {/* Name Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Nombre de la evaluación *</Text>
                                        <TextInput
                                            style={[styles.textInput, errors.name && styles.inputError]}
                                            value={name}
                                            onChangeText={(text) => {
                                                setName(text);
                                                setErrors(prev => ({ ...prev, name: undefined }));
                                            }}
                                            placeholder="Ej: Examen de Matemáticas - Tema 1"
                                            placeholderTextColor={Colors.textTertiary}
                                            maxLength={100}
                                        />
                                        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                                    </View>

                                    {/* Date Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Fecha de evaluación</Text>
                                        <TouchableOpacity
                                            style={styles.dateInput}
                                            onPress={() => setShowDatePicker(true)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="calendar" size={20} color={Colors.textSecondary} />
                                            <Text style={styles.dateText}>
                                                {evaluationDate.toLocaleDateString('es-ES', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </Text>
                                        </TouchableOpacity>
                                        {showDatePicker && (
                                            <DateTimePicker
                                                value={evaluationDate}
                                                mode="date"
                                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                onChange={handleDateChange}
                                            />
                                        )}
                                    </View>

                                    {/* Description Input */}
                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Descripción (opcional)</Text>
                                        <TextInput
                                            style={[styles.textInput, styles.textArea]}
                                            value={description}
                                            onChangeText={setDescription}
                                            placeholder="Breve descripción de la evaluación..."
                                            placeholderTextColor={Colors.textTertiary}
                                            multiline
                                            numberOfLines={4}
                                            textAlignVertical="top"
                                            maxLength={500}
                                        />
                                    </View>
                                </View>

                                <View style={{ height: 120 }} />
                            </ScrollView>

                            {/* Floating Button */}
                            <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom }]}>
                                <Button
                                    title={saving ? 'Creando...' : 'Crear Evaluación'}
                                    onPress={handleSubmit}
                                    loading={saving}
                                    icon={saving ? undefined : 'add-circle'}
                                    iconPosition="left"
                                    variant="primary"
                                    size="large"
                                    disabled={saving}
                                />
                            </View>
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
    headerTitleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 2,
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
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: 0.2,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 10,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    emptyContainer: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textTertiary,
    },
    optionsScroll: {
        flexGrow: 0,
    },
    optionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    optionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    optionChipSelected: {
        backgroundColor: Colors.primary + '08',
        borderColor: Colors.primary,
        borderWidth: 2,
    },
    optionChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    optionChipTextSelected: {
        color: Colors.primary,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginVertical: 8,
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: Colors.textPrimary,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    inputError: {
        borderColor: Colors.error,
    },
    errorText: {
        fontSize: 12,
        color: Colors.error,
    },
    dateInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateText: {
        fontSize: 15,
        color: Colors.textPrimary,
        flex: 1,
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
