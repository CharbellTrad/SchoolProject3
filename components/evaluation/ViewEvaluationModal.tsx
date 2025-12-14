import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';
import {
    Evaluation,
    EVALUATION_STATE_COLORS,
    EVALUATION_STATE_LABELS,
    EvaluationScore,
    loadEvaluationScores,
    RESULT_STATE_COLORS,
    RESULT_STATE_LABELS,
    SCORE_STATE_COLORS,
    SCORE_STATE_LABELS,
} from '../../services-odoo/evaluationService';

interface ViewEvaluationModalProps {
    visible: boolean;
    evaluation: Evaluation | null;
    onClose: () => void;
    onEdit: () => void;
    onGrade: () => void;
    isOfflineMode?: boolean;
}

type TabKey = 'info' | 'scores' | 'stats';

interface TabConfig {
    key: TabKey;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
}

// Score card for individual student scores
const ScoreCard = ({ score, evaluation }: { score: EvaluationScore; evaluation: Evaluation }) => {
    const getDisplayScore = () => {
        if (!evaluation.invisibleScore) {
            // Numérico
            return `${score.points20.toFixed(1)} pts`;
        } else if (!evaluation.invisibleLiteral) {
            // Literal
            return score.literalType || '-';
        } else if (!evaluation.invisibleObservation) {
            // Observación
            return score.observation ? 'Completado' : 'Pendiente';
        }
        return '-';
    };

    return (
        <View style={styles.scoreCard}>
            <View style={styles.scoreCardLeft}>
                <View style={styles.studentAvatar}>
                    <Ionicons name="person" size={16} color={Colors.primary} />
                </View>
                <View style={styles.scoreCardInfo}>
                    <Text style={styles.scoreCardName} numberOfLines={1}>{score.studentName}</Text>
                    <View style={[styles.stateBadge, { backgroundColor: SCORE_STATE_COLORS[score.state] + '20' }]}>
                        <Text style={[styles.stateBadgeText, { color: SCORE_STATE_COLORS[score.state] }]}>
                            {SCORE_STATE_LABELS[score.state]}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.scoreCardRight}>
                <Text style={[
                    styles.scoreValue,
                    { color: score.stateScore === 'approve' ? Colors.success : Colors.error }
                ]}>
                    {getDisplayScore()}
                </Text>
                {score.state === 'qualified' && (
                    <View style={[styles.resultBadge, { backgroundColor: RESULT_STATE_COLORS[score.stateScore] + '20' }]}>
                        <Text style={[styles.resultBadgeText, { color: RESULT_STATE_COLORS[score.stateScore] }]}>
                            {RESULT_STATE_LABELS[score.stateScore]}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

export const ViewEvaluationModal: React.FC<ViewEvaluationModalProps> = ({
    visible,
    evaluation,
    onClose,
    onEdit,
    onGrade,
    isOfflineMode = false,
}) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['92%'], []);
    const [activeTab, setActiveTab] = useState<TabKey>('info');
    const [scores, setScores] = useState<EvaluationScore[]>([]);
    const [loadingScores, setLoadingScores] = useState(false);

    // Tabs configuration
    const tabs = useMemo<TabConfig[]>(() => [
        { key: 'info', label: 'Información', icon: 'information-circle' },
        { key: 'scores', label: 'Calificaciones', icon: 'list' },
        { key: 'stats', label: 'Estadísticas', icon: 'bar-chart' },
    ], []);

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
            setActiveTab('info');
            setScores([]);
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    // Load scores when tab changes to scores
    useEffect(() => {
        const fetchScores = async () => {
            if (!visible || !evaluation || activeTab !== 'scores') return;
            if (scores.length > 0) return; // Already loaded

            setLoadingScores(true);
            try {
                const loadedScores = await loadEvaluationScores(evaluation.id);
                setScores(loadedScores);
            } catch (error) {
                if (__DEV__) {
                    console.error('Error loading scores:', error);
                }
            } finally {
                setLoadingScores(false);
            }
        };

        fetchScores();
    }, [visible, evaluation?.id, activeTab]);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const handleSheetChanges = useCallback(
        (index: number) => {
            if (index === -1) onClose();
        },
        [onClose]
    );

    if (!evaluation) return null;

    const stateColor = EVALUATION_STATE_COLORS[evaluation.state];
    const stateLabel = EVALUATION_STATE_LABELS[evaluation.state];

    // Calculate stats from scores
    const getStats = () => {
        const total = scores.length;
        const qualified = scores.filter(s => s.state === 'qualified').length;
        const approved = scores.filter(s => s.stateScore === 'approve').length;
        const failed = total - approved;
        const pending = total - qualified;

        return { total, qualified, approved, failed, pending };
    };

    const renderInfoTab = () => (
        <View style={styles.tabContent}>
            {/* Basic Info */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Detalles de la Evaluación</Text>

                <View style={styles.infoRow}>
                    <Ionicons name="person" size={18} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Profesor:</Text>
                    <Text style={styles.infoValue}>{evaluation.professorName}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="school" size={18} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Sección:</Text>
                    <Text style={styles.infoValue}>{evaluation.sectionName}</Text>
                </View>

                {evaluation.subjectName && (
                    <View style={styles.infoRow}>
                        <Ionicons name="book" size={18} color={Colors.textSecondary} />
                        <Text style={styles.infoLabel}>Materia:</Text>
                        <Text style={styles.infoValue}>{evaluation.subjectName}</Text>
                    </View>
                )}

                <View style={styles.infoRow}>
                    <Ionicons name="calendar" size={18} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Fecha:</Text>
                    <Text style={styles.infoValue}>{evaluation.evaluationDate || 'Sin fecha'}</Text>
                </View>

                <View style={styles.infoRow}>
                    <Ionicons name="stats-chart" size={18} color={Colors.textSecondary} />
                    <Text style={styles.infoLabel}>Promedio:</Text>
                    <Text style={[styles.infoValue, { color: Colors.primary, fontWeight: '700' }]}>
                        {evaluation.scoreAverage || '-'}
                    </Text>
                </View>
            </View>

            {/* Description */}
            {evaluation.description && (
                <View style={styles.infoSection}>
                    <Text style={styles.sectionTitle}>Descripción</Text>
                    <View style={styles.descriptionBox}>
                        <Text style={styles.descriptionText}>
                            {evaluation.description.replace(/<[^>]*>/g, '')}
                        </Text>
                    </View>
                </View>
            )}

            {/* Quick Stats */}
            <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Resumen Rápido</Text>
                <View style={styles.quickStatsRow}>
                    <View style={styles.quickStatBox}>
                        <Text style={styles.quickStatValue}>{evaluation.scoresCount}</Text>
                        <Text style={styles.quickStatLabel}>Estudiantes</Text>
                    </View>
                    <View style={styles.quickStatBox}>
                        <View style={[styles.stateBadgeLarge, { backgroundColor: stateColor + '20' }]}>
                            <Text style={[styles.stateBadgeLargeText, { color: stateColor }]}>{stateLabel}</Text>
                        </View>
                        <Text style={styles.quickStatLabel}>Estado</Text>
                    </View>
                </View>
            </View>
        </View>
    );

    const renderScoresTab = () => (
        <View style={styles.tabContent}>
            {loadingScores ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>Cargando calificaciones...</Text>
                </View>
            ) : scores.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="clipboard-outline" size={48} color={Colors.textTertiary} />
                    <Text style={styles.emptyTitle}>Sin calificaciones</Text>
                    <Text style={styles.emptyText}>Esta evaluación no tiene estudiantes registrados</Text>
                </View>
            ) : (
                <View style={styles.scoresContainer}>
                    {/* Header */}
                    <View style={styles.scoresHeader}>
                        <Text style={styles.scoresHeaderText}>
                            {scores.filter(s => s.state === 'qualified').length} / {scores.length} calificados
                        </Text>
                        <TouchableOpacity
                            style={[styles.gradeButton, isOfflineMode && styles.btnDisabled]}
                            onPress={onGrade}
                            disabled={isOfflineMode}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="create" size={16} color={isOfflineMode ? '#9ca3af' : '#fff'} />
                            <Text style={[styles.gradeButtonText, isOfflineMode && { color: '#9ca3af' }]}>
                                Calificar
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Scores list - limited to prevent performance issues */}
                    {scores.slice(0, 20).map((score) => (
                        <ScoreCard key={score.id} score={score} evaluation={evaluation} />
                    ))}

                    {scores.length > 20 && (
                        <View style={styles.moreIndicator}>
                            <Text style={styles.moreIndicatorText}>
                                + {scores.length - 20} estudiantes más
                            </Text>
                            <TouchableOpacity
                                style={styles.viewAllButton}
                                onPress={onGrade}
                                disabled={isOfflineMode}
                            >
                                <Text style={[styles.viewAllText, isOfflineMode && { color: Colors.textTertiary }]}>
                                    Ver todos y calificar
                                </Text>
                                <Ionicons name="arrow-forward" size={16} color={isOfflineMode ? Colors.textTertiary : Colors.primary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </View>
    );

    const renderStatsTab = () => {
        const stats = getStats();

        return (
            <View style={styles.tabContent}>
                {scores.length === 0 && !loadingScores ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="bar-chart-outline" size={48} color={Colors.textTertiary} />
                        <Text style={styles.emptyTitle}>Sin datos</Text>
                        <Text style={styles.emptyText}>Cargue las calificaciones primero</Text>
                        <TouchableOpacity
                            style={styles.loadScoresButton}
                            onPress={() => setActiveTab('scores')}
                        >
                            <Text style={styles.loadScoresText}>Ver Calificaciones</Text>
                        </TouchableOpacity>
                    </View>
                ) : loadingScores ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={Colors.primary} />
                        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
                    </View>
                ) : (
                    <View style={styles.statsContainer}>
                        {/* Progress Overview */}
                        <View style={styles.statsSection}>
                            <Text style={styles.sectionTitle}>Progreso de Calificación</Text>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        { width: `${(stats.qualified / stats.total) * 100}%` }
                                    ]}
                                />
                            </View>
                            <Text style={styles.progressText}>
                                {stats.qualified} de {stats.total} calificados ({Math.round((stats.qualified / stats.total) * 100)}%)
                            </Text>
                        </View>

                        {/* Results Breakdown */}
                        <View style={styles.statsSection}>
                            <Text style={styles.sectionTitle}>Resultados</Text>
                            <View style={styles.statsGrid}>
                                <View style={[styles.statsCard, { backgroundColor: Colors.success + '10' }]}>
                                    <Text style={[styles.statsCardValue, { color: Colors.success }]}>{stats.approved}</Text>
                                    <Text style={styles.statsCardLabel}>Aprobados</Text>
                                </View>
                                <View style={[styles.statsCard, { backgroundColor: Colors.error + '10' }]}>
                                    <Text style={[styles.statsCardValue, { color: Colors.error }]}>{stats.failed}</Text>
                                    <Text style={styles.statsCardLabel}>Reprobados</Text>
                                </View>
                                <View style={[styles.statsCard, { backgroundColor: Colors.warning + '10' }]}>
                                    <Text style={[styles.statsCardValue, { color: Colors.warning }]}>{stats.pending}</Text>
                                    <Text style={styles.statsCardLabel}>Pendientes</Text>
                                </View>
                            </View>
                        </View>

                        {/* Average */}
                        <View style={styles.statsSection}>
                            <Text style={styles.sectionTitle}>Promedio General</Text>
                            <View style={styles.averageBox}>
                                <Text style={styles.averageValue}>{evaluation.scoreAverage || '-'}</Text>
                                <View style={[
                                    styles.averageBadge,
                                    { backgroundColor: evaluation.stateScore === 'approve' ? Colors.success + '20' : Colors.error + '20' }
                                ]}>
                                    <Text style={[
                                        styles.averageBadgeText,
                                        { color: evaluation.stateScore === 'approve' ? Colors.success : Colors.error }
                                    ]}>
                                        {RESULT_STATE_LABELS[evaluation.stateScore]}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>
                )}
            </View>
        );
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'info':
                return renderInfoTab();
            case 'scores':
                return renderScoresTab();
            case 'stats':
                return renderStatsTab();
            default:
                return null;
        }
    };

    return (
        <>
            {visible && <StatusBar style="light" />}

            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                onChange={handleSheetChanges}
                backdropComponent={renderBackdrop}
                enablePanDownToClose={true}
                handleIndicatorStyle={styles.handleIndicator}
                backgroundStyle={styles.bottomSheetBackground}
                topInset={insets.top}
                enableContentPanningGesture={false}
                enableHandlePanningGesture={true}
                enableOverDrag={false}
            >
                <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconBox, { backgroundColor: stateColor + '15' }]}>
                                <Ionicons name="clipboard" size={22} color={stateColor} />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerTitle} numberOfLines={1}>{evaluation.name}</Text>
                                <View style={styles.headerMeta}>
                                    <View style={[styles.typeBadge, { backgroundColor: stateColor + '20' }]}>
                                        <Text style={[styles.typeText, { color: stateColor }]}>{stateLabel}</Text>
                                    </View>
                                    <Text style={styles.yearText}>{evaluation.yearName}</Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <Ionicons name="close-circle" size={28} color={Colors.error} />
                        </TouchableOpacity>
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabBar}>
                        {tabs.map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                                onPress={() => setActiveTab(tab.key)}
                                activeOpacity={0.7}
                            >
                                <Ionicons
                                    name={tab.icon}
                                    size={18}
                                    color={activeTab === tab.key ? Colors.primary : Colors.textSecondary}
                                />
                                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Body */}
                    <BottomSheetScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.bodyContent}
                    >
                        {renderActiveTab()}
                    </BottomSheetScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={onEdit}
                            style={[styles.secondaryBtn, isOfflineMode && styles.btnDisabled]}
                            activeOpacity={0.8}
                            disabled={isOfflineMode}
                        >
                            <Ionicons name="create-outline" size={20} color={isOfflineMode ? '#9ca3af' : Colors.primary} />
                            <Text style={[styles.secondaryBtnLabel, isOfflineMode && { color: '#9ca3af' }]}>
                                Editar
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={onGrade}
                            style={[styles.primaryBtn, isOfflineMode && styles.btnDisabled]}
                            activeOpacity={0.8}
                            disabled={isOfflineMode}
                        >
                            <Ionicons name="checkbox-outline" size={20} color={isOfflineMode ? '#9ca3af' : '#fff'} />
                            <Text style={[styles.primaryBtnLabel, isOfflineMode && { color: '#9ca3af' }]}>
                                Calificar Estudiantes
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BottomSheetModal>
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    handleIndicator: {
        backgroundColor: Colors.border,
        width: 40,
        height: 4,
    },
    bottomSheetBackground: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        backgroundColor: '#fff',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        flex: 1,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerInfo: {
        flex: 1,
        gap: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },
    headerMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    yearText: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        paddingHorizontal: 10,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: Colors.primary,
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    tabLabelActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    bodyContent: {
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingBottom: 100,
    },
    tabContent: {
        flex: 1,
    },
    // Info Tab styles
    infoSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
        width: 80,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textPrimary,
        flex: 1,
    },
    descriptionBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    quickStatsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    quickStatBox: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    quickStatValue: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    quickStatLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    stateBadgeLarge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    stateBadgeLargeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    // Scores Tab styles
    scoresContainer: {
        flex: 1,
    },
    scoresHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    scoresHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    gradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Colors.primary,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    gradeButtonText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    scoreCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    scoreCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    studentAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreCardInfo: {
        flex: 1,
        gap: 4,
    },
    scoreCardName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    scoreCardRight: {
        alignItems: 'flex-end',
        gap: 4,
    },
    scoreValue: {
        fontSize: 16,
        fontWeight: '800',
    },
    stateBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    stateBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    resultBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    resultBadgeText: {
        fontSize: 10,
        fontWeight: '700',
    },
    moreIndicator: {
        alignItems: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    moreIndicatorText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textTertiary,
    },
    viewAllButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    // Stats Tab styles
    statsContainer: {
        flex: 1,
    },
    statsSection: {
        marginBottom: 24,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#e2e8f0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.success,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    statsCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 4,
    },
    statsCardValue: {
        fontSize: 24,
        fontWeight: '800',
    },
    statsCardLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    averageBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    averageValue: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    averageBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
    },
    averageBadgeText: {
        fontSize: 14,
        fontWeight: '700',
    },
    // Empty and Loading states
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        gap: 12,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    loadScoresButton: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        backgroundColor: Colors.primaryLight + '20',
    },
    loadScoresText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    // Footer
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: '#f8fafc',
        gap: 12,
    },
    secondaryBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 20,
        gap: 8,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    secondaryBtnLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.primary,
    },
    primaryBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 13,
        paddingHorizontal: 20,
        gap: 8,
    },
    primaryBtnLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: '#fff',
    },
    btnDisabled: {
        backgroundColor: '#e2e8f0',
        borderColor: '#e2e8f0',
    },
    descriptionText: {
        fontSize: 14,
        color: Colors.textSecondary,
        lineHeight: 20,
    },
});
