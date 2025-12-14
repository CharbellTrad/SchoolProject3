import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Keyboard,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';
import {
    Evaluation,
    EvaluationScore,
    LITERAL_SHORT_LABELS,
    loadEvaluationScores,
    updateEvaluationScoresBatch,
    UpdateScoreData
} from '../../services-odoo/evaluationService';
import { showAlert } from '../showAlert';

interface EvaluationScoresModalProps {
    visible: boolean;
    evaluation: Evaluation | null;
    onClose: () => void;
    onSaved: () => void;
}

type ScoreUpdate = {
    id: number;
    original: EvaluationScore;
    current: UpdateScoreData;
    hasChanges: boolean;
};

// Individual score row component
const ScoreRow = ({
    scoreUpdate,
    evaluation,
    onUpdateScore,
    onUpdateLiteral,
    onUpdateObservation,
}: {
    scoreUpdate: ScoreUpdate;
    evaluation: Evaluation;
    onUpdateScore: (id: number, value: number) => void;
    onUpdateLiteral: (id: number, value: string) => void;
    onUpdateObservation: (id: number, value: string) => void;
}) => {
    const { original, current, hasChanges } = scoreUpdate;

    // Determine which input to show
    const showNumericInput = !evaluation.invisibleScore;
    const showLiteralInput = !evaluation.invisibleLiteral && evaluation.invisibleScore;
    const showObservationInput = !evaluation.invisibleObservation && evaluation.invisibleScore && evaluation.invisibleLiteral;

    const renderNumericInput = () => {
        const currentScore = current.score ?? original.score;
        const maxScore = evaluation.type === 'secundary' ? 20 : 20; // Could be 100 based on config

        return (
            <View style={styles.numericInputContainer}>
                <TextInput
                    style={[styles.numericInput, hasChanges && styles.inputChanged]}
                    value={currentScore > 0 ? currentScore.toString() : ''}
                    onChangeText={(text) => {
                        const value = parseFloat(text) || 0;
                        if (value >= 0 && value <= maxScore) {
                            onUpdateScore(original.id, value);
                        }
                    }}
                    keyboardType="decimal-pad"
                    placeholder="0"
                    placeholderTextColor={Colors.textTertiary}
                    maxLength={5}
                    selectTextOnFocus
                />
                <Text style={styles.maxScoreText}>/ {maxScore}</Text>
            </View>
        );
    };

    const renderLiteralInput = () => {
        const currentLiteral = current.literalType ?? original.literalType;
        const literals: Array<'A' | 'B' | 'C' | 'D' | 'E'> = ['A', 'B', 'C', 'D', 'E'];

        return (
            <View style={styles.literalInputContainer}>
                {literals.map((literal) => (
                    <TouchableOpacity
                        key={literal}
                        style={[
                            styles.literalButton,
                            currentLiteral === literal && styles.literalButtonActive,
                            hasChanges && currentLiteral === literal && styles.literalButtonChanged,
                        ]}
                        onPress={() => onUpdateLiteral(original.id, literal)}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.literalButtonText,
                            currentLiteral === literal && styles.literalButtonTextActive,
                        ]}>
                            {LITERAL_SHORT_LABELS[literal]}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const renderObservationInput = () => {
        const currentObservation = current.observation ?? original.observation;

        return (
            <TextInput
                style={[styles.observationInput, hasChanges && styles.inputChanged]}
                value={currentObservation}
                onChangeText={(text) => onUpdateObservation(original.id, text)}
                placeholder="Escribir observación..."
                placeholderTextColor={Colors.textTertiary}
                multiline
                numberOfLines={2}
                maxLength={500}
            />
        );
    };

    // Get result state color
    const getResultColor = () => {
        if (showNumericInput) {
            const score = current.score ?? original.score;
            return score >= 10 ? Colors.success : Colors.error;
        }
        if (showLiteralInput) {
            const literal = current.literalType ?? original.literalType;
            return literal && ['A', 'B', 'C'].includes(literal) ? Colors.success : Colors.error;
        }
        return Colors.success; // Observations are always "approved"
    };

    return (
        <View style={[styles.scoreRow, hasChanges && styles.scoreRowChanged]}>
            <View style={styles.scoreRowHeader}>
                <View style={styles.studentInfo}>
                    <View style={[styles.studentAvatar, { backgroundColor: getResultColor() + '20' }]}>
                        <Ionicons name="person" size={16} color={getResultColor()} />
                    </View>
                    <Text style={styles.studentName} numberOfLines={1}>{original.studentName}</Text>
                </View>
                {hasChanges && (
                    <View style={styles.changedIndicator}>
                        <Ionicons name="ellipse" size={8} color={Colors.warning} />
                    </View>
                )}
            </View>

            <View style={styles.scoreInputWrapper}>
                {showNumericInput && renderNumericInput()}
                {showLiteralInput && renderLiteralInput()}
                {showObservationInput && renderObservationInput()}
            </View>
        </View>
    );
};

export const EvaluationScoresModal: React.FC<EvaluationScoresModalProps> = ({
    visible,
    evaluation,
    onClose,
    onSaved,
}) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['95%'], []);

    const [scores, setScores] = useState<EvaluationScore[]>([]);
    const [scoreUpdates, setScoreUpdates] = useState<Map<number, ScoreUpdate>>(new Map());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Calculate changes count
    const changesCount = useMemo(() => {
        return Array.from(scoreUpdates.values()).filter(u => u.hasChanges).length;
    }, [scoreUpdates]);

    // Filter scores based on search
    const filteredScores = useMemo(() => {
        if (!searchQuery.trim()) return scores;
        const query = searchQuery.toLowerCase();
        return scores.filter(s => s.studentName.toLowerCase().includes(query));
    }, [scores, searchQuery]);

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
            loadScores();
        } else {
            bottomSheetRef.current?.dismiss();
            setScores([]);
            setScoreUpdates(new Map());
            setSearchQuery('');
        }
    }, [visible]);

    const loadScores = async () => {
        if (!evaluation) return;

        setLoading(true);
        try {
            const loadedScores = await loadEvaluationScores(evaluation.id);
            setScores(loadedScores);

            // Initialize score updates map
            const updatesMap = new Map<number, ScoreUpdate>();
            loadedScores.forEach(score => {
                updatesMap.set(score.id, {
                    id: score.id,
                    original: score,
                    current: {
                        score: score.score,
                        literalType: score.literalType,
                        observation: score.observation,
                    },
                    hasChanges: false,
                });
            });
            setScoreUpdates(updatesMap);
        } catch (error) {
            if (__DEV__) {
                console.error('Error loading scores:', error);
            }
            showAlert('Error', 'No se pudieron cargar las calificaciones');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateScore = (id: number, value: number) => {
        setScoreUpdates(prev => {
            const newMap = new Map(prev);
            const update = newMap.get(id);
            if (update) {
                const hasChanges = value !== update.original.score;
                newMap.set(id, {
                    ...update,
                    current: { ...update.current, score: value },
                    hasChanges: hasChanges ||
                        update.current.literalType !== update.original.literalType ||
                        update.current.observation !== update.original.observation,
                });
            }
            return newMap;
        });
    };

    const handleUpdateLiteral = (id: number, value: string) => {
        setScoreUpdates(prev => {
            const newMap = new Map(prev);
            const update = newMap.get(id);
            if (update) {
                const literalValue = value as 'A' | 'B' | 'C' | 'D' | 'E' | null;
                const hasChanges = literalValue !== update.original.literalType;
                newMap.set(id, {
                    ...update,
                    current: { ...update.current, literalType: literalValue },
                    hasChanges: hasChanges ||
                        update.current.score !== update.original.score ||
                        update.current.observation !== update.original.observation,
                });
            }
            return newMap;
        });
    };

    const handleUpdateObservation = (id: number, value: string) => {
        setScoreUpdates(prev => {
            const newMap = new Map(prev);
            const update = newMap.get(id);
            if (update) {
                const hasChanges = value !== update.original.observation;
                newMap.set(id, {
                    ...update,
                    current: { ...update.current, observation: value },
                    hasChanges: hasChanges ||
                        update.current.score !== update.original.score ||
                        update.current.literalType !== update.original.literalType,
                });
            }
            return newMap;
        });
    };

    const handleSave = async () => {
        Keyboard.dismiss();

        const changes = Array.from(scoreUpdates.values()).filter(u => u.hasChanges);
        if (changes.length === 0) {
            showAlert('Sin cambios', 'No hay calificaciones para guardar');
            return;
        }

        setSaving(true);
        try {
            const updates = changes.map(change => ({
                id: change.id,
                ...change.current,
            }));

            const result = await updateEvaluationScoresBatch(updates);

            if (result.success) {
                showAlert('Éxito', result.message || 'Calificaciones guardadas');
                onSaved();
                onClose();
            } else {
                showAlert('Error', result.message || 'Error al guardar calificaciones');
            }
        } catch (error: any) {
            showAlert('Error', error?.message || 'Error al guardar calificaciones');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        if (changesCount > 0) {
            showAlert(
                'Cambios sin guardar',
                `Tienes ${changesCount} calificaciones sin guardar. ¿Deseas salir?`,
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Salir sin guardar', style: 'destructive', onPress: onClose },
                ]
            );
        } else {
            onClose();
        }
    };

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
            if (index === -1 && changesCount === 0) {
                onClose();
            }
        },
        [onClose, changesCount]
    );

    if (!evaluation) return null;

    const renderScoreItem = ({ item }: { item: EvaluationScore }) => {
        const update = scoreUpdates.get(item.id);
        if (!update) return null;

        return (
            <ScoreRow
                scoreUpdate={update}
                evaluation={evaluation}
                onUpdateScore={handleUpdateScore}
                onUpdateLiteral={handleUpdateLiteral}
                onUpdateObservation={handleUpdateObservation}
            />
        );
    };

    const getGradingTypeText = () => {
        if (!evaluation.invisibleScore) return 'Calificación Numérica (0-20)';
        if (!evaluation.invisibleLiteral) return 'Calificación Literal (A-E)';
        if (!evaluation.invisibleObservation) return 'Observaciones';
        return 'Calificación';
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
                enablePanDownToClose={changesCount === 0}
                handleIndicatorStyle={styles.handleIndicator}
                backgroundStyle={styles.bottomSheetBackground}
                topInset={insets.top}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
                android_keyboardInputMode="adjustResize"
            >
                <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                                <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
                            </TouchableOpacity>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerTitle} numberOfLines={1}>{evaluation.name}</Text>
                                <Text style={styles.headerSubtitle}>{getGradingTypeText()}</Text>
                            </View>
                        </View>
                        {changesCount > 0 && (
                            <View style={styles.changesBadge}>
                                <Text style={styles.changesBadgeText}>{changesCount}</Text>
                            </View>
                        )}
                    </View>

                    {/* Search Bar */}
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color={Colors.textTertiary} />
                        <TextInput
                            style={styles.searchInput}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholder="Buscar estudiante..."
                            placeholderTextColor={Colors.textTertiary}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Stats Bar */}
                    <View style={styles.statsBar}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{scores.length}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.success }]}>
                                {scores.filter(s => s.state === 'qualified').length}
                            </Text>
                            <Text style={styles.statLabel}>Calificados</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: Colors.warning }]}>{changesCount}</Text>
                            <Text style={styles.statLabel}>Modificados</Text>
                        </View>
                    </View>

                    {/* Scores List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                            <Text style={styles.loadingText}>Cargando calificaciones...</Text>
                        </View>
                    ) : filteredScores.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color={Colors.textTertiary} />
                            <Text style={styles.emptyTitle}>Sin resultados</Text>
                            <Text style={styles.emptyText}>
                                {searchQuery ? 'No se encontraron estudiantes' : 'No hay estudiantes en esta evaluación'}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredScores}
                            renderItem={renderScoreItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                            removeClippedSubviews={true}
                            maxToRenderPerBatch={10}
                            windowSize={10}
                            initialNumToRender={15}
                        />
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.cancelBtn}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelBtnLabel}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSave}
                            style={[styles.saveBtn, (changesCount === 0 || saving) && styles.btnDisabled]}
                            activeOpacity={0.8}
                            disabled={changesCount === 0 || saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="save" size={20} color={changesCount === 0 ? '#9ca3af' : '#fff'} />
                                    <Text style={[styles.saveBtnLabel, changesCount === 0 && { color: '#9ca3af' }]}>
                                        Guardar ({changesCount})
                                    </Text>
                                </>
                            )}
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
    headerInfo: {
        flex: 1,
        gap: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },
    headerSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    changesBadge: {
        backgroundColor: Colors.warning,
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4,
        minWidth: 28,
        alignItems: 'center',
    },
    changesBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 16,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.textPrimary,
        paddingVertical: 0,
    },
    statsBar: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginTop: 12,
        marginBottom: 8,
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
        gap: 2,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    statDivider: {
        width: 1,
        backgroundColor: Colors.border,
    },
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 120,
    },
    scoreRow: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    scoreRowChanged: {
        borderColor: Colors.warning,
        borderWidth: 2,
    },
    scoreRowHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    studentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    studentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    studentName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
        flex: 1,
    },
    changedIndicator: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scoreInputWrapper: {
        flex: 1,
    },
    numericInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    numericInput: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
        textAlign: 'center',
    },
    inputChanged: {
        backgroundColor: Colors.warning + '15',
        borderWidth: 1,
        borderColor: Colors.warning,
    },
    maxScoreText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    literalInputContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    literalButton: {
        flex: 1,
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingVertical: 12,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    literalButtonActive: {
        backgroundColor: Colors.primary + '15',
        borderColor: Colors.primary,
    },
    literalButtonChanged: {
        backgroundColor: Colors.warning + '15',
        borderColor: Colors.warning,
    },
    literalButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    literalButtonTextActive: {
        color: Colors.primary,
    },
    observationInput: {
        backgroundColor: '#f1f5f9',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: Colors.textPrimary,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        paddingHorizontal: 40,
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
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: Platform.OS === 'ios' ? 20 : 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: '#fff',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        paddingVertical: 14,
    },
    cancelBtnLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    saveBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
    },
    saveBtnLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },
    btnDisabled: {
        backgroundColor: '#e2e8f0',
    },
});
