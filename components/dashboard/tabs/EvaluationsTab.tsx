/**
 * EvaluationsTab - enhanced visual design
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { DonutChart } from '../charts';
import { AnimatedBadge, Card, Empty, ListRow } from '../ui';

interface Props {
    data: DashboardData | null;
}

export const EvaluationsTab: React.FC<Props> = ({ data: d }) => {
    const evalData = d?.evaluationsStats ? [
        { value: d.evaluationsStats.qualified, color: Colors.success, gradientCenterColor: '#059669', label: 'Calificadas', text: 'Calificadas' },
        { value: d.evaluationsStats.partial, color: Colors.warning, gradientCenterColor: '#d97706', label: 'Parciales', text: 'Parciales' },
        { value: d.evaluationsStats.draft, color: Colors.textTertiary, gradientCenterColor: '#6b7280', label: 'Borrador', text: 'Borrador' },
    ].filter(item => item.value > 0) : [];

    const total = d?.evaluationsStats?.total || 0;

    return (
        <View style={styles.container}>
            {/* Stats Grid */}
            <View style={styles.statsRow}>
                <View style={styles.mainStatCol}>
                    <Card delay={0} style={styles.mainStatCard}>
                        <View style={[styles.mainStatIcon, { backgroundColor: Colors.primary + '15' }]}>
                            <Ionicons name="documents-outline" size={28} color={Colors.primary} />
                        </View>
                        <Text style={styles.mainStatValue}>{total}</Text>
                        <Text style={styles.mainStatLabel}>Evaluaciones</Text>
                    </Card>
                </View>
                <View style={[styles.chartCol, { flex: 1.2 }]}>
                    <Card delay={100} style={styles.chartCard} animate={false}>
                        {evalData.length > 0 ? (
                            <DonutChart
                                data={evalData}
                                centerValue={total}
                                centerLabel="Total"
                                radius={55}
                                innerRadius={40}
                                showLegend={false}
                            />
                        ) : <Empty />}
                    </Card>
                </View>
            </View>

            {/* Breakdown Grid */}
            <View style={styles.breakdownRow}>
                <Card delay={200} style={styles.breakdownCard}>
                    <View style={styles.breakdownItem}>
                        <Text style={[styles.bdValue, { color: Colors.success }]}>{d?.evaluationsStats?.qualified || 0}</Text>
                        <Text style={styles.bdLabel}>Calificadas</Text>
                    </View>
                </Card>
                <Card delay={250} style={styles.breakdownCard}>
                    <View style={styles.breakdownItem}>
                        <Text style={[styles.bdValue, { color: Colors.warning }]}>{d?.evaluationsStats?.partial || 0}</Text>
                        <Text style={styles.bdLabel}>Parciales</Text>
                    </View>
                </Card>
                <Card delay={300} style={styles.breakdownCard}>
                    <View style={styles.breakdownItem}>
                        <Text style={[styles.bdValue, { color: Colors.textTertiary }]}>{d?.evaluationsStats?.draft || 0}</Text>
                        <Text style={styles.bdLabel}>Borrador</Text>
                    </View>
                </Card>
            </View>

            {/* Evaluaciones Recientes */}
            <Card title="Evaluaciones Recientes" delay={400}>
                {d?.recentEvaluations?.evaluations?.length ? (
                    d.recentEvaluations.evaluations.map((e, i) => (
                        <ListRow key={i}>
                            <View style={styles.evalIcon}>
                                <Ionicons name="document-text" size={20} color={Colors.primary} />
                            </View>
                            <View style={styles.evalInfo}>
                                <Text style={styles.evalName} numberOfLines={1}>{e.name}</Text>
                                <Text style={styles.evalMeta} numberOfLines={1}>{e.section}</Text>
                            </View>
                            <View style={styles.evalDateCol}>
                                <Text style={styles.evalDate}>{e.date}</Text>
                                <AnimatedBadge
                                    value={e.state === 'qualified' ? 'Calif.' : e.state === 'partial' ? 'Parc.' : 'Borr.'}
                                    color={e.state === 'qualified' ? Colors.success : e.state === 'partial' ? Colors.warning : Colors.textTertiary}
                                />
                            </View>
                        </ListRow>
                    ))
                ) : <Empty message="Sin evaluaciones recientes" />}
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 6 },
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16, height: 140 }, // height fixes layout
    mainStatCol: { flex: 1 },
    mainStatCard: { margin: 0, height: '100%', alignItems: 'center', justifyContent: 'center' },
    mainStatIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    mainStatValue: { fontSize: 32, fontWeight: '800', color: Colors.primary },
    mainStatLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
    chartCol: { flex: 1 },
    chartCard: { margin: 0, height: '100%', justifyContent: 'center' },

    breakdownRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    breakdownCard: { flex: 1, padding: 12, marginBottom: 0 },
    breakdownItem: { alignItems: 'center' },
    bdValue: { fontSize: 20, fontWeight: '800' },
    bdLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 4 },

    evalIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary + '10', justifyContent: 'center', alignItems: 'center' },
    evalInfo: { flex: 1, marginLeft: 12 },
    evalName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    evalMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    evalDateCol: { alignItems: 'flex-end', gap: 4 },
    evalDate: { fontSize: 10, color: Colors.textTertiary },
});

export default EvaluationsTab;
