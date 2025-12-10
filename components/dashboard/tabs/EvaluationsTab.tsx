/**
 * EvaluationsTab - enhanced visual design with skeleton loading
 * Features: Stats, Distribution by Level, Recent Evaluations Table with Detail Modal
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, RecentEvaluation } from '../../../services-odoo/dashboardService';
import { ProgressLine } from '../charts';
import { AnimatedBadge, Card, DistributionRowSkeleton, Empty, StatCardSkeleton, TableRowSkeleton } from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
}

export const EvaluationsTab: React.FC<Props> = ({ data: d, loading }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedEvalRef = useRef<RecentEvaluation | null>(null);
    const isLoading = loading || !d;

    const openModal = (evaluation: RecentEvaluation) => {
        selectedEvalRef.current = evaluation;
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        // Don't clear the ref - keep content visible during fade out
    };

    const total = d?.evaluationsStats?.total || 0;
    const byType = d?.evaluationsStats?.by_type;

    // Distribution by level data - Colors match Odoo
    const distributionData = byType ? [
        { level: 'Media General', count: byType.secundary || 0, color: Colors.levelSecundary },
        { level: 'Primaria', count: byType.primary || 0, color: Colors.levelPrimary },
        { level: 'Preescolar', count: byType.pre || 0, color: Colors.levelPre },
    ] : [];

    const totalByType = distributionData.reduce((sum, d) => sum + d.count, 0);

    const getStateLabel = (state: string) => {
        switch (state) {
            case 'qualified': return 'Calificada';
            case 'partial': return 'Parcial';
            default: return 'Borrador';
        }
    };

    const getStateColor = (state: string) => {
        switch (state) {
            case 'qualified': return Colors.success;
            case 'partial': return Colors.warning;
            default: return Colors.textTertiary;
        }
    };

    return (
        <View style={styles.container}>
            {/* Stats Grid */}
            <Card title="Estadísticas de Evaluaciones" delay={100}>
                {isLoading ? (
                    <>
                        <View style={[styles.statsRow, { marginBottom: 10 }]}>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </View>
                        <View style={styles.statsRow}>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </View>
                    </>
                ) : (
                    <>
                        <View style={[styles.statsRow, { marginBottom: 10 }]}>
                            <Card style={styles.breakdownCard}>
                                <View style={styles.breakdownItem}>
                                    <Text style={[styles.bdValue, { color: Colors.primary }]}>{total}</Text>
                                    <Text style={styles.bdLabel}>Total Evaluaciones</Text>
                                </View>
                            </Card>
                            <Card style={styles.breakdownCard}>
                                <View style={styles.breakdownItem}>
                                    <Text style={[styles.bdValue, { color: Colors.success }]}>{d?.evaluationsStats?.qualified || 0}</Text>
                                    <Text style={styles.bdLabel}>Calificadas</Text>
                                </View>
                            </Card>
                        </View>
                        <View style={styles.statsRow}>
                            <Card style={styles.breakdownCard}>
                                <View style={styles.breakdownItem}>
                                    <Text style={[styles.bdValue, { color: Colors.warning }]}>{d?.evaluationsStats?.partial || 0}</Text>
                                    <Text style={styles.bdLabel}>Parciales</Text>
                                </View>
                            </Card>
                            <Card style={styles.breakdownCard}>
                                <View style={styles.breakdownItem}>
                                    <Text style={[styles.bdValue, { color: Colors.textTertiary }]}>{d?.evaluationsStats?.draft || 0}</Text>
                                    <Text style={styles.bdLabel}>Borrador</Text>
                                </View>
                            </Card>
                        </View>
                    </>
                )}
            </Card>

            {/* Distribución por Nivel */}
            <Card title="Distribución por Nivel" delay={150}>
                {isLoading ? (
                    <>
                        <DistributionRowSkeleton />
                        <DistributionRowSkeleton />
                        <DistributionRowSkeleton />
                    </>
                ) : distributionData.length > 0 && totalByType > 0 ? (
                    <View>
                        {distributionData.map((item, i) => (
                            <View key={i} style={styles.distRow}>
                                <View style={styles.distInfo}>
                                    <View style={[styles.levelDot, { backgroundColor: item.color }]} />
                                    <Text style={styles.distName}>{item.level}</Text>
                                    <Text style={styles.distCount}>{item.count}</Text>
                                </View>
                                <View style={styles.distProgress}>
                                    <ProgressLine
                                        value={totalByType > 0 ? (item.count / totalByType) * 100 : 0}
                                        height={8}
                                        color={item.color}
                                        animate
                                    />
                                </View>
                            </View>
                        ))}
                    </View>
                ) : <Empty message="Sin datos de distribución" />}
            </Card>

            {/* Evaluaciones Recientes - Simplified Table */}
            <Card title="Evaluaciones Recientes" delay={200}>
                {isLoading ? (
                    <>
                        <TableRowSkeleton columns={4} />
                        <TableRowSkeleton columns={4} isAlt />
                        <TableRowSkeleton columns={4} />
                        <TableRowSkeleton columns={4} isAlt />
                        <TableRowSkeleton columns={4} />
                    </>
                ) : d?.recentEvaluations?.evaluations?.length ? (
                    <View style={styles.evalTable}>
                        {/* Gradient Header */}
                        <LinearGradient
                            colors={[Colors.backgroundTertiary, '#fff']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={styles.tableHeader}
                        >
                            <Text style={[styles.tableHeaderCell, { width: 80, paddingLeft: 8 }]}>Fecha</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 2 }]}>Evaluación</Text>
                            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Sección</Text>
                            <Text style={[styles.tableHeaderCell, styles.centerText, { width: 60 }]}>Estado</Text>
                        </LinearGradient>

                        {/* Rows */}
                        {d.recentEvaluations.evaluations.map((e, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[styles.tableRow, i % 2 !== 0 && styles.tableRowAlt]}
                                onPress={() => openModal(e)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.tableCell, { width: 80, fontSize: 10, color: Colors.textTertiary, paddingLeft: 8 }]}>
                                    {e.date}
                                </Text>
                                <Text style={[styles.tableCell, { flex: 2, fontWeight: '600' }]} numberOfLines={1}>
                                    {e.name}
                                </Text>
                                <Text style={[styles.tableCell, { flex: 1, fontSize: 11, color: Colors.textSecondary }]} numberOfLines={1}>
                                    {e.section}
                                </Text>
                                <View style={[styles.pillsContainer, { justifyContent: 'center', width: 60 }]}>
                                    <AnimatedBadge
                                        value={e.state === 'qualified' ? 'Calif.' : e.state === 'partial' ? 'Parc.' : 'Borr.'}
                                        color={getStateColor(e.state)}
                                    />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                ) : <Empty message="Sin evaluaciones recientes" />}
            </Card>

            {/* Evaluation Detail Modal */}
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
                            <Text style={styles.modalTitle}>Detalle de Evaluación</Text>
                            <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                                <Ionicons name="close" size={24} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {/* Content */}
                        {selectedEvalRef.current && (
                            <View style={styles.modalBody}>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Evaluación</Text>
                                    <Text style={styles.detailValue}>{selectedEvalRef.current.name}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Fecha</Text>
                                    <Text style={styles.detailValue}>{selectedEvalRef.current.date}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Profesor</Text>
                                    <Text style={styles.detailValue}>{selectedEvalRef.current.professor || '-'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Sección</Text>
                                    <Text style={styles.detailValue}>{selectedEvalRef.current.section}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Materia</Text>
                                    <Text style={styles.detailValue}>{selectedEvalRef.current.subject || '-'}</Text>
                                </View>
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Promedio</Text>
                                    <Text style={[styles.detailValue, {
                                        color: Number(selectedEvalRef.current.average || 0) >= 10 ? Colors.success : Colors.error,
                                        fontWeight: '700'
                                    }]}>
                                        {selectedEvalRef.current.average != null ? Number(selectedEvalRef.current.average).toFixed(1) : '-'}
                                    </Text>
                                </View>
                                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                                    <Text style={styles.detailLabel}>Estado</Text>
                                    <AnimatedBadge
                                        value={getStateLabel(selectedEvalRef.current.state)}
                                        color={getStateColor(selectedEvalRef.current.state)}
                                    />
                                </View>
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
    statsRow: { flexDirection: 'row', gap: 12 },
    breakdownCard: { flex: 1, padding: 12, marginBottom: 0 },
    breakdownItem: { alignItems: 'center' },
    bdValue: { fontSize: 20, fontWeight: '800' },
    bdLabel: { fontSize: 10, color: Colors.textSecondary, marginTop: 4 },

    // Distribution by level
    distRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    distInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    levelDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
    distName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
    distCount: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },
    distProgress: { width: '100%' },

    // Evaluations table
    evalTable: { borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight },
    tableHeader: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 4 },
    tableHeaderCell: { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
    tableRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', backgroundColor: '#fff' },
    tableRowAlt: { backgroundColor: Colors.backgroundTertiary },
    tableCell: { fontSize: 12, color: Colors.textPrimary },
    centerText: { textAlign: 'center', flex: 1 },
    pillsContainer: { flexDirection: 'row', flex: 1 },

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
});

export default EvaluationsTab;
