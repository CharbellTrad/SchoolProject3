/**
 * EvaluationsTab - Matches Odoo's evaluations_stats_widget exactly
 * 
 * Odoo structure: Only ONE section "Estadísticas de Evaluaciones"
 * The widget displays all stats internally
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { ProgressLine } from '../charts';
import { Card, DistributionRowSkeleton, Empty, StatCardSkeleton } from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
}

export const EvaluationsTab: React.FC<Props> = ({ data: d, loading }) => {
    const isLoading = loading || !d;
    const stats = d?.evaluationsStats;

    const total = stats?.total || 0;
    const qualified = stats?.qualified || 0;
    const partial = stats?.partial || 0;
    const draft = stats?.draft || 0;

    // Distribution by level data - Colors match Odoo
    const byType = stats?.by_type;
    const distributionData = byType ? [
        { level: 'Media General', count: byType.secundary || 0, color: Colors.levelSecundary },
        { level: 'Primaria', count: byType.primary || 0, color: Colors.levelPrimary },
        { level: 'Preescolar', count: byType.pre || 0, color: Colors.levelPre },
    ] : [];

    const totalByType = distributionData.reduce((sum, item) => sum + item.count, 0);

    return (
        <View style={styles.container}>
            {/* Estadísticas de Evaluaciones - Single section matching Odoo */}
            <Card title="Estadísticas de Evaluaciones" delay={100}>
                {isLoading ? (
                    <>
                        <View style={[styles.statsRow, { marginBottom: 10 }]}>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </View>
                        <View style={styles.statsRow}>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </View>
                        <View style={styles.divider} />
                        <DistributionRowSkeleton />
                        <DistributionRowSkeleton />
                        <DistributionRowSkeleton />
                    </>
                ) : (
                    <>
                        {/* Stats Grid */}
                        <View style={[styles.statsRow, { marginBottom: 10 }]}>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: Colors.primary }]}>{total}</Text>
                                <Text style={styles.statLabel}>Total Evaluaciones</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: Colors.success }]}>{qualified}</Text>
                                <Text style={styles.statLabel}>Calificadas</Text>
                            </View>
                        </View>
                        <View style={styles.statsRow}>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: Colors.warning }]}>{partial}</Text>
                                <Text style={styles.statLabel}>Parciales</Text>
                            </View>
                            <View style={styles.statBox}>
                                <Text style={[styles.statValue, { color: Colors.textTertiary }]}>{draft}</Text>
                                <Text style={styles.statLabel}>Borrador</Text>
                            </View>
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />

                        {/* Distribution by Level (Part of the same widget in Odoo) */}
                        <Text style={styles.subSectionTitle}>Distribución por Nivel</Text>
                        {distributionData.length > 0 && totalByType > 0 ? (
                            <View>
                                {distributionData.map((item, i) => (
                                    <View key={i} style={styles.distRow}>
                                        <View style={styles.distInfo}>
                                            <View style={[styles.levelDot, { backgroundColor: item.color }]} />
                                            <Text style={styles.distName}>{item.level}</Text>
                                            <Text style={styles.distCount}>{item.count}</Text>
                                        </View>
                                        <View style={styles.distProgress}>
                                            <ProgressLine
                                                value={totalByType > 0 ? (item.count / totalByType) * 100 : 0}
                                                height={8}
                                                color={item.color}
                                                animate
                                            />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ) : <Empty message="Sin datos de distribución" />}
                    </>
                )}
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 6 },

    // Stats grid
    statsRow: { flexDirection: 'row', gap: 12 },
    statBox: {
        flex: 1,
        backgroundColor: Colors.backgroundTertiary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    statValue: { fontSize: 24, fontWeight: '800' },
    statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4, fontWeight: '500' },

    // Divider
    divider: {
        height: 1,
        backgroundColor: Colors.borderLight,
        marginVertical: 20,
    },

    // Sub-section title
    subSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12,
    },

    // Distribution by level
    distRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    distInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    levelDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    distName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
    distCount: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
    distProgress: { width: '100%' },
});

export default EvaluationsTab;
