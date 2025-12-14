/**
 * Modal para editar un profesor asignado
 * Permite modificar las secciones asignadas
 */
import { showAlert } from '@/components/showAlert';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../../constants/Colors';
import { useEnrolledSections } from '../../hooks/useEnrolledSections';
import * as authService from '../../services-odoo/authService';
import {
    SECTION_TYPE_COLORS,
    SECTION_TYPE_LABELS,
} from '../../services-odoo/enrolledSectionService';
import {
    deleteProfessor,
    Professor,
    updateProfessor,
} from '../../services-odoo/professorService';

interface EditProfessorModalProps {
    visible: boolean;
    professor: Professor | null;
    onClose: () => void;
    onSaved: () => void;
    onDeleted: () => void;
}

interface SelectableSection {
    id: number;
    name: string;
    type: 'pre' | 'primary' | 'secundary';
}

export const EditProfessorModal: React.FC<EditProfessorModalProps> = ({
    visible,
    professor,
    onClose,
    onSaved,
    onDeleted,
}) => {
    const { sections: enrolledSections } = useEnrolledSections();

    const [selectedSectionIds, setSelectedSectionIds] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Convert enrolled sections to selectable format
    const selectableSections: SelectableSection[] = enrolledSections.map(s => ({
        id: s.sectionId,
        name: s.sectionName,
        type: s.type,
    }));

    // Initialize with current sections when modal opens
    useEffect(() => {
        if (visible && professor) {
            setSelectedSectionIds(professor.sectionIds || []);
        }
    }, [visible, professor]);

    const toggleSection = (sectionId: number) => {
        setSelectedSectionIds(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const handleSave = async () => {
        if (!professor) return;

        const serverHealth = await authService.checkServerHealth();
        if (!serverHealth.ok) {
            showAlert('Sin conexión', 'No se puede guardar sin conexión a internet.');
            return;
        }

        setIsSaving(true);

        try {
            const result = await updateProfessor(professor.id, {
                sectionIds: selectedSectionIds,
            });

            if (result.success) {
                onSaved();
            } else {
                showAlert('❌ Error', result.message || 'No se pudo guardar los cambios');
            }
        } catch (error: any) {
            showAlert('❌ Error', error.message || 'Ocurrió un error inesperado');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!professor) return;

        showAlert(
            '⚠️ Eliminar Asignación',
            `¿Está seguro de eliminar la asignación de ${professor.professorName}?\n\nEsta acción no se puede deshacer.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        const serverHealth = await authService.checkServerHealth();
                        if (!serverHealth.ok) {
                            showAlert('Sin conexión', 'No se puede eliminar sin conexión a internet.');
                            return;
                        }

                        setIsDeleting(true);

                        try {
                            const result = await deleteProfessor(professor.id);

                            if (result.success) {
                                onDeleted();
                            } else {
                                showAlert('❌ Error', result.message || 'No se pudo eliminar la asignación');
                            }
                        } catch (error: any) {
                            showAlert('❌ Error', error.message || 'Ocurrió un error inesperado');
                        } finally {
                            setIsDeleting(false);
                        }
                    },
                },
            ]
        );
    };

    // Group sections by type
    const sectionsByType = selectableSections.reduce((acc, section) => {
        if (!acc[section.type]) {
            acc[section.type] = [];
        }
        acc[section.type].push(section);
        return acc;
    }, {} as Record<string, SelectableSection[]>);

    const renderSectionGroup = (type: 'pre' | 'primary' | 'secundary', sections: SelectableSection[]) => {
        if (!sections || sections.length === 0) return null;

        const typeColor = SECTION_TYPE_COLORS[type];
        const typeLabel = SECTION_TYPE_LABELS[type];

        return (
            <View style={styles.sectionGroup} key={type}>
                <View style={styles.sectionGroupHeader}>
                    <View style={[styles.typeIndicator, { backgroundColor: typeColor }]} />
                    <Text style={styles.sectionGroupTitle}>{typeLabel}</Text>
                </View>

                <View style={styles.sectionsGrid}>
                    {sections.map((section) => {
                        const isSelected = selectedSectionIds.includes(section.id);
                        return (
                            <TouchableOpacity
                                key={section.id}
                                style={[
                                    styles.sectionChip,
                                    isSelected && styles.sectionChipSelected,
                                    isSelected && { borderColor: typeColor },
                                ]}
                                onPress={() => toggleSection(section.id)}
                                activeOpacity={0.7}
                                disabled={isSaving || isDeleting}
                            >
                                <Ionicons
                                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={18}
                                    color={isSelected ? typeColor : Colors.textSecondary}
                                />
                                <Text
                                    style={[
                                        styles.sectionChipText,
                                        isSelected && { color: typeColor, fontWeight: '700' },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {section.name}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        );
    };

    if (!professor) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                        disabled={isSaving || isDeleting}
                    >
                        <Ionicons name="close" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Editar Asignación</Text>
                    <TouchableOpacity
                        style={[styles.deleteButton, (isSaving || isDeleting) && styles.disabledButton]}
                        onPress={handleDelete}
                        activeOpacity={0.7}
                        disabled={isSaving || isDeleting}
                    >
                        {isDeleting ? (
                            <ActivityIndicator size="small" color={Colors.error} />
                        ) : (
                            <Ionicons name="trash" size={20} color={Colors.error} />
                        )}
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Professor Info */}
                    <View style={styles.professorCard}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="person" size={32} color={Colors.primary} />
                        </View>
                        <View style={styles.professorInfo}>
                            <Text style={styles.professorName}>{professor.professorName}</Text>
                            <Text style={styles.yearName}>{professor.yearName}</Text>
                        </View>
                    </View>

                    {/* Section Selector */}
                    <View style={styles.formSection}>
                        <View style={styles.labelRow}>
                            <Text style={styles.fieldLabel}>Secciones Asignadas</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>
                                    {selectedSectionIds.length} seleccionadas
                                </Text>
                            </View>
                        </View>

                        {selectableSections.length === 0 ? (
                            <View style={styles.emptyBox}>
                                <Ionicons
                                    name="folder-open-outline"
                                    size={32}
                                    color={Colors.textTertiary}
                                />
                                <Text style={styles.emptyText}>No hay secciones disponibles</Text>
                            </View>
                        ) : (
                            <>
                                {renderSectionGroup('pre', sectionsByType.pre || [])}
                                {renderSectionGroup('primary', sectionsByType.primary || [])}
                                {renderSectionGroup('secundary', sectionsByType.secundary || [])}
                            </>
                        )}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={onClose}
                        activeOpacity={0.7}
                        disabled={isSaving || isDeleting}
                    >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            (isSaving || isDeleting) && styles.disabledButton,
                        ]}
                        onPress={handleSave}
                        activeOpacity={0.7}
                        disabled={isSaving || isDeleting}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="checkmark" size={20} color="#fff" />
                                <Text style={styles.saveButtonText}>Guardar</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? 20 : 60,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    deleteButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.error + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    professorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        marginBottom: 24,
    },
    avatarContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    professorInfo: {
        flex: 1,
        gap: 4,
    },
    professorName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    yearName: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    formSection: {
        gap: 16,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    fieldLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    countBadge: {
        backgroundColor: Colors.primary + '15',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    countText: {
        fontSize: 12,
        fontWeight: '600',
        color: Colors.primary,
    },
    sectionGroup: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        gap: 12,
    },
    sectionGroupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    typeIndicator: {
        width: 4,
        height: 20,
        borderRadius: 2,
    },
    sectionGroupTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    sectionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    sectionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 14,
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: Colors.border,
    },
    sectionChipSelected: {
        backgroundColor: '#fff',
        borderWidth: 2,
    },
    sectionChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    emptyBox: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: '#fff',
        borderRadius: 16,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textTertiary,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: Colors.backgroundSecondary,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    saveButton: {
        flex: 1,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
});
