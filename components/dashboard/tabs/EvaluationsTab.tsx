/**
 * EvaluationsTab - Tab 8: Evaluaciones
 * Matches Odoo structure exactly:
 * - Estadísticas de Evaluaciones (evaluations_stats_widget)
 * - Evaluaciones Recientes (evaluations_timeline)
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { DonutChart } from '../charts';
import { Card, Empty, ListRow, Separator } from '../ui';

interface Props {
    data: DashboardData | null;
}

export const EvaluationsTab: React.FC<Props> = ({ data: d }) => {
    // Donut data for evaluation status
    const evalData = d?.evaluationsStats ? [
        { value: d.evaluationsStats.qualified, color: Colors.success, gradientCenterColor: '#059669', label: 'Calificadas' },
        { value: d.evaluationsStats.partial, color: Colors.warning, gradientCenterColor: '#d97706', label: 'Parciales' },
        { value: d.evaluationsStats.draft, color: Colors.textTertiary, gradientCenterColor: '#6b7280', label: 'Borrador' },
    ].filter(item => item.value > 0) : [];

    const total = d?.evaluationsStats?.total || 0;

    return (
        <>
            {/* Estadísticas de Evaluaciones */}
            <Separator title="Estadísticas de Evaluaciones" />

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
                <View style={[styles.evalCard, { borderLeftColor: Colors.primary }]}>
                    <Text style={[styles.evalValue, { color: Colors.primary }]}>{d?.evaluationsStats?.total || 0}</Text>
                    <Text style={styles.evalLabel}>Total</Text>
                </View>
                <View style={[styles.evalCard, { borderLeftColor: Colors.success }]}>
                    <Text style={[styles.evalValue, { color: Colors.success }]}>{d?.evaluationsStats?.qualified || 0}</Text>
                    <Text style={styles.evalLabel}>Calificadas</Text>
                </View>
                <View style={[styles.evalCard, { borderLeftColor: Colors.warning }]}>
                    <Text style={[styles.evalValue, { color: Colors.warning }]}>{d?.evaluationsStats?.partial || 0}</Text>
                    <Text style={styles.evalLabel}>Parciales</Text>
                </View>
                <View style={[styles.evalCard, { borderLeftColor: Colors.textTertiary }]}>
                    <Text style={[styles.evalValue, { color: Colors.textTertiary }]}>{d?.evaluationsStats?.draft || 0}</Text>
                    <Text style={styles.evalLabel}>Borrador</Text>
                </View>
            </View>

            {/* Donut Chart */}
            <Card>
                {evalData.length > 0 ? (
                    <DonutChart
                        data={evalData}
                        centerValue={total}
                        centerLabel="Evaluaciones"
                        radius={75}
                        innerRadius={55}
                    />
                ) : <Empty message="Sin evaluaciones registradas" />}
            </Card>

            {/* Evaluaciones Recientes */}
            <Separator title="Evaluaciones Recientes" />
            <Card>
                {d?.recentEvaluations?.evaluations?.length ? (
                    d.recentEvaluations.evaluations.map((e, i) => (
                        <ListRow key={i}>
                            <View style={styles.evalIcon}>
                                <Ionicons name="document-text" size={18} color={Colors.primary} />
                            </View>
                            <View style={styles.evalInfo}>
                                <Text style={styles.evalName}>{e.name}</Text>
                                <Text style={styles.evalMeta}>{e.section} • {e.professor}</Text>
                            </View>
                            <View style={styles.evalDateCol}>
                                <Text style={styles.evalDate}>{e.date}</Text>
                                <View style={[styles.evalState, e.state === 'qualified' && { backgroundColor: Colors.success + '15' }]}>
                                    <Text style={[styles.evalStateText, e.state === 'qualified' && { color: Colors.success }]}>
                                        {e.state === 'qualified' ? 'Calificada' : e.state === 'partial' ? 'Parcial' : 'Borrador'}
                                    </Text>
                                </View>
                            </View>
                        </ListRow>
                    ))
                ) : <Empty message="Sin evaluaciones recientes" />}
            </Card>
        </>
    );
};

const styles = StyleSheet.create({
    // Stats grid
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
    evalCard: { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 12, padding: 16, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
    evalValue: { fontSize: 26, fontWeight: '800' },
    evalLabel: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary, marginTop: 4 },

    // Evaluations list
    evalIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
    evalInfo: { flex: 1, marginLeft: 12 },
    evalName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    evalMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    evalDateCol: { alignItems: 'flex-end' },
    evalDate: { fontSize: 10, color: Colors.textTertiary, marginBottom: 4 },
    evalState: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: Colors.backgroundSecondary },
    evalStateText: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary },
});

export default EvaluationsTab;
