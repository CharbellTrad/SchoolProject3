/**
 * DashboardGeneralTab - enhanced visual design
 * Features: Staggered animations, gradient tables, glassmorphism
 */
import { LinearGradient } from 'expo-linear-gradient';
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

    // Comparativa de Secciones
    const sectionsGroupedData = d?.sectionsComparison?.sections?.slice(0, 4).map((s) => ({
        label: s.section_name.length > 8 ? s.section_name.substring(0, 7) + '…' : s.section_name,
        value1: s.average || 0,
        value2: s.approval_rate || 0,
    })) || [];

    const approvalRate = d?.approvalRate?.rate || 0;
    const approvalColor = approvalRate >= 70 ? Colors.success : approvalRate >= 50 ? Colors.warning : Colors.error;

    return (
        <View style={styles.container}>
            {/* Rendimiento General */}
            <Card title="Rendimiento General del Año" delay={0}>
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

            <View style={styles.row}>
                {/* Distribución Donut */}
                <View style={styles.halfCol}>
                    <Card title="Distribución" delay={100} style={styles.fullHeight}>
                        {distributionData.length > 0 ? (
                            <DonutChart
                                data={distributionData}
                                centerValue={d?.studentsDistribution?.total || 0}
                                centerLabel="Total"
                                radius={70}
                                innerRadius={50}
                                showLegend={true}
                            />
                        ) : <Empty />}
                    </Card>
                </View>

                {/* Tasa Aprobación Gauge */}
                <View style={styles.halfCol}>
                    <Card title="Aprobación" delay={150} style={styles.fullHeight}>
                        {d?.approvalRate ? (
                            <View style={styles.gaugeSection}>
                                <RingGauge
                                    percentage={approvalRate}
                                    color={approvalColor}
                                    label="Tasa"
                                    size={110}
                                    strokeWidth={14}
                                />
                            </View>
                        ) : <Empty />}
                    </Card>
                </View>
            </View>

            {/* Comparativa Chart */}
            <Card title="Comparativa de Secciones" delay={200}>
                {sectionsGroupedData.length > 0 ? (
                    <GroupedBarChart
                        data={sectionsGroupedData}
                        value1Color={Colors.success}
                        value2Color={Colors.primary}
                        value1Label="Promedio"
                        value2Label="Aprobación"
                        maxValue1={20}
                        maxValue2={100}
                        height={180}
                    />
                ) : <Empty />}
            </Card>

            {/* Detalle de Secciones Table */}
            {d?.sectionsComparison?.sections?.length ? (
                <Card title="Detalle de Secciones" delay={300}>
                    <View style={styles.sectionTable}>
                        {/* Gradient Header */}
                        <LinearGradient
                            colors={[Colors.backgroundTertiary, '#fff']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.tableHeader}
                        >
                            <Text style={[styles.tableHeaderCell, { flex: 2, paddingLeft: 8 }]}>Sección</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Nivel</Text>
                            <Text style={[styles.tableHeaderCell, styles.centerText]}>Est.</Text>
                            <Text style={[styles.tableHeaderCell, styles.centerText]}>Prom.</Text>
                            <Text style={[styles.tableHeaderCell, styles.centerText]}>Aprob.</Text>
                        </LinearGradient>

                        {/* Rows */}
                        {d.sectionsComparison.sections.map((s, i) => (
                            <View key={i} style={[styles.tableRow, i % 2 !== 0 && styles.tableRowAlt]}>
                                <Text style={[styles.tableCell, { flex: 2, fontWeight: '600', paddingLeft: 8 }]}>{s.section_name}</Text>
                                <Text style={[styles.tableCell, { flex: 1, fontSize: 11, color: Colors.textSecondary }]}>
                                    {s.type === 'secundary' ? 'Media' : s.type === 'primary' ? 'Prim.' : 'Pre'}
                                </Text>
                                <Text style={[styles.tableCell, styles.centerText]}>{s.total_students}</Text>
                                <Text style={[styles.tableCell, styles.centerText, { color: s.average >= 10 ? Colors.success : Colors.error, fontWeight: '600' }]}>
                                    {s.average?.toFixed(1)}
                                </Text>
                                <View style={[styles.pillsContainer, { justifyContent: 'center', flex: 1 }]}>
                                    <View style={[styles.miniPill, { backgroundColor: (s.approval_rate >= 70 ? Colors.success : Colors.warning) + '20' }]}>
                                        <Text style={[styles.miniPillText, { color: s.approval_rate >= 70 ? Colors.success : Colors.warning }]}>
                                            {s.approval_rate}%
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </Card>
            ) : null}

            {/* Top 10 Estudiantes */}
            <Card title="Top 10 Mejores Estudiantes" delay={400} glassmorphism>
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 6 }, // Add gap between cards via container styling (or handled by Cards marginBottom)
    row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    halfCol: { flex: 1 },
    fullHeight: { flex: 1, marginBottom: 0 },

    // Performance rows
    perfRow: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    perfInfo: { marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    perfName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    perfStats: { fontSize: 11, color: Colors.textSecondary },
    perfProgress: { width: '100%' },

    // Gauge section
    gaugeSection: { alignItems: 'center', justifyContent: 'center', flex: 1 },

    // Top students
    topInfo: { flex: 1, marginLeft: 12 },
    topName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    topSection: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    topScore: { backgroundColor: Colors.success + '15', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    topAvg: { fontSize: 14, fontWeight: '700', color: Colors.success },

    // Section table
    sectionTable: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight },
    tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4 },
    tableHeaderCell: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center', backgroundColor: '#fff' },
    tableRowAlt: { backgroundColor: Colors.backgroundTertiary },
    tableCell: { fontSize: 12, color: Colors.textPrimary },
    centerText: { textAlign: 'center', flex: 1 },
    pillsContainer: { flexDirection: 'row', flex: 1 },
    miniPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    miniPillText: { fontSize: 11, fontWeight: '700' },
});

export default DashboardGeneralTab;
