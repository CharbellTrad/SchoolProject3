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
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';
import {
    enrollStudentInMention,
    loadMentions,
    Mention,
    MentionEnrollmentData,
    StudentEnrollment,
} from '../../services-odoo/studentEnrollmentService';
import { showAlert } from '../showAlert';

// Note: For the signature pad, you can use a library like react-native-signature-canvas
// For now, we'll use a placeholder that can be replaced with a proper signature component

interface MentionEnrollmentWizardModalProps {
    visible: boolean;
    enrollment: StudentEnrollment | null;
    onClose: () => void;
    onEnrolled: () => void;
}

interface Parent {
    id: number;
    name: string;
}

export const MentionEnrollmentWizardModal: React.FC<MentionEnrollmentWizardModalProps> = ({
    visible,
    enrollment,
    onClose,
    onEnrolled,
}) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['90%'], []);

    // Form state
    const [mentions, setMentions] = useState<Mention[]>([]);
    const [loadingMentions, setLoadingMentions] = useState(false);
    const [selectedMention, setSelectedMention] = useState<Mention | null>(null);
    const [signatureDate, setSignatureDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [observations, setObservations] = useState('');
    const [signatureConfirmed, setSignatureConfirmed] = useState(false);
    const [saving, setSaving] = useState(false);

    // Validation
    const [errors, setErrors] = useState<{
        mention?: string;
        signature?: string;
    }>({});

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
            resetForm();
            fetchMentions();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    const resetForm = () => {
        setSelectedMention(null);
        setSignatureDate(new Date());
        setObservations('');
        setSignatureConfirmed(false);
        setErrors({});
    };

    const fetchMentions = async () => {
        setLoadingMentions(true);
        try {
            const data = await loadMentions();
            setMentions(data);
        } catch (error) {
            if (__DEV__) {
                console.error('Error loading mentions:', error);
            }
        } finally {
            setLoadingMentions(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!selectedMention) {
            newErrors.mention = 'Debe seleccionar una mención';
        }
        if (!signatureConfirmed) {
            newErrors.signature = 'Debe confirmar la autorización del representante';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!enrollment) return;
        if (!validateForm()) return;

        Keyboard.dismiss();
        setSaving(true);

        try {
            const data: MentionEnrollmentData = {
                studentEnrollmentId: enrollment.id,
                mentionId: selectedMention!.id,
                parentId: enrollment.parentId || 0, // Use default parent if not set
                parentSignature: 'CONFIRMED', // Placeholder - would be actual signature data
                signatureDate: signatureDate.toISOString().split('T')[0],
                observations: observations.trim() || undefined,
            };

            const result = await enrollStudentInMention(data);

            if (result.success) {
                showAlert('Éxito', 'Estudiante inscrito en mención correctamente');
                onEnrolled();
                onClose();
            } else {
                showAlert('Error', result.message || 'Error al inscribir en mención');
            }
        } catch (error: any) {
            showAlert('Error', error?.message || 'Error al procesar la inscripción');
        } finally {
            setSaving(false);
        }
    };

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setSignatureDate(selectedDate);
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
            if (index === -1) onClose();
        },
        [onClose]
    );

    if (!enrollment) return null;

    // Only show for secundary (Media General/Técnico Medio)
    if (enrollment.type !== 'secundary') {
        return null;
    }

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
                keyboardBehavior="interactive"
                keyboardBlurBehavior="restore"
            >
                <View style={[styles.container, { paddingBottom: insets.bottom }]}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <View style={[styles.iconBox, { backgroundColor: '#8b5cf6' + '15' }]}>
                                <Ionicons name="school-outline" size={22} color="#8b5cf6" />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerTitle}>Inscripción en Mención</Text>
                                <Text style={styles.headerSubtitle} numberOfLines={1}>
                                    {enrollment.studentName}
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
                            <Ionicons name="close-circle" size={28} color={Colors.error} />
                        </TouchableOpacity>
                    </View>

                    {/* Form */}
                    <BottomSheetScrollView
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.formContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Info */}
                        <View style={styles.infoBox}>
                            <Ionicons name="information-circle" size={20} color={Colors.info} />
                            <Text style={styles.infoText}>
                                Al inscribir al estudiante en una mención técnica, se habilitarán
                                las materias específicas de la mención en su plan de estudios.
                            </Text>
                        </View>

                        {/* Student Info */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Estudiante:</Text>
                                <Text style={styles.infoValue}>{enrollment.studentName}</Text>
                            </View>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Sección:</Text>
                                <Text style={styles.infoValue}>{enrollment.sectionName}</Text>
                            </View>
                            {enrollment.parentName && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Representante:</Text>
                                    <Text style={styles.infoValue}>{enrollment.parentName}</Text>
                                </View>
                            )}
                        </View>

                        {/* Mention Selector */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Mención Técnica *</Text>
                            {loadingMentions ? (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="small" color={Colors.primary} />
                                    <Text style={styles.loadingText}>Cargando menciones...</Text>
                                </View>
                            ) : mentions.length === 0 ? (
                                <View style={styles.emptyMentions}>
                                    <Text style={styles.emptyText}>No hay menciones disponibles</Text>
                                </View>
                            ) : (
                                <View style={styles.mentionGrid}>
                                    {mentions.map((mention) => (
                                        <TouchableOpacity
                                            key={mention.id}
                                            style={[
                                                styles.mentionCard,
                                                selectedMention?.id === mention.id && styles.mentionCardSelected,
                                            ]}
                                            onPress={() => {
                                                setSelectedMention(mention);
                                                setErrors(prev => ({ ...prev, mention: undefined }));
                                            }}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={selectedMention?.id === mention.id ? 'checkmark-circle' : 'ellipse-outline'}
                                                size={20}
                                                color={selectedMention?.id === mention.id ? '#8b5cf6' : Colors.textTertiary}
                                            />
                                            <View style={styles.mentionInfo}>
                                                <Text style={[
                                                    styles.mentionName,
                                                    selectedMention?.id === mention.id && styles.mentionNameSelected,
                                                ]}>
                                                    {mention.name}
                                                </Text>
                                                {mention.code && (
                                                    <Text style={styles.mentionCode}>{mention.code}</Text>
                                                )}
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {errors.mention && <Text style={styles.errorText}>{errors.mention}</Text>}
                        </View>

                        {/* Signature Date */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Fecha de autorización</Text>
                            <TouchableOpacity
                                style={styles.dateInput}
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                            >
                                <Ionicons name="calendar" size={20} color={Colors.textSecondary} />
                                <Text style={styles.dateText}>
                                    {signatureDate.toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={signatureDate}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </View>

                        {/* Signature Confirmation (placeholder for actual signature) */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Autorización del Representante *</Text>
                            <TouchableOpacity
                                style={[
                                    styles.signatureBox,
                                    signatureConfirmed && styles.signatureBoxConfirmed,
                                    errors.signature && styles.signatureBoxError,
                                ]}
                                onPress={() => {
                                    setSignatureConfirmed(!signatureConfirmed);
                                    setErrors(prev => ({ ...prev, signature: undefined }));
                                }}
                                activeOpacity={0.7}
                            >
                                <View style={[
                                    styles.checkbox,
                                    signatureConfirmed && styles.checkboxChecked,
                                ]}>
                                    {signatureConfirmed && (
                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                    )}
                                </View>
                                <Text style={styles.signatureText}>
                                    Confirmo que el representante ha autorizado la inscripción
                                    del estudiante en esta mención técnica.
                                </Text>
                            </TouchableOpacity>
                            {errors.signature && <Text style={styles.errorText}>{errors.signature}</Text>}
                        </View>

                        {/* Observations */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Observaciones (opcional)</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea]}
                                value={observations}
                                onChangeText={setObservations}
                                placeholder="Observaciones adicionales..."
                                placeholderTextColor={Colors.textTertiary}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                                maxLength={300}
                            />
                        </View>
                    </BottomSheetScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.cancelBtn}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.cancelBtnLabel}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={[styles.submitBtn, saving && styles.btnDisabled]}
                            activeOpacity={0.8}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="school" size={20} color="#fff" />
                                    <Text style={styles.submitBtnLabel}>Inscribir en Mención</Text>
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
    formContent: {
        padding: 20,
        paddingBottom: 100,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: Colors.info + '10',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
    },
    infoCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        gap: 10,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '500',
        color: Colors.textPrimary,
        flex: 1,
        textAlign: 'right',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 10,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 20,
    },
    loadingText: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    emptyMentions: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textTertiary,
    },
    mentionGrid: {
        gap: 10,
    },
    mentionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderWidth: 2,
        borderColor: Colors.border,
    },
    mentionCardSelected: {
        backgroundColor: '#8b5cf6' + '08',
        borderColor: '#8b5cf6',
    },
    mentionInfo: {
        flex: 1,
        gap: 2,
    },
    mentionName: {
        fontSize: 15,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    mentionNameSelected: {
        color: '#8b5cf6',
        fontWeight: '700',
    },
    mentionCode: {
        fontSize: 12,
        color: Colors.textSecondary,
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
    signatureBox: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.border,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    signatureBoxConfirmed: {
        backgroundColor: Colors.success + '08',
        borderColor: Colors.success,
    },
    signatureBoxError: {
        borderColor: Colors.error,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: Colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    signatureText: {
        flex: 1,
        fontSize: 14,
        color: Colors.textPrimary,
        lineHeight: 20,
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
        minHeight: 80,
        textAlignVertical: 'top',
    },
    errorText: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 6,
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
    submitBtn: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#8b5cf6',
        borderRadius: 12,
        paddingVertical: 14,
        gap: 8,
    },
    submitBtnLabel: {
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
