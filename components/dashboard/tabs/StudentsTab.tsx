/**
 * StudentsTab - Replicación exacta del dashboard de Odoo
 * 
 * Secciones:
 * 1. KPI Stats (Total, Inscritos, Aprobados, Reprobados)
 * 2. Distribución (Por Nivel + Por Género)
 * 3. Estado y Rendimiento (Estado Inscripción + Tasa Aprobación)
 * 4. Top 10 Mejores Promedios
 * 5. Estudiantes en Riesgo Académico
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, StudentsTabPerformer } from '../../../services-odoo/dashboardService';
import { ProgressLine } from '../charts';
import {
    ApprovalGaugeSkeleton,
    Card,
    Empty,
    GenderBarSkeleton,
    KPIRowSkeleton,
    LevelDistributionSkeleton,
    RankBadge,
    StateStatsSkeleton,
    TopTableSkeletonPro as TopTableSkeleton
} from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
    skipAnimations?: boolean;
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

// Helper to convert level name to key
const getLevelKey = (name: string): string => {
    switch (name) {
        case 'Preescolar': return 'pre';
        case 'Primaria': return 'primary';
        case 'Media General': return 'secundary';
        case 'Técnico Medio': return 'tecnico';
        default: return 'primary';
    }
};

export const StudentsTab: React.FC<Props> = ({ data: d, loading, skipAnimations: _skipAnimations }) => {
    // DEBUG: Toggle skeleton visibility
    const [forceSkeletons, setForceSkeletons] = useState(false);
    const isLoading = forceSkeletons || loading || !d;
    const studentsData = d?.studentsTabData;

    // Calculate totals and percentages (keep as numbers for width calculations)
    const totalStudents = studentsData?.total || 0;
    const maleCount = studentsData?.by_gender?.M || 0;
    const femaleCount = studentsData?.by_gender?.F || 0;
    const genderTotal = maleCount + femaleCount;
    const malePercent = genderTotal > 0 ? (maleCount / genderTotal) * 100 : 0;
    const femalePercent = genderTotal > 0 ? (femaleCount / genderTotal) * 100 : 0;

    // Approval stats
    const approvedCount = studentsData?.by_approval?.approved || 0;
    const failedCount = studentsData?.by_approval?.failed || 0;
    const approvalTotal = approvedCount + failedCount;
    const approvalRate = approvalTotal > 0 ? (approvedCount / approvalTotal) * 100 : 0;

    // State stats
    const doneCount = studentsData?.by_state?.done || 0;
    const draftCount = studentsData?.by_state?.draft || 0;
    const cancelCount = studentsData?.by_state?.cancel || 0;
    const stateTotal = doneCount + draftCount + cancelCount;
    const donePercent = stateTotal > 0 ? (doneCount / stateTotal) * 100 : 0;
    const draftPercent = stateTotal > 0 ? (draftCount / stateTotal) * 100 : 0;
    const cancelPercent = stateTotal > 0 ? (cancelCount / stateTotal) * 100 : 0;

    return (
        <View style={styles.container}>
            {/* ========================================= */}
            {/* SECCIÓN 1: KPI Stats Cards               */}
            {/* ========================================= */}
            <Card title="Estadísticas de Estudiantes" delay={100}>
                {isLoading ? (
                    <KPIRowSkeleton count={4} />
                ) : (
                    <View style={styles.kpiRow}>
                        {/* Total Estudiantes */}
                        <View style={styles.kpiCard}>
                            <View style={[styles.kpiIcon, { backgroundColor: '#6B7280' + '20' }]}>
                                <Ionicons name="people" size={18} color="#6B7280" />
                            </View>
                            <Text style={styles.kpiValue}>{totalStudents}</Text>
                            <Text style={styles.kpiLabel}>Total Estudiantes</Text>
                        </View>

                        {/* Inscritos */}
                        <View style={styles.kpiCard}>
                            <View style={[styles.kpiIcon, { backgroundColor: Colors.info + '20' }]}>
                                <Ionicons name="checkmark-circle" size={18} color={Colors.info} />
                            </View>
                            <Text style={[styles.kpiValue, { color: Colors.info }]}>{doneCount}</Text>
                            <Text style={styles.kpiLabel}>Inscritos</Text>
                        </View>

                        {/* Aprobados */}
                        <View style={styles.kpiCard}>
                            <View style={[styles.kpiIcon, { backgroundColor: Colors.success + '20' }]}>
                                <Ionicons name="thumbs-up" size={18} color={Colors.success} />
                            </View>
                            <Text style={[styles.kpiValue, { color: Colors.success }]}>{approvedCount}</Text>
                            <Text style={styles.kpiLabel}>Aprobados</Text>
                        </View>

                        {/* Reprobados */}
                        <View style={styles.kpiCard}>
                            <View style={[styles.kpiIcon, { backgroundColor: Colors.error + '20' }]}>
                                <Ionicons name="thumbs-down" size={18} color={Colors.error} />
                            </View>
                            <Text style={[styles.kpiValue, { color: Colors.error }]}>{failedCount}</Text>
                            <Text style={styles.kpiLabel}>Reprobados</Text>
                        </View>
                    </View>
                )}
            </Card>

            {/* ========================================= */}
            {/* SECCIÓN 2: Distribución                  */}
            {/* ========================================= */}
            <View style={styles.twoColumnRow}>
                {/* Distribución por Nivel */}
                <Card title="Distribución por Nivel" style={styles.halfCard} delay={150}>
                    {isLoading ? (
                        <LevelDistributionSkeleton />
                    ) : studentsData?.by_level?.length ? (
                        <View style={styles.levelContainer}>
                            <View style={styles.totalBadge}>
                                <Text style={styles.totalBadgeText}>Total: {totalStudents}</Text>
                            </View>
                            <View style={styles.centeredContent}>
                                {studentsData.by_level.map((level, i) => {
                                    const levelKey = getLevelKey(level.name);
                                    const percent = totalStudents > 0 ? ((level.count / totalStudents) * 100).toFixed(1) : '0.0';
                                    return (
                                        <View key={i} style={styles.levelItem}>
                                            <View style={styles.levelHeader}>
                                                <Text style={styles.levelName}>{level.name}</Text>
                                                <Text style={[styles.levelCount, { color: getLevelColor(levelKey) }]}>
                                                    {level.count}
                                                </Text>
                                            </View>
                                            <ProgressLine
                                                value={parseFloat(percent)}
                                                height={10}
                                                color={getLevelColor(levelKey)}
                                                animate
                                            />
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    ) : <Empty message="Sin datos de niveles" />}
                </Card>

                {/* Distribución por Género */}
                <Card title="Distribución por Género" style={styles.halfCard} delay={200}>
                    {isLoading ? (
                        <GenderBarSkeleton />
                    ) : genderTotal > 0 ? (
                        <View style={styles.genderContainer}>
                            <View style={styles.totalBadge}>
                                <Text style={styles.totalBadgeText}>Total: {genderTotal}</Text>
                            </View>
                            {/* Content centered */}
                            <View style={styles.centeredContent}>
                                {/* Stacked Progress Bar */}
                                <View style={styles.genderBar}>
                                    <View style={[styles.genderSegment, {
                                        width: `${malePercent}%`,
                                        backgroundColor: Colors.primary,
                                        borderTopLeftRadius: 8,
                                        borderBottomLeftRadius: 8,
                                    }]}>
                                        {malePercent > 15 && (
                                            <Text style={styles.genderBarText}>{malePercent.toFixed(1)}%</Text>
                                        )}
                                    </View>
                                    <View style={[styles.genderSegment, {
                                        width: `${femalePercent}%`,
                                        backgroundColor: '#EC4899',
                                        borderTopRightRadius: 8,
                                        borderBottomRightRadius: 8,
                                    }]}>
                                        {femalePercent > 15 && (
                                            <Text style={styles.genderBarText}>{femalePercent.toFixed(1)}%</Text>
                                        )}
                                    </View>
                                </View>
                                {/* Legend */}
                                <View style={styles.genderLegend}>
                                    <View style={styles.genderLegendItem}>
                                        <Ionicons name="male" size={18} color={Colors.primary} />
                                        <Text style={styles.genderLegendValue}>{maleCount}</Text>
                                        <Text style={styles.genderLegendLabel}>Masculino</Text>
                                    </View>
                                    <View style={styles.genderLegendItem}>
                                        <Ionicons name="female" size={18} color="#EC4899" />
                                        <Text style={styles.genderLegendValue}>{femaleCount}</Text>
                                        <Text style={styles.genderLegendLabel}>Femenino</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : <Empty message="Sin datos de género" />}
                </Card>
            </View>

            {/* ========================================= */}
            {/* SECCIÓN 3: Estado y Rendimiento          */}
            {/* ========================================= */}
            <View style={styles.twoColumnRow}>
                {/* Estado de Inscripción */}
                <Card title="Estado de Inscripción" style={styles.halfCard} delay={250}>
                    {isLoading ? (
                        <StateStatsSkeleton />
                    ) : stateTotal > 0 ? (
                        <View style={styles.stateContainer}>
                            <View style={styles.totalBadge}>
                                <Text style={styles.totalBadgeText}>Total: {stateTotal}</Text>
                            </View>
                            <View style={styles.centeredContent}>
                                {/* Inscritos */}
                                <View style={styles.stateItem}>
                                    <View style={styles.stateHeader}>
                                        <View style={styles.stateLabel}>
                                            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                                            <Text style={styles.stateLabelText}>Inscritos</Text>
                                        </View>
                                        <Text style={[styles.stateValue, { color: Colors.success }]}>
                                            {doneCount} ({donePercent.toFixed(1)}%)
                                        </Text>
                                    </View>
                                    <ProgressLine value={donePercent} height={8} color={Colors.success} animate />
                                </View>
                                {/* Pendientes */}
                                <View style={styles.stateItem}>
                                    <View style={styles.stateHeader}>
                                        <View style={styles.stateLabel}>
                                            <Ionicons name="time" size={14} color={Colors.warning} />
                                            <Text style={styles.stateLabelText}>Pendientes</Text>
                                        </View>
                                        <Text style={[styles.stateValue, { color: Colors.warning }]}>
                                            {draftCount} ({draftPercent.toFixed(1)}%)
                                        </Text>
                                    </View>
                                    <ProgressLine value={draftPercent} height={8} color={Colors.warning} animate />
                                </View>
                                {/* Cancelados */}
                                <View style={styles.stateItem}>
                                    <View style={styles.stateHeader}>
                                        <View style={styles.stateLabel}>
                                            <Ionicons name="close-circle" size={14} color={Colors.error} />
                                            <Text style={styles.stateLabelText}>Cancelados</Text>
                                        </View>
                                        <Text style={[styles.stateValue, { color: Colors.error }]}>
                                            {cancelCount} ({cancelPercent.toFixed(1)}%)
                                        </Text>
                                    </View>
                                    <ProgressLine value={cancelPercent} height={8} color={Colors.error} animate />
                                </View>
                            </View>
                        </View>
                    ) : <Empty message="Sin datos de estado" />}
                </Card>

                {/* Tasa de Aprobación */}
                <Card title="Índice de Aprobación" style={styles.halfCard} delay={300}>
                    {isLoading ? (
                        <ApprovalGaugeSkeleton />
                    ) : approvalTotal > 0 ? (
                        <View style={styles.approvalContainer}>
                            <View style={styles.totalBadge}>
                                <Text style={styles.totalBadgeText}>Evaluados: {approvalTotal}</Text>
                            </View>
                            {/* Gauge representation */}
                            <View style={styles.gaugeContainer}>
                                <View style={styles.gaugeBackground}>
                                    <View style={[
                                        styles.gaugeFill,
                                        {
                                            width: `${approvalRate}%`,
                                            backgroundColor: approvalRate >= 70 ? Colors.success :
                                                approvalRate >= 50 ? Colors.warning : Colors.error
                                        }
                                    ]} />
                                </View>
                                <Text style={[
                                    styles.gaugeValue,
                                    {
                                        color: approvalRate >= 70 ? Colors.success :
                                            approvalRate >= 50 ? Colors.warning : Colors.error
                                    }
                                ]}>
                                    {approvalRate.toFixed(1)}%
                                </Text>
                            </View>
                            {/* Stats below */}
                            <View style={styles.approvalStats}>
                                <View style={styles.approvalStatItem}>
                                    <Ionicons name="checkmark" size={16} color={Colors.success} />
                                    <Text style={[styles.approvalStatValue, { color: Colors.success }]}>
                                        {approvedCount}
                                    </Text>
                                    <Text style={styles.approvalStatLabel}>Aprobados</Text>
                                </View>
                                <View style={styles.approvalStatItem}>
                                    <Ionicons name="close" size={16} color={Colors.error} />
                                    <Text style={[styles.approvalStatValue, { color: Colors.error }]}>
                                        {failedCount}
                                    </Text>
                                    <Text style={styles.approvalStatLabel}>Reprobados</Text>
                                </View>
                            </View>
                        </View>
                    ) : <Empty message="Sin datos de aprobación" />}
                </Card>
            </View>

            {/* ========================================= */}
            {/* SECCIÓN 4: Top 10 Mejores Promedios      */}
            {/* ========================================= */}
            <Card title="Top 10 Mejores Promedios" delay={350}>
                {isLoading ? (
                    <TopTableSkeleton rows={10} hasSectionHeaders={false} />
                ) : studentsData?.top_performers?.length ? (
                    <View style={styles.tableContainer}>
                        {/* Table Header */}
                        <View style={[styles.tableRow, styles.tableHeader]}>
                            <Text style={[styles.tableCell, styles.tableCellPos]}>Pos.</Text>
                            <Text style={[styles.tableCell, styles.tableCellName]}>Estudiante</Text>
                            <Text style={[styles.tableCell, styles.tableCellSection]}>Sección</Text>
                            <Text style={[styles.tableCell, styles.tableCellLevel]}>Nivel</Text>
                            <Text style={[styles.tableCell, styles.tableCellAvg]}>Prom.</Text>
                        </View>
                        {/* Table Body */}
                        {studentsData.top_performers.map((st: StudentsTabPerformer, i: number) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={[styles.tableCell, styles.tableCellPos]}>
                                    <RankBadge rank={i + 1} />
                                </View>
                                <Text style={[styles.tableCell, styles.tableCellName, styles.studentName]} numberOfLines={2}>
                                    {st.name}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCellSection, styles.sectionText]} numberOfLines={1}>
                                    {st.section}
                                </Text>
                                <View style={[styles.tableCell, styles.tableCellLevel]}>
                                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(st.level) + '20' }]}>
                                        <Text style={[styles.levelBadgeText, { color: getLevelColor(st.level) }]}>
                                            {st.level === 'pre' ? 'Pre' : st.level === 'primary' ? 'Pri' : 'Med'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.tableCell, styles.tableCellAvg]}>
                                    <View style={[styles.avgBadge, { backgroundColor: Colors.success }]}>
                                        <Text style={styles.avgBadgeText}>
                                            {typeof st.average === 'number' ? st.average.toFixed(1) : '-'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : <Empty message="Sin datos de rendimiento" />}
            </Card>

            {/* ========================================= */}
            {/* SECCIÓN 5: Estudiantes en Riesgo         */}
            {/* ========================================= */}
            <Card title="Estudiantes en Riesgo Académico" delay={400}>
                {isLoading ? (
                    <TopTableSkeleton rows={5} color={Colors.error} hasSectionHeaders={false} />
                ) : studentsData?.at_risk?.length ? (
                    <View style={styles.tableContainer}>
                        {/* Table Header */}
                        <View style={[styles.tableRow, styles.tableHeaderRisk]}>
                            <Text style={[styles.tableCell, styles.tableCellPos]}>Pos.</Text>
                            <Text style={[styles.tableCell, styles.tableCellName]}>Estudiante</Text>
                            <Text style={[styles.tableCell, styles.tableCellSection]}>Sección</Text>
                            <Text style={[styles.tableCell, styles.tableCellLevel]}>Nivel</Text>
                            <Text style={[styles.tableCell, styles.tableCellAvg]}>Prom.</Text>
                        </View>
                        {/* Table Body */}
                        {studentsData.at_risk.map((st: StudentsTabPerformer, i: number) => (
                            <View key={i} style={styles.tableRow}>
                                <View style={[styles.tableCell, styles.tableCellPos]}>
                                    <RankBadge rank={i + 1} highlightTop={false} />
                                </View>
                                <Text style={[styles.tableCell, styles.tableCellName, styles.studentName]} numberOfLines={2}>
                                    {st.name}
                                </Text>
                                <Text style={[styles.tableCell, styles.tableCellSection, styles.sectionText]} numberOfLines={1}>
                                    {st.section}
                                </Text>
                                <View style={[styles.tableCell, styles.tableCellLevel]}>
                                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(st.level) + '20' }]}>
                                        <Text style={[styles.levelBadgeText, { color: getLevelColor(st.level) }]}>
                                            {st.level === 'pre' ? 'Pre' : st.level === 'primary' ? 'Pri' : 'Med'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[styles.tableCell, styles.tableCellAvg]}>
                                    <View style={[styles.avgBadge, { backgroundColor: Colors.error }]}>
                                        <Text style={styles.avgBadgeText}>
                                            {typeof st.average === 'number' ? st.average.toFixed(1) : '-'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.noRiskContainer}>
                        <Ionicons name="shield-checkmark" size={48} color={Colors.success} style={{ opacity: 0.5 }} />
                        <Text style={styles.noRiskTitle}>¡Excelente!</Text>
                        <Text style={styles.noRiskText}>No hay estudiantes en riesgo académico</Text>
                    </View>
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
    container: { gap: 6 },

    // Two column layout
    twoColumnRow: { flexDirection: 'row', gap: 6 },
    halfCard: { flex: 1 },

    // KPI Cards - matching LevelTab style
    kpiRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
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
    kpiIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    kpiValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    kpiLabel: {
        fontSize: 9,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 2,
    },

    // Total badge
    totalBadge: {
        backgroundColor: Colors.backgroundTertiary,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        alignSelf: 'center',
        marginBottom: 12,
    },
    totalBadgeText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '600' },

    // Level distribution
    levelContainer: { flex: 1, alignItems: 'stretch' },
    levelItem: { marginBottom: 10, width: '100%' },
    levelHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    levelName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
    levelCount: { fontSize: 12, fontWeight: '700' },

    // Gender distribution
    genderContainer: { flex: 1, alignItems: 'center' },
    centeredContent: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
    genderBar: {
        flexDirection: 'row',
        height: 24,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
    },
    genderSegment: { justifyContent: 'center', alignItems: 'center' },
    genderBarText: { fontSize: 10, fontWeight: '700', color: '#fff' },
    genderLegend: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
    genderLegendItem: { alignItems: 'center' },
    genderLegendValue: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
    genderLegendLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

    // State distribution
    stateContainer: { flex: 1, alignItems: 'stretch' },
    stateItem: { marginBottom: 10, width: '100%' },
    stateHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    stateLabel: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    stateLabelText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
    stateValue: { fontSize: 11, fontWeight: '700' },

    // Approval gauge
    approvalContainer: { flex: 1, alignItems: 'center' },
    gaugeContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' },
    gaugeBackground: {
        width: '100%',
        height: 16,
        backgroundColor: Colors.backgroundTertiary,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
    },
    gaugeFill: { height: '100%', borderRadius: 8 },
    gaugeValue: { fontSize: 28, fontWeight: '800' },
    approvalStats: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight },
    approvalStatItem: { alignItems: 'center' },
    approvalStatValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },
    approvalStatLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 2 },

    // Table styles
    tableContainer: { marginHorizontal: -16 },
    tableRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    tableHeader: {
        backgroundColor: Colors.success + '10',
        borderBottomWidth: 0,
    },
    tableHeaderRisk: {
        backgroundColor: Colors.error + '10',
        borderBottomWidth: 0,
    },
    tableCell: { paddingHorizontal: 4 },
    tableCellPos: { width: 50 },
    tableCellName: { flex: 1 },
    tableCellSection: { width: 70 },
    tableCellLevel: { width: 50, alignItems: 'center' },
    tableCellAvg: { width: 50, alignItems: 'center' },
    studentName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
    sectionText: { fontSize: 10, color: Colors.textSecondary },
    riskPos: { fontSize: 12, color: Colors.textSecondary },
    levelBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    levelBadgeText: { fontSize: 9, fontWeight: '700' },
    avgBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4 },
    avgBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

    // No risk state
    noRiskContainer: { alignItems: 'center', paddingVertical: 24 },
    noRiskTitle: { fontSize: 16, fontWeight: '700', color: Colors.success, marginTop: 8 },
    noRiskText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
});

export default StudentsTab;

