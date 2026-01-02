/**
 * DashboardGeneralTab - Complete rewrite with interactive charts
 * Matches Odoo's Dashboard General structure with 7 widgets
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    FadeInDown,
    FadeInUp
} from 'react-native-reanimated';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { DonutChart, PolarAreaChart, RadarChart, SemiCircleGauge } from '../charts';
import {
    Card,
    Empty,
    LevelCardGridSkeleton,
    ListRow,
    PolarAreaSkeleton,
    RankBadge,
    SectionCardsSkeleton,
    SemiCircleGaugeSkeleton,
    Top9StudentsSkeleton
} from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
    skipAnimations?: boolean;
}

export const DashboardGeneralTab: React.FC<Props> = ({ data: d, loading, skipAnimations }) => {
    // DEBUG: Toggle skeleton visibility
    const [forceSkeletons, setForceSkeletons] = useState(false);
    const isLoading = forceSkeletons || loading || !d;

    // Helper for level styling
    const getLevelStyle = (type: string) => {
        switch (type) {
            case 'pre': return { color: Colors.levelPre, icon: 'school-outline' as const, name: 'Preescolar' };
            case 'primary': return { color: Colors.levelPrimary, icon: 'book-outline' as const, name: 'Primaria' };
            case 'secundary': return { color: Colors.levelSecundary, icon: 'library-outline' as const, name: 'Media General' };
            case 'tecnico': return { color: Colors.levelTecnico, icon: 'construct-outline' as const, name: 'Técnico Medio' };
            default: return { color: Colors.textSecondary, icon: 'school-outline' as const, name: type };
        }
    };

    // Get grade badge color based on average (matching Odoo)
    // For literals: colored background
    // For numeric: light background with colored text
    const getGradeBadgeStyle = (average: number | string | undefined, useLiteral: boolean) => {
        if (useLiteral && typeof average === 'string') {
            // Literal grades get colored backgrounds like Odoo
            const literalColors: { [key: string]: string } = {
                'A': '#16a34a', // green
                'B': '#0891b2', // cyan
                'C': '#f59e0b', // amber
                'D': '#f97316', // orange
                'E': '#dc2626', // red
            };
            return {
                backgroundColor: literalColors[average] || Colors.info,
                textColor: '#fff',
                borderColor: 'transparent',
            };
        }
        // Numeric grades get light background with border (Odoo style)
        return {
            backgroundColor: '#F3F4F6',
            textColor: Colors.textPrimary,
            borderColor: '#E5E7EB',
        };
    };

    // Prepare chart data
    const sectionsDistributionData = d?.sectionsDistribution?.labels.map((label, i) => ({
        value: d.sectionsDistribution!.data[i],
        color: [Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary][i] || Colors.info,
        gradientCenterColor: ['#0e7490', '#15803d', '#1e3a8a'][i] || Colors.info,
        label,
    })) || [];

    const professorsDistributionData = d?.professorsDistribution?.labels.map((label, i) => ({
        value: d.professorsDistribution!.data[i],
        color: [Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary][i] || Colors.info,
        gradientCenterColor: ['#0e7490', '#15803d', '#1e3a8a'][i] || Colors.info,
        label,
    })) || [];

    const studentsDistributionData = d?.studentsDistribution?.labels.map((label, i) => ({
        value: d.studentsDistribution!.data[i],
        color: [Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary, Colors.levelTecnico][i] || Colors.info,
        gradientCenterColor: ['#0e7490', '#15803d', '#1e3a8a', '#d97706'][i] || Colors.info,
        label,
    })) || [];

    const sectionsComparisonData = d?.sectionsComparison?.sections?.slice(0, 4).map((s) => ({
        label: s.section_name.length > 8 ? s.section_name.substring(0, 7) + '…' : s.section_name,
        fullLabel: s.section_name,
        value1: s.average || 0,
        value2: s.approval_rate || 0,
    })) || [];

    const approvalRate = d?.approvalRate?.rate || 0;
    const approvalColor = approvalRate >= 70 ? Colors.success : approvalRate >= 50 ? Colors.warning : Colors.error;
    const totalStudents = d?.approvalRate?.total || 0;
    const approvedStudents = d?.approvalRate?.approved || 0;
    const failedStudents = totalStudents - approvedStudents;

    return (
        <View style={styles.container}>
            {/* 1. Rendimiento General del Año Escolar */}
            <Card title="Rendimiento General del Año Escolar" delay={0}>
                {isLoading ? (
                    <LevelCardGridSkeleton />
                ) : d?.performanceByLevel?.levels?.length ? (
                    <View style={styles.levelCardsGrid}>
                        {d.performanceByLevel.levels.map((lv, i) => {
                            const style = getLevelStyle(lv.type);

                            // Helper: Convert numeric average to literal grade
                            const getLiteralGrade = (avg: number | undefined) => {
                                if (avg === undefined || avg === null || avg === 0) return 'A';
                                if (avg >= 18) return 'A';
                                if (avg >= 15) return 'B';
                                if (avg >= 12) return 'C';
                                if (avg >= 10) return 'D';
                                return 'E';
                            };

                            const getLiteralColor = (literal: string) => {
                                return {
                                    'A': '#16a34a', // green
                                    'B': '#0891b2', // cyan
                                    'C': '#f59e0b', // amber
                                    'D': '#f97316', // orange
                                    'E': '#dc2626', // red
                                }[literal] || '#6b7280';
                            };

                            return (
                                <Animated.View
                                    key={i}
                                    style={styles.levelCardWrapper}
                                >
                                    <TouchableOpacity
                                        style={[styles.levelCard, { borderColor: style.color }]}
                                        activeOpacity={0.8}
                                    >
                                        {/* Header with icon and title */}
                                        <View style={[styles.levelCardHeader, { backgroundColor: style.color + '15' }]}>
                                            <View style={[styles.levelIcon, { backgroundColor: style.color }]}>
                                                <Ionicons name={style.icon} size={16} color="#fff" />
                                            </View>
                                            <Text style={styles.levelCardTitle} numberOfLines={2}>{lv.name}</Text>
                                            <View style={styles.studentBadge}>
                                                <Text style={styles.studentBadgeText}>{lv.total_students}</Text>
                                            </View>
                                        </View>

                                        {/* Main Display - Different per level type */}
                                        <View style={styles.levelMainDisplay}>
                                            {lv.type === 'pre' ? (
                                                // PREESCOLAR: Show "Observación" badge
                                                <View style={[styles.observationBadge, { backgroundColor: Colors.success + '15' }]}>
                                                    <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
                                                    <Text style={[styles.observationText, { color: Colors.success }]}>
                                                        Observación
                                                    </Text>
                                                </View>
                                            ) : lv.type === 'primary' ? (
                                                // PRIMARIA: average is already a literal string (A-E) from backend
                                                <View style={[
                                                    styles.literalBadge,
                                                    { backgroundColor: getLiteralColor(String(lv.average) || 'A') }
                                                ]}>
                                                    <Text style={styles.literalText}>
                                                        {String(lv.average) || 'A'}
                                                    </Text>
                                                </View>
                                            ) : (
                                                // SECUNDARY/TECNICO: Show numeric average
                                                <View style={styles.numericDisplay}>
                                                    <Text style={[
                                                        styles.numericValue,
                                                        { color: typeof lv.average === 'number' && lv.average >= 10 ? Colors.success : Colors.error }
                                                    ]}>
                                                        {typeof lv.average === 'number' ? lv.average.toFixed(1) : '-'}
                                                    </Text>
                                                    <Text style={styles.numericMax}>/20</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Footer: Approved / Failed */}
                                        <View style={styles.levelFooter}>
                                            {lv.type === 'pre' ? (
                                                // Preescolar: All approved
                                                <>
                                                    <View style={styles.levelFooterItem}>
                                                        <Ionicons name="checkmark" size={12} color={Colors.success} />
                                                        <Text style={[styles.levelFooterText, { color: Colors.success }]}>
                                                            {lv.total_students} apr.
                                                        </Text>
                                                    </View>
                                                    <View style={styles.levelFooterItem}>
                                                        <Ionicons name="close" size={12} color={Colors.textTertiary} />
                                                        <Text style={[styles.levelFooterText, { color: Colors.textTertiary }]}>
                                                            0 rep.
                                                        </Text>
                                                    </View>
                                                </>
                                            ) : (
                                                <>
                                                    <View style={styles.levelFooterItem}>
                                                        <Ionicons name="checkmark" size={12} color={Colors.success} />
                                                        <Text style={[styles.levelFooterText, { color: Colors.success }]}>
                                                            {lv.approved_students} apr.
                                                        </Text>
                                                    </View>
                                                    <View style={styles.levelFooterItem}>
                                                        <Ionicons name="close" size={12} color={Colors.error} />
                                                        <Text style={[styles.levelFooterText, { color: Colors.error }]}>
                                                            {lv.failed_students} rep.
                                                        </Text>
                                                    </View>
                                                </>
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                </Animated.View>
                            );
                        })}
                    </View>
                ) : <Empty />}
            </Card>

            {/* 2 & 3. Secciones y Profesores - Side by Side */}
            <View style={styles.row}>
                <View style={styles.halfCol}>
                    <Card title="Secciones por Nivel" delay={100} style={styles.fullHeight}>
                        {isLoading ? (
                            <PolarAreaSkeleton size={130} legendItems={3} />
                        ) : sectionsDistributionData.length ? (
                            <PolarAreaChart
                                data={sectionsDistributionData}
                                size={150}
                                interactive
                            />
                        ) : <Empty message="Sin datos" />}
                    </Card>
                </View>
                <View style={styles.halfCol}>
                    <Card title="Profesores por Nivel" delay={150} style={styles.fullHeight}>
                        {isLoading ? (
                            <PolarAreaSkeleton size={130} legendItems={4} />
                        ) : professorsDistributionData.length ? (
                            <RadarChart
                                data={professorsDistributionData}
                                size={165}
                                interactive
                            />
                        ) : <Empty message="Sin datos" />}
                    </Card>
                </View>
            </View>

            {/* 4 & 5. Estudiantes y Aprobación - Side by Side */}
            <View style={styles.row}>
                <View style={styles.halfCol}>
                    <Card title="Estudiantes por Nivel" delay={200} style={styles.fullHeight}>
                        {isLoading ? (
                            <PolarAreaSkeleton size={120} legendItems={4} />
                        ) : studentsDistributionData.length ? (
                            <DonutChart
                                data={studentsDistributionData}
                                centerValue={d?.kpis?.totalStudentsCount || 0}
                                centerLabel="Total"
                                radius={60}
                                innerRadius={38}
                                interactive
                            />
                        ) : <Empty message="Sin datos" />}
                    </Card>
                </View>
                <View style={styles.halfCol}>
                    <Card title="Índice de Aprobación" delay={250} style={styles.fullHeight}>
                        {isLoading ? (
                            <SemiCircleGaugeSkeleton />
                        ) : (
                            <SemiCircleGauge
                                percentage={approvalRate}
                                total={totalStudents}
                                approved={approvedStudents}
                                failed={failedStudents}
                                byLevel={d?.approvalRate?.by_level?.map(lv => ({
                                    name: lv.name,
                                    type: lv.name === 'Preescolar' ? 'pre' :
                                        lv.name === 'Primaria' ? 'primary' :
                                            lv.name === 'Media General' ? 'secundary' : 'tecnico',
                                    rate: lv.name === 'Preescolar' ? 100 : lv.rate,
                                })) || []}
                                size={140}
                            />
                        )}
                    </Card>
                </View>
            </View>

            {/* 6. Mejor Sección por Nivel - Cards Layout (Odoo style) */}
            <Card title="Mejor Sección por Nivel" delay={300}>
                {isLoading ? (
                    <SectionCardsSkeleton />
                ) : d?.sectionsComparison?.sections?.length ? (
                    <View style={styles.sectionsCardsGrid}>
                        {d.sectionsComparison.sections.slice(0, 4).map((section, index) => {
                            const levelStyle = getLevelStyle(section.type);
                            const getLiteralGrade = (avg: number) => {
                                if (avg >= 18) return 'A';
                                if (avg >= 15) return 'B';
                                if (avg >= 12) return 'C';
                                if (avg >= 10) return 'D';
                                return 'E';
                            };
                            const getLiteralColor = (lit: string) => ({
                                'A': '#16a34a', 'B': '#0891b2', 'C': '#f59e0b', 'D': '#f97316', 'E': '#dc2626'
                            }[lit] || '#6b7280');
                            const approvalColor = section.approval_rate >= 80 ? Colors.success :
                                section.approval_rate >= 60 ? Colors.warning : Colors.error;

                            return (
                                <Animated.View
                                    key={section.section_id}
                                    entering={skipAnimations ? undefined : FadeInUp.delay(index * 80).duration(400)}
                                    style={[
                                        styles.sectionCard,
                                        { borderLeftColor: levelStyle.color },
                                        // Técnico Medio: wider and centered when alone
                                        section.type === 'tecnico' && styles.sectionCardWide
                                    ]}
                                >
                                    <View style={styles.sectionCardHeader}>
                                        <View style={{ flex: 1 }}>
                                            <View style={[styles.sectionLevelBadge, { backgroundColor: levelStyle.color }]}>
                                                <Text style={styles.sectionLevelText}>{levelStyle.name}</Text>
                                            </View>
                                            <Text style={[styles.sectionName, section.type === 'tecnico' && { maxWidth: 'auto' }]} numberOfLines={2}>{section.section_name}</Text>
                                        </View>
                                        {section.type === 'primary' ? (
                                            <View style={[styles.sectionAvgBadge, { backgroundColor: getLiteralColor(getLiteralGrade(section.average)) }]}>
                                                <Text style={styles.sectionAvgText}>{getLiteralGrade(section.average)}</Text>
                                            </View>
                                        ) : (
                                            <View style={[styles.sectionAvgBadge, { backgroundColor: Colors.backgroundTertiary }]}>
                                                <Text style={[styles.sectionAvgText, { color: Colors.textPrimary }]}>
                                                    {section.average.toFixed(1)}
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.sectionCardStats}>
                                        <Text style={styles.sectionStat}>
                                            <Ionicons name="people" size={12} color={Colors.textSecondary} /> {section.total_students} est.
                                        </Text>
                                        <Text style={[styles.sectionStat, { color: Colors.success }]}>
                                            <Ionicons name="checkmark" size={12} color={Colors.success} /> {section.approved_students} apr.
                                        </Text>
                                    </View>
                                    <View style={styles.sectionProgressBg}>
                                        <View style={[
                                            styles.sectionProgressFill,
                                            { width: `${section.approval_rate}%`, backgroundColor: approvalColor }
                                        ]} />
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </View>
                ) : <Empty message="Sin datos de secciones" />}
            </Card>

            {/* 7. Top 9 Mejores Estudiantes (3 por nivel) */}
            <Card title="Top 9 Mejores Estudiantes" delay={350}>
                {isLoading ? (
                    <Top9StudentsSkeleton />
                ) : (d?.topStudentsYear?.top_primary?.length ||
                    d?.topStudentsYear?.top_secundary?.length ||
                    d?.topStudentsYear?.top_tecnico?.length) ? (
                    <View style={styles.topStudentsContainer}>
                        {/* Primaria */}
                        {d?.topStudentsYear?.top_primary?.length ? (
                            <Animated.View entering={skipAnimations ? undefined : FadeInDown.delay(100).duration(400)}>
                                <View style={styles.levelSection}>
                                    <View style={[styles.levelBadge, { backgroundColor: Colors.levelPrimary + '15' }]}>
                                        <Ionicons name="book-outline" size={14} color={Colors.levelPrimary} />
                                        <Text style={[styles.levelBadgeText, { color: Colors.levelPrimary }]}>Primaria</Text>
                                    </View>
                                </View>
                                {d.topStudentsYear.top_primary.map((st, i) => (
                                    <ListRow key={`primary-${i}`} borderBottom={i < 2}>
                                        <RankBadge rank={i + 1} />
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{st.student_name}</Text>
                                            <Text style={styles.studentSection}>{st.section}</Text>
                                        </View>
                                        <View style={[
                                            styles.gradeBadge,
                                            {
                                                backgroundColor: getGradeBadgeStyle(st.use_literal ? st.literal_average : st.average, st.use_literal).backgroundColor,
                                                borderColor: getGradeBadgeStyle(st.use_literal ? st.literal_average : st.average, st.use_literal).borderColor,
                                                borderWidth: st.use_literal ? 0 : 1,
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.gradeBadgeText,
                                                { color: getGradeBadgeStyle(st.use_literal ? st.literal_average : st.average, st.use_literal).textColor }
                                            ]}>
                                                {st.use_literal ? st.literal_average : (typeof st.average === 'number' ? st.average.toFixed(1) : '-')}
                                            </Text>
                                        </View>
                                    </ListRow>
                                ))}
                            </Animated.View>
                        ) : null}

                        {/* Media General */}
                        {d?.topStudentsYear?.top_secundary?.length ? (
                            <Animated.View entering={skipAnimations ? undefined : FadeInDown.delay(200).duration(400)}>
                                <View style={styles.levelSection}>
                                    <View style={[styles.levelBadge, { backgroundColor: Colors.levelSecundary + '15' }]}>
                                        <Ionicons name="library-outline" size={14} color={Colors.levelSecundary} />
                                        <Text style={[styles.levelBadgeText, { color: Colors.levelSecundary }]}>Media General</Text>
                                    </View>
                                </View>
                                {d.topStudentsYear.top_secundary.map((st, i) => (
                                    <ListRow key={`secundary-${i}`} borderBottom={i < 2}>
                                        <RankBadge rank={i + 1} />
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{st.student_name}</Text>
                                            <Text style={styles.studentSection}>{st.section}</Text>
                                        </View>
                                        <View style={[
                                            styles.gradeBadge,
                                            {
                                                backgroundColor: getGradeBadgeStyle(st.use_literal ? st.literal_average : st.average, st.use_literal).backgroundColor,
                                                borderColor: getGradeBadgeStyle(st.use_literal ? st.literal_average : st.average, st.use_literal).borderColor,
                                                borderWidth: st.use_literal ? 0 : 1,
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.gradeBadgeText,
                                                { color: getGradeBadgeStyle(st.use_literal ? st.literal_average : st.average, st.use_literal).textColor }
                                            ]}>
                                                {st.use_literal ? st.literal_average : (typeof st.average === 'number' ? st.average.toFixed(1) : '-')}
                                            </Text>
                                        </View>
                                    </ListRow>
                                ))}
                            </Animated.View>
                        ) : null}

                        {/* Técnico Medio */}
                        {d?.topStudentsYear?.top_tecnico?.length ? (
                            <Animated.View entering={skipAnimations ? undefined : FadeInDown.delay(300).duration(400)}>
                                <View style={styles.levelSection}>
                                    <View style={[styles.levelBadge, { backgroundColor: Colors.levelTecnico + '15' }]}>
                                        <Ionicons name="construct-outline" size={14} color={Colors.levelTecnico} />
                                        <Text style={[styles.levelBadgeText, { color: Colors.levelTecnico }]}>Técnico Medio</Text>
                                    </View>
                                </View>
                                {d.topStudentsYear.top_tecnico.map((st, i) => (
                                    <ListRow key={`tecnico-${i}`} borderBottom={i < 2}>
                                        <RankBadge rank={i + 1} />
                                        <View style={styles.studentInfo}>
                                            <Text style={styles.studentName}>{st.student_name}</Text>
                                            <Text style={styles.studentSection}>{st.section}</Text>
                                        </View>
                                        <View style={[
                                            styles.gradeBadge,
                                            {
                                                backgroundColor: getGradeBadgeStyle(st.use_literal ? st.literal_average : st.average, st.use_literal).backgroundColor,
                                                borderColor: getGradeBadgeStyle(st.use_literal ? st.literal_average : st.average, st.use_literal).borderColor,
                                                borderWidth: st.use_literal ? 0 : 1,
                                            }
                                        ]}>
                                            <Text style={[
                                                styles.gradeBadgeText,
                                                { color: getGradeBadgeStyle(st.use_literal ? st.literal_average : st.average, st.use_literal).textColor }
                                            ]}>
                                                {st.use_literal ? st.literal_average : (typeof st.average === 'number' ? st.average.toFixed(1) : '-')}
                                            </Text>
                                        </View>
                                    </ListRow>
                                ))}
                            </Animated.View>
                        ) : null}
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

    // Row layout
    row: { flexDirection: 'row', gap: 12 },
    halfCol: { flex: 1 },
    fullHeight: { flex: 1 },

    // Level Cards Grid
    levelCardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    levelCardWrapper: {
        flexBasis: '48%',
        flexGrow: 1,
        minWidth: 140,
    },
    levelCard: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1.5,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    levelCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        gap: 8,
    },
    levelIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelCardTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textPrimary,
        flex: 1,
    },
    studentBadge: {
        backgroundColor: Colors.textSecondary,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    studentBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#fff',
    },
    levelMainDisplay: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 12,
        minHeight: 70,
    },
    observationBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        gap: 6,
    },
    observationText: {
        fontSize: 13,
        fontWeight: '600',
    },
    literalBadge: {
        width: 38,
        height: 38,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    literalText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#fff',
    },
    numericDisplay: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    numericValue: {
        fontSize: 28,
        fontWeight: '800',
    },
    numericMax: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textTertiary,
    },
    levelCardBody: {
        padding: 12,
        paddingTop: 4,
    },
    levelStatRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    levelStatItem: {
        alignItems: 'center',
    },
    levelStatValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    levelStatLabel: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    progressContainer: {
        marginBottom: 10,
    },
    progressBg: {
        height: 6,
        backgroundColor: Colors.backgroundTertiary,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 4,
        textAlign: 'center',
    },
    levelFooter: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
    levelFooterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    levelFooterText: {
        fontSize: 12,
        fontWeight: '700',
    },

    // Section Cards (Mejor Sección por Nivel)
    sectionsCardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        rowGap: 10,
    },
    sectionCard: {
        width: '50%',
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    sectionCardWide: {
        width: '100%',
        alignSelf: 'center',
    },
    sectionCardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    sectionLevelBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
        marginBottom: 4,
    },
    sectionLevelText: {
        fontSize: 9,
        fontWeight: '700',
        color: '#fff',
    },
    sectionName: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textPrimary,
        maxWidth: 100,
    },
    sectionAvgBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    sectionAvgText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#fff',
    },
    sectionCardStats: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    sectionStat: {
        fontSize: 10,
        color: Colors.textSecondary,
    },
    sectionProgressBg: {
        height: 4,
        backgroundColor: Colors.backgroundTertiary,
        borderRadius: 2,
        overflow: 'hidden',
    },
    sectionProgressFill: {
        height: '100%',
        borderRadius: 2,
    },

    // Top Students
    topStudentsContainer: {
        gap: 8,
    },
    levelSection: {
        marginTop: 12,
        marginBottom: 8,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    levelBadgeText: {
        fontSize: 12,
        fontWeight: '700',
    },
    studentInfo: {
        flex: 1,
        marginLeft: 12,
    },
    studentName: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    studentSection: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    gradeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        minWidth: 52,
        alignItems: 'center',
    },
    gradeBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
});

export default DashboardGeneralTab;
