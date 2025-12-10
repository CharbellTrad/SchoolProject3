/**
 * StudentsTab - enhanced visual design with skeleton loading
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, StudentPreview } from '../../../services-odoo/dashboardService';
import { AnimatedBadge, Card, Empty, ListRow, ListRowSkeleton, StudentAvatar } from '../ui';

interface Props {
    data: DashboardData | null;
    loading?: boolean;
}

const getTypeLabel = (type: string) => {
    switch (type) {
        case 'secundary': return 'Media General';
        case 'primary': return 'Primaria';
        case 'pre': return 'Preescolar';
        default: return type;
    }
};

const getStateConfig = (state: string) => {
    switch (state) {
        case 'done': return { label: 'Confirmado', color: Colors.success };
        case 'draft': return { label: 'Borrador', color: Colors.warning };
        case 'cancel': return { label: 'Cancelado', color: Colors.error };
        default: return { label: state, color: Colors.textSecondary };
    }
};

export const StudentsTab: React.FC<Props> = ({ data: d, loading }) => {
    const totalStudents = d?.kpis.totalStudentsCount || 0;
    const previewCount = d?.studentPreviews?.length || 0;
    const isLoading = loading || !d;

    return (
        <View style={styles.container}>
            <Card title={isLoading ? "Estudiantes del Año" : `Estudiantes del Año (${totalStudents})`} delay={0}>
                {isLoading ? (
                    <>
                        {Array.from({ length: 6 }).map((_, i) => (
                            <ListRowSkeleton key={i} hasAvatar hasBadge />
                        ))}
                    </>
                ) : d?.studentPreviews?.length ? (
                    <>
                        {d.studentPreviews.map((st: StudentPreview, i) => {
                            const stateConfig = getStateConfig(st.state || 'draft');
                            return (
                                <ListRow key={i}>
                                    <StudentAvatar name={st.studentName} color={Colors.primary} />
                                    <View style={styles.studentInfo}>
                                        <Text style={styles.studentName}>{st.studentName}</Text>
                                        <View style={styles.metaRow}>
                                            <Text style={styles.sectionName}>{st.sectionName}</Text>
                                            <View style={styles.dot} />
                                            <Text style={styles.typeBadge}>{getTypeLabel(st.type)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.stateCol}>
                                        <AnimatedBadge
                                            value={stateConfig.label}
                                            color={stateConfig.color}
                                            pulse={st.state === 'draft'}
                                        />
                                        {st.inscriptionDate && (
                                            <Text style={styles.dateText}>{st.inscriptionDate}</Text>
                                        )}
                                    </View>
                                </ListRow>
                            );
                        })}
                        {totalStudents > previewCount && (
                            <View style={styles.seeMore}>
                                <Text style={styles.seeMoreText}>
                                    Mostrando {previewCount} de {totalStudents} estudiantes
                                </Text>
                                <Text style={styles.seeMoreHint}>Ver todos en Gestión Académica</Text>
                            </View>
                        )}
                    </>
                ) : <Empty message="Sin estudiantes registrados" />}
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { gap: 6 },
    studentInfo: { flex: 1, marginLeft: 12 },
    studentName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
    sectionName: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
    dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Colors.textTertiary },
    typeBadge: { fontSize: 10, color: Colors.primary, fontWeight: '600' },
    stateCol: { alignItems: 'flex-end', gap: 4 },
    dateText: { fontSize: 10, color: Colors.textTertiary },
    seeMore: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight, marginTop: 8 },
    seeMoreText: { fontSize: 12, color: Colors.textSecondary },
    seeMoreHint: { fontSize: 11, color: Colors.primary, fontWeight: '600', marginTop: 4 },
});

export default StudentsTab;
