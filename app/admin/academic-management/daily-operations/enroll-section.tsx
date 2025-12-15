import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Platform,
    RefreshControl,
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
    createSectionSubject,
    enrollSection,
    loadAvailableProfessors,
    loadAvailableSubjectsForSection,
    loadProfessorsForSubject,
    ProfessorForSection,
    RegisterSubject,
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
    const [refreshing, setRefreshing] = useState(false);

    // Subject selection for secundary (Media General)
    const [availableSubjects, setAvailableSubjects] = useState<RegisterSubject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<{
        registerSubjectId: number;
        registerSubjectName: string;
        professorId: number;
        professorName: string;
    }[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [professorsForSubject, setProfessorsForSubject] = useState<ProfessorForSection[]>([]);
    const [selectingSubject, setSelectingSubject] = useState<RegisterSubject | null>(null);
    const [loadingProfessorsForSubject, setLoadingProfessorsForSubject] = useState(false);

    // Accordion state for section types
    const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

    // Accordion state for subjects list
    const [subjectsExpanded, setSubjectsExpanded] = useState(false);

    // Reset state when screen comes into focus (fresh start each time)
    useFocusEffect(
        useCallback(() => {
            // Reset all selection state
            setSelectedSection(null);
            setSelectedProfessorIds([]);
            setAvailableProfessors([]);
            setSelectedSubjects([]);
            setAvailableSubjects([]);
            setSelectingSubject(null);
            setProfessorsForSubject([]);
            setExpandedTypes(new Set());
            setSubjectsExpanded(false);

            // Fetch fresh data
            const fetchData = async () => {
                setIsLoading(true);
                try {
                    const sections = await loadSections(true); // force reload, no cache
                    setBaseSections(sections);
                    await refreshEnrolledSections();
                } catch (error) {
                    if (__DEV__) {
                        console.error('Error loading sections:', error);
                    }
                } finally {
                    setIsLoading(false);
                }
            };

            fetchData();
        }, [])
    );


    // Pull to refresh handler
    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const sections = await loadSections(true);
            setBaseSections(sections);
            await refreshEnrolledSections();
        } catch (error) {
            if (__DEV__) {
                console.error('Error refreshing sections:', error);
            }
        } finally {
            setRefreshing(false);
        }
    };

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

    // Load subjects when a secundary (Media General) section is selected
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!selectedSection || selectedSection.type !== 'secundary') {
                setAvailableSubjects([]);
                setSelectedSubjects([]);
                setSelectingSubject(null);
                setProfessorsForSubject([]);
                return;
            }

            setLoadingSubjects(true);
            try {
                // Load subjects from catalog that apply to this section
                const subjects = await loadAvailableSubjectsForSection(0, selectedSection.id);
                setAvailableSubjects(subjects);
            } catch (error) {
                if (__DEV__) {
                    console.error('Error loading subjects:', error);
                }
            } finally {
                setLoadingSubjects(false);
            }
        };

        fetchSubjects();
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
            setSelectedSubjects([]);
            setSelectingSubject(null);
            setProfessorsForSubject([]);
        } else {
            setSelectedSection(section);
            setSelectedProfessorIds([]);
            setSelectedSubjects([]);
            setSelectingSubject(null);
            setProfessorsForSubject([]);
        }
    };

    // Select a subject from catalog - start selecting professor
    const handleSelectSubject = async (subject: RegisterSubject) => {
        setSelectingSubject(subject);
        setLoadingProfessorsForSubject(true);
        setProfessorsForSubject([]);

        try {
            // Load professors assigned to this subject (using year ID 0 for current year)
            const professors = await loadProfessorsForSubject(subject.id);
            setProfessorsForSubject(professors);
        } catch (error) {
            if (__DEV__) console.error('Error loading professors for subject:', error);
            setProfessorsForSubject([]);
        } finally {
            setLoadingProfessorsForSubject(false);
        }
    };

    // Select professor for the currently selecting subject
    const handleSelectProfessorForSubject = (professorId: number, professorName: string) => {
        if (!selectingSubject) return;

        // Add to selected subjects
        setSelectedSubjects((prev) => [
            ...prev,
            {
                registerSubjectId: selectingSubject.id,
                registerSubjectName: selectingSubject.name,
                professorId,
                professorName,
            },
        ]);

        // Remove from available subjects
        setAvailableSubjects((prev) => prev.filter((s) => s.id !== selectingSubject.id));

        // Reset selecting state
        setSelectingSubject(null);
        setProfessorsForSubject([]);
    };

    // Cancel subject selection
    const handleCancelSelectSubject = () => {
        setSelectingSubject(null);
        setProfessorsForSubject([]);
    };

    // Remove a selected subject
    const handleRemoveSubject = (registerSubjectId: number, registerSubjectName: string) => {
        // Remove from selected
        setSelectedSubjects((prev) => prev.filter((s) => s.registerSubjectId !== registerSubjectId));

        // Add back to available
        setAvailableSubjects((prev) => [...prev, { id: registerSubjectId, name: registerSubjectName }]);
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

            if (result.success && result.data) {
                const enrolledSectionId = result.data;

                // For secundary sections, create subject assignments
                if (selectedSection.type === 'secundary' && selectedSubjects.length > 0) {
                    let subjectErrors = 0;
                    for (const subject of selectedSubjects) {
                        const subjectResult = await createSectionSubject(
                            enrolledSectionId,
                            subject.registerSubjectId,
                            subject.professorId
                        );
                        if (!subjectResult.success) {
                            subjectErrors++;
                            if (__DEV__) {
                                console.error(`Error creating subject ${subject.registerSubjectName}:`, subjectResult.message);
                            }
                        }
                    }

                    if (subjectErrors > 0) {
                        showAlert(
                            '⚠️ Sección Inscrita con Advertencias',
                            `La sección fue inscrita pero ${subjectErrors} materia(s) no pudieron ser asignadas.`,
                            [{ text: 'OK', onPress: () => router.back() }]
                        );
                    } else {
                        showAlert('✅ Sección Inscrita',
                            `La sección ha sido inscrita con ${selectedSubjects.length} materia(s) asignada(s).`,
                            [{ text: 'OK', onPress: () => router.back() }]
                        );
                    }
                } else {
                    showAlert('✅ Sección Inscrita', 'La sección ha sido inscrita exitosamente', [
                        { text: 'OK', onPress: () => router.back() },
                    ]);
                }

                await refreshEnrolledSections();
            } else {
                showAlert('❌ Error', result.message || 'No se pudo inscribir la sección');
            }
        } catch (error: any) {
            showAlert('❌ Error', error.message || 'Ocurrió un error inesperado');
        } finally {
            setIsSaving(false);
        }
    };

    const toggleAccordion = (type: string) => {
        setExpandedTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
                newSet.delete(type);
            } else {
                newSet.add(type);
            }
            return newSet;
        });
    };

    const renderSectionGroup = (type: 'pre' | 'primary' | 'secundary', sections: Section[]) => {
        if (sections.length === 0) return null;

        const typeColor = SECTION_TYPE_COLORS[type];
        const typeLabel = SECTION_TYPE_LABELS[type];
        const isExpanded = expandedTypes.has(type);
        const hasSelected = sections.some(s => s.id === selectedSection?.id);

        return (
            <View style={styles.accordionContainer} key={type}>
                {/* Accordion Header - clickable */}
                <TouchableOpacity
                    style={[
                        styles.accordionHeader,
                        hasSelected && { borderLeftColor: typeColor, borderLeftWidth: 4 }
                    ]}
                    onPress={() => toggleAccordion(type)}
                    activeOpacity={0.7}
                >
                    <View style={[styles.accordionIcon, { backgroundColor: typeColor + '15' }]}>
                        <Ionicons name="folder" size={20} color={typeColor} />
                    </View>
                    <View style={styles.accordionTitleContainer}>
                        <Text style={styles.accordionTitle}>{typeLabel}</Text>
                        <Text style={[styles.accordionCount, { color: typeColor }]}>
                            {sections.length} sección{sections.length !== 1 ? 'es' : ''}
                        </Text>
                    </View>
                    {hasSelected && (
                        <View style={[styles.accordionSelectedBadge, { backgroundColor: typeColor }]}>
                            <Ionicons name="checkmark" size={12} color="#fff" />
                        </View>
                    )}
                    <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={22}
                        color={Colors.textSecondary}
                    />
                </TouchableOpacity>

                {/* Accordion Content - collapsible sections list */}
                {isExpanded && (
                    <View style={styles.accordionContent}>
                        {sections.map((section, index) => {
                            const isSelected = selectedSection?.id === section.id;
                            return (
                                <TouchableOpacity
                                    key={section.id}
                                    style={[
                                        styles.sectionListItem,
                                        index === 0 && { borderTopWidth: 0 },
                                        isSelected && styles.sectionListItemSelected,
                                        isSelected && { backgroundColor: typeColor + '08', borderLeftColor: typeColor },
                                    ]}
                                    onPress={() => handleSelectSection(section)}
                                    activeOpacity={0.7}
                                    disabled={isSaving}
                                >
                                    <View style={[
                                        styles.radioButton,
                                        isSelected && { borderColor: typeColor, backgroundColor: typeColor }
                                    ]}>
                                        {isSelected && <View style={styles.radioButtonInner} />}
                                    </View>
                                    <Text
                                        style={[
                                            styles.sectionListItemText,
                                            isSelected && { color: typeColor, fontWeight: '700' },
                                        ]}
                                        numberOfLines={2}
                                    >
                                        {section.name}
                                    </Text>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={20} color={typeColor} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}
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

                {/* Subject Assignment for Secundary (Media General) */}
                {!isProfessorSection && (
                    <View style={styles.detailSection}>
                        <View style={styles.detailSectionHeader}>
                            <Ionicons name="book" size={18} color={Colors.textSecondary} />
                            <Text style={styles.detailSectionTitle}>Asignar Materias (Opcional)</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countBadgeText}>{selectedSubjects.length}</Text>
                            </View>
                        </View>

                        {loadingSubjects ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="small" color={Colors.primary} />
                                <Text style={styles.loadingText}>Cargando materias...</Text>
                            </View>
                        ) : selectingSubject ? (
                            // Selecting professor for a subject
                            <View style={styles.professorSelectionContainer}>
                                <View style={styles.selectingSubjectHeader}>
                                    <Text style={styles.selectingSubjectTitle}>{selectingSubject.name}</Text>
                                    <TouchableOpacity onPress={handleCancelSelectSubject} activeOpacity={0.7}>
                                        <Ionicons name="close-circle" size={22} color={Colors.textTertiary} />
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.selectingSubjectHint}>Seleccionar Profesor:</Text>

                                {loadingProfessorsForSubject ? (
                                    <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 10 }} />
                                ) : professorsForSubject.length === 0 ? (
                                    <View style={styles.emptyProfessors}>
                                        <Ionicons name="alert-circle-outline" size={20} color={Colors.warning} />
                                        <Text style={styles.emptyProfessorsText}>
                                            No hay profesores asignados a esta materia
                                        </Text>
                                    </View>
                                ) : (
                                    <ScrollView style={{ maxHeight: 150 }} nestedScrollEnabled>
                                        {professorsForSubject.map((professor, index) => (
                                            <TouchableOpacity
                                                key={professor.professorId}
                                                style={[styles.professorOption, index % 2 === 0 && styles.tableRowAlt]}
                                                onPress={() => handleSelectProfessorForSubject(professor.professorId, professor.professorName)}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="person" size={16} color={Colors.secondary} />
                                                <Text style={styles.professorOptionText}>{professor.professorName}</Text>
                                                <Ionicons name="arrow-forward-circle" size={18} color={Colors.primary} />
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                )}
                            </View>
                        ) : (
                            <>
                                {/* Available subjects to add - collapsible */}
                                {availableSubjects.length > 0 && (
                                    <View style={styles.subjectAccordionContainer}>
                                        <TouchableOpacity
                                            style={styles.subjectAccordionHeader}
                                            onPress={() => setSubjectsExpanded(!subjectsExpanded)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.subjectAccordionIcon}>
                                                <Ionicons name="book" size={18} color={Colors.secondary} />
                                            </View>
                                            <View style={styles.accordionTitleContainer}>
                                                <Text style={styles.subjectAccordionTitle}>Materias Disponibles</Text>
                                                <Text style={styles.subjectAccordionCount}>
                                                    {availableSubjects.length} materia{availableSubjects.length !== 1 ? 's' : ''}
                                                </Text>
                                            </View>
                                            <Ionicons
                                                name={subjectsExpanded ? 'chevron-up' : 'chevron-down'}
                                                size={20}
                                                color={Colors.textSecondary}
                                            />
                                        </TouchableOpacity>

                                        {subjectsExpanded && (
                                            <View style={styles.subjectAccordionContent}>
                                                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                                                    {availableSubjects.map((subject, index) => (
                                                        <TouchableOpacity
                                                            key={subject.id}
                                                            style={[
                                                                styles.subjectListItem,
                                                                index === 0 && { borderTopWidth: 0 }
                                                            ]}
                                                            onPress={() => handleSelectSubject(subject)}
                                                            activeOpacity={0.7}
                                                        >
                                                            <View style={styles.subjectListIcon}>
                                                                <Ionicons name="book-outline" size={18} color={Colors.secondary} />
                                                            </View>
                                                            <Text style={styles.subjectListItemText} numberOfLines={1}>{subject.name}</Text>
                                                            <Ionicons name="add-circle" size={22} color={Colors.primary} />
                                                        </TouchableOpacity>
                                                    ))}
                                                </ScrollView>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* Selected subjects list */}
                                {selectedSubjects.length > 0 && (
                                    <View style={styles.selectedSubjectsContainer}>
                                        <Text style={styles.selectedSubjectsLabel}>Materias Asignadas:</Text>
                                        <View style={styles.selectedSubjectsTable}>
                                            {selectedSubjects.map((subject, index) => (
                                                <View key={subject.registerSubjectId} style={[styles.selectedSubjectRow, index % 2 === 0 && styles.tableRowAlt]}>
                                                    <View style={styles.selectedSubjectInfo}>
                                                        <Text style={styles.selectedSubjectName} numberOfLines={1}>{subject.registerSubjectName}</Text>
                                                        <Text style={styles.selectedSubjectProfessor} numberOfLines={1}>{subject.professorName}</Text>
                                                    </View>
                                                    <TouchableOpacity
                                                        onPress={() => handleRemoveSubject(subject.registerSubjectId, subject.registerSubjectName)}
                                                        activeOpacity={0.7}
                                                        style={styles.removeSubjectBtn}
                                                    >
                                                        <Ionicons name="trash-outline" size={18} color={Colors.error} />
                                                    </TouchableOpacity>
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {availableSubjects.length === 0 && selectedSubjects.length === 0 && (
                                    <View style={styles.noticeCard}>
                                        <Ionicons name="information-circle" size={20} color={Colors.info} />
                                        <Text style={styles.noticeText}>
                                            No hay materias disponibles para esta sección.
                                        </Text>
                                    </View>
                                )}
                            </>
                        )}
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
                                refreshControl={
                                    <RefreshControl
                                        refreshing={refreshing}
                                        onRefresh={handleRefresh}
                                        colors={[Colors.primary]}
                                        tintColor={Colors.primary}
                                    />
                                }
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
        gap: 2,
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: 0.2,
        marginBottom: 4,
    },
    // Accordion styles
    accordionContainer: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
        backgroundColor: '#fff',
    },
    accordionIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    accordionTitleContainer: {
        flex: 1,
    },
    accordionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    accordionCount: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    accordionSelectedBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 4,
    },
    accordionContent: {
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    sectionListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        paddingLeft: 16,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#e8ecf0',
    },
    sectionListItemSelected: {
        borderLeftWidth: 4,
    },
    sectionListItemText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        color: Colors.textPrimary,
        lineHeight: 20,
    },
    radioButton: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: Colors.border,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#fff',
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
        gap: 12,
    },
    sectionCard: {
        width: '47%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 14,
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 2,
        borderColor: Colors.border,
        minHeight: 70,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    sectionCardSelected: {
        borderWidth: 2,
        ...Platform.select({
            ios: {
                shadowOpacity: 0.12,
                shadowRadius: 10,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    sectionCardIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionCardText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
        lineHeight: 18,
    },
    sectionCardCheck: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    // Keep old styles for backwards compatibility
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
    // Subject selection styles
    professorSelectionContainer: {
        backgroundColor: Colors.background,
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectingSubjectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    selectingSubjectTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
        flex: 1,
    },
    selectingSubjectHint: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    professorOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 10,
        borderRadius: 8,
    },
    professorOptionText: {
        flex: 1,
        fontSize: 14,
        color: Colors.textPrimary,
    },
    emptyProfessors: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    emptyProfessorsText: {
        fontSize: 13,
        color: Colors.textSecondary,
        flex: 1,
    },
    availableSubjectsContainer: {
        marginTop: 8,
    },
    availableSubjectsLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    subjectChipsScroll: {
        flexDirection: 'row',
    },
    subjectChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '10',
        borderRadius: 20,
        paddingVertical: 6,
        paddingHorizontal: 12,
        gap: 6,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    subjectChipText: {
        fontSize: 13,
        color: Colors.primary,
        fontWeight: '600',
    },
    selectedSubjectsContainer: {
        marginTop: 12,
    },
    selectedSubjectsLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    selectedSubjectsTable: {
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
    },
    selectedSubjectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },
    selectedSubjectInfo: {
        flex: 1,
        gap: 2,
    },
    selectedSubjectName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    selectedSubjectProfessor: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    removeSubjectBtn: {
        padding: 6,
    },
    // Subject list styles (vertical)
    subjectListContainer: {
        marginTop: 8,
    },
    subjectListLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    subjectListBox: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    subjectListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#e8ecf0',
    },
    subjectListIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.secondary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    subjectListItemText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    // Subject accordion styles
    subjectAccordionContainer: {
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Colors.border,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    subjectAccordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        gap: 10,
        backgroundColor: '#fff',
    },
    subjectAccordionIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.secondary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    subjectAccordionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    subjectAccordionCount: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.secondary,
        marginTop: 2,
    },
    subjectAccordionContent: {
        backgroundColor: '#f8fafc',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
});
