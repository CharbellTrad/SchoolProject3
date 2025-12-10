/**
 * TecnicoMedioTab - enhanced visual design with skeleton loading
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, StudentPreview } from '../../../services-odoo/dashboardService';
import { slideUpFadeIn } from '../animations';
import { RingGauge } from '../charts';
import {
    Card,
    ChartSkeleton,
    ConfigRowSkeleton,
    Empty,
    InfoNote,
    ListRow,
    ListRowSkeleton,
    RankBadge,
    StatCard,
    StatCardSkeleton,
    StudentAvatar
} from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
}

export const TecnicoMedioTab: React.FC<Props> = ({ data: d, loading }) => {
    const students = d?.studentsByLevel.tecnicoCount ?? 0;
    const approved = d?.approvedByLevel.tecnicoCount ?? 0;
    const sections = d?.sectionsByLevel.secundaryCount ?? 0;
    const approvalPct = students > 0 ? (approved / students) * 100 : 0;
    const levelDashboard = d?.secundaryTecnicoDashboard;
    const isLoading = loading || !d;

    // Animation for Stats Row
    const statsAnim = useRef(new Animated.Value(0)).current;
    const statsOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        slideUpFadeIn(statsAnim, statsOpacity, 300, 100).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* Configuración */}
            <Card title="Configuración" delay={0}>
                {isLoading ? (
                    <ConfigRowSkeleton />
                ) : d?.evaluationConfigs.secundary ? (
                    <View style={styles.configRow}>
                        <View style={[styles.configIcon, { backgroundColor: Colors.warning + '15' }]}>
                            <Ionicons name="construct-outline" size={20} color={Colors.warning} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.configText}>{d.evaluationConfigs.secundary.name}</Text>
                            <Text style={styles.configSub}>Sistema de evaluación técnica</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                ) : (
                    <Text style={styles.configEmpty}>Sin configuración (usa Media General)</Text>
                )}
            </Card>

            {/* Estadísticas */}
            <Animated.View style={[styles.statsRow, { transform: [{ translateY: statsAnim }], opacity: statsOpacity }]}>
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard value={students} label="Estudiantes" color={Colors.primary} />
                        <StatCard value={approved} label="Aprobados" color={Colors.success} />
                        <StatCard value={sections} label="Secciones" color={Colors.warning} />
                    </>
                )}
            </Animated.View>

            {/* Rendimiento */}
            <View style={styles.row}>
                <View style={styles.halfCol}>
                    <Card title="Rendimiento" delay={200} style={styles.fullHeight}>
                        {isLoading ? (
                            <ChartSkeleton type="ring" size={100} />
                        ) : (
                            <View style={styles.perfSection}>
                                <RingGauge percentage={approvalPct} color={Colors.warning} gradientColor="#d97706" label="Tasa" size={100} strokeWidth={12} />
                                <View style={styles.perfLegend}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
                                        <Text style={styles.legendText}>{approved} Apr.</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                                        <Text style={styles.legendText}>{students - approved} Rep.</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </Card>
                </View>

                {/* Estudiantes con Mención */}
                <View style={styles.halfCol}>
                    <Card title="Menciones" delay={300} style={styles.fullHeight}>
                        {isLoading ? (
                            <View style={styles.mentionsList}>
                                <ListRowSkeleton hasAvatar />
                                <ListRowSkeleton hasAvatar />
                                <ListRowSkeleton hasAvatar />
                            </View>
                        ) : d?.tecnicoStudentPreviews?.length ? (
                            <View style={styles.mentionsList}>
                                {d.tecnicoStudentPreviews.slice(0, 4).map((st: StudentPreview, i) => (
                                    <View key={i} style={styles.mentionRow}>
                                        <StudentAvatar name={st.studentName} color={Colors.warning} size={32} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.mentionName} numberOfLines={1}>{st.studentName}</Text>
                                            <Text style={styles.mentionLabel} numberOfLines={1}>{st.mentionName || 'Generico'}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : <Empty message="Sin estudiantes" />}
                    </Card>
                </View>
            </View>

            {/* Top 3 Estudiantes */}
            <Card title="Top 3 por Sección" delay={400}>
                {isLoading ? (
                    <>
                        <ListRowSkeleton hasAvatar hasBadge />
                        <ListRowSkeleton hasAvatar hasBadge />
                        <ListRowSkeleton hasAvatar hasBadge />
                    </>
                ) : levelDashboard?.top_students_by_section?.length ? (
                    levelDashboard.top_students_by_section.map((sec, i) => (
                        <View key={i} style={styles.topSection}>
                            <View style={styles.topSectionHeader}>
                                <View style={[styles.sectionBadge, { backgroundColor: Colors.warning + '15' }]}>
                                    <Text style={[styles.sectionBadgeText, { color: Colors.warning }]}>{sec.section_name}</Text>
                                </View>
                            </View>
                            {sec.top_3.map((st, j) => (
                                <ListRow key={j} borderBottom={j < sec.top_3.length - 1}>
                                    <RankBadge rank={j + 1} />
                                    <Text style={styles.topStudentName}>{st.student_name}</Text>
                                    <Text style={styles.topStudentAvg}>{st.average}</Text>
                                </ListRow>
                            ))}
                        </View>
                    ))
                ) : <InfoNote message="Los datos de Top 3 se calculan automáticamente." />}
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 6 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    halfCol: { flex: 1 },
    fullHeight: { flex: 1, marginBottom: 0 },

    configRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    configIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    configText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    configSub: { fontSize: 12, color: Colors.textSecondary },
    configEmpty: { fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic' },

    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },

    perfSection: { alignItems: 'center', paddingVertical: 8 },
    perfLegend: { flexDirection: 'row', gap: 16, marginTop: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: Colors.textSecondary },

    mentionsList: { gap: 12 },
    mentionRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    mentionName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
    mentionLabel: { fontSize: 10, color: Colors.textSecondary },

    topSection: { marginBottom: 20 },
    topSectionHeader: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
    sectionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    sectionBadgeText: { fontSize: 12, fontWeight: '700' },
    topStudentName: { flex: 1, fontSize: 13, color: Colors.textPrimary, marginLeft: 12 },
    topStudentAvg: { fontSize: 13, fontWeight: '700', color: Colors.success },
});

export default TecnicoMedioTab;
