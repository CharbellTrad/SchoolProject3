/**
 * LevelTab - Odoo-style level dashboard
 * Uses levelDashboard data directly for KPIs (matching Odoo's level_dashboard_kpi widget)
 * Features: 4 KPI cards, approval progress bar, Grados tags, Rendimiento by type, table-style Top 3 students
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, LevelDashboard, PreObservationItem, SectionPreview } from '../../../services-odoo/dashboardService';
import { slideUpFadeIn } from '../animations';
import { DonutChart } from '../charts';
import {
    Card,
    ConfigRowSkeleton,
    Empty,
    GradeTagsSkeleton,
    KPIRowSkeleton,
    ProgressBarSkeleton,
    RendimientoSkeleton,
    TimelineSkeleton,
    TopTableSkeletonPro as TopTableSkeleton
} from '../ui';

interface Props {
    level: 'secundary' | 'primary' | 'pre';
    levelName: string;
    data: DashboardData | null;
    color: string;
    loading?: boolean;
    skipAnimations?: boolean;
}

export const LevelTab: React.FC<Props> = ({ level, levelName, data: d, color, loading, skipAnimations }) => {
    // Get level-specific dashboard directly (contains all KPI data as per Odoo)
    const levelDashboard: LevelDashboard | undefined = level === 'secundary'
        ? d?.secundaryGeneralDashboard
        : level === 'primary'
            ? d?.primaryDashboard
            : d?.preDashboard;

    // Get KPIs from levelDashboard first, fallback to individual counts
    const students = levelDashboard?.total_students ?? (
        level === 'secundary' ? d?.studentsByLevel.secundaryCount
            : level === 'primary' ? d?.studentsByLevel.primaryCount
                : d?.studentsByLevel.preCount
    );
    const approved = levelDashboard?.approved_count ?? (
        level === 'secundary' ? d?.approvedByLevel.secundaryCount
            : level === 'primary' ? d?.approvedByLevel.primaryCount
                : d?.approvedByLevel.preCount
    );
    const failed = levelDashboard?.failed_count ?? ((students || 0) - (approved || 0));


    // Sections count from sectionsByLevel (correct count including A/B/C sections)
    const sections = level === 'secundary' ? d?.sectionsByLevel.secundaryCount
        : level === 'primary' ? d?.sectionsByLevel.primaryCount
            : d?.sectionsByLevel.preCount;

    // Section previews for the tags display
    const sectionPreviews = d?.sectionPreviews?.[level] || [];

    // Approval rate from levelDashboard or calculate
    const approvalPct = levelDashboard?.approval_rate ?? (
        students && students > 0 ? ((approved || 0) / students) * 100 : 0
    );

    // Evaluation config and type
    const evalConfig = level === 'secundary' ? d?.evaluationConfigs.secundary
        : level === 'primary' ? d?.evaluationConfigs.primary
            : d?.evaluationConfigs.pre;
    const evaluationType = levelDashboard?.evaluation_type || '20';
    const useLiteral = levelDashboard?.use_literal || level === 'primary';

    // Level-specific performance for Rendimiento section
    const levelPerformance = level === 'secundary' ? d?.secundaryPerformance
        : level === 'primary' ? d?.primaryPerformance
            : d?.prePerformance;

    // Preschool observations timeline
    const preObservations = level === 'pre' ? d?.preObservationsTimeline : null;

    // DEBUG: Toggle skeleton visibility
    const [forceSkeletons, setForceSkeletons] = useState(false);
    const isLoading = forceSkeletons || loading || !d;

    // Level title for Grados section
    const gradosTitle = level === 'secundary' ? 'Grados de Media General'
        : level === 'primary' ? 'Grados de Primaria'
            : 'Grados de Preescolar';
    const sectionsLabel = level === 'pre' ? 'Grupos' : 'Secciones';

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

    // Get literal description
    const getLiteralDescription = (literal: string) => {
        const descriptions: Record<string, string> = {
            'A': 'Excelente',
            'B': 'Muy Bueno',
            'C': 'Bueno',
            'D': 'Regular',
            'E': 'Insuficiente'
        };
        return descriptions[literal] || '';
    };

    // Get display value for student average
    const getDisplayValue = (student: { average: string | number; use_literal?: boolean }) => {
        if (student.use_literal || useLiteral) {
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
                ) : evalConfig ? (
                    <View style={styles.configRow}>
                        <View style={[styles.configIcon, { backgroundColor: color + '15' }]}>
                            <Ionicons name="settings-outline" size={20} color={color} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.configText}>{evalConfig.name}</Text>
                            <Text style={styles.configSub}>Sistema de evaluación activo</Text>
                        </View>
                        <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                    </View>
                ) : (
                    <Text style={styles.configEmpty}>Sin configuración de evaluación</Text>
                )}
            </Card>

            {/* 4 KPI Cards Row - Using levelDashboard data directly */}
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
                            <Text style={styles.kpiValue}>{isLoading ? '-' : students ?? 0}</Text>
                            <Text style={styles.kpiLabel}>Total Estudiantes</Text>
                        </View>

                        {/* Aprobados */}
                        <View style={styles.kpiCard}>
                            <View style={[styles.kpiIcon, { backgroundColor: Colors.success + '20' }]}>
                                <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                            </View>
                            <Text style={[styles.kpiValue, { color: Colors.success }]}>{isLoading ? '-' : approved ?? 0}</Text>
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

                        {/* Secciones */}
                        <View style={styles.kpiCard}>
                            <View style={[styles.kpiIcon, { backgroundColor: Colors.primary + '20' }]}>
                                <Ionicons name="grid" size={18} color={Colors.primary} />
                            </View>
                            <Text style={[styles.kpiValue, { color: Colors.primary }]}>{isLoading ? '-' : sections ?? 0}</Text>
                            <Text style={styles.kpiLabel}>{sectionsLabel}</Text>
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

            {/* Grados/Secciones Tags */}
            <Card title={gradosTitle} delay={100}>
                {isLoading ? (
                    <GradeTagsSkeleton count={6} />
                ) : sectionPreviews.length > 0 ? (
                    <View style={styles.tagsContainer}>
                        {sectionPreviews.map((sec: SectionPreview, i) => (
                            <View key={i} style={[styles.gradeTag, { backgroundColor: color + '15' }]}>
                                <Text style={[styles.gradeTagText, { color }]}>{sec.sectionName}</Text>
                            </View>
                        ))}
                    </View>
                ) : <Empty message="Sin grados registrados" />}
            </Card>

            {/* Rendimiento - Only show for non-Preescolar levels (Preescolar has no grades) */}
            {level !== 'pre' && (
                <Card title={`Rendimiento de ${levelName}`} delay={150} style={{ justifyContent: 'center' }}>
                    {isLoading ? (
                        <RendimientoSkeleton size={100} type={level === 'primary' ? 'literal' : 'numeric'} />
                    ) : level === 'primary' && useLiteral ? (
                        // LITERAL TYPE - Primaria (matches Odoo general_performance_graph screenshot)
                        <View style={styles.numericDisplay}>
                            <View style={styles.rendimientoRow}>
                                {/* Left: Literal Badge + Description + Stats */}
                                <View style={styles.literalColumn}>
                                    <View style={styles.literalMain}>
                                        <Text style={styles.literalHeader}>Promedio General</Text>
                                        <View style={[styles.literalBadge, { backgroundColor: getLiteralBadgeColor(levelPerformance?.literal_average || 'C') }]}>
                                            <Text style={styles.literalBadgeText}>{levelPerformance?.literal_average || 'C'}</Text>
                                        </View>
                                        <Text style={styles.literalDescription}>{getLiteralDescription(levelPerformance?.literal_average || 'C')}</Text>
                                    </View>
                                    {/* Stats Row */}
                                    <View style={styles.statsRow}>
                                        <View style={styles.literalStatItem}>
                                            <Text style={styles.literalStatValue}>{students || 0}</Text>
                                            <Text style={styles.literalStatLabel}>TOTAL</Text>
                                        </View>
                                        <View style={styles.statDivider} />
                                        <View style={styles.literalStatItem}>
                                            <Text style={[styles.literalStatValue, { color: Colors.success }]}>{approved || 0}</Text>
                                            <Text style={styles.literalStatLabel}>APROBADOS</Text>
                                        </View>
                                        <View style={styles.statDivider} />
                                        <View style={styles.literalStatItem}>
                                            <Text style={[styles.literalStatValue, { color: Colors.error }]}>{failed}</Text>
                                            <Text style={styles.literalStatLabel}>REPROBADOS</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Right: Literal Distribution Bars */}
                                <View style={styles.distributionColumn}>
                                    <View style={styles.distributionHeader}>
                                        <Ionicons name="bar-chart" size={14} color={Colors.textSecondary} />
                                        <Text style={styles.distributionTitle}>Distribución de Literales</Text>
                                    </View>
                                    {['A', 'B', 'C', 'D', 'E'].map((literal) => {
                                        const count = levelPerformance?.literal_distribution?.[literal as 'A' | 'B' | 'C' | 'D' | 'E'] || 0;
                                        const total = students || 1;
                                        const percentage = Math.round((count / total) * 100);
                                        return (
                                            <View key={literal} style={styles.distributionRow}>
                                                <View style={[styles.literalDot, { backgroundColor: getLiteralBadgeColor(literal) }]}>
                                                    <Text style={styles.literalDotText}>{literal}</Text>
                                                </View>
                                                <View style={styles.barContainer}>
                                                    <View
                                                        style={[
                                                            styles.barFill,
                                                            {
                                                                width: `${percentage}%`,
                                                                backgroundColor: getLiteralBadgeColor(literal)
                                                            }
                                                        ]}
                                                    />
                                                </View>
                                                <View style={styles.percentContainer}>
                                                    <Text style={styles.percentText}>{percentage}%</Text>
                                                    <Text style={styles.countText}>({count})</Text>
                                                </View>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    ) : (
                        // NUMERIC TYPE - Media General (matches Odoo general_performance_graph)
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
                                                { color: (levelPerformance?.general_average ?? 0) >= 10 ? Colors.success : Colors.error }
                                            ]}>
                                                {levelPerformance?.general_average?.toFixed(1) ?? '-'}
                                            </Text>
                                            <Text style={styles.averageSuffix}>/20</Text>
                                        </View>
                                    </View>

                                    {/* State Badge */}
                                    <View style={[
                                        styles.stateBadge,
                                        { backgroundColor: levelPerformance?.general_state === 'approve' ? Colors.success : Colors.error }
                                    ]}>
                                        <Ionicons
                                            name={levelPerformance?.general_state === 'approve' ? 'checkmark' : 'close'}
                                            size={14}
                                            color="#fff"
                                        />
                                        <Text style={styles.stateBadgeText}>
                                            {levelPerformance?.general_state === 'approve' ? 'Aprobado' : 'Reprobado'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}
                </Card>
            )}

            {/* Top 3 Estudiantes por Sección - NOT for Preescolar */}
            {level !== 'pre' && (
                <Card title="Top 3 Estudiantes por Sección" delay={200}>
                    {isLoading ? (
                        <TopTableSkeleton rows={5} color={color} />
                    ) : levelDashboard?.top_students_by_section?.length ? (
                        <View style={styles.tableContainer}>
                            {/* Table Header */}
                            <View style={[styles.tableHeader, { backgroundColor: color }]}>
                                <Text style={[styles.tableHeaderText, { width: 40 }]}>Pos.</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Estudiante</Text>
                                <Text style={[styles.tableHeaderText, { width: 70, textAlign: 'right' }]}>Promedio</Text>
                            </View>

                            {/* Table Body */}
                            {levelDashboard.top_students_by_section.map((sec, secIndex) => (
                                <View key={secIndex}>
                                    {/* Section Header Row */}
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="bookmark" size={12} color={color} style={{ marginRight: 6 }} />
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
            )}

            {/* Últimas Observaciones - Only for Preescolar (matches Odoo pre_observations_timeline) */}
            {level === 'pre' && (
                <Card title="Últimas Observaciones" delay={150}>
                    {isLoading ? (
                        <TimelineSkeleton items={4} color={color} />
                    ) : preObservations?.timeline?.length ? (
                        <View style={styles.timelineContainer}>
                            {/* Vertical line */}
                            <View style={[styles.timelineVerticalLine, { backgroundColor: color }]} />

                            {preObservations.timeline.slice(0, 15).map((obs: PreObservationItem, i: number) => (
                                <View key={i} style={styles.timelineItem}>
                                    {/* Timeline dot */}
                                    <View style={[styles.timelineDotOdoo, { backgroundColor: color }]} />

                                    {/* Observation Card - Mobile optimized */}
                                    <View style={styles.observationCard}>
                                        {/* Header: Name + Section inline, Date on right */}
                                        <View style={styles.obsCardHeader}>
                                            <View style={styles.obsHeaderLeft}>
                                                <Text style={styles.obsStudentName}>{obs.student_name}</Text>
                                                {obs.section && (
                                                    <View style={styles.obsSectionBadge}>
                                                        <Text style={styles.obsSectionText}>{obs.section}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={styles.obsDate}>{obs.date}</Text>
                                        </View>

                                        {/* Observation Text */}
                                        <Text style={styles.obsText} numberOfLines={3}>{obs.observation}</Text>

                                        {/* Footer: Professor + Evaluation - compact */}
                                        {(obs.professor || obs.evaluation_name) && (
                                            <View style={styles.obsFooter}>
                                                {obs.professor && (
                                                    <Text style={styles.obsProfText}>{obs.professor}</Text>
                                                )}
                                                {obs.evaluation_name && (
                                                    <View style={styles.obsEvalBadge}>
                                                        <Text style={styles.obsEvalText}>{obs.evaluation_name}</Text>
                                                    </View>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : <Empty message="Sin observaciones recientes" />}
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

// Helper function for literal badge colors (matches Odoo colors from styles.scss)
const getLiteralBadgeColor = (literal: string) => {
    const colors: Record<string, string> = {
        'A': '#4CAF50',  // Green (Odoo $literal-a)
        'B': '#2196F3',  // Blue (Odoo $literal-b)
        'C': '#FFC107',  // Yellow (Odoo $literal-c)
        'D': '#FF9800',  // Orange (Odoo $literal-d)
        'E': '#F44336'   // Red (Odoo $literal-e)
    };
    return colors[literal] || Colors.textSecondary;
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

    // Grados Tags
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'space-around' },
    gradeTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    gradeTagText: { fontSize: 12, fontWeight: '600' },
    tagSkeleton: {
        width: 80,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.skeleton.base
    },

    // Performance - Numeric (matches Odoo general_performance_graph)
    numericDisplay: {
        flex: 1,
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
    chartSection: {
        alignItems: 'center',
        marginBottom: 16,
    },
    chartTitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 12,
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
        fontSize: 40,
        fontWeight: '800',
    },
    averageSuffix: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginLeft: 4,
    },
    stateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
        marginBottom: 16,
    },
    stateBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 16,
    },
    statsVertical: {
        gap: 8,
        marginTop: 8,
    },
    statItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statItemLabel: {
        flex: 1,
        fontSize: 12,
        color: Colors.textSecondary,
    },
    statItemValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    statsGridItem: {
        flex: 1,
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        paddingVertical: 12,
        borderRadius: 8,
    },
    statsGridValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    statsGridLabel: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    perfSection: { alignItems: 'center', paddingVertical: 12 },
    perfStats: { flexDirection: 'row', gap: 30, marginTop: 16 },
    perfItem: { alignItems: 'center' },
    perfValue: { fontSize: 18, fontWeight: '800' },
    perfLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

    // Performance - Observation (Preescolar)
    observationDisplay: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    observationIconContainer: {
        marginBottom: 12,
    },
    observationTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    observationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.success + '15',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 8,
        marginBottom: 16,
    },
    observationBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.success,
    },
    observationNote: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
        paddingHorizontal: 16,
    },

    // Performance - Literal (Primaria)
    literalDisplay: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    literalMain: {
        alignItems: 'center',
        marginBottom: 16,
    },
    literalHeader: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginBottom: 8,
    },
    literalBadge: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    literalBadgeText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#fff',
    },
    literalDescription: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    // Literal Distribution (Primaria)
    literalColumn: {
        flex: 1,
        alignItems: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 5,
        paddingTop: 6,
        paddingBottom: 6,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    literalStatItem: {
        alignItems: 'center',
    },
    literalStatValue: {
        fontSize: 15,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    literalStatLabel: {
        fontSize: 8,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginTop: 2,
    },
    distributionColumn: {
        flex: 1,
        paddingLeft: 4,
    },
    distributionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10,
    },
    distributionTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    distributionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    literalDot: {
        width: 22,
        height: 22,
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    literalDotText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#fff',
    },
    barContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
    },
    percentContainer: {
        alignItems: 'flex-end',
        width: 40,
    },
    percentText: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    countText: {
        fontSize: 9,
        color: Colors.textSecondary,
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
        backgroundColor: '#3B82F6',
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

    // Observation Timeline - Odoo Style (Preescolar)
    timelineContainer: {
        position: 'relative',
        marginLeft: 6,
    },
    timelineVerticalLine: {
        position: 'absolute',
        left: 5,
        top: 8,
        bottom: 8,
        width: 2,
        borderRadius: 1,
        opacity: 0.6,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    timelineDotOdoo: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginTop: 4,
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    observationCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    obsCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6,
    },
    obsHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flex: 1,
        flexWrap: 'wrap',
    },
    obsAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    obsStudentName: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    obsSectionBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    obsSectionText: {
        fontSize: 9,
        color: Colors.textSecondary,
    },
    obsDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    obsDate: {
        fontSize: 10,
        color: Colors.textTertiary,
    },
    obsText: {
        fontSize: 12,
        color: Colors.textPrimary,
        lineHeight: 17,
        marginBottom: 6,
    },
    obsFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
        flexWrap: 'wrap',
        gap: 6,
    },
    obsProfContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    obsProfText: {
        fontSize: 10,
        color: Colors.textTertiary,
        fontStyle: 'italic',
    },
    obsEvalBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#E3F2FD',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    obsEvalText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#1976D2',
    },
    // Legacy observation styles (can be removed if not used)
    observationRow: { flexDirection: 'row', paddingVertical: 12 },
    observationTimeline: { width: 24, alignItems: 'center' },
    timelineDot: { width: 10, height: 10, borderRadius: 5 },
    timelineLine: { width: 2, flex: 1, marginTop: 4 },
    observationContent: { flex: 1, marginLeft: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    observationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    observationStudent: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    observationDate: { fontSize: 10, color: Colors.textTertiary },
    observationSection: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    observationText: { fontSize: 12, color: Colors.textPrimary, marginTop: 6, lineHeight: 18 },
    observationProf: { fontSize: 10, color: Colors.textTertiary, fontStyle: 'italic', marginTop: 4 },
    statDivider: {
        width: 1,
        height: 25,
        backgroundColor: '#ddd',
    },
});

export default LevelTab;
