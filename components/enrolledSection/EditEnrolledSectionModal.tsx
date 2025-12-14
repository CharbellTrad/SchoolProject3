import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';
import * as authService from '../../services-odoo/authService';
import {
    createSectionSubject,
    deleteEnrolledSection,
    deleteSectionSubject,
    EnrolledSection,
    loadAvailableProfessors,
    loadAvailableSubjectsForSection,
    loadProfessorsForSection,
    loadProfessorsForSubject,
    loadStudentsForSection,
    loadSubjectsForSection,
    ProfessorForSection,
    RegisterSubject,
    SECTION_TYPE_COLORS,
    SECTION_TYPE_LABELS,
    StudentForSection,
    SubjectWithProfessor,
    updateEnrolledSection,
    updateSubjectProfessor,
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

// Subject Row Component - click to edit professor
const SubjectRow = ({
    subjectId,
    subjectName,
    professorName,
    index,
    onEdit,
    onDelete,
    isPendingDelete,
    disabled,
}: {
    subjectId: number;
    subjectName: string;
    professorName: string | null;
    index: number;
    onEdit: (subjectId: number, subjectName: string) => void;
    onDelete: (subjectId: number, subjectName: string) => void;
    isPendingDelete: boolean;
    disabled: boolean;
}) => (
    <View style={[
        styles.tableRow,
        index % 2 === 0 && styles.tableRowAlt,
        isPendingDelete && styles.tableRowPendingDelete
    ]}>
        <TouchableOpacity
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
            onPress={() => onEdit(subjectId, subjectName)}
            disabled={disabled || isPendingDelete}
            activeOpacity={0.7}
        >
            <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{subjectName}</Text>
            <View style={styles.professorBadge}>
                <Text
                    style={[
                        styles.professorBadgeText,
                        professorName ? {} : { color: Colors.textTertiary, fontStyle: 'italic' },
                    ]}
                    numberOfLines={1}
                >
                    {professorName || 'Sin asignar'}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
            </View>
        </TouchableOpacity>
        <TouchableOpacity
            style={styles.deleteSubjectBtn}
            onPress={() => onDelete(subjectId, subjectName)}
            disabled={disabled}
            activeOpacity={0.7}
        >
            {isPendingDelete ? (
                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
            ) : (
                <Ionicons name="trash-outline" size={18} color={Colors.error} />
            )}
        </TouchableOpacity>
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
    const [allProfessors, setAllProfessors] = useState<ProfessorForSection[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingProfessors, setLoadingProfessors] = useState(false);

    // Pending subject changes (for save button)
    const [pendingSubjectDeletions, setPendingSubjectDeletions] = useState<Set<number>>(new Set());
    const [pendingSubjectEdits, setPendingSubjectEdits] = useState<Map<number, { newProfessorId: number; newProfessorName: string }>>(new Map());
    const [pendingSubjectAdds, setPendingSubjectAdds] = useState<{ registerSubjectId: number; registerSubjectName: string; professorId: number; professorName: string }[]>([]);
    const [savingSubjects, setSavingSubjects] = useState(false);

    // Add/Edit subject mode states
    const [isAddingSubject, setIsAddingSubject] = useState(false);
    const [editingSubject, setEditingSubject] = useState<SubjectWithProfessor | null>(null); // Subject being edited
    const [availableSubjects, setAvailableSubjects] = useState<RegisterSubject[]>([]);
    const [loadingAvailableSubjects, setLoadingAvailableSubjects] = useState(false);
    const [selectedNewSubject, setSelectedNewSubject] = useState<RegisterSubject | null>(null);
    const [professorsForSubject, setProfessorsForSubject] = useState<ProfessorForSection[]>([]);
    const [loadingProfessorsForSubject, setLoadingProfessorsForSubject] = useState(false);
    const [creatingSubject, setCreatingSubject] = useState(false);

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

    // Initialize selected professors from section data and reset pending subject states
    useEffect(() => {
        if (visible && section) {
            setSelectedProfessorIds([...section.professorIds]);
            // Reset pending subject changes when section changes
            setPendingSubjectDeletions(new Set());
            setPendingSubjectEdits(new Map());
            setPendingSubjectAdds([]);
            setEditingSubject(null);
            setIsAddingSubject(false);
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

    // Load subjects for secundary - and also load all available professors for assignment
    useEffect(() => {
        const loadSubjects = async () => {
            if (!visible || !section || section.type !== 'secundary') return;

            setLoadingSubjects(true);
            try {
                const [subjects, available] = await Promise.all([
                    loadSubjectsForSection(section.id),
                    loadAvailableProfessors(),
                ]);
                setSubjectsData(subjects);
                setAllProfessors(available);
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

    // Toggle pending deletion for a subject
    const handleToggleDeleteSubject = (subjectId: number, subjectName: string) => {
        setPendingSubjectDeletions((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(subjectId)) {
                newSet.delete(subjectId);
            } else {
                newSet.add(subjectId);
            }
            return newSet;
        });
    };

    // Start edit subject mode - click on a subject row
    const handleEditSubject = async (subjectId: number, subjectName: string) => {
        const subject = subjectsData.find((s) => s.subjectId === subjectId);
        if (!subject) return;

        setEditingSubject(subject);
        setLoadingProfessorsForSubject(true);
        setProfessorsForSubject([]);

        try {
            // Use registerSubjectId and yearId to filter professors exactly like Odoo
            const professors = await loadProfessorsForSubject(subject.registerSubjectId, section?.yearId);
            setProfessorsForSubject(professors);
        } catch (error) {
            if (__DEV__) console.error('Error loading professors:', error);
            setProfessorsForSubject([]);
        } finally {
            setLoadingProfessorsForSubject(false);
        }
    };

    // Select new professor for editing subject (adds to pending edits)
    const handleSelectProfessorForEdit = (professorId: number, professorName: string) => {
        if (!editingSubject) return;

        // Add to pending edits
        setPendingSubjectEdits((prev) => {
            const newMap = new Map(prev);
            newMap.set(editingSubject.subjectId, { newProfessorId: professorId, newProfessorName: professorName });
            return newMap;
        });

        // Update local display
        setSubjectsData((prev) =>
            prev.map((s) =>
                s.subjectId === editingSubject.subjectId
                    ? { ...s, professorId: professorId, professorName: professorName }
                    : s
            )
        );

        // Exit edit mode
        setEditingSubject(null);
        setProfessorsForSubject([]);
    };

    // Cancel edit mode
    const handleCancelEditSubject = () => {
        setEditingSubject(null);
        setProfessorsForSubject([]);
    };

    // Start add subject mode
    const handleStartAddSubject = async () => {
        if (!section) return;

        const serverHealth = await authService.checkServerHealth();
        if (!serverHealth.ok) {
            showAlert('Sin conexión', 'No se puede agregar sin conexión.');
            return;
        }

        setIsAddingSubject(true);
        setLoadingAvailableSubjects(true);
        setSelectedNewSubject(null);
        setProfessorsForSubject([]);

        try {
            const available = await loadAvailableSubjectsForSection(section.id, section.sectionId);
            setAvailableSubjects(available);
        } catch (error) {
            if (__DEV__) console.error('Error loading available subjects:', error);
            showAlert('Error', 'No se pudieron cargar las materias disponibles');
        } finally {
            setLoadingAvailableSubjects(false);
        }
    };

    // Handle selecting a new subject
    const handleSelectNewSubject = async (subject: RegisterSubject) => {
        setSelectedNewSubject(subject);
        setLoadingProfessorsForSubject(true);
        setProfessorsForSubject([]);

        try {
            // Pass yearId to filter professors exactly like Odoo school_subject.py
            const professors = await loadProfessorsForSubject(subject.id, section?.yearId);
            setProfessorsForSubject(professors);
        } catch (error) {
            if (__DEV__) console.error('Error loading professors for subject:', error);
            setProfessorsForSubject([]);
        } finally {
            setLoadingProfessorsForSubject(false);
        }
    };

    // Handle adding new subject to pending (not immediate)
    const handleCreateSubject = (professorId: number) => {
        if (!selectedNewSubject) return;

        const professor = professorsForSubject.find((p) => p.professorId === professorId);

        // Add to pending adds
        setPendingSubjectAdds((prev) => [
            ...prev,
            {
                registerSubjectId: selectedNewSubject.id,
                registerSubjectName: selectedNewSubject.name,
                professorId,
                professorName: professor?.professorName || 'Sin asignar',
            },
        ]);

        // Remove from available list
        setAvailableSubjects((prev) => prev.filter((s) => s.id !== selectedNewSubject.id));

        // Reset add mode
        setIsAddingSubject(false);
        setSelectedNewSubject(null);
        setProfessorsForSubject([]);
    };

    // Cancel add mode
    const handleCancelAddSubject = () => {
        setIsAddingSubject(false);
        setSelectedNewSubject(null);
        setAvailableSubjects([]);
        setProfessorsForSubject([]);
    };

    // Check if there are pending subject changes
    const hasSubjectChanges = pendingSubjectDeletions.size > 0 || pendingSubjectEdits.size > 0 || pendingSubjectAdds.length > 0;

    // Save all pending subject changes
    const handleSaveSubjectChanges = async () => {
        if (!section) return;

        const serverHealth = await authService.checkServerHealth();
        if (!serverHealth.ok) {
            showAlert('Sin conexión', 'No se puede guardar sin conexión.');
            return;
        }

        setSavingSubjects(true);
        let hasErrors = false;

        try {
            // Process pending adds
            for (const add of pendingSubjectAdds) {
                const result = await createSectionSubject(section.id, add.registerSubjectId, add.professorId);
                if (!result.success) {
                    showAlert('Error', result.message || `Error al agregar ${add.registerSubjectName}`);
                    hasErrors = true;
                } else if (result.data) {
                    // Add to local state
                    const newSubject: SubjectWithProfessor = {
                        subjectId: result.data,
                        registerSubjectId: add.registerSubjectId,
                        subjectName: add.registerSubjectName,
                        professorId: add.professorId,
                        professorName: add.professorName,
                    };
                    setSubjectsData((prev) => [...prev, newSubject]);
                }
            }

            // Process pending professor edits
            for (const [subjectId, edit] of pendingSubjectEdits) {
                const result = await updateSubjectProfessor(subjectId, edit.newProfessorId);
                if (!result.success) {
                    showAlert('Error', result.message || `Error al actualizar materia`);
                    hasErrors = true;
                }
            }

            // Process pending deletions
            for (const subjectId of pendingSubjectDeletions) {
                const result = await deleteSectionSubject(subjectId);
                if (!result.success) {
                    showAlert('Error', result.message || `Error al eliminar materia`);
                    hasErrors = true;
                } else {
                    setSubjectsData((prev) => prev.filter((s) => s.subjectId !== subjectId));
                }
            }

            if (!hasErrors) {
                showAlert('Éxito', 'Cambios guardados correctamente');
            }

            // Clear pending changes
            setPendingSubjectDeletions(new Set());
            setPendingSubjectEdits(new Map());
            setPendingSubjectAdds([]);
        } catch (error: any) {
            showAlert('Error', error.message || 'Error inesperado');
        } finally {
            setSavingSubjects(false);
        }
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

    const renderStudentsTab = () => (
        <View style={styles.tabContent}>
            {/* Table Container */}
            <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Estudiante</Text>
                    <View style={styles.stateBadge}>
                        <Text style={[styles.tableHeaderText, { textAlign: 'center' }]}>Estado</Text>
                    </View>
                </View>

                {/* Table Body */}
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
                    <View style={styles.tableBody}>
                        <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
                            {studentsData.map((student, index) => (
                                <StudentRow key={student.studentId} name={student.studentName} state={student.state} index={index} />
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );

    const renderSubjectsTab = () => (
        <View style={styles.tabContent}>
            {/* Add Subject Mode */}
            {isAddingSubject ? (
                <View style={styles.addSubjectContainer}>
                    {/* Header */}
                    <View style={styles.addSubjectHeader}>
                        <Text style={styles.addSubjectTitle}>
                            {selectedNewSubject ? 'Seleccionar Profesor' : 'Seleccionar Materia'}
                        </Text>
                        <TouchableOpacity onPress={handleCancelAddSubject} activeOpacity={0.7}>
                            <Ionicons name="close-circle" size={24} color={Colors.textTertiary} />
                        </TouchableOpacity>
                    </View>

                    {/* Step 1: Select Subject */}
                    {!selectedNewSubject && (
                        <View style={styles.addSubjectList}>
                            {loadingAvailableSubjects ? (
                                <View style={styles.loadingPlaceholder}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.infoText}>Cargando materias...</Text>
                                </View>
                            ) : availableSubjects.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="checkmark-circle" size={40} color={Colors.success} />
                                    <Text style={styles.emptyText}>Todas las materias están asignadas</Text>
                                </View>
                            ) : (
                                <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled>
                                    {availableSubjects.map((subject) => (
                                        <TouchableOpacity
                                            key={subject.id}
                                            style={styles.addSubjectItem}
                                            onPress={() => handleSelectNewSubject(subject)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="book" size={18} color={Colors.primary} />
                                            <Text style={styles.addSubjectItemText}>{subject.name}</Text>
                                            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}

                    {/* Step 2: Select Professor */}
                    {selectedNewSubject && (
                        <View style={styles.addSubjectList}>
                            <View style={styles.selectedSubjectBadge}>
                                <Ionicons name="book" size={16} color={Colors.primary} />
                                <Text style={styles.selectedSubjectText}>{selectedNewSubject.name}</Text>
                            </View>

                            {loadingProfessorsForSubject ? (
                                <View style={styles.loadingPlaceholder}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.infoText}>Cargando profesores...</Text>
                                </View>
                            ) : professorsForSubject.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="person-outline" size={40} color={Colors.textTertiary} />
                                    <Text style={styles.emptyText}>No hay profesores disponibles</Text>
                                </View>
                            ) : (
                                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                                    {professorsForSubject.map((professor: ProfessorForSection) => (
                                        <TouchableOpacity
                                            key={professor.professorId}
                                            style={styles.addSubjectItem}
                                            onPress={() => handleCreateSubject(professor.professorId)}
                                            disabled={creatingSubject}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="person" size={18} color={Colors.secondary} />
                                            <Text style={styles.addSubjectItemText}>{professor.professorName}</Text>
                                            {creatingSubject ? (
                                                <ActivityIndicator size="small" color={Colors.primary} />
                                            ) : (
                                                <Ionicons name="add-circle" size={20} color={Colors.success} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}
                </View>
            ) : (
                <>
                    {/* Table Container */}
                    <View style={styles.tableContainer}>
                        {/* Table Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Materia</Text>
                            <View style={styles.professorHeaderCell}>
                                <Text style={styles.tableHeaderText}>Profesor</Text>
                            </View>
                            <View style={styles.deleteHeaderCell}>
                                <Text style={styles.tableHeaderText}></Text>
                            </View>
                        </View>

                        {/* Table Body */}
                        {loadingSubjects ? (
                            <View style={styles.loadingPlaceholder}>
                                <ActivityIndicator size="large" color={Colors.primary} />
                                <Text style={styles.infoText}>Cargando materias...</Text>
                            </View>
                        ) : subjectsData.length === 0 && pendingSubjectAdds.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="book-outline" size={40} color={Colors.textTertiary} />
                                <Text style={styles.emptyText}>No hay materias asignadas</Text>
                            </View>
                        ) : (
                            <View style={styles.tableBody}>
                                <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
                                    {/* Existing subjects */}
                                    {subjectsData.map((subject, index) => (
                                        <SubjectRow
                                            key={subject.subjectId}
                                            subjectId={subject.subjectId}
                                            subjectName={subject.subjectName}
                                            professorName={subject.professorName}
                                            index={index}
                                            onEdit={handleEditSubject}
                                            onDelete={handleToggleDeleteSubject}
                                            isPendingDelete={pendingSubjectDeletions.has(subject.subjectId)}
                                            disabled={isLoading || savingSubjects}
                                        />
                                    ))}
                                    {/* Pending adds - shown with green indicator */}
                                    {pendingSubjectAdds.map((add, index) => (
                                        <View
                                            key={`pending-${add.registerSubjectId}`}
                                            style={[
                                                styles.tableRow,
                                                (subjectsData.length + index) % 2 === 0 && styles.tableRowAlt,
                                                styles.tableRowPendingAdd
                                            ]}
                                        >
                                            <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{add.registerSubjectName}</Text>
                                            <View style={styles.professorBadge}>
                                                <Text style={styles.professorBadgeText} numberOfLines={1}>{add.professorName}</Text>
                                            </View>
                                            <TouchableOpacity
                                                style={styles.deleteSubjectBtn}
                                                onPress={() => {
                                                    setPendingSubjectAdds((prev) => prev.filter((p) => p.registerSubjectId !== add.registerSubjectId));
                                                    // Re-add to available subjects
                                                    setAvailableSubjects((prev) => [...prev, { id: add.registerSubjectId, name: add.registerSubjectName }]);
                                                }}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Edit Subject Mode */}
                    {editingSubject && (
                        <View style={styles.addSubjectContainer}>
                            <View style={styles.addSubjectHeader}>
                                <Text style={styles.addSubjectTitle}>Cambiar Profesor</Text>
                                <TouchableOpacity onPress={handleCancelEditSubject} activeOpacity={0.7}>
                                    <Ionicons name="close-circle" size={24} color={Colors.textTertiary} />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.selectedSubjectBadge}>
                                <Ionicons name="book" size={16} color={Colors.primary} />
                                <Text style={styles.selectedSubjectText}>{editingSubject.subjectName}</Text>
                            </View>
                            {loadingProfessorsForSubject ? (
                                <View style={styles.loadingPlaceholder}>
                                    <ActivityIndicator size="large" color={Colors.primary} />
                                    <Text style={styles.infoText}>Cargando profesores...</Text>
                                </View>
                            ) : professorsForSubject.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <Ionicons name="person-outline" size={40} color={Colors.textTertiary} />
                                    <Text style={styles.emptyText}>No hay profesores disponibles</Text>
                                </View>
                            ) : (
                                <ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
                                    {professorsForSubject.map((professor) => (
                                        <TouchableOpacity
                                            key={professor.professorId}
                                            style={[
                                                styles.addSubjectItem,
                                                editingSubject.professorId === professor.professorId && styles.addSubjectItemSelected
                                            ]}
                                            onPress={() => handleSelectProfessorForEdit(professor.professorId, professor.professorName)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons name="person" size={18} color={Colors.secondary} />
                                            <Text style={styles.addSubjectItemText}>{professor.professorName}</Text>
                                            {editingSubject.professorId === professor.professorId && (
                                                <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            )}
                        </View>
                    )}

                    {/* Add Subject Button */}
                    {!editingSubject && (
                        <TouchableOpacity
                            style={styles.addSubjectButton}
                            onPress={handleStartAddSubject}
                            disabled={isLoading || savingSubjects}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="add-circle" size={20} color={Colors.primary} />
                            <Text style={styles.addSubjectButtonText}>Agregar Materia</Text>
                        </TouchableOpacity>
                    )}

                </>
            )}
        </View>
    );

    const renderProfessorsTab = () => (
        <View style={styles.tabContent}>
            {/* Table Container */}
            <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                    <View style={styles.checkboxCell}>
                        <Text style={styles.tableHeaderText}></Text>
                    </View>
                    <Text style={[styles.tableHeaderText, { flex: 1 }]}>Docente</Text>
                </View>

                {/* Table Body */}
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
                    <View style={styles.tableBody}>
                        <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
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
                    </View>
                )}
            </View>

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
                <View style={{ flex: 1, backgroundColor: '#fff', paddingBottom: insets.bottom }}>
                    <View style={styles.container}>
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
                                <Ionicons name="close-circle" size={28} color={Colors.error} />
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
                        {(hasChanges || (hasSubjectChanges && !editingSubject)) && (
                            <View style={styles.footer}>
                                {isLoading || savingSubjects ? (
                                    <View style={styles.saveBtn}>
                                        <ActivityIndicator size="small" color="#fff" />
                                    </View>
                                ) : (
                                    <TouchableOpacity
                                        onPress={hasSubjectChanges ? handleSaveSubjectChanges : handleSave}
                                        style={styles.saveBtn}
                                        activeOpacity={0.8}
                                    >
                                        <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                                        <Text style={styles.saveBtnLabel}>Guardar Cambios</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}
                    </View>
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
    tableContainer: {
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.border,
        backgroundColor: '#fff',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
            }
        }),
    },
    tableHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f1f5f9',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tableHeaderText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    tableBody: {
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
    professorHeaderCell: {
        width: 140,
        alignItems: 'flex-start',
    },
    professorDropdown: {
        width: 140,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    professorDropdownText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textPrimary,
        flex: 1,
    },
    professorDropdownList: {
        position: 'absolute',
        top: '100%',
        right: 16,
        width: 200,
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        marginTop: 4,
        zIndex: 100,
        maxHeight: 200,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    professorDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    professorDropdownItemText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textPrimary,
        flex: 1,
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
    // Delete subject button
    deleteSubjectBtn: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    deleteHeaderCell: {
        width: 44,
    },
    // Add subject button
    addSubjectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        backgroundColor: Colors.primary + '10',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
        borderStyle: 'dashed',
        gap: 8,
    },
    addSubjectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    // Add subject mode
    addSubjectContainer: {
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: 16,
    },
    addSubjectHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    addSubjectTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    addSubjectList: {
        minHeight: 100,
    },
    addSubjectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 14,
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        marginBottom: 8,
        gap: 12,
    },
    addSubjectItemText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    selectedSubjectBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary + '15',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        marginBottom: 12,
        gap: 8,
    },
    selectedSubjectText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    // Pending delete row style
    tableRowPendingDelete: {
        backgroundColor: Colors.error + '10',
        opacity: 0.7,
    },
    // Pending add row style
    tableRowPendingAdd: {
        backgroundColor: Colors.success + '10',
        borderLeftWidth: 3,
        borderLeftColor: Colors.success,
    },
    // Professor badge
    professorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 6,
        width: 140,
    },
    professorBadgeText: {
        fontSize: 13,
        fontWeight: '500',
        color: Colors.textPrimary,
        flex: 1,
    },
    // Selected item style
    addSubjectItemSelected: {
        backgroundColor: Colors.primary + '15',
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    // Save subjects button
    saveSubjectsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 20,
        gap: 8,
        marginTop: 8,
    },
    saveSubjectsButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
});
