/**
 * ProfessorsTab - enhanced visual design with skeleton loading
 * Features: Tables for Professors Summary and Stats, Detail Modal
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, ProfessorDetailedItem } from '../../../services-odoo/dashboardService';
import { AnimatedBarChart, ProgressLine } from '../charts';
import { Card, ChartSkeleton, Empty, StatCardSkeleton, TableRowSkeleton } from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
}

export const ProfessorsTab: React.FC<Props> = ({ data: d, loading }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedProfRef = useRef<ProfessorDetailedItem | null>(null);
    const isLoading = loading || !d;

    const openModal = (prof: ProfessorDetailedItem) => {
        selectedProfRef.current = prof;
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
    };

    // Difficult subjects bar data
    const difficultyData = d?.difficultSubjects?.subjects?.slice(0, 6).map((s) => ({
        value: s.failure_rate || 0,
        label: s.subject_name.length > 8 ? s.subject_name.substring(0, 7) + '…' : s.subject_name,
        frontColor: Colors.error,
        gradientColor: '#f87171',
    })) || [];

    const getLevelLabel = (key: string) => {
        switch (key) {
            case 'pre': return 'Preescolar';
            case 'primary': return 'Primaria';
            case 'secundary_general': return 'Media General';
            case 'secundary_tecnico': return 'Técnico Medio';
            default: return key;
        }
    };

    const getLevelColor = (key: string) => {
        switch (key) {
            case 'pre': return Colors.levelPre;
            case 'primary': return Colors.levelPrimary;
            case 'secundary_general': return Colors.levelSecundary;
            case 'secundary_tecnico': return Colors.levelTecnico;
            default: return Colors.textSecondary;
        }
    };

    return (
        <View style={styles.container}>
            {/* Resumen de Profesores */}
            <Card title="Resumen de Profesores" delay={100}>
                {isLoading ? (
                    <>
                        <StatCardSkeleton />
                        <TableRowSkeleton columns={4} />
                        <TableRowSkeleton columns={4} isAlt />
                        <TableRowSkeleton columns={4} />
                        <TableRowSkeleton columns={4} isAlt />
                        <TableRowSkeleton columns={4} />
                    </>
                ) : (
                    <>
                        {/* Total Counter */}
                        <View style={styles.totalCard}>
                            <View style={styles.totalIcon}>
                                <Ionicons name="people" size={28} color={Colors.primary} />
                            </View>
                            <Text style={styles.totalValue}>{d?.professorSummary?.total || 0}</Text>
                            <Text style={styles.totalLabel}>Profesores Activos</Text>
                        </View>

                        {/* Professors Table */}
                        {d?.professorSummary?.professors?.length ? (
                            <View style={styles.table}>
                                {/* Header */}
                                <LinearGradient
                                    colors={[Colors.backgroundTertiary, '#fff']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 0, y: 1 }}
                                    style={styles.tableHeader}
                                >
                                    <Text style={[styles.tableHeaderCell, { flex: 2, paddingLeft: 8 }]}>Profesor</Text>
                                    <Text style={[styles.tableHeaderCell, styles.centerText]}>Secciones</Text>
                                    <Text style={[styles.tableHeaderCell, styles.centerText]}>Materias</Text>
                                    <Text style={[styles.tableHeaderCell, styles.centerText]}>Evaluac.</Text>
                                </LinearGradient>

                                {/* Rows */}
                                {d.professorSummary.professors.map((p, i) => (
                                    <View key={i} style={[styles.tableRow, i % 2 !== 0 && styles.tableRowAlt]}>
                                        <Text style={[styles.tableCell, { flex: 2, fontWeight: '600', paddingLeft: 8 }]} numberOfLines={1}>
                                            {p.professor_name}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.centerText]}>
                                            {p.sections_count}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.centerText]}>
                                            {p.subjects_count}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.centerText]}>
                                            {p.evaluations_count}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        ) : <Empty />}
                    </>
                )}
            </Card>

            {/* Estadísticas por Tipo de Estudiante */}
            <Card title="Estadísticas por Tipo de Estudiante" delay={200}>
                {isLoading ? (
                    <>
                        <TableRowSkeleton columns={3} />
                        <TableRowSkeleton columns={3} isAlt />
                        <TableRowSkeleton columns={3} />
                        <TableRowSkeleton columns={3} isAlt />
                        <TableRowSkeleton columns={3} />
                    </>
                ) : d?.professorDetailedStats?.professors?.length ? (
                    <View style={styles.table}>
                        {/* Header */}
                        <LinearGradient
                            colors={[Colors.backgroundTertiary, '#fff']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.tableHeader}
                        >
                            <Text style={[styles.tableHeaderCell, { flex: 2, paddingLeft: 8 }]}>Profesor</Text>
                            <Text style={[styles.tableHeaderCell, styles.centerText]}>Evaluac.</Text>
                            <Text style={[styles.tableHeaderCell, styles.centerText]}>Secciones</Text>
                        </LinearGradient>

                        {/* Rows */}
                        {d.professorDetailedStats.professors.map((prof, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.tableRow, i % 2 !== 0 && styles.tableRowAlt]}
                                onPress={() => openModal(prof)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tableCell, { flex: 2, fontWeight: '600', paddingLeft: 8 }]} numberOfLines={1}>
                                    {prof.professor_name}
                                </Text>
                                <Text style={[styles.tableCell, styles.centerText]}>
                                    {prof.total_evaluations}
                                </Text>
                                <Text style={[styles.tableCell, styles.centerText]}>
                                    {prof.sections_count}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : <Empty />}
            </Card>

            {/* Materias Difíciles */}
            <Card title="Materias con Mayor Dificultad" delay={300}>
                {isLoading ? (
                    <ChartSkeleton type="bar" height={140} />
                ) : d?.difficultSubjects?.subjects?.length ? (
                    <>
                        <View style={styles.diffList}>
                            {d.difficultSubjects.subjects.slice(0, 4).map((s, i) => (
                                <View key={i} style={styles.difficultyRow}>
                                    <Text style={styles.difficultyName}>{s.subject_name}</Text>
                                    <View style={styles.difficultyBar}>
                                        <ProgressLine value={s.failure_rate || 0} color={Colors.error} height={6} animate />
                                    </View>
                                    <Text style={styles.difficultyValue}>{s.failure_rate}%</Text>
                                </View>
                            ))}
                        </View>
                        {difficultyData.length > 0 && (
                            <View style={styles.chartSection}>
                                <AnimatedBarChart data={difficultyData} maxValue={100} height={140} barWidth={24} spacing={20} />
                            </View>
                        )}
                    </>
                ) : <Empty />}
            </Card>

            {/* Professor Detail Modal */}
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={closeModal}
            >
                <Pressable style={styles.modalOverlay} onPress={closeModal}>
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Detalle del Profesor</Text>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        {selectedProfRef.current && (
                            <View style={styles.modalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Profesor</Text>
                                    <Text style={styles.detailValue}>{selectedProfRef.current.professor_name}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Evaluaciones</Text>
                                    <Text style={[styles.detailValue]}>
                                        {selectedProfRef.current.total_evaluations}
                                    </Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Secciones</Text>
                                    <Text style={styles.detailValue}>{selectedProfRef.current.sections_count}</Text>
                                </View>

                                {/* Stats by Type Header */}
                                <View style={styles.statsHeader}>
                                    <Text style={styles.statsHeaderText}>Promedios por Nivel</Text>
                                </View>

                                {/* Stats by Type */}
                                {(['pre', 'primary', 'secundary_general', 'secundary_tecnico'] as const).map((key) => {
                                    const stat = selectedProfRef.current?.stats_by_type?.[key];
                                    if (!stat || stat.count === 0) return null;

                                    return (
                                        <View key={key} style={styles.detailRow}>
                                            <View style={styles.levelLabelContainer}>
                                                <View style={[styles.levelDot, { backgroundColor: getLevelColor(key) }]} />
                                                <Text style={styles.detailLabel}>{getLevelLabel(key)}</Text>
                                            </View>
                                            <Text style={[styles.detailValue, { color: getLevelColor(key), fontWeight: '700' }]}>
                                                {stat.average?.toFixed(1) || '-'} ({stat.count})
                                            </Text>
                                        </View>
                                    );
                                })}
                            </View>
                        )}
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 6 },

    totalCard: { alignItems: 'center', justifyContent: 'center', paddingVertical: 20, marginBottom: 16 },
    totalIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8, backgroundColor: Colors.primary + '15' },
    totalValue: { fontSize: 32, fontWeight: '800', color: Colors.primary },
    totalLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

    // Table styles
    table: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight },
    tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4 },
    tableHeaderCell: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', flex: 1 },
    tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', backgroundColor: '#fff' },
    tableRowAlt: { backgroundColor: Colors.backgroundTertiary },
    tableCell: { fontSize: 12, color: Colors.textPrimary, flex: 1 },
    centerText: { textAlign: 'center' },
    pillsContainer: { flexDirection: 'row', flex: 1 },

    // Difficulty section
    diffList: { gap: 12, marginBottom: 20 },
    difficultyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    difficultyName: { width: 100, fontSize: 12, fontWeight: '600', color: Colors.textPrimary },
    difficultyBar: { flex: 1 },
    difficultyValue: { width: 30, fontSize: 11, fontWeight: '700', color: Colors.error, textAlign: 'right' },
    chartSection: { paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight },

    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        backgroundColor: Colors.backgroundTertiary,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    modalBody: {
        padding: 20,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    detailLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 14,
        color: Colors.textPrimary,
        fontWeight: '600',
        textAlign: 'right',
        flex: 1,
        marginLeft: 16,
    },
    statsHeader: {
        paddingTop: 16,
        paddingBottom: 8,
        borderBottomWidth: 0,
    },
    statsHeaderText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    levelLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    levelStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelCount: {
        fontSize: 11,
        color: Colors.textTertiary,
        marginLeft: 6,
    },
});

export default ProfessorsTab;
