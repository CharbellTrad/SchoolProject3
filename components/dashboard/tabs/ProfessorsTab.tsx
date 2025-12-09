/**
 * ProfessorsTab - Tab 7: Profesores
 * Matches Odoo structure exactly:
 * - Resumen de Profesores (professor_summary_widget)
 * - Estadísticas por Tipo de Estudiante (professor_detailed_stats_widget) - shows per professor
 * - Materias con Mayor Dificultad (difficult_subjects_chart)
 */
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { DashboardData } from '../../../services-odoo/dashboardService';
import { AnimatedBarChart, ProgressLine } from '../charts';
import { Badge, Card, Empty, ListRow, Separator } from '../ui';

interface Props {
    data: DashboardData | null;
}

export const ProfessorsTab: React.FC<Props> = ({ data: d }) => {
    // Difficult subjects bar data
    const difficultyData = d?.difficultSubjects?.subjects?.slice(0, 6).map((s) => ({
        value: s.failure_rate || 0,
        label: s.subject_name.length > 8 ? s.subject_name.substring(0, 7) + '…' : s.subject_name,
        frontColor: Colors.error,
        gradientColor: '#f87171',
    })) || [];

    // Helper to get best stat from a professor
    const getBestLevel = (stats: any) => {
        if (!stats) return null;
        const levels = [
            { key: 'pre', name: 'Preescolar', color: '#ec4899' },
            { key: 'primary', name: 'Primaria', color: Colors.success },
            { key: 'secundary_general', name: 'Media General', color: Colors.primary },
            { key: 'secundary_tecnico', name: 'Técnico Medio', color: Colors.warning },
        ];
        let best = null;
        let maxCount = 0;
        for (const lv of levels) {
            const data = stats[lv.key];
            if (data && data.count > maxCount) {
                maxCount = data.count;
                best = { ...lv, count: data.count, average: data.average };
            }
        }
        return best;
    };

    return (
        <>
            {/* Resumen de Profesores */}
            <Separator title="Resumen de Profesores" />
            <Card>
                {d?.professorSummary?.professors?.length ? (
                    d.professorSummary.professors.map((p, i) => (
                        <ListRow key={i}>
                            <View style={styles.profAvatar}>
                                <Ionicons name="person" size={18} color={Colors.primary} />
                            </View>
                            <View style={styles.profInfo}>
                                <Text style={styles.profName}>{p.professor_name}</Text>
                                <Text style={styles.profMeta}>
                                    {p.sections_count} secciones • {p.subjects_count} materias • {p.evaluations_count} evaluaciones
                                </Text>
                            </View>
                            <View style={styles.badgesCol}>
                                <Badge value={p.evaluations_count} color={Colors.success} icon="clipboard" />
                            </View>
                        </ListRow>
                    ))
                ) : <Empty message="Sin profesores asignados" />}
            </Card>

            {/* Estadísticas por Tipo de Estudiante - Per Professor */}
            <Separator title="Estadísticas por Profesor" />
            <Card>
                {d?.professorDetailedStats?.professors?.length ? (
                    d.professorDetailedStats.professors.slice(0, 5).map((prof, i) => {
                        const best = getBestLevel(prof.stats_by_type);
                        const totalStudents = Object.values(prof.stats_by_type || {}).reduce(
                            (sum: number, lv: any) => sum + (lv?.count || 0), 0
                        );
                        return (
                            <View key={i} style={styles.detailedRow}>
                                <View style={styles.detailedHeader}>
                                    <View style={styles.profAvatar}>
                                        <Ionicons name="school" size={18} color={Colors.primary} />
                                    </View>
                                    <View style={styles.detailedInfo}>
                                        <Text style={styles.profName}>{prof.professor_name}</Text>
                                        <Text style={styles.profMeta}>
                                            {totalStudents} estudiantes • {prof.total_evaluations} evaluaciones
                                        </Text>
                                    </View>
                                    {best && (
                                        <View style={[styles.levelBadge, { backgroundColor: best.color + '15' }]}>
                                            <Text style={[styles.levelBadgeText, { color: best.color }]}>
                                                {best.name.split(' ')[0]}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                {/* Mini stats by type */}
                                <View style={styles.typeStatsRow}>
                                    {prof.stats_by_type?.pre?.count > 0 && (
                                        <View style={styles.typeStat}>
                                            <Text style={[styles.typeValue, { color: '#ec4899' }]}>{prof.stats_by_type.pre.count}</Text>
                                            <Text style={styles.typeLabel}>Pre</Text>
                                        </View>
                                    )}
                                    {prof.stats_by_type?.primary?.count > 0 && (
                                        <View style={styles.typeStat}>
                                            <Text style={[styles.typeValue, { color: Colors.success }]}>{prof.stats_by_type.primary.count}</Text>
                                            <Text style={styles.typeLabel}>Prim</Text>
                                        </View>
                                    )}
                                    {prof.stats_by_type?.secundary_general?.count > 0 && (
                                        <View style={styles.typeStat}>
                                            <Text style={[styles.typeValue, { color: Colors.primary }]}>{prof.stats_by_type.secundary_general.count}</Text>
                                            <Text style={styles.typeLabel}>MG</Text>
                                        </View>
                                    )}
                                    {prof.stats_by_type?.secundary_tecnico?.count > 0 && (
                                        <View style={styles.typeStat}>
                                            <Text style={[styles.typeValue, { color: Colors.warning }]}>{prof.stats_by_type.secundary_tecnico.count}</Text>
                                            <Text style={styles.typeLabel}>TM</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })
                ) : <Empty message="Sin estadísticas disponibles" />}
            </Card>

            {/* Materias con Mayor Dificultad */}
            <Separator title="Materias con Mayor Dificultad" />
            <Card>
                {d?.difficultSubjects?.subjects?.length ? (
                    <>
                        {d.difficultSubjects.subjects.slice(0, 5).map((s, i) => (
                            <View key={i} style={styles.difficultyRow}>
                                <Text style={styles.difficultyName}>{s.subject_name}</Text>
                                <View style={styles.difficultyBar}>
                                    <ProgressLine value={s.failure_rate || 0} color={Colors.error} height={6} animate />
                                </View>
                            </View>
                        ))}
                        {difficultyData.length > 0 && (
                            <View style={styles.chartSection}>
                                <AnimatedBarChart data={difficultyData} maxValue={100} height={160} barWidth={28} spacing={15} />
                            </View>
                        )}
                    </>
                ) : <Empty message="Sin datos de dificultad" />}
            </Card>
        </>
    );
};

const styles = StyleSheet.create({
    // Professor
    profAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primary + '15', justifyContent: 'center', alignItems: 'center' },
    profInfo: { flex: 1, marginLeft: 12 },
    profName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
    profMeta: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    badgesCol: { alignItems: 'flex-end' },

    // Detailed stats per professor
    detailedRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
    detailedHeader: { flexDirection: 'row', alignItems: 'center' },
    detailedInfo: { flex: 1, marginLeft: 12 },
    levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    levelBadgeText: { fontSize: 10, fontWeight: '600' },
    typeStatsRow: { flexDirection: 'row', marginTop: 10, marginLeft: 52, gap: 16 },
    typeStat: { alignItems: 'center' },
    typeValue: { fontSize: 16, fontWeight: '700' },
    typeLabel: { fontSize: 9, color: Colors.textSecondary, marginTop: 2 },

    // Difficulty
    difficultyRow: { marginBottom: 12 },
    difficultyName: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
    difficultyBar: { width: '100%' },
    chartSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: 16 },
});

export default ProfessorsTab;
