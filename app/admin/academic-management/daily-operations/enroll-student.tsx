import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
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
import { useEnrolledSections } from '../../../../hooks/useEnrolledSections';
import * as authService from '../../../../services-odoo/authService';
import {
    SECTION_TYPE_COLORS,
    SECTION_TYPE_LABELS,
} from '../../../../services-odoo/enrolledSectionService';
import { loadStudents, Student } from '../../../../services-odoo/personService';
import {
    createStudentEnrollment,
    NewStudentEnrollment,
} from '../../../../services-odoo/studentEnrollmentService';

interface SelectableSection {
    id: number;
    name: string;
    type: 'pre' | 'primary' | 'secundary';
    yearId: number;
}

export default function EnrollStudentScreen() {
    const insets = useSafeAreaInsets();
    const { sections: enrolledSections, onRefresh: refreshEnrolledSections } = useEnrolledSections();

    // Form state
    const [selectedSection, setSelectedSection] = useState<SelectableSection | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [fromSchool, setFromSchool] = useState('');
    const [observations, setObservations] = useState('');

    // Loading states
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data
    const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Validation
    const [errors, setErrors] = useState<{
        section?: string;
        student?: string;
    }>({});

    // Convert enrolled sections to selectable format
    const selectableSections: SelectableSection[] = enrolledSections.map(s => ({
        id: s.sectionId,
        name: s.sectionName,
        type: s.type,
        yearId: s.yearId,
    }));

    // Load students on mount
    useEffect(() => {
        const fetchStudents = async () => {
            setLoadingStudents(true);
            try {
                const students = await loadStudents();
                // Filter to only active students
                setAvailableStudents(students.filter((s: Student) => s.is_active));
            } catch (error) {
                if (__DEV__) {
                    console.error('Error loading students:', error);
                }
            } finally {
                setLoadingStudents(false);
            }
        };

        fetchStudents();
    }, []);

    // Filter students by search
    const filteredStudents = availableStudents.filter(student => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return student.name.toLowerCase().includes(query) ||
            (student.vat && student.vat.toLowerCase().includes(query));
    });

    const handleSectionSelect = (section: SelectableSection) => {
        setSelectedSection(section);
        setErrors(prev => ({ ...prev, section: undefined }));
    };

    const handleStudentSelect = (student: Student) => {
        setSelectedStudent(student);
        setErrors(prev => ({ ...prev, student: undefined }));
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!selectedSection) {
            newErrors.section = 'Debe seleccionar una sección';
        }
        if (!selectedStudent) {
            newErrors.student = 'Debe seleccionar un estudiante';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        const serverHealth = await authService.checkServerHealth();
        if (!serverHealth.ok) {
            showAlert('Sin conexión', 'No se puede inscribir al estudiante sin conexión a internet.');
            return;
        }

        Keyboard.dismiss();
        setSaving(true);

        try {
            const data: NewStudentEnrollment = {
                yearId: selectedSection!.yearId,
                sectionId: selectedSection!.id,
                studentId: selectedStudent!.id,
                fromSchool: fromSchool.trim() || undefined,
                observations: observations.trim() || undefined,
            };

            const result = await createStudentEnrollment(data);

            if (result.success) {
                await refreshEnrolledSections();
                showAlert('✅ Estudiante Inscrito', `${selectedStudent!.name} ha sido inscrito exitosamente en ${selectedSection!.name}`, [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                showAlert('❌ Error', result.message || 'No se pudo inscribir al estudiante');
            }
        } catch (error: any) {
            showAlert('❌ Error', error.message || 'Ocurrió un error inesperado');
        } finally {
            setSaving(false);
        }
    };

    // Group sections by type
    const sectionsByType = selectableSections.reduce((acc, section) => {
        if (!acc[section.type]) {
            acc[section.type] = [];
        }
        acc[section.type].push(section);
        return acc;
    }, {} as Record<string, SelectableSection[]>);

    const renderSectionGroup = (type: 'pre' | 'primary' | 'secundary', sections: SelectableSection[]) => {
        if (!sections || sections.length === 0) return null;

        const typeColor = SECTION_TYPE_COLORS[type];
        const typeLabel = SECTION_TYPE_LABELS[type];

        return (
            <View style={styles.sectionGroup} key={type}>
                <View style={styles.sectionGroupHeader}>
                    <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
                    <Text style={styles.sectionGroupTitle}>{typeLabel}</Text>
                    <View style={[styles.countBadge, { backgroundColor: typeColor + '20' }]}>
                        <Text style={[styles.countBadgeText, { color: typeColor }]}>
                            {sections.length}
                        </Text>
                    </View>
                </View>

                <View style={styles.sectionsGrid}>
                    {sections.map((section) => {
                        const isSelected = selectedSection?.id === section.id;
                        return (
                            <TouchableOpacity
                                key={section.id}
                                style={[
                                    styles.sectionChip,
                                    isSelected && styles.sectionChipSelected,
                                    isSelected && { borderColor: typeColor },
                                ]}
                                onPress={() => handleSectionSelect(section)}
                                activeOpacity={0.7}
                                disabled={saving}
                            >
                                <Ionicons
                                    name={isSelected ? 'checkmark-circle' : 'folder-outline'}
                                    size={18}
                                    color={isSelected ? typeColor : Colors.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.sectionChipText,
                                        isSelected && { color: typeColor, fontWeight: '700' },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {section.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <>
            <Head>
                <title>Inscribir Estudiante</title>
            </Head>
            <GestureHandlerRootView style={{ flex: 1 }}>
                <BottomSheetModalProvider>
                    <SafeAreaProvider>
                        <StatusBar style="light" translucent />
                        <View style={styles.container}>
                            {/* Header */}
                            <LinearGradient
                                colors={[Colors.primary, Colors.primaryDark]}
                                style={[styles.header, { paddingTop: insets.top }]}
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
                                <Text style={styles.headerTitle}>Inscribir Estudiante</Text>
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
                                        <Ionicons name="person-add" size={40} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.instructionTitle}>Nueva inscripción</Text>
                                    <Text style={styles.instructionText}>
                                        Seleccione una sección y un estudiante para inscribirlo en el año escolar actual.
                                    </Text>
                                </View>

                                {/* Section Selector */}
                                <View style={styles.formSection}>
                                    <Text style={styles.fieldLabel}>Seleccionar sección *</Text>
                                    {selectableSections.length === 0 ? (
                                        <View style={styles.emptyBox}>
                                            <Ionicons name="folder-open-outline" size={32} color={Colors.textTertiary} />
                                            <Text style={styles.emptyText}>No hay secciones inscritas</Text>
                                            <Text style={styles.emptyHint}>Primero inscriba secciones en el año escolar</Text>
                                        </View>
                                    ) : (
                                        <>
                                            {renderSectionGroup('pre', sectionsByType.pre || [])}
                                            {renderSectionGroup('primary', sectionsByType.primary || [])}
                                            {renderSectionGroup('secundary', sectionsByType.secundary || [])}
                                        </>
                                    )}
                                    {errors.section && <Text style={styles.errorText}>{errors.section}</Text>}
                                </View>

                                {/* Student Selector */}
                                <View style={styles.formSection}>
                                    <Text style={styles.fieldLabel}>Seleccionar estudiante *</Text>

                                    {/* Search */}
                                    <View style={styles.searchContainer}>
                                        <Ionicons name="search" size={20} color={Colors.textTertiary} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Buscar por nombre o cédula..."
                                            placeholderTextColor={Colors.textTertiary}
                                            value={searchQuery}
                                            onChangeText={setSearchQuery}
                                        />
                                        {searchQuery.length > 0 && (
                                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                                            </TouchableOpacity>
                                        )}
                                    </View>

                                    {loadingStudents ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="large" color={Colors.primary} />
                                            <Text style={styles.loadingText}>Cargando estudiantes...</Text>
                                        </View>
                                    ) : filteredStudents.length === 0 ? (
                                        <View style={styles.emptyBox}>
                                            <Ionicons name="people-outline" size={32} color={Colors.textTertiary} />
                                            <Text style={styles.emptyText}>
                                                {searchQuery ? 'No se encontraron estudiantes' : 'No hay estudiantes disponibles'}
                                            </Text>
                                        </View>
                                    ) : (
                                        <ScrollView style={styles.studentsList} nestedScrollEnabled>
                                            {filteredStudents.slice(0, 20).map((student) => {
                                                const isSelected = selectedStudent?.id === student.id;
                                                return (
                                                    <TouchableOpacity
                                                        key={student.id}
                                                        style={[
                                                            styles.studentCard,
                                                            isSelected && styles.studentCardSelected,
                                                        ]}
                                                        onPress={() => handleStudentSelect(student)}
                                                        activeOpacity={0.7}
                                                        disabled={saving}
                                                    >
                                                        {student.image_1920 ? (
                                                            <Image
                                                                source={{ uri: `data:image/png;base64,${student.image_1920}` }}
                                                                style={styles.studentAvatar}
                                                            />
                                                        ) : (
                                                            <View style={styles.studentAvatarPlaceholder}>
                                                                <Text style={styles.studentInitial}>
                                                                    {student.name.charAt(0).toUpperCase()}
                                                                </Text>
                                                            </View>
                                                        )}
                                                        <View style={styles.studentInfo}>
                                                            <Text style={styles.studentName} numberOfLines={1}>
                                                                {student.name}
                                                            </Text>
                                                            {student.vat && (
                                                                <Text style={styles.studentVat}>
                                                                    {student.vat}
                                                                </Text>
                                                            )}
                                                        </View>
                                                        <Ionicons
                                                            name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                                            size={24}
                                                            color={isSelected ? Colors.primary : Colors.textTertiary}
                                                        />
                                                    </TouchableOpacity>
                                                );
                                            })}
                                            {filteredStudents.length > 20 && (
                                                <Text style={styles.moreText}>
                                                    Mostrando 20 de {filteredStudents.length} estudiantes. Use el buscador para filtrar.
                                                </Text>
                                            )}
                                        </ScrollView>
                                    )}
                                    {errors.student && <Text style={styles.errorText}>{errors.student}</Text>}
                                </View>

                                {/* Optional Fields */}
                                <View style={styles.formSection}>
                                    <Text style={styles.fieldLabel}>Información adicional (opcional)</Text>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Plantel de procedencia</Text>
                                        <TextInput
                                            style={styles.textInput}
                                            value={fromSchool}
                                            onChangeText={setFromSchool}
                                            placeholder="Nombre del plantel anterior..."
                                            placeholderTextColor={Colors.textTertiary}
                                            maxLength={200}
                                        />
                                    </View>

                                    <View style={styles.inputGroup}>
                                        <Text style={styles.inputLabel}>Observaciones</Text>
                                        <TextInput
                                            style={[styles.textInput, styles.textArea]}
                                            value={observations}
                                            onChangeText={setObservations}
                                            placeholder="Observaciones adicionales..."
                                            placeholderTextColor={Colors.textTertiary}
                                            multiline
                                            numberOfLines={3}
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
                                    title={saving ? 'Inscribiendo...' : 'Inscribir Estudiante'}
                                    onPress={handleSubmit}
                                    loading={saving}
                                    icon={saving ? undefined : 'person-add'}
                                    iconPosition="left"
                                    variant="primary"
                                    size="large"
                                    disabled={saving || selectableSections.length === 0}
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
    formSection: {
        marginBottom: 24,
        gap: 12,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: 0.2,
    },
    sectionGroup: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        gap: 12,
        marginBottom: 12,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            },
        }),
    },
    sectionGroupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    typeIndicator: {
        width: 4,
        height: 20,
        borderRadius: 2,
    },
    sectionGroupTitle: {
        flex: 1,
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    countBadgeText: {
        fontSize: 13,
        fontWeight: '800',
    },
    sectionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    sectionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    sectionChipSelected: {
        backgroundColor: '#fff',
        borderWidth: 2,
    },
    sectionChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        maxWidth: 120,
    },
    emptyBox: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#fff',
        borderRadius: 16,
        gap: 8,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    emptyHint: {
        fontSize: 13,
        color: Colors.textTertiary,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.textPrimary,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    loadingText: {
        fontSize: 15,
        color: Colors.textSecondary,
    },
    studentsList: {
        maxHeight: 300,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    studentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    studentCardSelected: {
        backgroundColor: Colors.primary + '08',
    },
    studentAvatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
    },
    studentAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentInitial: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.primary,
    },
    studentInfo: {
        flex: 1,
        gap: 2,
    },
    studentName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    studentVat: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    moreText: {
        fontSize: 13,
        color: Colors.textTertiary,
        textAlign: 'center',
        padding: 16,
    },
    inputGroup: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
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
        minHeight: 80,
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: 12,
        color: Colors.error,
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
