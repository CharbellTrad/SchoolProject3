import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';
import { EnrolledSection, loadProfessorsForSection, loadStudentsForSection, loadSubjectsForSection, ProfessorForSection, SECTION_TYPE_COLORS, SECTION_TYPE_LABELS, StudentForSection, SubjectWithProfessor } from '../../services-odoo/enrolledSectionService';

interface ViewEnrolledSectionModalProps {
    visible: boolean;
    section: EnrolledSection | null;
    onClose: () => void;
    onEdit: () => void;
    isOfflineMode?: boolean;
}

type TabKey = 'students' | 'subjects' | 'professors' | 'performance';

interface TabConfig {
    key: TabKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

// Table Row Component for Students
const StudentRow = ({ name, state, index }: { name: string; state?: string; index: number }) => {
    const stateColors: Record<string, { bg: string; text: string; label: string }> = {
        draft: { bg: Colors.info + '20', text: Colors.info, label: 'Inscrito' },
        done: { bg: Colors.success + '20', text: Colors.success, label: 'Aprobado' },
        cancel: { bg: Colors.error + '20', text: Colors.error, label: 'Cancelado' },
    };
    const stateStyle = stateColors[state || 'draft'] || stateColors.draft;

    return (
        <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
            <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>{name}</Text>
            <View style={styles.stateBadge}>
                <View style={[styles.stateBadgeInner, { backgroundColor: stateStyle.bg }]}>
                    <Text style={[styles.stateBadgeText, { color: stateStyle.text }]}>{stateStyle.label}</Text>
                </View>
            </View>
        </View>
    );
};

// Table Row Component for Subjects with Professor
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

// Table Row Component for Professors
const ProfessorRow = ({ name, index }: { name: string; index: number }) => (
    <View style={[styles.tableRow, index % 2 === 0 && styles.tableRowAlt]}>
        <Ionicons name="person" size={18} color={Colors.secondary} style={{ marginRight: 10 }} />
        <Text style={styles.tableCell} numberOfLines={1}>{name}</Text>
    </View>
);

export const ViewEnrolledSectionModal: React.FC<ViewEnrolledSectionModalProps> = ({
    visible,
    section,
    onClose,
    onEdit,
    isOfflineMode = false,
}) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['90%'], []);
    const [activeTab, setActiveTab] = useState<TabKey>('students');
    const [subjectsData, setSubjectsData] = useState<SubjectWithProfessor[]>([]);
    const [studentsData, setStudentsData] = useState<StudentForSection[]>([]);
    const [professorsData, setProfessorsData] = useState<ProfessorForSection[]>([]);
    const [loadingSubjects, setLoadingSubjects] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
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

        // Performance tab for primary and secundary only
        if (section.type !== 'pre') {
            baseTabs.push({ key: 'performance', label: 'Rendimiento', icon: 'stats-chart' });
        }

        return baseTabs;
    }, [section?.type]);

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
            setActiveTab('students');
        } else {
            bottomSheetRef.current?.dismiss();
            setSubjectsData([]);
            setStudentsData([]);
        }
    }, [visible]);

    // Load students for section
    useEffect(() => {
        const loadStudents = async () => {
            if (!visible || !section) return;

            setLoadingStudents(true);
            try {
                const students = await loadStudentsForSection(section.id);
                setStudentsData(students);
            } catch (error) {
                if (__DEV__) {
                    console.error('Error loading students:', error);
                }
            } finally {
                setLoadingStudents(false);
            }
        };

        loadStudents();
    }, [visible, section?.id]);

    // Load subjects with professors for secundary sections
    useEffect(() => {
        const loadSubjects = async () => {
            if (!visible || !section || section.type !== 'secundary') return;

            setLoadingSubjects(true);
            try {
                const subjects = await loadSubjectsForSection(section.id);
                setSubjectsData(subjects);
            } catch (error) {
                if (__DEV__) {
                    console.error('Error loading subjects:', error);
                }
            } finally {
                setLoadingSubjects(false);
            }
        };

        loadSubjects();
    }, [visible, section?.id, section?.type]);

    // Load professors for pre/primary sections
    useEffect(() => {
        const loadProfessors = async () => {
            if (!visible || !section || section.type === 'secundary') return;

            setLoadingProfessors(true);
            try {
                const professors = await loadProfessorsForSection(section.id);
                setProfessorsData(professors);
            } catch (error) {
                if (__DEV__) {
                    console.error('Error loading professors:', error);
                }
            } finally {
                setLoadingProfessors(false);
            }
        };

        loadProfessors();
    }, [visible, section?.id, section?.type]);

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

    const renderStudentsTab = () => (
        <View style={styles.tabContent}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Estudiante</Text>
                <View style={styles.stateBadge}>
                    <Text style={styles.tableHeaderText}>Estado</Text>
                </View>
            </View>

            {/* Table Content */}
            {loadingStudents ? (
                <View style={styles.loadingPlaceholder}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.infoText}>Cargando estudiantes...</Text>
                </View>
            ) : section.studentsCount === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No hay estudiantes inscritos</Text>
                </View>
            ) : studentsData.length > 0 ? (
                <ScrollView style={styles.tableBody} nestedScrollEnabled>
                    {studentsData.map((student, index) => (
                        <StudentRow
                            key={student.studentId}
                            name={student.studentName}
                            state={student.state}
                            index={index}
                        />
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No se encontraron estudiantes</Text>
                </View>
            )}
        </View>
    );

    const renderSubjectsTab = () => (
        <View style={styles.tabContent}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Materia</Text>
                <View style={styles.professorCell}>
                    <Text style={styles.tableHeaderText}>Profesor</Text>
                </View>
            </View>

            {/* Table Content */}
            {loadingSubjects ? (
                <View style={styles.loadingPlaceholder}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.infoText}>Cargando materias...</Text>
                </View>
            ) : section.subjectsCount === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No hay materias asignadas</Text>
                </View>
            ) : subjectsData.length > 0 ? (
                <ScrollView style={styles.tableBody} nestedScrollEnabled>
                    {subjectsData.map((subject, index) => (
                        <SubjectRow
                            key={subject.subjectId}
                            subjectName={subject.subjectName}
                            professorName={subject.professorName}
                            index={index}
                        />
                    ))}
                </ScrollView>
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="book-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No se encontraron materias</Text>
                </View>
            )}
        </View>
    );

    const renderProfessorsTab = () => (
        <View style={styles.tabContent}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderText}>Docente</Text>
            </View>

            {/* Table Content */}
            {loadingProfessors ? (
                <View style={styles.loadingPlaceholder}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.infoText}>Cargando docentes...</Text>
                </View>
            ) : professorsData.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="person-outline" size={40} color={Colors.textTertiary} />
                    <Text style={styles.emptyText}>No hay docentes asignados</Text>
                </View>
            ) : (
                <ScrollView style={styles.tableBody} nestedScrollEnabled>
                    {professorsData.map((professor, index) => (
                        <ProfessorRow
                            key={professor.professorId}
                            name={professor.professorName}
                            index={index}
                        />
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const renderPerformanceTab = () => {
        const studentsAvg = section.studentsAverageJson;
        const subjectsAvg = section.subjectsAverageJson;
        const topStudents = section.topStudentsJson?.top_students || [];

        return (
            <View style={styles.tabContent}>
                {/* Promedios de Materias (only secundary) */}
                {section.type === 'secundary' && subjectsAvg && (
                    <View style={styles.performanceSection}>
                        <Text style={styles.performanceTitle}>Promedios de Materias</Text>
                        <View style={styles.performanceCard}>
                            <Text style={styles.avgLabel}>Promedio General</Text>
                            <Text style={styles.avgValue}>{subjectsAvg.general_average.toFixed(2)}</Text>
                        </View>
                    </View>
                )}

                {/* Promedios de Estudiantes (primary/secundary) */}
                {studentsAvg && (
                    <View style={styles.performanceSection}>
                        <Text style={styles.performanceTitle}>Promedios de Estudiantes</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.performanceCard}>
                                <Text style={styles.avgLabel}>Promedio</Text>
                                <Text style={styles.avgValue}>{studentsAvg.general_average.toFixed(2)}</Text>
                            </View>
                            <View style={[styles.performanceCard, { backgroundColor: Colors.success + '10' }]}>
                                <Text style={styles.avgLabel}>Aprobados</Text>
                                <Text style={[styles.avgValue, { color: Colors.success }]}>{studentsAvg.approved_students}</Text>
                            </View>
                            <View style={[styles.performanceCard, { backgroundColor: Colors.error + '10' }]}>
                                <Text style={styles.avgLabel}>Reprobados</Text>
                                <Text style={[styles.avgValue, { color: Colors.error }]}>{studentsAvg.failed_students}</Text>
                            </View>
                        </View>
                    </View>
                )}

                {/* Top 5 Estudiantes */}
                {topStudents.length > 0 && (
                    <View style={styles.performanceSection}>
                        <Text style={styles.performanceTitle}>Top 5 Estudiantes</Text>
                        {topStudents.slice(0, 5).map((student, index) => (
                            <View key={student.student_id} style={styles.topStudentRow}>
                                <View style={styles.rankBadge}>
                                    <Text style={styles.rankText}>#{index + 1}</Text>
                                </View>
                                <Text style={styles.topStudentName} numberOfLines={1}>{student.student_name}</Text>
                                <Text style={styles.topStudentAvg}>
                                    {student.use_literal ? student.literal_average : student.average.toFixed(2)}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* No data state */}
                {!studentsAvg && !subjectsAvg && topStudents.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="stats-chart-outline" size={40} color={Colors.textTertiary} />
                        <Text style={styles.emptyText}>No hay datos de rendimiento disponibles</Text>
                    </View>
                )}
            </View>
        );
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'students':
                return renderStudentsTab();
            case 'subjects':
                return renderSubjectsTab();
            case 'professors':
                return renderProfessorsTab();
            case 'performance':
                return renderPerformanceTab();
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
                                <Ionicons name="folder" size={22} color={typeColor} />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerTitle} numberOfLines={1}>{section.sectionName}</Text>
                                <View style={styles.headerMeta}>
                                    <View style={[styles.typeBadge, { backgroundColor: typeColor + '20' }]}>
                                        <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
                                    </View>
                                    <Text style={styles.yearText}>{section.yearName}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <Ionicons name="close-circle" size={28} color={Colors.error} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabBar}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                                onPress={() => setActiveTab(tab.key)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={tab.icon}
                                    size={18}
                                    color={activeTab === tab.key ? Colors.primary : Colors.textSecondary}
                                />
                                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Body */}
                    <BottomSheetScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.bodyContent}
                    >
                        {renderActiveTab()}
                    </BottomSheetScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={onEdit}
                            style={[styles.editBtn, isOfflineMode && styles.btnDisabled]}
                            activeOpacity={0.8}
                            disabled={isOfflineMode}
                        >
                            <Ionicons name="create-outline" size={20} color={isOfflineMode ? '#9ca3af' : '#fff'} />
                            <Text style={[styles.editBtnLabel, isOfflineMode && { color: '#9ca3af' }]}>
                                Editar Sección
                            </Text>
                        </TouchableOpacity>
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
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    yearText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingHorizontal: 10,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: Colors.primary,
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    tabLabelActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    bodyContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    tabContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        overflow: 'hidden',
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
        backgroundColor: '#f1f5f9',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tableHeaderText: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    tableBody: {
        maxHeight: 300,
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
    tableCell: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textPrimary,
        flex: 1,
    },
    stateBadge: {
        width: 90,
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
    loadingPlaceholder: {
        padding: 20,
        alignItems: 'center',
        gap: 16,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    statBox: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    infoText: {
        fontSize: 13,
        color: Colors.textTertiary,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    performanceSection: {
        marginBottom: 20,
    },
    performanceTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    performanceCard: {
        flex: 1,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 4,
    },
    avgLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
    },
    avgValue: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    topStudentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#f1f5f9',
    },
    rankBadge: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    rankText: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.primary,
    },
    topStudentName: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    topStudentAvg: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.primary,
    },
    footer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: '#f8fafc',
    },
    editBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 20,
        gap: 8,
    },
    btnDisabled: {
        backgroundColor: '#e2e8f0',
    },
    editBtnLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
        letterSpacing: 0.1,
    },
});
