/**
 * LevelTab - enhanced visual design
 * Features: Staggered animations, enhanced stats, skeleton loading
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, SectionPreview } from '../../../services-odoo/dashboardService';
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
    SectionRowSkeleton,
    StatCard,
    StatCardSkeleton
} from '../ui';

interface Props {
    level: 'secundary' | 'primary' | 'pre';
    levelName: string;
    data: DashboardData | null;
    color: string;
    loading?: boolean;
}

export const LevelTab: React.FC<Props> = ({ level, levelName, data: d, color, loading }) => {
    // Get level-specific data (same logic as before)
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
    const showSubjects = level !== 'pre';
    const isLoading = loading || !d;

    // Animation for Stats Row
    const statsAnim = useRef(new Animated.Value(0)).current;
    const statsOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        slideUpFadeIn(statsAnim, statsOpacity, 300, 100).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* Configuración de Evaluación */}
            <Card title="Configuración" delay={0}>
                {isLoading ? (
                    <ConfigRowSkeleton />
                ) : evalConfig ? (
                    <View style={styles.configRow}>
                        <View style={[styles.configIcon, { backgroundColor: color + '15' }]}>
                            <Ionicons name="settings-outline" size={20} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.configText}>{evalConfig.name}</Text>
                            <Text style={styles.configSub}>Sistema de evaluación activo</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                ) : (
                    <Text style={styles.configEmpty}>Sin configuración de evaluación</Text>
                )}
            </Card>

            {/* Estadísticas Row - Animated */}
            <Animated.View style={[styles.statsRow, { transform: [{ translateY: statsAnim }], opacity: statsOpacity }]}>
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                        <StatCardSkeleton />
                    </>
                ) : (
                    <>
                        <StatCard value={students ?? 0} label="Estudiantes" color={Colors.primary} />
                        <StatCard value={approved ?? 0} label="Aprobados" color={Colors.success} />
                        <StatCard value={sections ?? 0} label="Secciones" color={color} />
                    </>
                )}
            </Animated.View>

            {/* Rendimiento */}
            <View style={styles.row}>
                <View style={styles.halfCol}>
                    <Card title="Rendimiento" delay={200} style={styles.fullHeight}>
                        {isLoading ? (
                            <ChartSkeleton type="ring" size={100} />
                        ) : perf ? (
                            <View style={styles.perfSection}>
                                <RingGauge percentage={approvalPct} color={color} label="Tasa" size={100} strokeWidth={12} />
                                <View style={styles.perfStats}>
                                    <View style={styles.perfItem}>
                                        <Text style={[styles.perfValue, { color: Colors.success }]}>{perf.subjects_approved}</Text>
                                        <Text style={styles.perfLabel}>Apr.</Text>
                                    </View>
                                    <View style={styles.perfItem}>
                                        <Text style={[styles.perfValue, { color: Colors.error }]}>{perf.subjects_failed}</Text>
                                        <Text style={styles.perfLabel}>Rep.</Text>
                                    </View>
                                </View>
                            </View>
                        ) : <Empty />}
                    </Card>
                </View>

                {/* Secciones List */}
                <View style={styles.halfCol}>
                    <Card title={isLoading ? "Secciones" : `Secciones (${sectionPreviews.length})`} delay={300} style={styles.fullHeight}>
                        {isLoading ? (
                            <View style={styles.sectionsList}>
                                <SectionRowSkeleton />
                                <SectionRowSkeleton />
                                <SectionRowSkeleton />
                                <SectionRowSkeleton />
                            </View>
                        ) : sectionPreviews.length > 0 ? (
                            <View style={styles.sectionsList}>
                                {sectionPreviews.slice(0, 4).map((sec: SectionPreview, i) => (
                                    <View key={i} style={styles.sectionRow}>
                                        <View style={[styles.sectionDot, { backgroundColor: color }]} />
                                        <Text style={styles.sectionName} numberOfLines={1}>{sec.sectionName}</Text>
                                        <Text style={styles.sectionCount}>{sec.studentsCount}</Text>
                                    </View>
                                ))}
                                {sectionPreviews.length > 4 && (
                                    <Text style={styles.moreText}>+ {sectionPreviews.length - 4} más</Text>
                                )}
                            </View>
                        ) : <Empty message="Sin secciones" />}
                    </Card>
                </View>
            </View>

            {/* Top 3 Estudiantes por Sección */}
            <Card title="Top 3 Estudiantes por Sección" delay={400}>
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
                                <View style={[styles.sectionBadge, { backgroundColor: color + '15' }]}>
                                    <Text style={[styles.sectionBadgeText, { color }]}>{sec.section_name}</Text>
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
                ) : sectionPreviews.length > 0 ? (
                    <InfoNote message="Los datos de Top 3 se calculan automáticamente." />
                ) : <Empty />}
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 6 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    halfCol: { flex: 1 },
    fullHeight: { flex: 1, marginBottom: 0 },

    // Config
    configRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    configIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    configText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    configSub: { fontSize: 12, color: Colors.textSecondary },
    configEmpty: { fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic' },

    // Stats
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },

    // Sections List
    sectionsList: { gap: 10 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionDot: { width: 8, height: 8, borderRadius: 4 },
    sectionName: { flex: 1, fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
    sectionCount: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
    moreText: { fontSize: 11, color: Colors.textTertiary, fontStyle: 'italic', marginLeft: 16 },

    // Performance
    perfSection: { alignItems: 'center', paddingVertical: 8 },
    perfStats: { flexDirection: 'row', gap: 20, marginTop: 12 },
    perfItem: { alignItems: 'center' },
    perfValue: { fontSize: 16, fontWeight: '700' },
    perfLabel: { fontSize: 10, color: Colors.textSecondary },

    // Top Section
    topSection: { marginBottom: 20 },
    topSectionHeader: { flexDirection: 'row', marginBottom: 10, alignItems: 'center' },
    sectionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    sectionBadgeText: { fontSize: 12, fontWeight: '700' },
    topStudentName: { flex: 1, fontSize: 13, color: Colors.textPrimary, marginLeft: 12 },
    topStudentAvg: { fontSize: 13, fontWeight: '700', color: Colors.success },
});

export default LevelTab;
