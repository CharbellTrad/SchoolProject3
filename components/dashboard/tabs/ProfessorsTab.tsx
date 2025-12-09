/**
 * ProfessorsTab - enhanced visual design
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { AnimatedBarChart, ProgressLine } from '../charts';
import { Badge, Card, Empty } from '../ui';

interface Props {
    data: DashboardData | null;
}

export const ProfessorsTab: React.FC<Props> = ({ data: d }) => {
    // Difficult subjects bar data
    const difficultyData = d?.difficultSubjects?.subjects?.slice(0, 6).map((s) => ({
        value: s.failure_rate || 0,
        label: s.subject_name.length > 8 ? s.subject_name.substring(0, 7) + '…' : s.subject_name,
        frontColor: Colors.error,
        gradientColor: '#f87171',
    })) || [];

    // Helper to get best stat from a professor
    const getBestLevel = (stats: any) => {
        if (!stats) return null;
        const levels = [
            { key: 'pre', name: 'Pre', color: '#ec4899' },
            { key: 'primary', name: 'Prim', color: Colors.success },
            { key: 'secundary_general', name: 'Media', color: Colors.primary },
            { key: 'secundary_tecnico', name: 'Tec', color: Colors.warning },
        ];
        let best = null;
        let maxCount = 0;
        for (const lv of levels) {
            const data = stats[lv.key];
            if (data && data.count > maxCount) {
                maxCount = data.count;
                best = { ...lv, count: data.count, average: data.average };
            }
        }
        return best;
    };

    const statsAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(statsAnim, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* Total Active */}
            <View style={styles.row}>
                <View style={styles.halfCol}>
                    <Card style={styles.totalCard} delay={0}>
                        <View style={styles.totalIcon}>
                            <Ionicons name="people" size={24} color={Colors.primary} />
                        </View>
                        <Text style={styles.totalValue}>{d?.professorSummary?.total || 0}</Text>
                        <Text style={styles.totalLabel}>Activos</Text>
                    </Card>
                </View>

                {/* Resumen Lista */}
                <View style={styles.halfCol}>
                    <Card title="Resumen" delay={100} style={styles.fullHeight}>
                        {d?.professorSummary?.professors?.length ? (
                            <View style={styles.summaryList}>
                                {d.professorSummary.professors.slice(0, 3).map((p, i) => (
                                    <View key={i} style={styles.summaryRow}>
                                        <View style={styles.dot} />
                                        <Text style={styles.summaryName} numberOfLines={1}>{p.professor_name}</Text>
                                        <Badge value={p.evaluations_count} color={Colors.primary} />
                                    </View>
                                ))}
                            </View>
                        ) : <Empty />}
                    </Card>
                </View>
            </View>

            {/* Estadísticas Detalladas */}
            <Card title="Estadísticas por Profesor" delay={200}>
                {d?.professorDetailedStats?.professors?.length ? (
                    d.professorDetailedStats.professors.slice(0, 5).map((prof, i) => {
                        const best = getBestLevel(prof.stats_by_type);
                        return (
                            <View key={i} style={styles.detailedRow}>
                                <View style={styles.detailedHeader}>
                                    <View style={styles.profAvatar}>
                                        <Text style={styles.profInitials}>{prof.professor_name.charAt(0)}</Text>
                                    </View>
                                    <View style={styles.detailedInfo}>
                                        <Text style={styles.profName}>{prof.professor_name}</Text>
                                        <Text style={styles.profMeta}>{prof.total_evaluations} evaluaciones</Text>
                                    </View>
                                    {best && (
                                        <View style={[styles.bestBadge, { backgroundColor: best.color + '15' }]}>
                                            <Text style={[styles.bestBadgeText, { color: best.color }]}>{best.name}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Mini Stats Grid */}
                                <View style={styles.typeStatsGrid}>
                                    {(['pre', 'primary', 'secundary_general', 'secundary_tecnico'] as const).map((key) => {
                                        const stat = prof.stats_by_type[key];
                                        if (!stat || stat.count === 0) return null;

                                        const color = key === 'pre' ? '#ec4899' : key === 'primary' ? Colors.success : key === 'secundary_general' ? Colors.primary : Colors.warning;
                                        const label = key === 'pre' ? 'Pre' : key === 'primary' ? 'Prim' : key === 'secundary_general' ? 'MG' : 'TM';

                                        return (
                                            <View key={key} style={styles.typeStatItem}>
                                                <Text style={[styles.typeStatValue, { color }]}>{stat.average?.toFixed(1)}</Text>
                                                <Text style={styles.typeStatLabel}>{label} ({stat.count})</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })
                ) : <Empty />}
            </Card>

            {/* Materias Difíciles */}
            <Card title="Materias con Mayor Dificultad" delay={300}>
                {d?.difficultSubjects?.subjects?.length ? (
                    <>
                        <View style={styles.diffList}>
                            {d.difficultSubjects.subjects.slice(0, 4).map((s, i) => (
                                <View key={i} style={styles.difficultyRow}>
                                    <Text style={styles.difficultyName}>{s.subject_name}</Text>
                                    <View style={styles.difficultyBar}>
                                        <ProgressLine value={s.failure_rate || 0} color={Colors.error} height={6} animate />
                                    </View>
                                    <Text style={styles.difficultyValue}>{s.failure_rate}%</Text>
                                </View>
                            ))}
                        </View>
                        {difficultyData.length > 0 && (
                            <View style={styles.chartSection}>
                                <AnimatedBarChart data={difficultyData} maxValue={100} height={140} barWidth={24} spacing={20} />
                            </View>
                        )}
                    </>
                ) : <Empty />}
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 6 },
    row: { flexDirection: 'column', gap: 12, marginBottom: 16 },
    halfCol: { width: '100%' },
    fullHeight: { marginBottom: 0 },

    totalCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
    totalIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    totalValue: { fontSize: 42, fontWeight: '800', color: Colors.primary },
    totalLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },

    summaryList: { gap: 12 },
    summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textTertiary },
    summaryName: { flex: 1, fontSize: 13, color: Colors.textPrimary },

    detailedRow: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    detailedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    profAvatar: { width: 36, height: 36, borderRadius: 12, backgroundColor: Colors.backgroundTertiary, justifyContent: 'center', alignItems: 'center' },
    profInitials: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
    detailedInfo: { flex: 1, marginLeft: 12 },
    profName: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
    profMeta: { fontSize: 11, color: Colors.textSecondary },
    bestBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    bestBadgeText: { fontSize: 10, fontWeight: '700' },

    typeStatsGrid: { flexDirection: 'row', gap: 16, marginLeft: 48 },
    typeStatItem: { alignItems: 'center' },
    typeStatValue: { fontSize: 14, fontWeight: '800' },
    typeStatLabel: { fontSize: 10, color: Colors.textSecondary },

    diffList: { gap: 12, marginBottom: 20 },
    difficultyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    difficultyName: { width: 100, fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
    difficultyBar: { flex: 1 },
    difficultyValue: { width: 30, fontSize: 11, fontWeight: '700', color: Colors.error, textAlign: 'right' },
    chartSection: { paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },
});

export default ProfessorsTab;
