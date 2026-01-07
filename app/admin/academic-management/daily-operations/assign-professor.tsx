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
import { useProfessors } from '../../../../hooks/useProfessors';
import * as authService from '../../../../services-odoo/authService';
import { SECTION_TYPE_COLORS, SECTION_TYPE_LABELS } from '../../../../services-odoo/enrolledSectionService';
import { assignProfessor, Employee, loadEmployees, NewProfessor } from '../../../../services-odoo/professorService';

interface SelectableSection {
    id: number;
    name: string;
    type: 'pre' | 'primary' | 'secundary';
    yearId: number;
}

export default function AssignProfessorScreen() {
    const insets = useSafeAreaInsets();
    const { sections: enrolledSections } = useEnrolledSections();
    const { onRefresh: refreshProfessors, professors } = useProfessors();

    // Form state
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedSectionIds, setSelectedSectionIds] = useState<number[]>([]);

    // Loading states
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [saving, setSaving] = useState(false);

    // Data
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Validation
    const [errors, setErrors] = useState<{
        employee?: string;
        sections?: string;
    }>({});

    // Get already assigned professor IDs
    const assignedProfessorIds = professors.map(p => p.professorId);

    // Convert enrolled sections to selectable format
    const selectableSections: SelectableSection[] = enrolledSections.map(s => ({
        id: s.sectionId,
        name: s.sectionName,
        type: s.type,
        yearId: s.yearId,
    }));

    // Get current year from enrolled sections
    const currentYear = enrolledSections.length > 0 ? enrolledSections[0].yearId : 0;

    // Load employees on mount
    useEffect(() => {
        const fetchEmployees = async () => {
            setLoadingEmployees(true);
            try {
                const employeeList = await loadEmployees(true);
                // Filter out already assigned professors
                const available = employeeList.filter(
                    e => !assignedProfessorIds.includes(e.id)
                );
                setEmployees(available);
            } catch (error) {
                if (__DEV__) {
                    console.error('Error loading employees:', error);
                }
            } finally {
                setLoadingEmployees(false);
            }
        };

        fetchEmployees();
    }, [assignedProfessorIds.length]);

    // Filter employees by search
    const filteredEmployees = employees.filter(employee => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase();
        return employee.name.toLowerCase().includes(query) ||
            (employee.workEmail && employee.workEmail.toLowerCase().includes(query));
    });

    const handleEmployeeSelect = (employee: Employee) => {
        setSelectedEmployee(employee);
        setErrors(prev => ({ ...prev, employee: undefined }));
    };

    const toggleSection = (sectionId: number) => {
        setSelectedSectionIds(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
        setErrors(prev => ({ ...prev, sections: undefined }));
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!selectedEmployee) {
            newErrors.employee = 'Debe seleccionar un docente';
        }
        // Sections are optional for pre/primary

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
            showAlert('Sin conexión', 'No se puede asignar al docente sin conexión a internet.');
            return;
        }

        Keyboard.dismiss();
        setSaving(true);

        try {
            const data: NewProfessor = {
                professorId: selectedEmployee!.id,
                yearId: currentYear,
                sectionIds: selectedSectionIds.length > 0 ? selectedSectionIds : undefined,
            };

            const result = await assignProfessor(data);

            if (result.success) {
                await refreshProfessors();
                showAlert('✅ Docente Asignado', `${selectedEmployee!.name} ha sido asignado exitosamente al año escolar`, [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                showAlert('❌ Error', result.message || 'No se pudo asignar al docente');
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
                </View>

                <View style={styles.sectionsGrid}>
                    {sections.map((section) => {
                        const isSelected = selectedSectionIds.includes(section.id);
                        return (
                            <TouchableOpacity
                                key={section.id}
                                style={[
                                    styles.sectionChip,
                                    isSelected && styles.sectionChipSelected,
                                    isSelected && { borderColor: typeColor },
                                ]}
                                onPress={() => toggleSection(section.id)}
                                activeOpacity={0.7}
                                disabled={saving}
                            >
                                <Ionicons
                                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
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
                <title>Asignar Docente</title>
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
                                <Text style={styles.headerTitle}>Asignar Docente</Text>
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
                                    <Text style={styles.instructionTitle}>Nueva asignación</Text>
                                    <Text style={styles.instructionText}>
                                        Seleccione un empleado para asignarlo como docente en el año escolar actual.
                                        Opcionalmente puede asignarle secciones.
                                    </Text>
                                </View>

                                {/* Employee Selector */}
                                <View style={styles.formSection}>
                                    <Text style={styles.fieldLabel}>Seleccionar Docente *</Text>

                                    {/* Search */}
                                    <View style={styles.searchContainer}>
                                        <Ionicons name="search" size={20} color={Colors.textTertiary} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder="Buscar por nombre o email..."
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

                                    {loadingEmployees ? (
                                        <View style={styles.loadingContainer}>
                                            <ActivityIndicator size="large" color={Colors.primary} />
                                            <Text style={styles.loadingText}>Cargando empleados...</Text>
                                        </View>
                                    ) : filteredEmployees.length === 0 ? (
                                        <View style={styles.emptyBox}>
                                            <Ionicons name="people-outline" size={32} color={Colors.textTertiary} />
                                            <Text style={styles.emptyText}>
                                                {searchQuery ? 'No se encontraron empleados' : 'No hay empleados disponibles'}
                                            </Text>
                                            <Text style={styles.emptyHint}>
                                                Todos los empleados ya están asignados
                                            </Text>
                                        </View>
                                    ) : (
                                        <ScrollView style={styles.employeesList} nestedScrollEnabled>
                                            {filteredEmployees.slice(0, 15).map((employee) => {
                                                const isSelected = selectedEmployee?.id === employee.id;
                                                return (
                                                    <TouchableOpacity
                                                        key={employee.id}
                                                        style={[
                                                            styles.employeeCard,
                                                            isSelected && styles.employeeCardSelected,
                                                        ]}
                                                        onPress={() => handleEmployeeSelect(employee)}
                                                        activeOpacity={0.7}
                                                        disabled={saving}
                                                    >
                                                        {employee.imageUrl ? (
                                                            <Image
                                                                source={{ uri: employee.imageUrl }}
                                                                style={styles.employeeAvatar}
                                                            />
                                                        ) : (
                                                            <View style={styles.employeeAvatarPlaceholder}>
                                                                <Ionicons name="person" size={20} color={Colors.primary} />
                                                            </View>
                                                        )}
                                                        <View style={styles.employeeInfo}>
                                                            <Text style={styles.employeeName} numberOfLines={1}>
                                                                {employee.name}
                                                            </Text>
                                                            {employee.workEmail && (
                                                                <Text style={styles.employeeEmail} numberOfLines={1}>
                                                                    {employee.workEmail}
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
                                            {filteredEmployees.length > 15 && (
                                                <Text style={styles.moreText}>
                                                    Mostrando 15 de {filteredEmployees.length} empleados. Use el buscador para filtrar.
                                                </Text>
                                            )}
                                        </ScrollView>
                                    )}
                                    {errors.employee && <Text style={styles.errorText}>{errors.employee}</Text>}
                                </View>

                                {/* Section Selector (Optional) */}
                                <View style={styles.formSection}>
                                    <View style={styles.fieldLabelRow}>
                                        <Text style={styles.fieldLabel}>Asignar Secciones</Text>
                                        <Text style={styles.optionalLabel}>(Opcional)</Text>
                                    </View>
                                    {selectableSections.length === 0 ? (
                                        <View style={styles.emptyBox}>
                                            <Ionicons name="folder-open-outline" size={32} color={Colors.textTertiary} />
                                            <Text style={styles.emptyText}>No hay secciones inscritas</Text>
                                        </View>
                                    ) : (
                                        <>
                                            <View style={styles.selectedCount}>
                                                <Ionicons name="checkmark-done" size={18} color={Colors.primary} />
                                                <Text style={styles.selectedCountText}>
                                                    {selectedSectionIds.length} secciones seleccionadas
                                                </Text>
                                            </View>
                                            {renderSectionGroup('pre', sectionsByType.pre || [])}
                                            {renderSectionGroup('primary', sectionsByType.primary || [])}
                                            {renderSectionGroup('secundary', sectionsByType.secundary || [])}
                                        </>
                                    )}
                                </View>

                                <View style={{ height: 120 }} />
                            </ScrollView>

                            {/* Floating Button */}
                            <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom }]}>
                                <Button
                                    title={saving ? 'Asignando...' : 'Asignar Docente'}
                                    onPress={handleSubmit}
                                    loading={saving}
                                    icon={saving ? undefined : 'person-add'}
                                    iconPosition="left"
                                    variant="primary"
                                    size="large"
                                    disabled={saving || employees.length === 0}
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
    fieldLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    optionalLabel: {
        fontSize: 12,
        color: Colors.textTertiary,
        fontWeight: '500',
    },
    selectedCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
    },
    selectedCountText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
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
    employeesList: {
        maxHeight: 300,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    employeeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    employeeCardSelected: {
        backgroundColor: Colors.primary + '08',
    },
    employeeAvatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    employeeAvatarPlaceholder: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    employeeInfo: {
        flex: 1,
        gap: 2,
    },
    employeeName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    employeeEmail: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    moreText: {
        fontSize: 13,
        color: Colors.textTertiary,
        textAlign: 'center',
        padding: 16,
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
