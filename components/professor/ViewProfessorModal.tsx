/**
 * Modal para visualizar detalles de un profesor asignado
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Colors from '../../constants/Colors';
import { Professor } from '../../services-odoo/professorService';

interface ViewProfessorModalProps {
    visible: boolean;
    professor: Professor | null;
    onClose: () => void;
    onEdit: () => void;
    isOfflineMode?: boolean;
}

export const ViewProfessorModal: React.FC<ViewProfessorModalProps> = ({
    visible,
    professor,
    onClose,
    onEdit,
    isOfflineMode = false,
}) => {
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
                    >
                        <Ionicons name="close" size={24} color={Colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Detalle del Docente</Text>
                    <TouchableOpacity
                        style={[styles.editButton, isOfflineMode && styles.disabledButton]}
                        onPress={() => {
                            if (!isOfflineMode) {
                                onClose();
                                setTimeout(onEdit, 300);
                            }
                        }}
                        disabled={isOfflineMode}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="pencil"
                            size={20}
                            color={isOfflineMode ? '#9ca3af' : Colors.primary}
                        />
                    </TouchableOpacity>
                </View>

                <ScrollView
                    style={styles.content}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                >
                    {/* Professor Card */}
                    <View style={styles.professorCard}>
                        <View style={styles.avatarContainer}>
                            <Ionicons name="person" size={40} color={Colors.primary} />
                        </View>
                        <Text style={styles.professorName}>{professor.professorName}</Text>
                        <Text style={styles.yearName}>{professor.yearName}</Text>
                    </View>

                    {/* Stats */}
                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Ionicons name="grid" size={24} color={Colors.primary} />
                            <Text style={styles.statValue}>{professor.sectionsCount}</Text>
                            <Text style={styles.statLabel}>Secciones</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Ionicons name="book" size={24} color={Colors.secondary} />
                            <Text style={styles.statValue}>{professor.subjectsCount}</Text>
                            <Text style={styles.statLabel}>Materias</Text>
                        </View>
                    </View>

                    {/* Secciones asignadas */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Secciones Asignadas</Text>
                        {professor.sectionNames && professor.sectionNames.length > 0 ? (
                            <View style={styles.tagsContainer}>
                                {professor.sectionNames.map((name, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Ionicons
                                            name="folder"
                                            size={14}
                                            color={Colors.primary}
                                        />
                                        <Text style={styles.tagText}>{name}</Text>
                                    </View>
                                ))}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Ionicons
                                    name="folder-open-outline"
                                    size={32}
                                    color={Colors.textTertiary}
                                />
                                <Text style={styles.emptyText}>
                                    Sin secciones asignadas
                                </Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
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
    editButton: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: Colors.primary + '15',
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
        alignItems: 'center',
        padding: 28,
        backgroundColor: '#fff',
        borderRadius: 20,
        marginBottom: 20,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
        }),
    },
    avatarContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.primary + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    professorName: {
        fontSize: 22,
        fontWeight: '800',
        color: Colors.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    yearName: {
        fontSize: 15,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 20,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff',
        borderRadius: 16,
        gap: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    statLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 16,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: Colors.primary + '10',
        borderRadius: 12,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.primary,
    },
    emptyState: {
        alignItems: 'center',
        padding: 24,
        gap: 8,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textTertiary,
    },
});
