/**
 * LevelTab - Odoo-style level dashboard
 * Features: 4 KPI cards, approval progress bar, Grados tags, Rendimiento, table-style Top 3 students
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, PreObservationItem, SectionPreview } from '../../../services-odoo/dashboardService';
import { slideUpFadeIn } from '../animations';
import { RingGauge } from '../charts';
import {
    Card,
    ChartSkeleton,
    ConfigRowSkeleton,
    Empty,
    ListRowSkeleton,
} from '../ui';

interface Props {
    level: 'secundary' | 'primary' | 'pre';
    levelName: string;
    data: DashboardData | null;
    color: string;
    loading?: boolean;
}

export const LevelTab: React.FC<Props> = ({ level, levelName, data: d, color, loading }) => {
    // Get level-specific data
    const students = level === 'secundary' ? d?.studentsByLevel.secundaryCount
        : level === 'primary' ? d?.studentsByLevel.primaryCount
            : d?.studentsByLevel.preCount;
    const approved = level === 'secundary' ? d?.approvedByLevel.secundaryCount
        : level === 'primary' ? d?.approvedByLevel.primaryCount
            : d?.approvedByLevel.preCount;
    const failed = (students || 0) - (approved || 0);
    const sections = level === 'secundary' ? d?.sectionsByLevel.secundaryCount
        : level === 'primary' ? d?.sectionsByLevel.primaryCount
            : d?.sectionsByLevel.preCount;
    const evalConfig = level === 'secundary' ? d?.evaluationConfigs.secundary
        : level === 'primary' ? d?.evaluationConfigs.primary
            : d?.evaluationConfigs.pre;
    const levelDashboard = level === 'secundary' ? d?.secundaryGeneralDashboard
        : level === 'primary' ? d?.primaryDashboard
            : d?.preDashboard;
    const sectionPreviews = d?.sectionPreviews?.[level] || [];

    // Preschool observations timeline
    const preObservations = level === 'pre' ? d?.preObservationsTimeline : null;

    const approvalPct = students && students > 0 ? ((approved || 0) / students) * 100 : 0;
    const isLoading = loading || !d;

    // Level title for Grados section
    const gradosTitle = level === 'secundary' ? 'Grados de Media General'
        : level === 'primary' ? 'Grados de Primaria'
            : 'Grados de Preescolar';
    const sectionsLabel = level === 'pre' ? 'Grupos' : 'Secciones';

    // Animation for KPI Row
    const kpiAnim = useRef(new Animated.Value(0)).current;
    const kpiOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        slideUpFadeIn(kpiAnim, kpiOpacity, 300, 100).start();
    }, []);

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

    return (
        <View style={styles.container}>
            {/* Configuración de Evaluación */}
            <Card title="Configuración" delay={0}>
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

            {/* 4 KPI Cards Row - Odoo style */}
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

            {/* Approval Progress Bar - Odoo style */}
            <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Tasa de Aprobación</Text>
                    <Text style={[styles.progressPercent, { color: getProgressColor(approvalPct) }]}>
                        {isLoading ? '-' : approvalPct.toFixed(1)}%
                    </Text>
                </View>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            {
                                width: isLoading ? '0%' : `${approvalPct}%`,
                                backgroundColor: getProgressColor(approvalPct)
                            }
                        ]}
                    />
                </View>
            </View>

            {/* Grados/Secciones Tags - Odoo style */}
            <Card title={gradosTitle} delay={100}>
                {isLoading ? (
                    <View style={styles.tagsContainer}>
                        <View style={styles.tagSkeleton} />
                        <View style={styles.tagSkeleton} />
                        <View style={styles.tagSkeleton} />
                    </View>
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

            {/* Rendimiento - RingGauge (NOT for pre) */}
            {level !== 'pre' && (
                <Card title={`Rendimiento de ${levelName}`} delay={150}>
                    {isLoading ? (
                        <ChartSkeleton type="ring" size={100} />
                    ) : (
                        <View style={styles.perfSection}>
                            <RingGauge
                                percentage={approvalPct}
                                color={color}
                                label="Aprobación"
                                size={100}
                                strokeWidth={12}
                            />
                            <View style={styles.perfStats}>
                                <View style={styles.perfItem}>
                                    <Text style={[styles.perfValue, { color: Colors.success }]}>{approved || 0}</Text>
                                    <Text style={styles.perfLabel}>Aprobados</Text>
                                </View>
                                <View style={styles.perfItem}>
                                    <Text style={[styles.perfValue, { color: Colors.error }]}>{failed}</Text>
                                    <Text style={styles.perfLabel}>Reprobados</Text>
                                </View>
                            </View>
                        </View>
                    )}
                </Card>
            )}

            {/* Top 3 Estudiantes por Sección - TABLE style like Odoo */}
            {level !== 'pre' && (
                <Card title="Top 3 Estudiantes por Sección" delay={200}>
                    {isLoading ? (
                        <>
                            <ListRowSkeleton hasAvatar hasBadge />
                            <ListRowSkeleton hasAvatar hasBadge />
                            <ListRowSkeleton hasAvatar hasBadge />
                        </>
                    ) : levelDashboard?.top_students_by_section?.length ? (
                        <View style={styles.tableContainer}>
                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <Text style={[styles.tableHeaderText, { width: 40 }]}>Pos.</Text>
                                <Text style={[styles.tableHeaderText, { flex: 1 }]}>Estudiante</Text>
                                <Text style={[styles.tableHeaderText, { width: 70, textAlign: 'right' }]}>Promedio</Text>
                            </View>

                            {/* Table Body */}
                            {levelDashboard.top_students_by_section.map((sec, secIndex) => (
                                <View key={secIndex}>
                                    {/* Section Header Row */}
                                    <View style={styles.sectionHeaderRow}>
                                        <Ionicons name="bookmark" size={12} color="#6B7280" style={{ marginRight: 6 }} />
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
                                                <Text style={styles.averageText}>
                                                    {typeof st.average === 'number' ? st.average.toFixed(1) : st.average}
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ))}
                        </View>
                    ) : <Empty message="Sin datos de estudiantes" />}
                </Card>
            )}

            {/* Últimas Observaciones - Only for Preescolar */}
            {level === 'pre' && (
                <Card title="Últimas Observaciones" delay={300}>
                    {isLoading ? (
                        <>
                            <ListRowSkeleton hasAvatar hasBadge />
                            <ListRowSkeleton hasAvatar hasBadge />
                            <ListRowSkeleton hasAvatar hasBadge />
                        </>
                    ) : preObservations?.timeline?.length ? (
                        preObservations.timeline.slice(0, 5).map((obs: PreObservationItem, i: number) => (
                            <View key={i} style={styles.observationRow}>
                                <View style={styles.observationTimeline}>
                                    <View style={[styles.timelineDot, { backgroundColor: color }]} />
                                    {i < Math.min(preObservations.timeline.length, 5) - 1 && (
                                        <View style={[styles.timelineLine, { backgroundColor: color + '40' }]} />
                                    )}
                                </View>
                                <View style={styles.observationContent}>
                                    <View style={styles.observationHeader}>
                                        <Text style={styles.observationStudent}>{obs.student_name}</Text>
                                        <Text style={styles.observationDate}>{obs.date}</Text>
                                    </View>
                                    <Text style={styles.observationSection}>{obs.section}</Text>
                                    <Text style={styles.observationText} numberOfLines={2}>{obs.observation}</Text>
                                    {obs.professor && (
                                        <Text style={styles.observationProf}>Prof. {obs.professor}</Text>
                                    )}
                                </View>
                            </View>
                        ))
                    ) : <Empty message="Sin observaciones recientes" />}
                </Card>
            )}
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

    // Grados Tags
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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

    // Performance
    perfSection: { alignItems: 'center', paddingVertical: 12 },
    perfStats: { flexDirection: 'row', gap: 30, marginTop: 16 },
    perfItem: { alignItems: 'center' },
    perfValue: { fontSize: 18, fontWeight: '800' },
    perfLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

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

    // Observation Timeline (Preescolar only)
    observationRow: {
        flexDirection: 'row',
        paddingVertical: 12,
    },
    observationTimeline: {
        width: 24,
        alignItems: 'center',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginTop: 4,
    },
    observationContent: {
        flex: 1,
        marginLeft: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    observationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    observationStudent: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    observationDate: {
        fontSize: 10,
        color: Colors.textTertiary,
    },
    observationSection: {
        fontSize: 11,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    observationText: {
        fontSize: 12,
        color: Colors.textPrimary,
        marginTop: 6,
        lineHeight: 18,
    },
    observationProf: {
        fontSize: 10,
        color: Colors.textTertiary,
        fontStyle: 'italic',
        marginTop: 4,
    },
});

export default LevelTab;
