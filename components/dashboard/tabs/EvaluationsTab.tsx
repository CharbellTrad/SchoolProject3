/**
 * EvaluationsTab - Exact replication of Odoo Evaluations tab
 * 
 * Structure from school_year_view.xml:
 * 1. "Estadísticas de Evaluaciones" - 4 KPI Cards
 * 2. "Distribución de Evaluaciones" - Doughnut chart + Legend by level
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { ProgressLine } from '../charts';
import DonutChart from '../charts/DonutChart';
import { Card, DistributionSkeleton, Empty, KPIRowSkeleton } from '../ui';
interface Props {
    data: DashboardData | null;
    loading?: boolean;
    skipAnimations?: boolean;
}

// Level configuration matching Odoo exactly
const LEVEL_CONFIG = {
    pre: { label: 'Preescolar', color: '#FFB300', icon: 'happy' as const },
    primary: { label: 'Primaria', color: '#43A047', icon: 'book' as const },
    secundary: { label: 'Media General', color: '#1E88E5', icon: 'school' as const },
    tecnico: { label: 'Técnico Medio', color: '#8E24AA', icon: 'construct' as const },
};

export const EvaluationsTab: React.FC<Props> = ({ data: d, loading, skipAnimations: _skipAnimations }) => {
    // DEBUG: Toggle skeleton visibility
    const [forceSkeletons, setForceSkeletons] = useState(false);
    const isLoading = forceSkeletons || loading || !d;
    const stats = d?.evaluationsStats;

    // KPI data
    const total = stats?.total ?? 0;
    const qualified = stats?.qualified ?? 0;
    const partial = stats?.partial ?? 0;
    const draft = stats?.draft ?? 0;
    const completionRate = total > 0 ? Math.round((qualified / total) * 100) : 0;

    // Distribution by level
    const byType = stats?.by_type ?? { pre: 0, primary: 0, secundary: 0 };

    // Color for completion rate
    const getCompletionColor = () => {
        if (completionRate >= 80) return Colors.success;
        if (completionRate >= 50) return Colors.warning;
        return Colors.error;
    };

    // Chart data for distribution
    const chartData = (['pre', 'primary', 'secundary', 'tecnico'] as const)
        .map(level => ({
            level,
            value: (byType as any)[level] ?? 0,
            ...LEVEL_CONFIG[level],
            percentage: total > 0 ? Math.round(((byType as any)[level] ?? 0) / total * 100) : 0,
        }))
        .filter(item => item.value > 0);

    return (
        <View style={styles.container}>
            {/* ========================================= */}
            {/* SECCIÓN 1: Estadísticas de Evaluaciones  */}
            {/* ========================================= */}
            <Card title="Estadísticas de Evaluaciones" delay={100}>
                {isLoading ? (
                    <KPIRowSkeleton count={4} />
                ) : (
                    <>
                        <View style={styles.kpiRow}>
                            {/* Calificadas */}
                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcon, { backgroundColor: Colors.success + '20' }]}>
                                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                                </View>
                                <Text style={[styles.kpiValue, { color: Colors.success }]}>{qualified}</Text>
                                <Text style={styles.kpiLabel}>Calificadas</Text>
                            </View>
                            {/* Parciales */}
                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcon, { backgroundColor: Colors.warning + '20' }]}>
                                    <Ionicons name="time" size={16} color={Colors.warning} />
                                </View>
                                <Text style={[styles.kpiValue, { color: Colors.warning }]}>{partial}</Text>
                                <Text style={styles.kpiLabel}>Parciales</Text>
                            </View>
                            {/* Borrador */}
                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcon, { backgroundColor: Colors.textTertiary + '20' }]}>
                                    <Ionicons name="create" size={16} color={Colors.textTertiary} />
                                </View>
                                <Text style={[styles.kpiValue, { color: Colors.textTertiary }]}>{draft}</Text>
                                <Text style={styles.kpiLabel}>Borrador</Text>
                            </View>
                            {/* Completadas % */}
                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcon, { backgroundColor: getCompletionColor() + '20' }]}>
                                    <Ionicons name="bar-chart" size={16} color={getCompletionColor()} />
                                </View>
                                <Text style={[styles.kpiValue, { color: getCompletionColor() }]}>{completionRate}%</Text>
                                <Text style={styles.kpiLabel}>Completadas</Text>
                            </View>
                        </View>

                        {/* Progress Bar - Tasa de Completitud */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Tasa de Completitud de Evaluaciones</Text>
                                <Text style={[styles.progressPercent, { color: getCompletionColor() }]}>
                                    {completionRate}%
                                </Text>
                            </View>
                            <ProgressLine
                                value={completionRate}
                                height={10}
                                color={getCompletionColor()}
                                animate
                            />
                        </View>
                    </>
                )}
            </Card>

            {/* ========================================= */}
            {/* SECCIÓN 2: Distribución de Evaluaciones  */}
            {/* ========================================= */}
            <Card title="Distribución de Evaluaciones" delay={200}>
                {isLoading ? (
                    <DistributionSkeleton legendItems={4} />
                ) : total > 0 ? (
                    <View style={styles.distributionContainer}>
                        <DonutChart
                            data={chartData.map(item => ({
                                value: item.value,
                                color: item.color,
                                label: item.label,
                            }))}
                            centerValue={total}
                            centerLabel="Total"
                            radius={120}
                            innerRadius={90}
                            showLegend={true}
                            // legendPosition="right"
                            legendTextSize={16}
                            legendValueSize={16}
                            legendPercentSize={14}
                            legendItemGap={5}
                            animate
                            interactive
                        />
                    </View>
                ) : (
                    <Empty message="No hay datos de distribución" />
                )}
            </Card>

            {/* DEBUG: Toggle Skeletons Button - REMOVE AFTER TESTING */}
            {/* <TouchableOpacity
                onPress={() => setForceSkeletons(!forceSkeletons)}
                style={{
                    backgroundColor: forceSkeletons ? Colors.error : Colors.success,
                    padding: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                    marginTop: 8,
                }}
            >
                <Text style={{ color: '#fff', fontWeight: '700' }}>
                    {forceSkeletons ? '🔴 Skeletons ON' : '🟢 Skeletons OFF'}
                </Text>
            </TouchableOpacity> */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 12 },

    // KPI Cards - Matching LevelTab sizes
    kpiRow: { flexDirection: 'row', gap: 8 },
    kpiCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    kpiIcon: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
    kpiValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary },
    kpiLabel: { fontSize: 9, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },


    distributionContainer: { justifyContent: 'center', paddingVertical: 10 },

    // Progress Bar
    progressSection: { marginTop: 12 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 10, color: Colors.textSecondary },
    progressPercent: { fontSize: 11, fontWeight: '700' },
});

export default EvaluationsTab;