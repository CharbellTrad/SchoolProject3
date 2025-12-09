/**
 * TecnicoMedioTab - Tab 3: Técnico Medio
 * Matches Odoo structure exactly:
 * - Configuración de Evaluación
 * - Estadísticas (Total Estudiantes, Aprobados, Secciones Activas)
 * - Estudiantes con Mención Inscrita (student_id, section_id, mention_id, mention_state)
 * - Rendimiento de Técnico Medio
 * - Top 3 Estudiantes por Sección
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, StudentPreview } from '../../../services-odoo/dashboardService';
import { RingGauge } from '../charts';
import { Card, Empty, InfoNote, ListRow, RankBadge, Separator, StatCard, StudentAvatar } from '../ui';

interface Props {
    data: DashboardData | null;
}

export const TecnicoMedioTab: React.FC<Props> = ({ data: d }) => {
    const students = d?.studentsByLevel.tecnicoCount ?? 0;
    const approved = d?.approvedByLevel.tecnicoCount ?? 0;
    const sections = d?.sectionsByLevel.secundaryCount ?? 0;
    const approvalPct = students > 0 ? (approved / students) * 100 : 0;
    const levelDashboard = d?.secundaryTecnicoDashboard; // Use Técnico Medio specific dashboard

    return (
        <>
            {/* Configuración de Evaluación */}
            <Separator title="Configuración de Evaluación" />
            <Card>
                {d?.evaluationConfigs.secundary ? (
                    <View style={styles.configRow}>
                        <Ionicons name="checkmark-circle" size={20} color={Colors.warning} />
                        <Text style={styles.configText}>{d.evaluationConfigs.secundary.name}</Text>
                    </View>
                ) : (
                    <Text style={styles.configEmpty}>Sin configuración (usa Media General)</Text>
                )}
            </Card>

            {/* Estadísticas */}
            <View style={styles.statsRow}>
                <StatCard value={students} label="Total Estudiantes" color={Colors.primary} />
                <StatCard value={approved} label="Aprobados" color={Colors.success} />
                <StatCard value={sections} label="Secciones Activas" color={Colors.warning} />
            </View>

            {/* Estudiantes con Mención Inscrita */}
            <Separator title="Estudiantes con Mención Inscrita" />
            <Card>
                {d?.tecnicoStudentPreviews?.length ? (
                    d.tecnicoStudentPreviews.map((st: StudentPreview, i) => (
                        <ListRow key={i}>
                            <StudentAvatar name={st.studentName} color={Colors.warning} />
                            <View style={styles.studentInfo}>
                                <Text style={styles.studentName}>{st.studentName}</Text>
                                <Text style={styles.studentMeta}>{st.sectionName}</Text>
                            </View>
                            <View style={styles.mentionCol}>
                                <Text style={styles.mentionName}>{st.mentionName || 'Mención'}</Text>
                                <View style={[styles.stateBadge, st.mentionState === 'enrolled' && styles.stateBadgeSuccess]}>
                                    <Text style={[styles.stateText, st.mentionState === 'enrolled' && styles.stateTextSuccess]}>
                                        {st.mentionState === 'enrolled' ? 'Inscrito' : 'Pendiente'}
                                    </Text>
                                </View>
                            </View>
                        </ListRow>
                    ))
                ) : <Empty message="Sin estudiantes de Técnico Medio" />}
            </Card>

            {/* Rendimiento de Técnico Medio */}
            <Separator title="Rendimiento de Técnico Medio" />
            <Card>
                <View style={styles.perfSection}>
                    <RingGauge percentage={approvalPct} color={Colors.warning} gradientColor="#d97706" label="Aprobación" size={120} />
                    <View style={styles.perfLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                            <Text style={styles.legendText}>{approved} Aprobados</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                            <Text style={styles.legendText}>{students - approved} Reprobados</Text>
                        </View>
                    </View>
                </View>
            </Card>

            {/* Top 3 Estudiantes por Sección */}
            <Separator title="Top 3 Estudiantes por Sección" />
            <Card>
                {levelDashboard?.top_students_by_section?.length ? (
                    levelDashboard.top_students_by_section.map((sec, i) => (
                        <View key={i} style={styles.topSection}>
                            <Text style={[styles.topSectionTitle, { color: Colors.warning }]}>{sec.section_name}</Text>
                            {sec.top_3.map((st, j) => (
                                <ListRow key={j} borderBottom={j < sec.top_3.length - 1}>
                                    <RankBadge rank={j + 1} />
                                    <Text style={styles.topStudentName}>{st.student_name}</Text>
                                    <Text style={styles.topStudentAvg}>{st.average}</Text>
                                </ListRow>
                            ))}
                        </View>
                    ))
                ) : d?.tecnicoStudentPreviews?.length ? (
                    <InfoNote message="Los datos de Top 3 por sección se calculan automáticamente cuando hay evaluaciones registradas." />
                ) : <Empty />}
            </Card>
        </>
    );
};

const styles = StyleSheet.create({
    configRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    configText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    configEmpty: { fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic' },
    statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },

    // Students
    studentInfo: { flex: 1, marginLeft: 12 },
    studentName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    studentMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    mentionCol: { alignItems: 'flex-end' },
    mentionName: { fontSize: 11, color: Colors.textSecondary, marginBottom: 4 },
    stateBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.backgroundSecondary },
    stateBadgeSuccess: { backgroundColor: Colors.success + '15' },
    stateText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
    stateTextSuccess: { color: Colors.success },

    // Performance
    perfSection: { alignItems: 'center' },
    perfLegend: { flexDirection: 'row', gap: 24, marginTop: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: Colors.textSecondary },

    // Top Section
    topSection: { marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    topSectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    topStudentName: { flex: 1, fontSize: 13, color: Colors.textPrimary, marginLeft: 12 },
    topStudentAvg: { fontSize: 13, fontWeight: '700', color: Colors.success },
});

export default TecnicoMedioTab;
