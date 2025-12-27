/**
 * StudentsTab - Complete rewrite to match Odoo dashboard structure
 * 
 * Sections from Odoo (school_year_view.xml):
 * 1. Distribución de Estudiantes (by_gender, by_state)
 * 2. Rendimiento y Niveles (by_approval, by_level)
 * 3. Top 10 Mejores Promedios
 * 4. Estudiantes en Riesgo Académico
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, StudentsTabPerformer } from '../../../services-odoo/dashboardService';
import { ProgressLine } from '../charts';
import {
    Card,
    ChartSkeleton,
    Empty,
    ListRow,
    ListRowSkeleton,
    RankBadge,
    StatCard,
    StatCardSkeleton
} from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
}

// Helper to get level color
const getLevelColor = (level: string): string => {
    switch (level) {
        case 'pre': return Colors.levelPre;
        case 'primary': return Colors.levelPrimary;
        case 'secundary': return Colors.levelSecundary;
        case 'tecnico': return Colors.levelTecnico;
        default: return Colors.textSecondary;
    }
};

// Helper to get level display name
const getLevelLabel = (level: string): string => {
    switch (level) {
        case 'pre': return 'Preescolar';
        case 'primary': return 'Primaria';
        case 'secundary': return 'Media General';
        case 'tecnico': return 'Técnico Medio';
        default: return level;
    }
};

export const StudentsTab: React.FC<Props> = ({ data: d, loading }) => {
    const isLoading = loading || !d;
    const studentsData = d?.studentsTabData;

    // Calculate totals
    const totalStudents = studentsData?.total || 0;
    const maleCount = studentsData?.by_gender?.M || 0;
    const femaleCount = studentsData?.by_gender?.F || 0;
    const approvedCount = studentsData?.by_approval?.approved || 0;
    const failedCount = studentsData?.by_approval?.failed || 0;

    return (
        <View style={styles.container}>
            {/* Distribución de Estudiantes */}
            <Card title="Distribución de Estudiantes" delay={100}>
                {isLoading ? (
                    <>
                        <View style={styles.statsRow}>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </View>
                        <View style={[styles.statsRow, { marginTop: 10 }]}>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </View>
                    </>
                ) : (
                    <>
                        {/* Gender Distribution */}
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <View style={[styles.statIcon, { backgroundColor: Colors.primary + '15' }]}>
                                    <Ionicons name="male" size={20} color={Colors.primary} />
                                </View>
                                <Text style={styles.statValue}>{maleCount}</Text>
                                <Text style={styles.statLabel}>Masculino</Text>
                            </View>
                            <View style={styles.statBox}>
                                <View style={[styles.statIcon, { backgroundColor: '#ec4899' + '15' }]}>
                                    <Ionicons name="female" size={20} color="#ec4899" />
                                </View>
                                <Text style={styles.statValue}>{femaleCount}</Text>
                                <Text style={styles.statLabel}>Femenino</Text>
                            </View>
                        </View>

                        {/* By State */}
                        <View style={[styles.statsRow, { marginTop: 16 }]}>
                            <StatCard
                                value={studentsData?.by_state?.done || 0}
                                label="Confirmados"
                                color={Colors.success}
                            />
                            <StatCard
                                value={studentsData?.by_state?.draft || 0}
                                label="Borrador"
                                color={Colors.warning}
                            />
                        </View>
                    </>
                )}
            </Card>

            {/* Rendimiento y Niveles */}
            <Card title="Rendimiento y Niveles" delay={150}>
                {isLoading ? (
                    <>
                        <View style={styles.statsRow}>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </View>
                        <ChartSkeleton type="bar" height={100} />
                    </>
                ) : (
                    <>
                        {/* Approval Stats */}
                        <View style={styles.statsRow}>
                            <StatCard
                                value={approvedCount}
                                label="Aprobados"
                                color={Colors.success}
                            />
                            <StatCard
                                value={failedCount}
                                label="Reprobados"
                                color={Colors.error}
                            />
                        </View>

                        {/* By Level Distribution */}
                        {studentsData?.by_level?.length ? (
                            <View style={styles.levelDistribution}>
                                <Text style={styles.sectionSubtitle}>Distribución por Nivel</Text>
                                {studentsData.by_level.map((level, i) => (
                                    <View key={i} style={styles.levelRow}>
                                        <View style={styles.levelInfo}>
                                            <View style={[styles.levelDot, { backgroundColor: getLevelColor(level.name === 'Preescolar' ? 'pre' : level.name === 'Primaria' ? 'primary' : level.name === 'Media General' ? 'secundary' : 'tecnico') }]} />
                                            <Text style={styles.levelName}>{level.name}</Text>
                                            <Text style={styles.levelCount}>{level.count}</Text>
                                        </View>
                                        <View style={styles.levelProgress}>
                                            <ProgressLine
                                                value={totalStudents > 0 ? (level.count / totalStudents) * 100 : 0}
                                                height={8}
                                                color={getLevelColor(level.name === 'Preescolar' ? 'pre' : level.name === 'Primaria' ? 'primary' : level.name === 'Media General' ? 'secundary' : 'tecnico')}
                                                animate
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : null}
                    </>
                )}
            </Card>

            {/* Top 10 Mejores Promedios */}
            <Card title="Top 10 Mejores Promedios" delay={200}>
                {isLoading ? (
                    <>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <ListRowSkeleton key={i} hasAvatar hasBadge />
                        ))}
                    </>
                ) : studentsData?.top_performers?.length ? (
                    studentsData.top_performers.map((st: StudentsTabPerformer, i: number) => (
                        <ListRow key={i}>
                            <RankBadge rank={i + 1} />
                            <View style={styles.studentInfo}>
                                <Text style={styles.studentName}>{st.name}</Text>
                                <View style={styles.metaRow}>
                                    <Text style={styles.sectionName}>{st.section}</Text>
                                    <View style={styles.dot} />
                                    <Text style={[styles.levelBadge, { color: getLevelColor(st.level) }]}>
                                        {getLevelLabel(st.level)}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.scoreBox, {
                                backgroundColor: ((typeof st.average === 'number' && st.average >= 10) ? Colors.success : Colors.error) + '15'
                            }]}>
                                <Text style={[styles.scoreText, {
                                    color: (typeof st.average === 'number' && st.average >= 10) ? Colors.success : Colors.error
                                }]}>
                                    {typeof st.average === 'number' ? st.average.toFixed(1) : '-'}
                                </Text>
                            </View>
                        </ListRow>
                    ))
                ) : <Empty message="Sin datos de rendimiento" />}
            </Card>

            {/* Estudiantes en Riesgo Académico */}
            <Card title="Estudiantes en Riesgo Académico" delay={250}>
                {isLoading ? (
                    <>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <ListRowSkeleton key={i} hasAvatar hasBadge />
                        ))}
                    </>
                ) : studentsData?.at_risk?.length ? (
                    studentsData.at_risk.map((st: StudentsTabPerformer, i: number) => (
                        <ListRow key={i}>
                            <View style={[styles.riskIcon, { backgroundColor: Colors.error + '15' }]}>
                                <Ionicons name="warning" size={16} color={Colors.error} />
                            </View>
                            <View style={styles.studentInfo}>
                                <Text style={styles.studentName}>{st.name}</Text>
                                <View style={styles.metaRow}>
                                    <Text style={styles.sectionName}>{st.section}</Text>
                                    <View style={styles.dot} />
                                    <Text style={[styles.levelBadge, { color: getLevelColor(st.level) }]}>
                                        {getLevelLabel(st.level)}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.scoreBox, { backgroundColor: Colors.error + '15' }]}>
                                <Text style={[styles.scoreText, { color: Colors.error }]}>
                                    {typeof st.average === 'number' ? st.average.toFixed(1) : '-'}
                                </Text>
                            </View>
                        </ListRow>
                    ))
                ) : <Empty message="Sin estudiantes en riesgo" icon="checkmark-circle-outline" />}
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 6 },

    // Stats rows
    statsRow: { flexDirection: 'row', gap: 12 },
    statBox: {
        flex: 1,
        backgroundColor: Colors.backgroundTertiary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center'
    },
    statIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8
    },
    statValue: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary },
    statLabel: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', marginTop: 4 },

    // Level distribution
    levelDistribution: { marginTop: 20 },
    sectionSubtitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    levelRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    levelInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    levelDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    levelName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
    levelCount: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
    levelProgress: { width: '100%' },

    // Student list items
    studentInfo: { flex: 1, marginLeft: 12 },
    studentName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    sectionName: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textTertiary },
    levelBadge: { fontSize: 10, fontWeight: '600' },

    // Score display
    scoreBox: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    scoreText: { fontSize: 14, fontWeight: '700' },

    // Risk indicator
    riskIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center'
    },
});

export default StudentsTab;
