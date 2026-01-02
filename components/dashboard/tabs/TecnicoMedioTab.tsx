/**
 * TecnicoMedioTab - Odoo-style Técnico Medio dashboard
 * Uses levelDashboard data directly for KPIs (matching Odoo's level_dashboard_kpi widget)
 * Features: 4 KPI cards, approval progress bar, mentions tags, table-style Top 3 by mention
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, LevelDashboard } from '../../../services-odoo/dashboardService';
import { slideUpFadeIn } from '../animations';
import { DonutChart } from '../charts';
import {
    Card,
    ConfigRowSkeleton,
    Empty,
    KPIRowSkeleton,
    ProgressBarSkeleton,
    RendimientoSkeleton,
    TopTableSkeletonPro as TopTableSkeleton
} from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
    skipAnimations?: boolean;
}

export const TecnicoMedioTab: React.FC<Props> = ({ data: d, loading, skipAnimations }) => {
    // Get Técnico Medio dashboard directly
    const levelDashboard: LevelDashboard | undefined = d?.secundaryTecnicoDashboard;

    // Get KPIs from levelDashboard first, fallback to individual counts
    const students = levelDashboard?.total_students ?? d?.studentsByLevel.tecnicoCount ?? 0;
    const approved = levelDashboard?.approved_count ?? d?.approvedByLevel.tecnicoCount ?? 0;
    const failed = levelDashboard?.failed_count ?? (students - approved);
    const approvalPct = levelDashboard?.approval_rate ?? (students > 0 ? (approved / students) * 100 : 0);

    // Get performance data for average - find from levels array
    const tecnicoPerformance = d?.performanceByLevel?.levels?.find(l => l.type === 'tecnico');
    const generalAverage = tecnicoPerformance?.average ?? 0;

    // DEBUG: Toggle skeleton visibility
    const [forceSkeletons, setForceSkeletons] = useState(false);
    const isLoading = forceSkeletons || loading || !d;

    // Get unique mentions from tecnicoStudentPreviews
    const mentionNames = React.useMemo(() => {
        if (!d?.tecnicoStudentPreviews?.length) return [];
        const uniqueMentions = new Set<string>();
        d.tecnicoStudentPreviews.forEach(st => {
            if (st.mentionName) uniqueMentions.add(st.mentionName);
        });
        return Array.from(uniqueMentions);
    }, [d?.tecnicoStudentPreviews]);

    // Animation for KPI Row
    const kpiAnim = useRef(new Animated.Value(0)).current;
    const kpiOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (skipAnimations) {
            kpiAnim.setValue(0);
            kpiOpacity.setValue(1);
        } else {
            slideUpFadeIn(kpiAnim, kpiOpacity, 300, 100).start();
        }
    }, [skipAnimations]);

    // Get progress bar color based on approval rate
    const getProgressColor = (rate: number) => {
        if (rate >= 80) return Colors.success;
        if (rate >= 60) return '#FFA500';
        return Colors.error;
    };

    // Get avatar color from name
    const getAvatarColor = (name: string) => {
        const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
        const index = name.charCodeAt(0) % colors.length;
        return colors[index];
    };

    // Get initials from name
    const getInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    // Get display value for student average
    const getDisplayValue = (student: { average: string | number; use_literal?: boolean }) => {
        if (student.use_literal) {
            return student.average;
        }
        return typeof student.average === 'number' ? student.average.toFixed(1) : student.average;
    };

    return (
        <View style={styles.container}>
            {/* Configuración de Evaluación */}
            <Card title="Configuración de Evaluación" delay={0}>
                {isLoading ? (
                    <ConfigRowSkeleton />
                ) : d?.evaluationConfigs.secundary ? (
                    <View style={styles.configRow}>
                        <View style={[styles.configIcon, { backgroundColor: Colors.levelTecnico + '15' }]}>
                            <Ionicons name="construct-outline" size={20} color={Colors.levelTecnico} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.configText}>{d.evaluationConfigs.secundary.name}</Text>
                            <Text style={styles.configSub}>Sistema de evaluación técnica</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                ) : (
                    <Text style={styles.configEmpty}>Sin configuración (usa Media General)</Text>
                )}
            </Card>

            {/* 4 KPI Cards Row - Using levelDashboard data */}
            <Card title="Estadísticas de Estudiantes" delay={50}>
                {isLoading ? (
                    <KPIRowSkeleton count={4} />
                ) : (
                    <Animated.View style={[styles.kpiRow, { transform: [{ translateY: kpiAnim }], opacity: kpiOpacity }]}>
                        {/* Total Estudiantes */}
                        <View style={styles.kpiCard}>
                            <View style={[styles.kpiIcon, { backgroundColor: '#6B7280' + '20' }]}>
                                <Ionicons name="people" size={18} color="#6B7280" />
                            </View>
                            <Text style={styles.kpiValue}>{isLoading ? '-' : students}</Text>
                            <Text style={styles.kpiLabel}>Total Estudiantes</Text>
                        </View>

                        {/* Aprobados */}
                        <View style={styles.kpiCard}>
                            <View style={[styles.kpiIcon, { backgroundColor: Colors.success + '20' }]}>
                                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                            </View>
                            <Text style={[styles.kpiValue, { color: Colors.success }]}>{isLoading ? '-' : approved}</Text>
                            <Text style={styles.kpiLabel}>Aprobados</Text>
                        </View>

                        {/* Reprobados */}
                        <View style={styles.kpiCard}>
                            <View style={[styles.kpiIcon, { backgroundColor: Colors.error + '20' }]}>
                                <Ionicons name="close-circle" size={18} color={Colors.error} />
                            </View>
                            <Text style={[styles.kpiValue, { color: Colors.error }]}>{isLoading ? '-' : failed}</Text>
                            <Text style={styles.kpiLabel}>Reprobados</Text>
                        </View>

                        {/* Menciones */}
                        <View style={styles.kpiCard}>
                            <View style={[styles.kpiIcon, { backgroundColor: Colors.primary + '20' }]}>
                                <Ionicons name="school" size={18} color={Colors.primary} />
                            </View>
                            <Text style={[styles.kpiValue, { color: Colors.primary }]}>{isLoading ? '-' : mentionNames.length}</Text>
                            <Text style={styles.kpiLabel}>Menciones</Text>
                        </View>
                    </Animated.View>
                )}
            </Card>

            {/* Approval Progress Bar */}
            <Card title="Tasa de Aprobación" delay={75}>
                {isLoading ? (
                    <ProgressBarSkeleton />
                ) : (
                    <View>
                        <View style={styles.progressHeader}>
                            <Text style={styles.progressLabel}>Porcentaje de Aprobación</Text>
                            <Text style={[styles.progressPercent, { color: getProgressColor(approvalPct) }]}>
                                {approvalPct.toFixed(1)}%
                            </Text>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${approvalPct}%`,
                                        backgroundColor: getProgressColor(approvalPct)
                                    }
                                ]}
                            />
                        </View>
                    </View>
                )}
            </Card>

            {/* Menciones de Técnico Medio - TAGS */}
            <Card title="Menciones de Técnico Medio" delay={100}>
                {isLoading ? (
                    <View style={styles.tagsContainer}>
                        <View style={styles.tagSkeleton} />
                        <View style={styles.tagSkeleton} />
                        <View style={styles.tagSkeleton} />
                    </View>
                ) : mentionNames.length > 0 ? (
                    <View style={styles.tagsContainer}>
                        {mentionNames.map((mention, i) => (
                            <View key={i} style={[styles.mentionTag, { backgroundColor: Colors.levelTecnico + '15' }]}>
                                <Ionicons name="school" size={14} color={Colors.levelTecnico} />
                                <Text style={[styles.mentionTagText, { color: Colors.levelTecnico }]}>{mention}</Text>
                            </View>
                        ))}
                    </View>
                ) : <Empty message="Sin menciones registradas" />}
            </Card>

            {/* Rendimiento de Técnico Medio - Matches LevelTab layout */}
            <Card title="Rendimiento de Técnico Medio" delay={150}>
                {isLoading ? (
                    <RendimientoSkeleton size={100} type="numeric" />
                ) : (
                    <View style={styles.numericDisplay}>
                        {/* Side by side: Chart Left, Stats Right */}
                        <View style={styles.rendimientoRow}>
                            {/* Left: Chart with Total in center and legend below */}
                            <View style={styles.chartColumn}>
                                <DonutChart
                                    data={[
                                        { label: 'Aprobados', value: approved || 0, color: Colors.success },
                                        { label: 'Reprobados', value: failed || 0, color: Colors.error },
                                    ]}
                                    centerValue={students || 0}
                                    centerLabel="Total"
                                    radius={60}
                                    innerRadius={35}
                                    showLegend={true}
                                />
                            </View>

                            {/* Right: Average + State Badge */}
                            <View style={styles.statsColumn}>
                                {/* Average Display */}
                                <View style={styles.averageContainer}>
                                    <Text style={styles.averageLabel}>Promedio General</Text>
                                    <View style={styles.averageRow}>
                                        <Text style={[
                                            styles.averageValue,
                                            { color: generalAverage >= 10 ? Colors.success : Colors.error }
                                        ]}>
                                            {generalAverage.toFixed(1)}
                                        </Text>
                                        <Text style={styles.averageSuffix}>/20</Text>
                                    </View>
                                </View>

                                {/* State Badge */}
                                <View style={[
                                    styles.stateBadge,
                                    { backgroundColor: generalAverage >= 10 ? Colors.success : Colors.error }
                                ]}>
                                    <Ionicons
                                        name={generalAverage >= 10 ? 'checkmark' : 'close'}
                                        size={14}
                                        color="#fff"
                                    />
                                    <Text style={styles.stateBadgeText}>
                                        {generalAverage >= 10 ? 'Aprobado' : 'Reprobado'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </Card>

            {/* Top 3 Estudiantes por Mención - TABLE style like Odoo */}
            <Card title="Top 3 Estudiantes por Mención" delay={200}>
                {isLoading ? (
                    <TopTableSkeleton rows={6} color={Colors.levelTecnico} />
                ) : levelDashboard?.top_students_by_section?.length ? (
                    <View style={styles.tableContainer}>
                        {/* Table Header */}
                        <View style={[styles.tableHeader, { backgroundColor: Colors.levelTecnico }]}>
                            <Text style={[styles.tableHeaderText, { width: 40 }]}>Pos.</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Estudiante</Text>
                            <Text style={[styles.tableHeaderText, { width: 70, textAlign: 'right' }]}>Promedio</Text>
                        </View>

                        {/* Table Body */}
                        {levelDashboard.top_students_by_section.map((sec, secIndex) => (
                            <View key={secIndex}>
                                {/* Section/Mention Header Row */}
                                <View style={styles.sectionHeaderRow}>
                                    <Ionicons name="school" size={12} color={Colors.levelTecnico} style={{ marginRight: 6 }} />
                                    <Text style={styles.sectionHeaderText}>{sec.section_name}</Text>
                                </View>

                                {/* Students */}
                                {sec.top_3.map((st, stIndex) => (
                                    <View key={stIndex} style={styles.studentRow}>
                                        {/* Position Badge */}
                                        <View style={{ width: 40, alignItems: 'center' }}>
                                            {stIndex === 0 ? (
                                                <View style={[styles.positionBadge, styles.goldBadge]}>
                                                    <Ionicons name="trophy" size={10} color="#B8860B" />
                                                </View>
                                            ) : stIndex === 1 ? (
                                                <View style={[styles.positionBadge, styles.silverBadge]}>
                                                    <Ionicons name="star" size={10} color="#666" />
                                                </View>
                                            ) : stIndex === 2 ? (
                                                <View style={[styles.positionBadge, styles.bronzeBadge]}>
                                                    <Ionicons name="star" size={10} color="#fff" />
                                                </View>
                                            ) : (
                                                <Text style={styles.positionText}>{stIndex + 1}</Text>
                                            )}
                                        </View>

                                        {/* Student Name with Avatar */}
                                        <View style={styles.studentInfo}>
                                            <View style={[styles.avatar, { backgroundColor: getAvatarColor(st.student_name) }]}>
                                                <Text style={styles.avatarText}>{getInitials(st.student_name)}</Text>
                                            </View>
                                            <Text style={styles.studentName} numberOfLines={2}>{st.student_name}</Text>
                                        </View>

                                        {/* Average Badge */}
                                        <View style={styles.averageBadge}>
                                            <Text style={styles.averageText}>{getDisplayValue(st)}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        ))}
                    </View>
                ) : <Empty message="Sin datos de estudiantes" />}
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

    // Config Card
    configRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    configIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    configText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
    configSub: { fontSize: 12, color: Colors.textSecondary },
    configEmpty: { fontSize: 13, color: Colors.textTertiary, fontStyle: 'italic' },

    // KPI Cards Row
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

    // Progress Bar
    progressContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '700',
    },
    progressBar: {
        height: 10,
        backgroundColor: '#E5E7EB',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },

    // Mentions Tags
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-around' },
    mentionTag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6
    },
    mentionTagText: { fontSize: 13, fontWeight: '600' },
    tagSkeleton: {
        width: 100,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.skeleton.base
    },

    // Performance - Numeric (matches Odoo general_performance_graph)
    numericDisplay: {
        paddingVertical: 8,
    },
    rendimientoRow: {
        flexDirection: 'row',
        gap: 16,
    },
    chartColumn: {
        flex: 1,
    },
    statsColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    averageContainer: {
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    averageLabel: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    averageRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    averageValue: {
        fontSize: 32,
        fontWeight: '800',
    },
    averageSuffix: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginLeft: 2,
    },
    stateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    stateBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },

    // Table styles
    tableContainer: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    tableHeaderText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#fff',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#E8E8E8',
    },
    sectionHeaderText: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    studentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    positionBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    goldBadge: {
        backgroundColor: '#FFD700',
    },
    silverBadge: {
        backgroundColor: '#C0C0C0',
    },
    bronzeBadge: {
        backgroundColor: '#CD7F32',
    },
    positionText: {
        fontSize: 11,
        color: Colors.textTertiary,
    },
    studentInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    studentName: {
        fontSize: 13,
        color: Colors.textPrimary,
        flex: 1,
    },
    averageBadge: {
        backgroundColor: Colors.success,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    averageText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
});

export default TecnicoMedioTab;
