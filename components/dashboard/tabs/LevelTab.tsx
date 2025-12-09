/**
 * LevelTab - Generic tab for Media General, Primaria, Preescolar
 * Matches Odoo structure exactly:
 * - Configuración de Evaluación
 * - Estadísticas (Total Estudiantes, Aprobados, Secciones Activas)
 * - Secciones de [Nivel] (lista con badges)
 * - Rendimiento de [Nivel] (performance graph)
 * - Top 3 Estudiantes por Sección (level_dashboard)
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, SectionPreview } from '../../../services-odoo/dashboardService';
import { RingGauge } from '../charts';
import { Badge, Card, Empty, InfoNote, ListRow, RankBadge, Separator, StatCard } from '../ui';

interface Props {
    level: 'secundary' | 'primary' | 'pre';
    levelName: string;
    data: DashboardData | null;
    color: string;
}

export const LevelTab: React.FC<Props> = ({ level, levelName, data: d, color }) => {
    // Get level-specific data
    const students = level === 'secundary' ? d?.studentsByLevel.secundaryCount
        : level === 'primary' ? d?.studentsByLevel.primaryCount
            : d?.studentsByLevel.preCount;
    const approved = level === 'secundary' ? d?.approvedByLevel.secundaryCount
        : level === 'primary' ? d?.approvedByLevel.primaryCount
            : d?.approvedByLevel.preCount;
    const sections = level === 'secundary' ? d?.sectionsByLevel.secundaryCount
        : level === 'primary' ? d?.sectionsByLevel.primaryCount
            : d?.sectionsByLevel.preCount;
    const evalConfig = level === 'secundary' ? d?.evaluationConfigs.secundary
        : level === 'primary' ? d?.evaluationConfigs.primary
            : d?.evaluationConfigs.pre;
    const perf = level === 'secundary' ? d?.secundaryPerformance
        : level === 'primary' ? d?.primaryPerformance
            : d?.prePerformance;
    const sectionPreviews = d?.sectionPreviews?.[level] || [];
    const levelDashboard = level === 'secundary' ? d?.secundaryGeneralDashboard
        : level === 'primary' ? d?.primaryDashboard
            : d?.preDashboard;

    const approvalPct = students && students > 0 ? ((approved || 0) / students) * 100 : 0;
    const showSubjects = level !== 'pre'; // Preescolar no tiene materias

    return (
        <>
            {/* Configuración de Evaluación */}
            <Separator title="Configuración de Evaluación" />
            <Card>
                {evalConfig ? (
                    <View style={styles.configRow}>
                        <Ionicons name="checkmark-circle" size={20} color={color} />
                        <Text style={styles.configText}>{evalConfig.name}</Text>
                    </View>
                ) : (
                    <Text style={styles.configEmpty}>Sin configuración de evaluación</Text>
                )}
            </Card>

            {/* Estadísticas */}
            <View style={styles.statsRow}>
                <StatCard value={students ?? 0} label="Total Estudiantes" color={Colors.primary} />
                <StatCard value={approved ?? 0} label="Aprobados" color={Colors.success} />
                <StatCard value={sections ?? 0} label="Secciones Activas" color={color} />
            </View>

            {/* Secciones de [Nivel] */}
            <Separator title={`Secciones de ${levelName}`} />
            <Card>
                {sectionPreviews.length > 0 ? (
                    sectionPreviews.map((sec: SectionPreview, i) => (
                        <ListRow key={i}>
                            <Text style={styles.sectionName}>{sec.sectionName}</Text>
                            <View style={styles.badgesRow}>
                                <Badge value={sec.studentsCount} color={Colors.primary} icon="people" />
                                {showSubjects && <Badge value={sec.subjectsCount} color={Colors.success} icon="book" />}
                                <Badge value={sec.professorsCount} color={color} icon="person" />
                            </View>
                        </ListRow>
                    ))
                ) : <Empty message="Sin secciones registradas" />}
            </Card>

            {/* Rendimiento de [Nivel] */}
            <Separator title={`Rendimiento de ${levelName}`} />
            <Card>
                {perf ? (
                    <View style={styles.perfSection}>
                        <RingGauge percentage={approvalPct} color={color} label="Aprobación" size={120} />
                        <View style={styles.perfStats}>
                            <View style={styles.perfItem}>
                                <Text style={styles.perfValue}>{perf.total_subjects}</Text>
                                <Text style={styles.perfLabel}>Materias</Text>
                            </View>
                            <View style={styles.perfItem}>
                                <Text style={[styles.perfValue, { color: Colors.success }]}>{perf.subjects_approved}</Text>
                                <Text style={styles.perfLabel}>Aprobadas</Text>
                            </View>
                            <View style={styles.perfItem}>
                                <Text style={[styles.perfValue, { color: Colors.error }]}>{perf.subjects_failed}</Text>
                                <Text style={styles.perfLabel}>Reprobadas</Text>
                            </View>
                        </View>
                    </View>
                ) : <Empty />}
            </Card>

            {/* Top 3 Estudiantes por Sección - using correct Odoo field names */}
            <Separator title="Top 3 Estudiantes por Sección" />
            <Card>
                {levelDashboard?.top_students_by_section?.length ? (
                    levelDashboard.top_students_by_section.map((sec, i) => (
                        <View key={i} style={styles.topSection}>
                            <Text style={[styles.topSectionTitle, { color }]}>{sec.section_name}</Text>
                            {sec.top_3.map((st, j) => (
                                <ListRow key={j} borderBottom={j < sec.top_3.length - 1}>
                                    <RankBadge rank={j + 1} />
                                    <Text style={styles.topStudentName}>{st.student_name}</Text>
                                    <Text style={styles.topStudentAvg}>{st.average}</Text>
                                </ListRow>
                            ))}
                        </View>
                    ))
                ) : sectionPreviews.length > 0 ? (
                    <InfoNote message="Los datos de Top 3 por sección se calculan automáticamente cuando hay evaluaciones registradas." />
                ) : <Empty />}
            </Card>
        </>
    );
};

const styles = StyleSheet.create({
    // Config
    configRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    configText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    configEmpty: { fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic' },

    // Stats
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },

    // Sections
    sectionName: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    badgesRow: { flexDirection: 'row', gap: 8 },

    // Performance
    perfSection: { alignItems: 'center' },
    perfStats: { flexDirection: 'row', gap: 24, marginTop: 16 },
    perfItem: { alignItems: 'center' },
    perfValue: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
    perfLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 4 },

    // Top Section
    topSection: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    topSectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    topStudentName: { flex: 1, fontSize: 13, color: Colors.textPrimary, marginLeft: 12 },
    topStudentAvg: { fontSize: 13, fontWeight: '700', color: Colors.success },
});

export default LevelTab;
