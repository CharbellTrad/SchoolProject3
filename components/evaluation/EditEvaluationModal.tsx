import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';
import {
    deleteEvaluation,
    Evaluation,
    EVALUATION_STATE_COLORS,
    EVALUATION_STATE_LABELS,
    updateEvaluation,
} from '../../services-odoo/evaluationService';
import { showAlert } from '../showAlert';

interface EditEvaluationModalProps {
    visible: boolean;
    evaluation: Evaluation | null;
    onClose: () => void;
    onSaved: () => void;
    onDeleted: () => void;
}

export const EditEvaluationModal: React.FC<EditEvaluationModalProps> = ({
    visible,
    evaluation,
    onClose,
    onSaved,
    onDeleted,
}) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['85%'], []);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [evaluationDate, setEvaluationDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Track changes
    const hasChanges = useMemo(() => {
        if (!evaluation) return false;

        const dateStr = evaluationDate ? evaluationDate.toISOString().split('T')[0] : '';
        return (
            name !== evaluation.name ||
            description !== (evaluation.description || '') ||
            dateStr !== (evaluation.evaluationDate || '')
        );
    }, [evaluation, name, description, evaluationDate]);

    useEffect(() => {
        if (visible && evaluation) {
            bottomSheetRef.current?.present();
            // Initialize form with current values
            setName(evaluation.name);
            setDescription(evaluation.description || '');
            setEvaluationDate(
                evaluation.evaluationDate
                    ? new Date(evaluation.evaluationDate)
                    : new Date()
            );
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible, evaluation]);

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

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEvaluationDate(selectedDate);
        }
    };

    const handleSave = async () => {
        if (!evaluation) return;

        // Validation
        if (!name.trim()) {
            showAlert('Error', 'El nombre de la evaluación es requerido');
            return;
        }

        Keyboard.dismiss();
        setSaving(true);

        try {
            const dateStr = evaluationDate
                ? evaluationDate.toISOString().split('T')[0]
                : undefined;

            const result = await updateEvaluation(evaluation.id, {
                name: name.trim(),
                description: description.trim(),
                evaluationDate: dateStr,
            });

            if (result.success) {
                showAlert('Éxito', 'Evaluación actualizada correctamente');
                onSaved();
                onClose();
            } else {
                showAlert('Error', result.message || 'Error al actualizar la evaluación');
            }
        } catch (error: any) {
            showAlert('Error', error?.message || 'Error al actualizar la evaluación');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        showAlert(
            'Eliminar Evaluación',
            '¿Estás seguro de que deseas eliminar esta evaluación? Esta acción no se puede deshacer.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: confirmDelete,
                },
            ]
        );
    };

    const confirmDelete = async () => {
        if (!evaluation) return;

        setDeleting(true);
        try {
            const result = await deleteEvaluation(evaluation.id);

            if (result.success) {
                showAlert('Éxito', 'Evaluación eliminada correctamente');
                onDeleted();
                onClose();
            } else {
                showAlert('Error', result.message || 'Error al eliminar la evaluación');
            }
        } catch (error: any) {
            showAlert('Error', error?.message || 'Error al eliminar la evaluación');
        } finally {
            setDeleting(false);
        }
    };

    const handleClose = () => {
        if (hasChanges) {
            showAlert(
                'Cambios sin guardar',
                '¿Deseas descartar los cambios?',
                [
                    { text: 'Continuar editando', style: 'cancel' },
                    { text: 'Descartar', style: 'destructive', onPress: onClose },
                ]
            );
        } else {
            onClose();
        }
    };

    if (!evaluation) return null;

    const stateColor = EVALUATION_STATE_COLORS[evaluation.state];
    const stateLabel = EVALUATION_STATE_LABELS[evaluation.state];

    return (
        <>
            {visible && <StatusBar style="light" />}

            <BottomSheetModal
                ref={bottomSheetRef}
                index={0}
                snapPoints={snapPoints}
                onChange={handleSheetChanges}
                backdropComponent={renderBackdrop}
                enablePanDownToClose={!hasChanges}
                handleIndicatorStyle={styles.handleIndicator}
                backgroundStyle={styles.bottomSheetBackground}
                topInset={insets.top}
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
            >
                <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconBox, { backgroundColor: Colors.primary + '15' }]}>
                                <Ionicons name="create" size={22} color={Colors.primary} />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerTitle}>Editar Evaluación</Text>
                                <View style={styles.headerMeta}>
                                    <View style={[styles.typeBadge, { backgroundColor: stateColor + '20' }]}>
                                        <Text style={[styles.typeText, { color: stateColor }]}>{stateLabel}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
                            <Ionicons name="close-circle" size={28} color={Colors.error} />
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <BottomSheetScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.formContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Section Info (readonly) */}
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Información (no editable)</Text>
                            <View style={styles.infoRow}>
                                <Ionicons name="person" size={16} color={Colors.textSecondary} />
                                <Text style={styles.infoText}>{evaluation.professorName}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Ionicons name="school" size={16} color={Colors.textSecondary} />
                                <Text style={styles.infoText}>{evaluation.sectionName}</Text>
                            </View>
                            {evaluation.subjectName && (
                                <View style={styles.infoRow}>
                                    <Ionicons name="book" size={16} color={Colors.textSecondary} />
                                    <Text style={styles.infoText}>{evaluation.subjectName}</Text>
                                </View>
                            )}
                        </View>

                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nombre *</Text>
                            <TextInput
                                style={styles.textInput}
                                value={name}
                                onChangeText={setName}
                                placeholder="Nombre de la evaluación"
                                placeholderTextColor={Colors.textTertiary}
                                maxLength={100}
                            />
                        </View>

                        {/* Date Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Fecha de evaluación</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar" size={20} color={Colors.textSecondary} />
                                <Text style={styles.dateText}>
                                    {evaluationDate
                                        ? evaluationDate.toLocaleDateString('es-ES', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })
                                        : 'Seleccionar fecha'}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={evaluationDate || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                />
                            )}
                        </View>

                        {/* Description Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Descripción</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Descripción de la evaluación..."
                                placeholderTextColor={Colors.textTertiary}
                                multiline
                                numberOfLines={4}
                                maxLength={1000}
                                textAlignVertical="top"
                            />
                            <Text style={styles.charCount}>
                                {description.length}/1000
                            </Text>
                        </View>

                        {/* Danger Zone */}
                        <View style={styles.dangerZone}>
                            <Text style={styles.dangerTitle}>Zona de peligro</Text>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={handleDelete}
                                activeOpacity={0.7}
                                disabled={deleting}
                            >
                                {deleting ? (
                                    <ActivityIndicator size="small" color={Colors.error} />
                                ) : (
                                    <>
                                        <Ionicons name="trash" size={20} color={Colors.error} />
                                        <Text style={styles.deleteButtonText}>Eliminar Evaluación</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                            <Text style={styles.dangerNote}>
                                Solo se puede eliminar si no tiene calificaciones registradas.
                            </Text>
                        </View>
                    </BottomSheetScrollView>

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
                            style={[styles.saveBtn, (!hasChanges || saving) && styles.btnDisabled]}
                            activeOpacity={0.8}
                            disabled={!hasChanges || saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="save" size={20} color={!hasChanges ? '#9ca3af' : '#fff'} />
                                    <Text style={[styles.saveBtnLabel, !hasChanges && { color: '#9ca3af' }]}>
                                        Guardar Cambios
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
    formContent: {
        padding: 20,
        paddingBottom: 100,
    },
    infoCard: {
        backgroundColor: '#f1f5f9',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        gap: 10,
    },
    infoLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    infoText: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 8,
    },
    textInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 15,
        color: Colors.textPrimary,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        color: Colors.textTertiary,
        textAlign: 'right',
        marginTop: 4,
    },
    dateInput: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    dateText: {
        fontSize: 15,
        color: Colors.textPrimary,
        flex: 1,
    },
    dangerZone: {
        marginTop: 20,
        backgroundColor: Colors.error + '08',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: Colors.error + '30',
    },
    dangerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.error,
        marginBottom: 12,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#fff',
        borderRadius: 10,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: Colors.error,
    },
    deleteButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.error,
    },
    dangerNote: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 10,
        fontStyle: 'italic',
    },
    footer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        backgroundColor: '#f8fafc',
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
    dateTextInput: {
        flex: 1,
        fontSize: 15,
        color: Colors.textPrimary,
        paddingVertical: 0,
    },
});
