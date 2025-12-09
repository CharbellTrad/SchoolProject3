/**
 * StudentsTab - Tab 6: Estudiantes
 * Shows all students with student_id, section_id, type, state badge, inscription_date
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData, StudentPreview } from '../../../services-odoo/dashboardService';
import { Card, Empty, ListRow, StudentAvatar } from '../ui';

interface Props {
    data: DashboardData | null;
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
        case 'done': return { label: 'Confirmado', color: Colors.success, bg: Colors.success + '15' };
        case 'draft': return { label: 'Borrador', color: Colors.warning, bg: Colors.warning + '15' };
        case 'cancel': return { label: 'Cancelado', color: Colors.error, bg: Colors.error + '15' };
        default: return { label: state, color: Colors.textSecondary, bg: Colors.backgroundSecondary };
    }
};

export const StudentsTab: React.FC<Props> = ({ data: d }) => {
    const totalStudents = d?.kpis.totalStudentsCount || 0;
    const previewCount = d?.studentPreviews?.length || 0;

    return (
        <>
            <Card title={`Estudiantes del Año (${totalStudents})`}>
                {d?.studentPreviews?.length ? (
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
                                            <Text style={styles.typeBadge}>{getTypeLabel(st.type)}</Text>
                                        </View>
                                    </View>
                                    <View style={styles.stateCol}>
                                        <View style={[styles.stateBadge, { backgroundColor: stateConfig.bg }]}>
                                            <Text style={[styles.stateText, { color: stateConfig.color }]}>{stateConfig.label}</Text>
                                        </View>
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
                                <Text style={styles.seeMoreHint}>Ver todos en Gestión Académica → Inscripciones</Text>
                            </View>
                        )}
                    </>
                ) : <Empty message="Sin estudiantes registrados" />}
            </Card>
        </>
    );
};

const styles = StyleSheet.create({
    studentInfo: { flex: 1, marginLeft: 12 },
    studentName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 },
    sectionName: { fontSize: 11, color: Colors.textSecondary },
    typeBadge: { fontSize: 10, color: Colors.primary, fontWeight: '600', backgroundColor: Colors.primary + '10', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    stateCol: { alignItems: 'flex-end' },
    stateBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
    stateText: { fontSize: 10, fontWeight: '600' },
    dateText: { fontSize: 10, color: Colors.textTertiary, marginTop: 4 },
    seeMore: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight, marginTop: 8 },
    seeMoreText: { fontSize: 12, color: Colors.textSecondary },
    seeMoreHint: { fontSize: 11, color: Colors.primary, fontWeight: '600', marginTop: 4 },
});

export default StudentsTab;
