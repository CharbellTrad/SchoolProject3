/**
 * TecnicoMedioTab - Odoo-style Técnico Medio dashboard
 * Features: 4 KPI cards, approval progress bar, mentions tags, table-style Top 3
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { slideUpFadeIn } from '../animations';
import {
    Card,
    ConfigRowSkeleton,
    Empty,
    ListRowSkeleton,
} from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
}

export const TecnicoMedioTab: React.FC<Props> = ({ data: d, loading }) => {
    const students = d?.studentsByLevel.tecnicoCount ?? 0;
    const approved = d?.approvedByLevel.tecnicoCount ?? 0;
    const failed = students - approved;
    const sections = d?.sectionsByLevel.secundaryCount ?? 0;
    const approvalPct = students > 0 ? (approved / students) * 100 : 0;
    const levelDashboard = d?.secundaryTecnicoDashboard;
    const isLoading = loading || !d;

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
            {/* 1. Configuración de Evaluación */}
            <Card title="Configuración de Evaluación" delay={0}>
                {isLoading ? (
                    <ConfigRowSkeleton />
                ) : d?.evaluationConfigs.secundary ? (
                    <View style={styles.configRow}>
                        <View style={[styles.configIcon, { backgroundColor: Colors.warning + '15' }]}>
                            <Ionicons name="construct-outline" size={20} color={Colors.warning} />
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

            {/* 2. KPI Cards Row - Odoo style */}
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
                    <View style={[styles.kpiIcon, { backgroundColor: Colors.warning + '20' }]}>
                        <Ionicons name="school" size={18} color={Colors.warning} />
                    </View>
                    <Text style={[styles.kpiValue, { color: Colors.warning }]}>{isLoading ? '-' : mentionNames.length}</Text>
                    <Text style={styles.kpiLabel}>Menciones</Text>
                </View>
            </Animated.View>

            {/* 3. Approval Progress Bar - Odoo style */}
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

            {/* 4. Menciones de Técnico Medio - TAGS */}
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
                            <View key={i} style={[styles.mentionTag, { backgroundColor: Colors.warning + '15' }]}>
                                <Ionicons name="school" size={14} color={Colors.warning} />
                                <Text style={[styles.mentionTagText, { color: Colors.warning }]}>{mention}</Text>
                            </View>
                        ))}
                    </View>
                ) : <Empty message="Sin menciones registradas" />}
            </Card>

            {/* 5. Top 3 Estudiantes por Mención - TABLE style like Odoo */}
            <Card title="Top 3 Estudiantes por Mención" delay={200}>
                {isLoading ? (
                    <>
                        <ListRowSkeleton hasAvatar hasBadge />
                        <ListRowSkeleton hasAvatar hasBadge />
                        <ListRowSkeleton hasAvatar hasBadge />
                    </>
                ) : levelDashboard?.top_students_by_section?.length ? (
                    <View style={styles.tableContainer}>
                        {/* Table Header */}
                        <View style={[styles.tableHeader, { backgroundColor: Colors.warning }]}>
                            <Text style={[styles.tableHeaderText, { width: 40 }]}>Pos.</Text>
                            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Estudiante</Text>
                            <Text style={[styles.tableHeaderText, { width: 70, textAlign: 'right' }]}>Promedio</Text>
                        </View>

                        {/* Table Body */}
                        {levelDashboard.top_students_by_section.map((sec, secIndex) => (
                            <View key={secIndex}>
                                {/* Section Header Row */}
                                <View style={styles.sectionHeaderRow}>
                                    <Ionicons name="school" size={12} color={Colors.warning} style={{ marginRight: 6 }} />
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

    // KPI Cards Row - Odoo style
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

    // Progress Bar - Odoo style
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
    tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
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

    // Table styles - Odoo style
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
