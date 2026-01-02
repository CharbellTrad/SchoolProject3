/**
 * ProfessorsTab - Exact replication of Odoo Professors tab
 * 
 * Structure from school_year_view.xml:
 * 1. "Estadísticas de Profesores" - KPI Cards + Progress Bar
 * 2. "Top 5 Profesores" - Ranking list
 * 3. "Distribución por Nivel" - Level distribution
 * 4. "Materias con Mayor Dificultad" - Chart + Table (separate cards)
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { ProgressLine } from '../charts';
import {
    Card,
    Empty,
    KPIRowSkeleton,
    MateriasDificultadSkeleton,
    ProfessorsLevelSkeleton,
    ProgressBarSkeleton,
    SubjectDetailSkeleton,
    TopProfesoresSkeleton
} from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
    skipAnimations?: boolean;
}

export const ProfessorsTab: React.FC<Props> = ({ data: d, loading, skipAnimations: _skipAnimations }) => {
    // DEBUG: Toggle skeleton visibility
    const [forceSkeletons, setForceSkeletons] = useState(false);
    const isLoading = forceSkeletons || loading || !d;

    // Main data source - professor_dashboard_json from Odoo
    const dashboard = d?.professorDashboard;

    // KPIs
    const totalProfessors = dashboard?.total_professors ?? 0;
    const totalSubjects = dashboard?.total_subjects ?? 0;
    const totalEvaluations = dashboard?.total_evaluations ?? 0;
    const generalAverage = dashboard?.general_average ?? 0;
    const performancePercent = (generalAverage / 20) * 100;

    // Top 5 Professors
    const topProfessors = dashboard?.top_professors ?? [];

    // Distribution by level
    const distribution = dashboard?.distribution_by_level ?? { pre: 0, primary: 0, secundary: 0, tecnico: 0 };

    // Difficult subjects
    const difficultSubjects = d?.difficultSubjects?.subjects ?? [];

    // Helper functions matching Odoo's widget
    const getAvgColor = (avg: number) => avg >= 15 ? Colors.success : avg >= 10 ? Colors.warning : Colors.error;

    // Medals only for top 3, plain numbers for 4 and 5
    const getMedal = (index: number) => {
        if (index === 0) return '🥇';
        if (index === 1) return '🥈';
        if (index === 2) return '🥉';
        return `${index + 1}`;
    };

    const getInitials = (name: string) => {
        if (!name) return '?';
        const parts = name.split(' ').filter(Boolean);
        return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].substring(0, 2).toUpperCase();
    };

    const getAvatarColor = (name: string) => {
        const colors = ['#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#EA580C', '#16A34A', '#0891B2', '#2563EB'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    };

    // Use Odoo's exact difficulty labels
    const getDifficultyLabel = (rate: number) => {
        if (rate >= 50) return 'Muy Difícil';
        if (rate >= 30) return 'Difícil';
        if (rate >= 15) return 'Moderada';
        return 'Normal';
    };

    const getDifficultyColor = (rate: number) => {
        if (rate >= 50) return Colors.error;
        if (rate >= 30) return Colors.warning;
        if (rate >= 15) return Colors.info;
        return Colors.success;
    };

    // Get gradient color based on failure rate (like Odoo)
    const getBarColor = (rate: number) => {
        // Gradient from orange (low) to red (high)
        const r = 220 + Math.min(35, rate * 0.35);
        const g = Math.max(60, 180 - rate * 1.8);
        const b = 60;
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    };

    return (
        <View style={styles.container}>
            {/* ========================================= */}
            {/* SECCIÓN 1: Estadísticas de Profesores    */}
            {/* ========================================= */}
            <Card title="Estadísticas de Profesores" delay={100}>
                {isLoading ? (
                    <>
                        <KPIRowSkeleton count={4} />
                        <ProgressBarSkeleton />
                    </>
                ) : (
                    <>
                        {/* KPI Cards - All 4 horizontal */}
                        <View style={styles.kpiRow}>
                            {/* Total Profesores */}
                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcon, { backgroundColor: '#6B728020' }]}>
                                    <Ionicons name="people" size={16} color="#6B7280" />
                                </View>
                                <Text style={styles.kpiValue}>{totalProfessors}</Text>
                                <Text style={styles.kpiLabel}>Profesores</Text>
                            </View>
                            {/* Materias - grey icon */}
                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcon, { backgroundColor: Colors.primary + '20' }]}>
                                    <Ionicons name="book" size={16} color={Colors.primary} />
                                </View>
                                <Text style={[styles.kpiValue, { color: Colors.primary }]}>{totalSubjects}</Text>
                                <Text style={styles.kpiLabel}>Materias</Text>
                            </View>
                            {/* Evaluaciones - grey icon */}
                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcon, { backgroundColor: Colors.info + '20' }]}>
                                    <Ionicons name="clipboard" size={16} color={Colors.info} />
                                </View>
                                <Text style={[styles.kpiValue, { color: Colors.info }]}>{totalEvaluations}</Text>
                                <Text style={styles.kpiLabel}>Evaluaciones</Text>
                            </View>
                            {/* Promedio */}
                            <View style={styles.kpiCard}>
                                <View style={[styles.kpiIcon, { backgroundColor: getAvgColor(generalAverage) + '20' }]}>
                                    <Ionicons name="trending-up" size={16} color={getAvgColor(generalAverage)} />
                                </View>
                                <Text style={[styles.kpiValue, { color: getAvgColor(generalAverage) }]}>
                                    {generalAverage.toFixed(1)}
                                </Text>
                                <Text style={styles.kpiLabel}>Promedio</Text>
                            </View>
                        </View>

                        {/* Progress Bar - Rendimiento General */}
                        <View style={styles.progressSection}>
                            <View style={styles.progressHeader}>
                                <Text style={styles.progressLabel}>Rendimiento General del Profesorado</Text>
                                <Text style={[styles.progressPercent, { color: getAvgColor(generalAverage) }]}>
                                    {performancePercent.toFixed(1)}%
                                </Text>
                            </View>
                            <ProgressLine
                                value={performancePercent}
                                height={10}
                                color={getAvgColor(generalAverage)}
                                animate
                            />
                        </View>
                    </>
                )}
            </Card>

            {/* ========================================= */}
            {/* SECCIÓN 2: Top 5 Profesores              */}
            {/* ========================================= */}
            <Card title="Top 5 Profesores" delay={200}>
                {isLoading ? (
                    <TopProfesoresSkeleton />
                ) : topProfessors.length > 0 ? (
                    <View style={styles.top5List}>
                        {topProfessors.map((prof, i) => (
                            <View key={i} style={[styles.profRow, i < topProfessors.length - 1 && styles.profRowBorder]}>
                                <View style={styles.rankContainer}>
                                    <Text style={[styles.medal, i >= 3 && styles.medalPlain]}>{getMedal(i)}</Text>
                                </View>
                                {/* Avatar */}
                                <View style={[styles.avatar, { backgroundColor: getAvatarColor(prof.professor_name) }]}>
                                    <Text style={styles.avatarText}>{getInitials(prof.professor_name)}</Text>
                                </View>
                                {/* Info */}
                                <View style={styles.profInfo}>
                                    <Text style={styles.profName} numberOfLines={1}>{prof.professor_name}</Text>
                                    <View style={styles.profStatsRow}>
                                        <Ionicons name="book-outline" size={10} color={Colors.textTertiary} />
                                        <Text style={styles.profStats}>{prof.subjects_count} materias</Text>
                                        <Text style={styles.profStatsDot}>•</Text>
                                        <Ionicons name="clipboard-outline" size={10} color={Colors.textTertiary} />
                                        <Text style={styles.profStats}>{prof.evaluations_count} eval.</Text>
                                    </View>
                                </View>
                                {/* Average Badge */}
                                <View style={[styles.avgBadge, { backgroundColor: getAvgColor(prof.average) }]}>
                                    <Text style={styles.avgBadgeText}>{prof.average.toFixed(1)}/20</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                ) : <Empty message="Sin datos de profesores" />}
            </Card>

            {/* ========================================= */}
            {/* SECCIÓN 3: Distribución por Nivel        */}
            {/* ========================================= */}
            <Card title="Distribución por Nivel" delay={250}>
                {isLoading ? (
                    <ProfessorsLevelSkeleton />
                ) : (
                    <View style={styles.distributionList}>
                        {/* Preescolar */}
                        <View style={styles.levelRow}>
                            <View style={styles.levelInfo}>
                                <View style={[styles.iconPlaceholder, { backgroundColor: Colors.levelPre + '15' }]}>
                                    <Ionicons name="happy" size={18} color={Colors.levelPre} />
                                </View>
                                <Text style={styles.levelName}>Preescolar</Text>
                            </View>
                            <View style={[styles.levelBadge, { backgroundColor: Colors.levelPre }]}>
                                <Text style={styles.levelBadgeText}>{distribution.pre} profesores</Text>
                            </View>
                        </View>
                        {/* Primaria */}
                        <View style={styles.levelRow}>
                            <View style={styles.levelInfo}>
                                <View style={[styles.iconPlaceholder, { backgroundColor: Colors.levelPrimary + '15' }]}>
                                    <Ionicons name="book" size={18} color={Colors.levelPrimary} />
                                </View>
                                <Text style={styles.levelName}>Primaria</Text>
                            </View>
                            <View style={[styles.levelBadge, { backgroundColor: Colors.levelPrimary }]}>
                                <Text style={styles.levelBadgeText}>{distribution.primary} profesores</Text>
                            </View>
                        </View>
                        {/* Media General */}
                        <View style={styles.levelRow}>
                            <View style={styles.levelInfo}>
                                <View style={[styles.iconPlaceholder, { backgroundColor: Colors.levelSecundary + '15' }]}>
                                    <Ionicons name="school" size={18} color={Colors.levelSecundary} />
                                </View>
                                <Text style={styles.levelName}>Media General</Text>
                            </View>
                            <View style={[styles.levelBadge, { backgroundColor: Colors.levelSecundary }]}>
                                <Text style={styles.levelBadgeText}>{distribution.secundary} profesores</Text>
                            </View>
                        </View>
                        {/* Técnico Medio */}
                        <View style={[styles.levelRow, { borderBottomWidth: 0 }]}>
                            <View style={styles.levelInfo}>
                                <View style={[styles.iconPlaceholder, { backgroundColor: Colors.levelTecnico + '15' }]}>
                                    <Ionicons name="construct" size={18} color={Colors.levelTecnico} />
                                </View>
                                <Text style={styles.levelName}>Técnico Medio</Text>
                            </View>
                            <View style={[styles.levelBadge, { backgroundColor: Colors.levelTecnico }]}>
                                <Text style={styles.levelBadgeText}>{distribution.tecnico} profesores</Text>
                            </View>
                        </View>
                    </View>
                )}
            </Card>

            {/* ========================================= */}
            {/* SECCIÓN 4: Materias con Mayor Dificultad */}
            {/* ========================================= */}
            {/* Chart Card - Custom horizontal bars */}
            <Card title="Top 10 Materias con Mayor Dificultad" delay={300}>
                {isLoading ? (
                    <MateriasDificultadSkeleton />
                ) : difficultSubjects.length > 0 ? (
                    <View style={styles.horizontalChart}>
                        {difficultSubjects.slice(0, 10).map((s, i) => (
                            <View key={i} style={styles.horizontalBarRow}>
                                <Text style={styles.horizontalBarLabel} numberOfLines={2}>
                                    {s.subject_name}
                                </Text>
                                <View style={styles.horizontalBarContainer}>
                                    <View
                                        style={[
                                            styles.horizontalBar,
                                            {
                                                width: `${s.failure_rate}%`,
                                                backgroundColor: getBarColor(s.failure_rate)
                                            }
                                        ]}
                                    />
                                </View>
                                <Text style={styles.horizontalBarValue}>{s.failure_rate}%</Text>
                            </View>
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptySuccess}>
                        <Ionicons name="checkmark-circle" size={32} color={Colors.success} />
                        <Text style={styles.emptySuccessText}>¡Excelente! No hay materias con alta tasa de reprobación.</Text>
                    </View>
                )}
            </Card>

            {/* Table Card - Detalle de Materias */}
            {difficultSubjects.length > 0 && (
                <Card title="Detalle de Materias" delay={350}>
                    {isLoading ? (
                        <SubjectDetailSkeleton rows={5} />
                    ) : (
                        <View style={styles.table}>
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderCell, { flex: 2.5 }]}>Materia</Text>
                                <Text style={[styles.tableHeaderCell, styles.centerText]}>Rep.</Text>
                                <Text style={[styles.tableHeaderCell, styles.centerText]}>Total</Text>
                                <Text style={[styles.tableHeaderCell, styles.centerText]}>Prom.</Text>
                                <Text style={[styles.tableHeaderCell, { flex: 1.3, textAlign: 'center' }]}>Dificultad</Text>
                            </View>
                            <ScrollView style={{ maxHeight: 250 }} nestedScrollEnabled>
                                {difficultSubjects.slice(0, 10).map((s, i) => (
                                    <View key={i} style={[styles.tableRow, i % 2 !== 0 && styles.tableRowAlt]}>
                                        <View style={[styles.tableCellContainer, { flex: 2.5 }]}>
                                            <Ionicons name="book-outline" size={12} color={Colors.textTertiary} style={{ marginRight: 4 }} />
                                            <Text style={styles.tableCellName} numberOfLines={2}>{s.subject_name}</Text>
                                        </View>
                                        <Text style={[styles.tableCell, styles.centerText, { color: Colors.error, fontWeight: '700' }]}>
                                            {s.failed_students}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.centerText]}>{s.total_students}</Text>
                                        <Text style={[styles.tableCell, styles.centerText]}>{s.average}/20</Text>
                                        <View style={{ flex: 1.3, alignItems: 'center' }}>
                                            <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(s.failure_rate) }]}>
                                                <Text style={styles.difficultyText}>
                                                    {getDifficultyLabel(s.failure_rate)}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    )}
                </Card>
            )}

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

    // Progress Bar
    progressSection: { marginTop: 12 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
    progressLabel: { fontSize: 10, color: Colors.textSecondary },
    progressPercent: { fontSize: 11, fontWeight: '700' },

    // Top 5 List
    top5List: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
    profRow: { flexDirection: 'row', alignItems: 'center', padding: 10, gap: 10 },
    profRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    rankContainer: { width: 30, alignItems: 'center', justifyContent: 'center' },
    medal: { fontSize: 20, textAlign: 'center' },
    medalPlain: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
    avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    avatarText: { fontSize: 12, fontWeight: '700', color: '#fff' },
    profInfo: { flex: 1, minWidth: 0 },
    profName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    profStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 3 },
    profStats: { fontSize: 10, color: Colors.textTertiary },
    profStatsDot: { fontSize: 10, color: Colors.textTertiary, marginHorizontal: 2 },
    avgBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    avgBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },

    // Distribution List
    distributionList: { backgroundColor: '#fff', borderRadius: 10, overflow: 'hidden' },
    levelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    levelInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    iconPlaceholder: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    levelName: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary },
    levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    levelBadgeText: { fontSize: 10, fontWeight: '600', color: '#fff' },

    // Horizontal Bar Chart (like Odoo)
    horizontalChart: { gap: 4 },
    horizontalBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28, paddingVertical: 4 },
    horizontalBarLabel: { width: 100, fontSize: 10, fontWeight: '500', color: Colors.textPrimary },
    horizontalBarContainer: { flex: 1, height: 14, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden' },
    horizontalBar: { height: '100%', borderRadius: 4 },
    horizontalBarValue: { width: 36, fontSize: 10, fontWeight: '700', color: Colors.error, textAlign: 'right' },

    // Chart Container
    chartContainer: { paddingVertical: 8 },

    // Table
    table: { borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight },
    tableHeader: { flexDirection: 'row', backgroundColor: Colors.backgroundTertiary, paddingVertical: 10, paddingHorizontal: 8 },
    tableHeaderCell: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', flex: 1 },
    tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', backgroundColor: '#fff' },
    tableRowAlt: { backgroundColor: Colors.backgroundTertiary },
    tableCellContainer: { flexDirection: 'row', alignItems: 'flex-start', flex: 1 },
    tableCellName: { fontSize: 11, color: Colors.textPrimary, flex: 1, lineHeight: 14 },
    tableCell: { fontSize: 11, color: Colors.textPrimary, flex: 1 },
    centerText: { textAlign: 'center' },
    difficultyBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
    difficultyText: { fontSize: 9, fontWeight: '700', color: '#fff' },

    // Empty success state
    emptySuccess: { alignItems: 'center', padding: 20, gap: 8 },
    emptySuccessText: { fontSize: 12, color: Colors.success, textAlign: 'center', fontWeight: '500' },
});

export default ProfessorsTab;