/**
 * DashboardGeneralTab - Tab 1: Dashboard General
 * Matches Odoo structure exactly:
 * - Rendimiento General del Año Escolar (year_performance_overview)
 * - Distribución de Estudiantes por Nivel (students_distribution_chart)
 * - Tasa de Aprobación General (approval_rate_gauge)
 * - Comparativa de Secciones (sections_comparison_chart)
 * - Top 10 Mejores Estudiantes del Año (top_students_list)
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { DonutChart, GroupedBarChart, ProgressLine, RingGauge } from '../charts';
import { Card, Empty, ListRow, RankBadge } from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
}

export const DashboardGeneralTab: React.FC<Props> = ({ data: d, loading }) => {
    // Distribución de Estudiantes data
    const distributionData = d?.studentsDistribution?.labels.map((label, i) => ({
        value: d.studentsDistribution!.data[i],
        color: [Colors.primary, Colors.success, '#ec4899', Colors.warning][i] || Colors.info,
        gradientCenterColor: ['#1e40af', '#059669', '#db2777', '#d97706'][i] || Colors.info,
        label,
    })) || [];

    // Comparativa de Secciones data - shows BOTH average and approval_rate like Odoo
    const sectionsGroupedData = d?.sectionsComparison?.sections?.slice(0, 4).map((s) => ({
        label: s.section_name.length > 8 ? s.section_name.substring(0, 7) + '…' : s.section_name,
        value1: s.average || 0,        // Promedio (0-20 scale)
        value2: s.approval_rate || 0,  // Tasa de Aprobación (%)
    })) || [];

    const approvalRate = d?.approvalRate?.rate || 0;
    const approvalColor = approvalRate >= 70 ? Colors.success : approvalRate >= 50 ? Colors.warning : Colors.error;

    return (
        <>
            {/* Rendimiento General del Año Escolar */}
            <Card title="Rendimiento General del Año Escolar">
                {d?.performanceByLevel?.levels?.length ? (
                    <View>
                        {d.performanceByLevel.levels.map((lv, i) => (
                            <View key={i} style={styles.perfRow}>
                                <View style={styles.perfInfo}>
                                    <Text style={styles.perfName}>{lv.name}</Text>
                                    <Text style={styles.perfStats}>{lv.total_students} estudiantes • {lv.approved_students} aprobados</Text>
                                </View>
                                <View style={styles.perfProgress}>
                                    <ProgressLine value={lv.approval_rate || 0} height={8} animate />
                                </View>
                            </View>
                        ))}
                    </View>
                ) : <Empty />}
            </Card>

            {/* Distribución de Estudiantes por Nivel */}
            <Card title="Distribución de Estudiantes por Nivel">
                {distributionData.length > 0 ? (
                    <DonutChart
                        data={distributionData}
                        centerValue={d?.studentsDistribution?.total || 0}
                        centerLabel="Total"
                        radius={85}
                        innerRadius={60}
                    />
                ) : <Empty />}
            </Card>

            {/* Tasa de Aprobación General */}
            <Card title="Tasa de Aprobación General">
                {d?.approvalRate ? (
                    <View style={styles.gaugeSection}>
                        <RingGauge
                            percentage={approvalRate}
                            color={approvalColor}
                            label="Aprobación"
                            size={140}
                            strokeWidth={18}
                        />
                        <View style={styles.gaugeLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
                                <Text style={styles.legendText}>{d.approvalRate.approved} Aprobados</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
                                <Text style={styles.legendText}>{d.approvalRate.failed} Reprobados</Text>
                            </View>
                        </View>
                    </View>
                ) : <Empty />}
            </Card>

            {/* Comparativa de Secciones - shows both Promedio AND Aprobación like Odoo */}
            <Card title="Comparativa de Secciones">
                {sectionsGroupedData.length > 0 ? (
                    <GroupedBarChart
                        data={sectionsGroupedData}
                        value1Color={Colors.success}
                        value2Color={Colors.primary}
                        value1Label="Promedio"
                        value2Label="Aprobación"
                        maxValue1={20}
                        maxValue2={100}
                        height={200}
                    />
                ) : <Empty />}
            </Card>

            {/* Detalle de Secciones - Table matching Odoo */}
            {d?.sectionsComparison?.sections?.length ? (
                <Card title="Detalle de Secciones">
                    <View style={styles.sectionTable}>
                        {/* Header */}
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Sección</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Nivel</Text>
                            <Text style={[styles.tableHeaderCell, styles.centerText]}>Est.</Text>
                            <Text style={[styles.tableHeaderCell, styles.centerText]}>Prom.</Text>
                            <Text style={[styles.tableHeaderCell, styles.centerText]}>Aprob.</Text>
                        </View>
                        {/* Rows */}
                        {d.sectionsComparison.sections.map((s, i) => (
                            <View key={i} style={styles.tableRow}>
                                <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]}>{s.section_name}</Text>
                                <Text style={[styles.tableCell, { flex: 1 }]}>
                                    {s.type === 'secundary' ? 'Media' : s.type === 'primary' ? 'Prim.' : 'Pre'}
                                </Text>
                                <Text style={[styles.tableCell, styles.centerText]}>{s.total_students}</Text>
                                <Text style={[styles.tableCell, styles.centerText, { color: s.average >= 10 ? Colors.success : Colors.error }]}>
                                    {s.average?.toFixed(1)}
                                </Text>
                                <Text style={[styles.tableCell, styles.centerText, { color: s.approval_rate >= 70 ? Colors.success : Colors.warning }]}>
                                    {s.approval_rate}%
                                </Text>
                            </View>
                        ))}
                    </View>
                </Card>
            ) : null}

            {/* Top 10 Mejores Estudiantes del Año */}
            <Card title="Top 10 Mejores Estudiantes del Año">
                {d?.topStudentsYear?.top_students?.length ? (
                    d.topStudentsYear.top_students.map((st, i) => (
                        <ListRow key={i}>
                            <RankBadge rank={i + 1} />
                            <View style={styles.topInfo}>
                                <Text style={styles.topName}>{st.student_name}</Text>
                                <Text style={styles.topSection}>{st.section}</Text>
                            </View>
                            <View style={styles.topScore}>
                                <Text style={styles.topAvg}>{st.use_literal ? st.literal_average : st.average?.toFixed(1)}</Text>
                            </View>
                        </ListRow>
                    ))
                ) : <Empty />}
            </Card>
        </>
    );
};

const styles = StyleSheet.create({
    // Performance rows
    perfRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    perfInfo: { marginBottom: 8 },
    perfName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
    perfStats: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    perfProgress: { width: '100%' },

    // Gauge section
    gaugeSection: { alignItems: 'center' },
    gaugeLegend: { flexDirection: 'row', gap: 24, marginTop: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: Colors.textSecondary },

    // Top students
    topInfo: { flex: 1, marginLeft: 12 },
    topName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    topSection: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    topScore: { backgroundColor: Colors.success + '15', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
    topAvg: { fontSize: 14, fontWeight: '700', color: Colors.success },

    // Section table
    sectionTable: {},
    tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingBottom: 8, marginBottom: 8 },
    tableHeaderCell: { fontSize: 11, fontWeight: '600', color: Colors.textSecondary },
    tableRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    tableCell: { fontSize: 12, color: Colors.textPrimary },
    centerText: { textAlign: 'center', flex: 1 },
});

export default DashboardGeneralTab;
