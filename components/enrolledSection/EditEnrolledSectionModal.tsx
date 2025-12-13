import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';
import * as authService from '../../services-odoo/authService';
import {
    deleteEnrolledSection,
    EnrolledSection,
    loadAvailableProfessors,
    loadProfessorsForSection,
    loadStudentsForSection,
    loadSubjectsForSection,
    ProfessorForSection,
    SECTION_TYPE_COLORS,
    SECTION_TYPE_LABELS,
    StudentForSection,
    SubjectWithProfessor,
    updateEnrolledSection,
} from '../../services-odoo/enrolledSectionService';
import { showAlert } from '../showAlert';

interface EditEnrolledSectionModalProps {
    visible: boolean;
    section: EnrolledSection | null;
    availableProfessors?: { id: number; name: string }[]; // Now optional, loaded internally
    onClose: () => void;
    onSave: () => void;
}

type TabKey = 'students' | 'subjects' | 'professors' | 'settings';

interface TabConfig {
    key: TabKey;
    label: string;
    icon: string;
}

// Table Row Components
const StudentRow = ({ name, state, index }: { name: string; state: string; index: number }) => {
    const getStateStyle = () => {
        switch (state) {
            case 'done':
                return { bg: '#dcfce7', color: '#16a34a', label: 'Inscrito' };
            case 'cancel':
                return { bg: '#fee2e2', color: '#dc2626', label: 'Retirado' };
            default:
                return { bg: '#dbeafe', color: '#2563eb', label: 'Por inscribir' };
        }
    };
    const stateStyle = getStateStyle();

    return (
        <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
            <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{name}</Text>
            <View style={styles.stateBadge}>
                <View style={[styles.stateBadgeInner, { backgroundColor: stateStyle.bg }]}>
                    <Text style={[styles.stateBadgeText, { color: stateStyle.color }]}>{stateStyle.label}</Text>
                </View>
            </View>
        </View>
    );
};

const SubjectRow = ({ subjectName, professorName, index }: { subjectName: string; professorName: string | null; index: number }) => (
    <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
        <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{subjectName}</Text>
        <View style={styles.professorCell}>
            <Text style={[styles.tableCell, { color: professorName ? Colors.textPrimary : Colors.textTertiary }]} numberOfLines={1}>
                {professorName || 'Sin asignar'}
            </Text>
        </View>
    </View>
);

const ProfessorRow = ({ name, index, isSelected, onToggle, disabled }: {
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

export const EditEnrolledSectionModal: React.FC<EditEnrolledSectionModalProps> = ({
    visible,
    section,
    availableProfessors,
    onClose,
    onSave,
}) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['90%'], []);

    const [activeTab, setActiveTab] = useState<TabKey>('students');
    const [selectedProfessorIds, setSelectedProfessorIds] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Data states
    const [studentsData, setStudentsData] = useState<StudentForSection[]>([]);
    const [subjectsData, setSubjectsData] = useState<SubjectWithProfessor[]>([]);
    const [professorsData, setProfessorsData] = useState<ProfessorForSection[]>([]);
    const [allProfessors, setAllProfessors] = useState<ProfessorForSection[]>([]); // All available professors for selection
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingProfessors, setLoadingProfessors] = useState(false);

    // Determine available tabs based on section type
    const tabs = useMemo<TabConfig[]>(() => {
        if (!section) return [];

        const baseTabs: TabConfig[] = [
            { key: 'students', label: 'Estudiantes', icon: 'people' },
        ];

        if (section.type === 'secundary') {
            baseTabs.push({ key: 'subjects', label: 'Materias', icon: 'book' });
        } else {
            baseTabs.push({ key: 'professors', label: 'Docentes', icon: 'person' });
        }

        baseTabs.push({ key: 'settings', label: 'Ajustes', icon: 'settings' });

        return baseTabs;
    }, [section?.type]);

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
            setActiveTab('students');
        } else {
            bottomSheetRef.current?.dismiss();
            setStudentsData([]);
            setSubjectsData([]);
            setProfessorsData([]);
            setSelectedProfessorIds([]);
        }
    }, [visible]);

    // Initialize selected professors from section data
    useEffect(() => {
        if (visible && section) {
            setSelectedProfessorIds([...section.professorIds]);
        }
    }, [visible, section]);

    // Load students
    useEffect(() => {
        const loadStudents = async () => {
            if (!visible || !section) return;

            setLoadingStudents(true);
            try {
                const students = await loadStudentsForSection(section.id);
                setStudentsData(students);
            } catch (error) {
                if (__DEV__) console.error('Error loading students:', error);
            } finally {
                setLoadingStudents(false);
            }
        };
        loadStudents();
    }, [visible, section?.id]);

    // Load subjects for secundary
    useEffect(() => {
        const loadSubjects = async () => {
            if (!visible || !section || section.type !== 'secundary') return;

            setLoadingSubjects(true);
            try {
                const subjects = await loadSubjectsForSection(section.id);
                setSubjectsData(subjects);
            } catch (error) {
                if (__DEV__) console.error('Error loading subjects:', error);
            } finally {
                setLoadingSubjects(false);
            }
        };
        loadSubjects();
    }, [visible, section?.id, section?.type]);

    // Load professors for pre/primary - both assigned and all available
    useEffect(() => {
        const loadProfessors = async () => {
            if (!visible || !section || section.type === 'secundary') return;

            setLoadingProfessors(true);
            try {
                // Load currently assigned professors
                const assigned = await loadProfessorsForSection(section.id);
                setProfessorsData(assigned);

                // Load all available professors for selection
                const available = await loadAvailableProfessors();
                setAllProfessors(available);

                // Initialize selected IDs from assigned professors
                setSelectedProfessorIds(assigned.map(p => p.professorId));
            } catch (error) {
                if (__DEV__) console.error('Error loading professors:', error);
            } finally {
                setLoadingProfessors(false);
            }
        };
        loadProfessors();
    }, [visible, section?.id, section?.type]);

    const toggleProfessor = (professorId: number) => {
        setSelectedProfessorIds((prev) =>
            prev.includes(professorId)
                ? prev.filter((id) => id !== professorId)
                : [...prev, professorId]
        );
    };

    const handleSave = async () => {
        if (!section) return;

        const serverHealth = await authService.checkServerHealth();
        if (!serverHealth.ok) {
            showAlert('Sin conexión', 'No se puede actualizar sin conexión a internet.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateEnrolledSection(section.id, {
                professorIds: selectedProfessorIds,
            });

            if (result.success) {
                showAlert('Éxito', 'Sección actualizada correctamente');
                onSave();
                onClose();
            } else {
                showAlert('Error', result.message || 'No se pudo actualizar');
            }
        } catch (error: any) {
            showAlert('Error', error.message || 'Ocurrió un error inesperado');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!section) return;

        // Remove client-side check - let Odoo handle the error
        showAlert(
            '¿Eliminar sección?',
            `¿Estás seguro de eliminar "${section.sectionName}"? Esta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const serverHealth = await authService.checkServerHealth();
                        if (!serverHealth.ok) {
                            showAlert('Sin conexión', 'No se puede eliminar sin conexión.');
                            return;
                        }

                        onClose();
                        setTimeout(async () => {
                            try {
                                const result = await deleteEnrolledSection(section.id);
                                if (result.success) {
                                    showAlert('Éxito', 'Sección eliminada correctamente');
                                    onSave();
                                } else {
                                    showAlert('Error', result.message || 'No se pudo eliminar');
                                }
                            } catch (error: any) {
                                showAlert('Error', error.message || 'Ocurrió un error inesperado');
                            }
                        }, 300);
                    },
                },
            ]
        );
    };

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

    const handleSheetChanges = useCallback(
        (index: number) => {
            if (index === -1) onClose();
        },
        [onClose]
    );

    if (!section) return null;

    const typeColor = SECTION_TYPE_COLORS[section.type];
    const typeLabel = SECTION_TYPE_LABELS[section.type];
    const canEditProfessors = section.type !== 'secundary';
    const hasChanges = canEditProfessors &&
        JSON.stringify([...selectedProfessorIds].sort()) !== JSON.stringify([...section.professorIds].sort());

    // Tab Content Renderers
    const renderStudentsTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Estudiante</Text>
                <View style={styles.stateBadge}>
                    <Text style={[styles.tableHeaderText, { textAlign: 'center' }]}>Estado</Text>
                </View>
            </View>

            {loadingStudents ? (
                <View style={styles.loadingPlaceholder}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.infoText}>Cargando estudiantes...</Text>
                </View>
            ) : studentsData.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No hay estudiantes inscritos</Text>
                </View>
            ) : (
                <ScrollView style={styles.tableBody} nestedScrollEnabled>
                    {studentsData.map((student, index) => (
                        <StudentRow key={student.studentId} name={student.studentName} state={student.state} index={index} />
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const renderSubjectsTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Materia</Text>
                <View style={styles.professorCell}>
                    <Text style={styles.tableHeaderText}>Profesor</Text>
                </View>
            </View>

            {loadingSubjects ? (
                <View style={styles.loadingPlaceholder}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.infoText}>Cargando materias...</Text>
                </View>
            ) : subjectsData.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No hay materias asignadas</Text>
                </View>
            ) : (
                <ScrollView style={styles.tableBody} nestedScrollEnabled>
                    {subjectsData.map((subject, index) => (
                        <SubjectRow key={subject.subjectId} subjectName={subject.subjectName} professorName={subject.professorName} index={index} />
                    ))}
                </ScrollView>
            )}

            {/* Notice for editing subjects */}
            <View style={styles.noticeCard}>
                <Ionicons name="information-circle" size={20} color={Colors.info} />
                <Text style={styles.noticeText}>
                    Para agregar o editar materias, use la pantalla de gestión de materias en Odoo.
                </Text>
            </View>
        </View>
    );

    const renderProfessorsTab = () => (
        <View style={styles.tabContent}>
            <View style={styles.tableHeader}>
                <View style={styles.checkboxCell}>
                    <Text style={styles.tableHeaderText}></Text>
                </View>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Docente</Text>
            </View>

            {loadingProfessors ? (
                <View style={styles.loadingPlaceholder}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.infoText}>Cargando docentes...</Text>
                </View>
            ) : allProfessors.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="person-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No hay docentes disponibles</Text>
                    <Text style={styles.emptySubtext}>Registre docentes en Odoo primero</Text>
                </View>
            ) : (
                <ScrollView style={styles.tableBody} nestedScrollEnabled>
                    {allProfessors.map((professor, index) => (
                        <ProfessorRow
                            key={professor.professorId}
                            name={professor.professorName}
                            index={index}
                            isSelected={selectedProfessorIds.includes(professor.professorId)}
                            onToggle={() => toggleProfessor(professor.professorId)}
                            disabled={isLoading}
                        />
                    ))}
                </ScrollView>
            )}

            {/* Selected count */}
            <View style={styles.selectionInfo}>
                <Text style={styles.selectionInfoText}>
                    {selectedProfessorIds.length} docente(s) seleccionado(s)
                </Text>
            </View>
        </View>
    );

    const renderSettingsTab = () => (
        <View style={styles.tabContent}>
            {/* Section Info */}
            <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                    <Ionicons name="folder" size={20} color={typeColor} />
                    <Text style={styles.infoLabel}>Sección:</Text>
                    <Text style={styles.infoValue}>{section.sectionName}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={20} color={Colors.primary} />
                    <Text style={styles.infoLabel}>Año Escolar:</Text>
                    <Text style={styles.infoValue}>{section.yearName}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="people" size={20} color={Colors.secondary} />
                    <Text style={styles.infoLabel}>Estudiantes:</Text>
                    <Text style={styles.infoValue}>{section.studentsCount}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Ionicons name="person" size={20} color={Colors.info} />
                    <Text style={styles.infoLabel}>Docentes:</Text>
                    <Text style={styles.infoValue}>{section.professorsCount}</Text>
                </View>
                {section.type === 'secundary' && (
                    <View style={styles.infoRow}>
                        <Ionicons name="book" size={20} color="#10b981" />
                        <Text style={styles.infoLabel}>Materias:</Text>
                        <Text style={styles.infoValue}>{section.subjectsCount}</Text>
                    </View>
                )}
            </View>

            {/* Danger Zone */}
            <View style={styles.dangerZone}>
                <View style={styles.dangerZoneHeader}>
                    <Ionicons name="warning" size={24} color={Colors.error} />
                    <Text style={styles.dangerZoneTitle}>Zona de Peligro</Text>
                </View>
                <Text style={styles.dangerZoneText}>
                    Esta acción eliminará la sección del año escolar actual. Si tiene estudiantes, Odoo mostrará un error.
                </Text>
                <TouchableOpacity
                    onPress={handleDelete}
                    style={styles.deleteButton}
                    activeOpacity={0.8}
                    disabled={isLoading}
                >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.deleteButtonText}>
                        Eliminar Sección
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'students':
                return renderStudentsTab();
            case 'subjects':
                return renderSubjectsTab();
            case 'professors':
                return renderProfessorsTab();
            case 'settings':
                return renderSettingsTab();
            default:
                return null;
        }
    };

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
            >
                <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconBox, { backgroundColor: typeColor + '15' }]}>
                                <Ionicons name="create" size={22} color={typeColor} />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerTitle} numberOfLines={1}>{section.sectionName}</Text>
                                <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                                    <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <Ionicons name="close-circle" size={28} color={Colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsContainer}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
                            {tabs.map((tab) => (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                                    onPress={() => setActiveTab(tab.key)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={tab.icon as any}
                                        size={18}
                                        color={activeTab === tab.key ? Colors.primary : Colors.textTertiary}
                                    />
                                    <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Body */}
                    <BottomSheetScrollView style={{ flex: 1 }} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
                        {renderActiveTab()}
                    </BottomSheetScrollView>

                    {/* Footer - only show if there are changes */}
                    {hasChanges && (
                        <View style={styles.footer}>
                            {isLoading ? (
                                <View style={styles.saveBtn}>
                                    <ActivityIndicator size="small" color="#fff" />
                                </View>
                            ) : (
                                <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
                                    <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                    <Text style={styles.saveBtnLabel}>Guardar Cambios</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </View>
            </BottomSheetModal>
        </>
    );
};

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
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        gap: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },
    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    tabsContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tabsScroll: {
        paddingHorizontal: 16,
        gap: 8,
        paddingVertical: 12,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#f1f5f9',
        gap: 6,
    },
    tabActive: {
        backgroundColor: Colors.primary + '15',
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textTertiary,
    },
    tabLabelActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    bodyContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    tabContent: {
        gap: 16,
    },
    tableHeader: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    tableHeaderText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    tableBody: {
        maxHeight: 280,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: '#fff',
    },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
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
        flex: 1,
    },
    stateBadge: {
        width: 90,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stateBadgeInner: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignItems: 'center',
    },
    stateBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    professorCell: {
        width: 120,
        alignItems: 'flex-start',
    },
    checkboxCell: {
        width: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    loadingPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
    infoText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    selectionInfo: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    selectionInfoText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
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
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    infoValue: {
        flex: 1,
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'right',
    },
    dangerZone: {
        marginTop: 16,
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
    deleteButtonDisabled: {
        backgroundColor: '#e2e8f0',
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.1,
    },
    footer: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: '#fff',
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
