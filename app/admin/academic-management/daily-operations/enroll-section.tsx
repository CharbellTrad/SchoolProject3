import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
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
    enrollSection,
    loadAvailableProfessors,
    ProfessorForSection,
    SECTION_TYPE_COLORS,
    SECTION_TYPE_LABELS
} from '../../../../services-odoo/enrolledSectionService';
import { loadSections, Section } from '../../../../services-odoo/sectionService';

// Professor Row Component for the selection table
const ProfessorRow = ({
    name,
    index,
    isSelected,
    onToggle,
    disabled
}: {
    name: string;
    index: number;
    isSelected: boolean;
    onToggle: () => void;
    disabled: boolean;
}) => (
    <TouchableOpacity
        style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt, isSelected && styles.tableRowSelected]}
        onPress={onToggle}
        disabled={disabled}
        activeOpacity={0.7}
    >
        <View style={styles.checkboxCell}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
        </View>
        <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{name}</Text>
    </TouchableOpacity>
);

export default function EnrollSectionScreen() {
    const insets = useSafeAreaInsets();
    const { sections: enrolledSections, onRefresh: refreshEnrolledSections } = useEnrolledSections();

    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [baseSections, setBaseSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<Section | null>(null);

    // Professor selection for pre/primary
    const [availableProfessors, setAvailableProfessors] = useState<ProfessorForSection[]>([]);
    const [selectedProfessorIds, setSelectedProfessorIds] = useState<number[]>([]);
    const [loadingProfessors, setLoadingProfessors] = useState(false);

    // Load available sections
    useEffect(() => {
        const fetchSections = async () => {
            setIsLoading(true);
            try {
                const sections = await loadSections(true);
                setBaseSections(sections);
            } catch (error) {
                if (__DEV__) {
                    console.error('Error loading sections:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchSections();
    }, []);

    // Load professors when a pre/primary section is selected
    useEffect(() => {
        const fetchProfessors = async () => {
            if (!selectedSection || selectedSection.type === 'secundary') {
                setAvailableProfessors([]);
                setSelectedProfessorIds([]);
                return;
            }

            setLoadingProfessors(true);
            try {
                const professors = await loadAvailableProfessors();
                setAvailableProfessors(professors);
            } catch (error) {
                if (__DEV__) {
                    console.error('Error loading professors:', error);
                }
            } finally {
                setLoadingProfessors(false);
            }
        };

        fetchProfessors();
    }, [selectedSection?.id, selectedSection?.type]);

    // Filter out already enrolled sections
    const availableSections = useMemo(() => {
        const enrolledSectionIds = new Set(enrolledSections.map((s) => s.sectionId));
        return baseSections.filter((s) => !enrolledSectionIds.has(s.id));
    }, [baseSections, enrolledSections]);

    // Group sections by type
    const sectionsByType = useMemo(() => {
        const grouped: Record<string, Section[]> = {
            pre: [],
            primary: [],
            secundary: [],
        };

        availableSections.forEach((section) => {
            if (grouped[section.type]) {
                grouped[section.type].push(section);
            }
        });

        return grouped;
    }, [availableSections]);

    const toggleProfessor = (professorId: number) => {
        setSelectedProfessorIds((prev) =>
            prev.includes(professorId)
                ? prev.filter((id) => id !== professorId)
                : [...prev, professorId]
        );
    };

    const handleSelectSection = (section: Section) => {
        if (selectedSection?.id === section.id) {
            setSelectedSection(null);
            setSelectedProfessorIds([]);
        } else {
            setSelectedSection(section);
            setSelectedProfessorIds([]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedSection) {
            showAlert('Error', 'Debe seleccionar una sección para inscribir');
            return;
        }

        const serverHealth = await authService.checkServerHealth();
        if (!serverHealth.ok) {
            showAlert(
                'Sin conexión',
                'No se puede inscribir la sección sin conexión a internet.'
            );
            return;
        }

        setIsSaving(true);

        try {
            // Get current year from enrolled sections if available
            const currentYear = enrolledSections.length > 0 ? enrolledSections[0].yearId : 0;

            if (!currentYear) {
                showAlert('Error', 'No se pudo determinar el año escolar actual');
                setIsSaving(false);
                return;
            }

            const result = await enrollSection({
                yearId: currentYear,
                sectionId: selectedSection.id,
                professorIds: selectedProfessorIds.length > 0 ? selectedProfessorIds : undefined,
            });

            if (result.success) {
                await refreshEnrolledSections();
                showAlert('✅ Sección Inscrita', 'La sección ha sido inscrita exitosamente', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                showAlert('❌ Error', result.message || 'No se pudo inscribir la sección');
            }
        } catch (error: any) {
            showAlert('❌ Error', error.message || 'Ocurrió un error inesperado');
        } finally {
            setIsSaving(false);
        }
    };

    const renderSectionGroup = (type: 'pre' | 'primary' | 'secundary', sections: Section[]) => {
        if (sections.length === 0) return null;

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
                                onPress={() => handleSelectSection(section)}
                                activeOpacity={0.7}
                                disabled={isSaving}
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

    // Detail panel for selected section
    const renderDetailPanel = () => {
        if (!selectedSection) return null;

        const typeColor = SECTION_TYPE_COLORS[selectedSection.type];
        const typeLabel = SECTION_TYPE_LABELS[selectedSection.type];
        const isProfessorSection = selectedSection.type !== 'secundary';

        return (
            <View style={styles.detailPanel}>
                {/* Section Info Header */}
                <View style={styles.detailHeader}>
                    <View style={[styles.detailIconBox, { backgroundColor: typeColor + '15' }]}>
                        <Ionicons name="folder-open" size={24} color={typeColor} />
                    </View>
                    <View style={styles.detailHeaderInfo}>
                        <Text style={styles.detailTitle}>{selectedSection.name}</Text>
                        <View style={[styles.detailTypeBadge, { backgroundColor: typeColor + '20' }]}>
                            <Text style={[styles.detailTypeText, { color: typeColor }]}>{typeLabel}</Text>
                        </View>
                    </View>
                </View>

                {/* Professor Selection for Pre/Primary */}
                {isProfessorSection && (
                    <View style={styles.detailSection}>
                        <View style={styles.detailSectionHeader}>
                            <Ionicons name="person" size={18} color={Colors.textSecondary} />
                            <Text style={styles.detailSectionTitle}>Asignar Docentes (Opcional)</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeTextSmall}>{selectedProfessorIds.length}</Text>
                            </View>
                        </View>

                        {loadingProfessors ? (
                            <View style={styles.loadingMini}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                                <Text style={styles.loadingMiniText}>Cargando docentes...</Text>
                            </View>
                        ) : availableProfessors.length === 0 ? (
                            <View style={styles.emptyMini}>
                                <Text style={styles.emptyMiniText}>No hay docentes disponibles</Text>
                            </View>
                        ) : (
                            <>
                                <View style={styles.tableHeader}>
                                    <View style={styles.checkboxCell} />
                                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Docente</Text>
                                </View>
                                <ScrollView style={styles.tableBody} nestedScrollEnabled>
                                    {availableProfessors.map((professor, index) => (
                                        <ProfessorRow
                                            key={professor.professorId}
                                            name={professor.professorName}
                                            index={index}
                                            isSelected={selectedProfessorIds.includes(professor.professorId)}
                                            onToggle={() => toggleProfessor(professor.professorId)}
                                            disabled={isSaving}
                                        />
                                    ))}
                                </ScrollView>
                            </>
                        )}
                    </View>
                )}

                {/* Notice for Secundary */}
                {!isProfessorSection && (
                    <View style={styles.noticeCard}>
                        <Ionicons name="information-circle" size={20} color={Colors.info} />
                        <Text style={styles.noticeText}>
                            Las materias y profesores se asignan después de inscribir la sección.
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    return (
        <>
            <Head>
                <title>Inscribir Sección</title>
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
                                <Text style={styles.headerTitle}>Inscribir Sección</Text>
                                <View style={{ width: 40 }} />
                            </LinearGradient>

                            {/* Content */}
                            <ScrollView
                                style={styles.content}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={styles.scrollContent}
                            >
                                {/* Instruction Card */}
                                <View style={styles.instructionCard}>
                                    <View style={styles.instructionIconContainer}>
                                        <Ionicons name="folder-open" size={40} color={Colors.primary} />
                                    </View>
                                    <Text style={styles.instructionTitle}>Nueva inscripción</Text>
                                    <Text style={styles.instructionText}>
                                        Seleccione una sección para inscribirla en el año escolar actual.
                                        {selectedSection?.type !== 'secundary' && ' Puede asignar docentes opcionalmente.'}
                                    </Text>
                                </View>

                                {/* Loading State */}
                                {isLoading ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="large" color={Colors.primary} />
                                        <Text style={styles.loadingText}>Cargando secciones disponibles...</Text>
                                    </View>
                                ) : availableSections.length === 0 ? (
                                    <View style={styles.emptyState}>
                                        <Ionicons name="checkmark-done-circle" size={60} color={Colors.success} />
                                        <Text style={styles.emptyStateTitle}>¡Todo listo!</Text>
                                        <Text style={styles.emptyStateText}>
                                            Todas las secciones ya están inscritas en el año escolar actual.
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        <View style={styles.formContainer}>
                                            <Text style={styles.fieldLabel}>Seleccionar sección *</Text>
                                            {renderSectionGroup('pre', sectionsByType.pre)}
                                            {renderSectionGroup('primary', sectionsByType.primary)}
                                            {renderSectionGroup('secundary', sectionsByType.secundary)}
                                        </View>

                                        {/* Detail Panel */}
                                        {renderDetailPanel()}
                                    </>
                                )}

                                <View style={{ height: 120 }} />
                            </ScrollView>

                            {/* Floating Button */}
                            {availableSections.length > 0 && (
                                <View style={[styles.floatingButtonContainer, { paddingBottom: insets.bottom }]}>
                                    <Button
                                        title={isSaving ? 'Inscribiendo...' : 'Inscribir Sección'}
                                        onPress={handleSubmit}
                                        loading={isSaving}
                                        icon={isSaving ? undefined : 'add-circle'}
                                        iconPosition="left"
                                        variant="primary"
                                        size="large"
                                        disabled={isSaving || !selectedSection}
                                    />
                                </View>
                            )}
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
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        gap: 16,
    },
    loadingText: {
        fontSize: 15,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#fff',
        borderRadius: 20,
        gap: 12,
    },
    emptyStateTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    emptyStateText: {
        fontSize: 15,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    formContainer: {
        gap: 20,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: 0.2,
        marginBottom: 4,
    },
    sectionGroup: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        gap: 12,
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
        backgroundColor: Colors.primary + '20',
    },
    countBadgeText: {
        fontSize: 13,
        fontWeight: '800',
    },
    countBadgeTextSmall: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.primary,
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
    // Detail Panel Styles
    detailPanel: {
        marginTop: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        gap: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    detailHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    detailIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    detailHeaderInfo: {
        flex: 1,
        gap: 4,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },
    detailTypeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    detailTypeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    detailSection: {
        gap: 12,
    },
    detailSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    detailSectionTitle: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    // Table Styles
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tableHeaderText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    tableBody: {
        maxHeight: 200,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: '#fff',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    tableRowAlt: {
        backgroundColor: '#fafbfc',
    },
    tableRowSelected: {
        backgroundColor: Colors.primary + '08',
    },
    tableCell: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    checkboxCell: {
        width: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    loadingMini: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        gap: 8,
    },
    loadingMiniText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    emptyMini: {
        paddingVertical: 20,
        alignItems: 'center',
    },
    emptyMiniText: {
        fontSize: 14,
        color: Colors.textTertiary,
    },
    noticeCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: Colors.info + '10',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.info + '30',
    },
    noticeText: {
        flex: 1,
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
});
