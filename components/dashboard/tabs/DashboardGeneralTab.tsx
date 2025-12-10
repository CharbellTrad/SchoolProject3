/**
 * DashboardGeneralTab - enhanced visual design
 * Features: Staggered animations, gradient tables, glassmorphism, skeleton loading
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { DonutChart, GroupedBarChart, RingGauge } from '../charts';
import {
    Card,
    ChartSkeleton,
    Empty,
    LevelCardSkeleton,
    ListRow,
    ListRowSkeleton,
    RankBadge,
    TableRowSkeleton
} from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
}

export const DashboardGeneralTab: React.FC<Props> = ({ data: d, loading }) => {
    // Distribución de Estudiantes data - Colors match Odoo: Pre=info, Primary=success, Secundary=primary, Tecnico=warning
    const distributionData = d?.studentsDistribution?.labels.map((label, i) => ({
        value: d.studentsDistribution!.data[i],
        color: [Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary, Colors.levelTecnico][i] || Colors.info,
        gradientCenterColor: ['#0e7490', '#15803d', '#1e3a8a', '#d97706'][i] || Colors.info,
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

    // Helper to get level color and icon
    const getLevelStyle = (type: string) => {
        switch (type) {
            case 'pre': return { color: Colors.levelPre, icon: 'school-outline' as const, border: Colors.levelPre };
            case 'primary': return { color: Colors.levelPrimary, icon: 'book-outline' as const, border: Colors.levelPrimary };
            case 'secundary': return { color: Colors.levelSecundary, icon: 'library-outline' as const, border: Colors.levelSecundary };
            default: return { color: Colors.textSecondary, icon: 'school-outline' as const, border: Colors.borderLight };
        }
    };

    // Show skeleton when loading
    const isLoading = loading || !d;

    return (
        <View style={styles.container}>
            {/* Rendimiento General del Año - Matching Odoo year_performance_overview widget */}
            <Card title="Rendimiento General del Año Escolar" delay={0}>
                {isLoading ? (
                    <View style={styles.levelCardsContainer}>
                        <LevelCardSkeleton />
                        <LevelCardSkeleton />
                        <LevelCardSkeleton />
                    </View>
                ) : d?.performanceByLevel?.levels?.length ? (
                    <View style={styles.levelCardsContainer}>
                        {d.performanceByLevel.levels.map((lv, i) => {
                            const style = getLevelStyle(lv.type);
                            const approvalPct = lv.total_students > 0
                                ? (lv.approved_students / lv.total_students * 100)
                                : 0;
                            return (
                                <View key={i} style={[styles.levelCard, { borderColor: style.border }]}>
                                    {/* Header */}
                                    <View style={[styles.levelCardHeader, { backgroundColor: style.color + '10' }]}>
                                        <Ionicons name={style.icon} size={18} color={style.color} />
                                        <Text style={[styles.levelCardTitle, { color: style.color }]}>{lv.name}</Text>
                                    </View>

                                    {/* Stats Row */}
                                    <View style={styles.levelStatsRow}>
                                        <View style={styles.levelStatItem}>
                                            <Text style={styles.levelStatValue}>{lv.total_students}</Text>
                                            <Text style={styles.levelStatLabel}>Estudiantes</Text>
                                        </View>
                                        <View style={styles.levelStatItem}>
                                            <Text style={[styles.levelStatValue, { color: lv.average >= 10 ? Colors.success : Colors.error }]}>
                                                {lv.average?.toFixed(1) || '-'}
                                            </Text>
                                            <Text style={styles.levelStatLabel}>Promedio</Text>
                                        </View>
                                    </View>

                                    {/* Progress Bar */}
                                    <View style={styles.levelProgressContainer}>
                                        <View style={styles.levelProgressBg}>
                                            <View style={[styles.levelProgressFill, { width: `${approvalPct}%`, backgroundColor: Colors.success }]}>
                                                <Text style={styles.levelProgressText}>{lv.approved_students} aprobados</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Footer Stats */}
                                    <View style={styles.levelFooter}>
                                        <View style={styles.levelFooterItem}>
                                            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                                            <Text style={[styles.levelFooterText, { color: Colors.success }]}>
                                                {lv.approval_rate?.toFixed(0) || 0}% aprobación
                                            </Text>
                                        </View>
                                        <View style={styles.levelFooterItem}>
                                            <Ionicons name="close-circle" size={14} color={Colors.error} />
                                            <Text style={[styles.levelFooterText, { color: Colors.error }]}>
                                                {lv.failed_students} reprobados
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                ) : <Empty />}
            </Card>

            <View style={styles.row}>
                {/* Distribución Donut */}
                <View style={styles.halfCol}>
                    <Card title="Distribución" delay={100} style={styles.fullHeight}>
                        {isLoading ? (
                            <ChartSkeleton type="donut" size={140} />
                        ) : distributionData.length > 0 ? (
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
                        {isLoading ? (
                            <ChartSkeleton type="ring" size={140} />
                        ) : d?.approvalRate ? (
                            <View style={styles.gaugeSection}>
                                <RingGauge
                                    percentage={approvalRate}
                                    color={approvalColor}
                                    label="Tasa"
                                    size={140}
                                    strokeWidth={16}
                                />
                                <View style={styles.approvalStats}>
                                    <View style={styles.approvalStatItem}>
                                        <Text style={styles.approvalStatValue}>{d.approvalRate.total}</Text>
                                        <Text style={styles.approvalStatLabel}>Total</Text>
                                    </View>
                                    <View style={styles.approvalStatItem}>
                                        <Text style={[styles.approvalStatValue, { color: Colors.success }]}>{d.approvalRate.approved}</Text>
                                        <Text style={styles.approvalStatLabel}>Aprobados</Text>
                                    </View>
                                    <View style={styles.approvalStatItem}>
                                        <Text style={[styles.approvalStatValue, { color: Colors.error }]}>{d.approvalRate.failed}</Text>
                                        <Text style={styles.approvalStatLabel}>Reprobados</Text>
                                    </View>
                                </View>
                            </View>
                        ) : <Empty />}
                    </Card>
                </View>
            </View>

            {/* Comparativa Chart */}
            <Card title="Comparativa de Secciones" delay={200}>
                {isLoading ? (
                    <ChartSkeleton type="bar" height={180} />
                ) : sectionsGroupedData.length > 0 ? (
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
            <Card title="Detalle de Secciones" delay={300}>
                {isLoading ? (
                    <View style={styles.sectionTable}>
                        <TableRowSkeleton columns={5} />
                        <TableRowSkeleton columns={5} isAlt />
                        <TableRowSkeleton columns={5} />
                        <TableRowSkeleton columns={5} isAlt />
                        <TableRowSkeleton columns={5} />
                    </View>
                ) : d?.sectionsComparison?.sections?.length ? (
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
                ) : <Empty message="Sin secciones" />}
            </Card>

            {/* Top 10 Estudiantes */}
            <Card title="Top 10 Mejores Estudiantes" delay={400} glassmorphism>
                {isLoading ? (
                    <>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <ListRowSkeleton key={i} hasAvatar hasBadge />
                        ))}
                    </>
                ) : d?.topStudentsYear?.top_students?.length ? (
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
    container: { gap: 6 },
    row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    halfCol: { flex: 1 },
    fullHeight: { flex: 1, marginBottom: 0 },

    // Level Performance Cards (Matching Odoo year_performance_overview)
    levelCardsContainer: { gap: 12 },
    levelCard: {
        borderRadius: 12,
        borderWidth: 1.5,
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    levelCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
    },
    levelCardTitle: { fontSize: 14, fontWeight: '700' },
    levelStatsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    levelStatItem: { alignItems: 'center' },
    levelStatValue: { fontSize: 22, fontWeight: '800', color: Colors.textPrimary },
    levelStatLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },
    levelProgressContainer: { paddingHorizontal: 14, marginBottom: 10 },
    levelProgressBg: {
        height: 24,
        backgroundColor: Colors.backgroundTertiary,
        borderRadius: 6,
        overflow: 'hidden',
    },
    levelProgressFill: {
        height: '100%',
        borderRadius: 6,
        justifyContent: 'center',
        paddingHorizontal: 10,
        minWidth: 80,
    },
    levelProgressText: { fontSize: 11, fontWeight: '700', color: '#fff' },
    levelFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    levelFooterItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    levelFooterText: { fontSize: 11, fontWeight: '600' },

    // Gauge section
    gaugeSection: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    approvalStats: { flexDirection: 'row', justifyContent: 'center', width: '100%', marginTop: 16, gap: 10 },
    approvalStatItem: { alignItems: 'center' },
    approvalStatValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
    approvalStatLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

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
