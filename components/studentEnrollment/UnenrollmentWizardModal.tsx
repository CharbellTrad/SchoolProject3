import { Ionicons } from '@expo/vector-icons';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Colors from '../../constants/Colors';
import {
    StudentEnrollment,
    UnenrollmentData,
    unenrollStudent,
} from '../../services-odoo/studentEnrollmentService';
import { showAlert } from '../showAlert';

interface UnenrollmentWizardModalProps {
    visible: boolean;
    enrollment: StudentEnrollment | null;
    onClose: () => void;
    onUnenrolled: () => void;
}

interface DocumentFile {
    name: string;
    data: string; // base64
}

export const UnenrollmentWizardModal: React.FC<UnenrollmentWizardModalProps> = ({
    visible,
    enrollment,
    onClose,
    onUnenrolled,
}) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const insets = useSafeAreaInsets();
    const snapPoints = useMemo(() => ['85%'], []);

    // Form state
    const [reason, setReason] = useState('');
    const [document1, setDocument1] = useState<DocumentFile | null>(null);
    const [document2, setDocument2] = useState<DocumentFile | null>(null);
    const [document3, setDocument3] = useState<DocumentFile | null>(null);
    const [saving, setSaving] = useState(false);

    // Validation
    const [errors, setErrors] = useState<{ reason?: string }>({});

    useEffect(() => {
        if (visible) {
            bottomSheetRef.current?.present();
            resetForm();
        } else {
            bottomSheetRef.current?.dismiss();
        }
    }, [visible]);

    const resetForm = () => {
        setReason('');
        setDocument1(null);
        setDocument2(null);
        setDocument3(null);
        setErrors({});
    };

    const pickDocument = async (setDoc: (doc: DocumentFile | null) => void) => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                const base64 = await FileSystem.readAsStringAsync(asset.uri, {
                    encoding: 'base64',
                });

                setDoc({
                    name: asset.name,
                    data: base64,
                });
            }
        } catch (error) {
            if (__DEV__) {
                console.error('Error picking document:', error);
            }
            showAlert('Error', 'No se pudo cargar el documento');
        }
    };

    const removeDocument = (setDoc: (doc: DocumentFile | null) => void) => {
        setDoc(null);
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!reason.trim()) {
            newErrors.reason = 'El motivo de desinscripción es requerido';
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
            const data: UnenrollmentData = {
                studentEnrollmentId: enrollment.id,
                reason: reason.trim(),
            };

            if (document1) {
                data.document1 = document1;
            }
            if (document2) {
                data.document2 = document2;
            }
            if (document3) {
                data.document3 = document3;
            }

            const result = await unenrollStudent(data);

            if (result.success) {
                showAlert('Éxito', 'Estudiante desinscrito correctamente');
                onUnenrolled();
                onClose();
            } else {
                showAlert('Error', result.message || 'Error al desinscribir al estudiante');
            }
        } catch (error: any) {
            showAlert('Error', error?.message || 'Error al procesar la desinscripción');
        } finally {
            setSaving(false);
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

    const renderDocumentPicker = (
        label: string,
        doc: DocumentFile | null,
        setDoc: (doc: DocumentFile | null) => void,
        required: boolean = false
    ) => (
        <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
                {label} {required ? '*' : '(opcional)'}
            </Text>
            {doc ? (
                <View style={styles.documentCard}>
                    <View style={styles.documentInfo}>
                        <Ionicons name="document-text" size={20} color={Colors.primary} />
                        <Text style={styles.documentName} numberOfLines={1}>{doc.name}</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => removeDocument(setDoc)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="close-circle" size={22} color={Colors.error} />
                    </TouchableOpacity>
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => pickDocument(setDoc)}
                    activeOpacity={0.7}
                >
                    <Ionicons name="cloud-upload" size={24} color={Colors.primary} />
                    <Text style={styles.uploadText}>Cargar documento</Text>
                    <Text style={styles.uploadHint}>PDF o imagen</Text>
                </TouchableOpacity>
            )}
        </View>
    );

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
                            <View style={[styles.iconBox, { backgroundColor: Colors.error + '15' }]}>
                                <Ionicons name="exit-outline" size={22} color={Colors.error} />
                            </View>
                            <View style={styles.headerInfo}>
                                <Text style={styles.headerTitle}>Desinscribir Estudiante</Text>
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
                        {/* Warning */}
                        <View style={styles.warningBox}>
                            <Ionicons name="warning" size={20} color={Colors.warning} />
                            <Text style={styles.warningText}>
                                Esta acción retirará al estudiante del año escolar actual. El estudiante
                                quedará marcado como "cancelado" y no podrá participar en evaluaciones.
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
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Año Escolar:</Text>
                                <Text style={styles.infoValue}>{enrollment.yearName}</Text>
                            </View>
                        </View>

                        {/* Reason Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Motivo de la desinscripción *</Text>
                            <TextInput
                                style={[styles.textInput, styles.textArea, errors.reason && styles.inputError]}
                                value={reason}
                                onChangeText={(text) => {
                                    setReason(text);
                                    setErrors(prev => ({ ...prev, reason: undefined }));
                                }}
                                placeholder="Explique el motivo por el cual el estudiante será retirado..."
                                placeholderTextColor={Colors.textTertiary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                maxLength={500}
                            />
                            {errors.reason && <Text style={styles.errorText}>{errors.reason}</Text>}
                            <Text style={styles.charCount}>{reason.length}/500</Text>
                        </View>

                        {/* Documents */}
                        <Text style={styles.sectionTitle}>Documentos de Soporte</Text>

                        {renderDocumentPicker('Documento 1', document1, setDocument1)}
                        {renderDocumentPicker('Documento 2', document2, setDocument2)}
                        {renderDocumentPicker('Documento 3', document3, setDocument3)}

                        {/* Note */}
                        <View style={styles.noteBox}>
                            <Ionicons name="information-circle" size={18} color={Colors.info} />
                            <Text style={styles.noteText}>
                                Puede adjuntar hasta 3 documentos de soporte como constancias,
                                cartas de retiro u otros documentos relevantes.
                            </Text>
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
                                    <Ionicons name="exit" size={20} color="#fff" />
                                    <Text style={styles.submitBtnLabel}>Desinscribir</Text>
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
    warningBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        backgroundColor: Colors.warning + '10',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: Colors.warning + '30',
    },
    warningText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textPrimary,
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
    sectionTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 12,
        marginTop: 8,
    },
    inputGroup: {
        marginBottom: 16,
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
    inputError: {
        borderColor: Colors.error,
    },
    errorText: {
        fontSize: 12,
        color: Colors.error,
        marginTop: 6,
    },
    charCount: {
        fontSize: 12,
        color: Colors.textTertiary,
        textAlign: 'right',
        marginTop: 4,
    },
    uploadButton: {
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: Colors.primary + '30',
        borderStyle: 'dashed',
        padding: 24,
        alignItems: 'center',
        gap: 8,
    },
    uploadText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primary,
    },
    uploadHint: {
        fontSize: 12,
        color: Colors.textTertiary,
    },
    documentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: Colors.primaryLight + '15',
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: Colors.primary + '30',
    },
    documentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    documentName: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
        flex: 1,
    },
    noteBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        backgroundColor: Colors.info + '10',
        borderRadius: 10,
        padding: 14,
        marginTop: 8,
    },
    noteText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 18,
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
        backgroundColor: Colors.error,
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
});
