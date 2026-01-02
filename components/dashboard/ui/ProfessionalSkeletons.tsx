/**
 * Professional Skeleton Components
 * Pixel-perfect recreations of actual content for seamless loading transitions
 */
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { CircleShimmer, DarkCircleShimmer, DarkShimmer, Shimmer } from './DashboardComponents';

// ==================== KPI CARDS ROW SKELETON ====================
// Matches: 4 KPI cards with icon, value, label - exactly like kpiCard styles
interface KPIRowSkeletonProps {
    count?: number;
}

export const KPIRowSkeleton: React.FC<KPIRowSkeletonProps> = ({ count = 4 }) => (
    <View style={kpiStyles.row}>
        {Array.from({ length: count }).map((_, i) => (
            <View key={i} style={kpiStyles.card}>
                {/* Icon container */}
                <View style={kpiStyles.iconContainer}>
                    <Shimmer width={18} height={18} borderRadius={4} />
                </View>
                {/* Value */}
                <Shimmer width={28} height={18} borderRadius={6} style={{ marginBottom: 4 }} />
                {/* Label */}
                <Shimmer width={48} height={9} borderRadius={3} />
            </View>
        ))}
    </View>
);

const kpiStyles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 4,
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    iconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: Colors.skeleton.base + '40',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
});

// ==================== PROGRESS BAR SKELETON ====================
// Matches: Tasa de Aprobación progress bar
export const ProgressBarSkeleton: React.FC = () => (
    <View style={progressStyles.container}>
        <View style={progressStyles.header}>
            <Shimmer width={120} height={12} borderRadius={4} />
            <Shimmer width={40} height={14} borderRadius={4} />
        </View>
        <View style={progressStyles.bar}>
            <Shimmer width="65%" height={10} borderRadius={5} />
        </View>
    </View>
);

const progressStyles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    bar: {
        height: 10,
        backgroundColor: '#E5E7EB',
        borderRadius: 5,
        overflow: 'hidden',
    },
});

// ==================== GRADE TAGS SKELETON ====================
// Matches: Grados tags container
interface GradeTagsSkeletonProps {
    count?: number;
}

export const GradeTagsSkeleton: React.FC<GradeTagsSkeletonProps> = ({ count = 6 }) => (
    <View style={tagsStyles.container}>
        {Array.from({ length: count }).map((_, i) => (
            <View key={i} style={tagsStyles.tag}>
                <Shimmer width={60 + (i % 3) * 15} height={11} borderRadius={4} />
            </View>
        ))}
    </View>
);

const tagsStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'center',
    },
    tag: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: Colors.skeleton.base + '30',
    },
});

// ==================== RENDIMIENTO CHART SKELETON ====================
// Matches: DonutChart with legend and stats column
interface RendimientoSkeletonProps {
    showLegend?: boolean;
    size?: number;
    type?: 'literal' | 'numeric';
}

export const RendimientoSkeleton: React.FC<RendimientoSkeletonProps> = ({
    showLegend = true,
    size = 120,
    type = 'numeric'
}) => {
    // LITERAL TYPE - For Primaria (literal badge + distribution bars)
    if (type === 'literal') {
        return (
            <View style={rendimientoStyles.container}>
                {/* Left: Literal Main */}
                <View style={rendimientoStyles.literalColumn}>
                    <View style={rendimientoStyles.literalMain}>
                        <Shimmer width={90} height={10} borderRadius={4} />
                        {/* Literal Badge */}
                        <View style={rendimientoStyles.literalBadge}>
                            <Shimmer width={35} height={35} borderRadius={8} />
                        </View>
                        <Shimmer width={80} height={10} borderRadius={4} />
                    </View>
                    {/* Stats Row */}
                    <View style={rendimientoStyles.literalStatsRow}>
                        <View style={rendimientoStyles.literalStatItem}>
                            <Shimmer width={24} height={16} borderRadius={4} />
                            <Shimmer width={35} height={8} borderRadius={3} />
                        </View>
                        <View style={rendimientoStyles.literalDivider} />
                        <View style={rendimientoStyles.literalStatItem}>
                            <Shimmer width={24} height={16} borderRadius={4} />
                            <Shimmer width={45} height={8} borderRadius={3} />
                        </View>
                        <View style={rendimientoStyles.literalDivider} />
                        <View style={rendimientoStyles.literalStatItem}>
                            <Shimmer width={20} height={16} borderRadius={4} />
                            <Shimmer width={50} height={8} borderRadius={3} />
                        </View>
                    </View>
                </View>
                {/* Right: Distribution Bars */}
                <View style={rendimientoStyles.distributionColumn}>
                    <View style={rendimientoStyles.distHeader}>
                        <CircleShimmer size={14} />
                        <Shimmer width={100} height={10} borderRadius={4} />
                    </View>
                    {['#16a34a', '#0891b2', '#f59e0b', '#f97316', '#dc2626'].map((color, i) => (
                        <View key={i} style={rendimientoStyles.distRow}>
                            <View style={[rendimientoStyles.distDot, { backgroundColor: color + '40' }]} />
                            <View style={rendimientoStyles.distBarBg}>
                                <View style={[rendimientoStyles.distBarFill, {
                                    width: `${[75, 55, 45, 25, 10][i]}%`,
                                    backgroundColor: color + '50'
                                }]} />
                            </View>
                            <Shimmer width={28} height={10} borderRadius={4} />
                        </View>
                    ))}
                </View>
            </View>
        );
    }

    // NUMERIC TYPE - For Media General (donut + stats)
    return (
        <View style={rendimientoStyles.container}>
            {/* Chart Column */}
            <View style={rendimientoStyles.chartCol}>
                {/* Donut */}
                <View style={[rendimientoStyles.donut, { width: size, height: size, borderRadius: size / 2 }]}>
                    <View style={[rendimientoStyles.donutInner, {
                        width: size - 36,
                        height: size - 36,
                        borderRadius: (size - 36) / 2
                    }]}>
                        <Shimmer width={32} height={24} borderRadius={6} />
                        <Shimmer width={24} height={10} borderRadius={3} style={{ marginTop: 4 }} />
                    </View>
                </View>
                {/* Legend below - Odoo style with left border */}
                {showLegend && (
                    <View style={rendimientoStyles.legendRow}>
                        <View style={[rendimientoStyles.legendItemBorder, { borderLeftColor: Colors.success }]}>
                            <Shimmer width={'60%'} height={11} borderRadius={3} />
                            <Shimmer width={24} height={11} borderRadius={3} />
                        </View>
                        <View style={[rendimientoStyles.legendItemBorder, { borderLeftColor: Colors.error }]}>
                            <Shimmer width={'60%'} height={11} borderRadius={3} />
                            <Shimmer width={24} height={11} borderRadius={3} />
                        </View>
                    </View>
                )}
            </View>
            {/* Stats Column */}
            <View style={rendimientoStyles.statsCol}>
                {/* Average Container */}
                <View style={rendimientoStyles.avgContainer}>
                    <Shimmer width={80} height={10} borderRadius={4} style={{ marginBottom: 8 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Shimmer width={48} height={32} borderRadius={8} />
                        <Shimmer width={20} height={14} borderRadius={3} style={{ marginLeft: 4 }} />
                    </View>
                </View>
                {/* State Badge */}
                <View style={rendimientoStyles.stateBadge}>
                    <Shimmer width={14} height={14} borderRadius={7} />
                    <Shimmer width={55} height={12} borderRadius={4} style={{ marginLeft: 6 }} />
                </View>
            </View>
        </View>
    );
};

const rendimientoStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 16,
        paddingVertical: 8,
    },
    chartCol: {
        flex: 1,
        alignItems: 'center',
    },
    donut: {
        backgroundColor: Colors.skeleton.base,
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutInner: {
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    legendRow: {
        flexDirection: 'column',
        gap: 6,
        marginTop: 12,
        width: '100%',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendItemBorder: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderLeftWidth: 3,
        backgroundColor: Colors.skeleton.base + '15',
    },
    statsCol: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avgContainer: {
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    stateBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.skeleton.base + '50',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    // Literal variant styles
    literalColumn: {
        flex: 1,
        gap: 12,
    },
    literalMain: {
        alignItems: 'center',
        gap: 8,
    },
    literalBadge: {
        width: 50,
        height: 50,
        borderRadius: 10,
        backgroundColor: Colors.skeleton.base + '30',
        justifyContent: 'center',
        alignItems: 'center',
    },
    literalStatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#f8f9fa',
        borderRadius: 8,
    },
    literalStatItem: {
        alignItems: 'center',
        gap: 2,
    },
    literalDivider: {
        width: 1,
        height: 24,
        backgroundColor: '#ddd',
    },
    distributionColumn: {
        flex: 1,
        gap: 6,
    },
    distHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 6,
    },
    distRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    distDot: {
        width: 14,
        height: 14,
        borderRadius: 3,
    },
    distBarBg: {
        flex: 1,
        height: 10,
        backgroundColor: '#e5e7eb',
        borderRadius: 5,
        overflow: 'hidden',
    },
    distBarFill: {
        height: '100%',
        borderRadius: 5,
    },
});

// ==================== TOP TABLE SKELETON ====================
// Matches: Top 3 Estudiantes por Sección table with header
interface TopTableSkeletonProps {
    rows?: number;
    color?: string;
    hasSectionHeaders?: boolean;
}

export const TopTableSkeleton: React.FC<TopTableSkeletonProps> = ({
    rows = 6,
    color = Colors.primary,
    hasSectionHeaders = true
}) => (
    <View style={tableStyles.container}>
        {/* Table Header */}
        <View style={[tableStyles.header, { backgroundColor: color }]}>
            <View style={{ width: 40 }}>
                <Shimmer width={28} height={10} borderRadius={3} style={{ opacity: 0.6 }} />
            </View>
            <View style={{ flex: 1 }}>
                <Shimmer width={70} height={10} borderRadius={3} style={{ opacity: 0.6 }} />
            </View>
            <View style={{ width: 70, alignItems: 'flex-end' }}>
                <Shimmer width={55} height={10} borderRadius={3} style={{ opacity: 0.6 }} />
            </View>
        </View>

        {/* Section Header */}
        {hasSectionHeaders && (
            <View style={tableStyles.sectionHeader}>
                <View style={[tableStyles.sectionDot, { backgroundColor: color }]} />
                <Shimmer width={100} height={10} borderRadius={4} />
            </View>
        )}

        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={tableStyles.row}>
                {/* Position Badge */}
                <View style={{ width: 40, alignItems: 'center' }}>
                    {i < 3 ? (
                        <View style={[tableStyles.posBadge, {
                            backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32'
                        }]}>
                            <Shimmer width={10} height={10} borderRadius={2} style={{ opacity: 0.4 }} />
                        </View>
                    ) : (
                        <Shimmer width={14} height={11} borderRadius={3} />
                    )}
                </View>
                {/* Student Info */}
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <CircleShimmer size={28} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Shimmer width="75%" height={12} borderRadius={4} />
                    </View>
                </View>
                {/* Average Badge */}
                <View style={[tableStyles.avgBadge, { backgroundColor: Colors.success + '80' }]}>
                    <Shimmer width={24} height={11} borderRadius={3} style={{ opacity: 0.5 }} />
                </View>
            </View>
        ))}
    </View>
);

const tableStyles = StyleSheet.create({
    container: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: '#E8E8E8',
        gap: 6,
    },
    sectionDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#FAFAFA',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    posBadge: {
        width: 22,
        height: 22,
        borderRadius: 11,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avgBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
});

// ==================== DISTRIBUTION CHART SKELETON ====================
// Matches: Distribución de Evaluaciones with donut + legend cards
interface DistributionSkeletonProps {
    legendItems?: number;
}

export const DistributionSkeleton: React.FC<DistributionSkeletonProps> = ({ legendItems = 4 }) => (
    <View style={distStyles.container}>
        {/* Left: Donut Chart */}
        <View style={distStyles.chartSection}>
            <View style={distStyles.donut}>
                <View style={distStyles.donutInner}>
                    <Shimmer width={36} height={28} borderRadius={8} />
                    <Shimmer width={28} height={10} borderRadius={4} style={{ marginTop: 4 }} />
                </View>
            </View>
        </View>
        {/* Right: Legend */}
        <View style={distStyles.legendSection}>
            {Array.from({ length: legendItems }).map((_, i) => (
                <View key={i} style={distStyles.legendCard}>
                    <View style={[distStyles.legendBorder, {
                        backgroundColor: [Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary, Colors.levelTecnico][i % 4] + '30'
                    }]} />
                    <CircleShimmer size={14} />
                    <View style={{ flex: 1 }}>
                        <Shimmer width="80%" height={10} borderRadius={4} />
                    </View>
                    <Shimmer width={20} height={10} borderRadius={3} />
                    <Shimmer width={28} height={10} borderRadius={3} />
                </View>
            ))}
        </View>
    </View>
);

const distStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    chartSection: {
        alignItems: 'center',
    },
    donut: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: Colors.skeleton.base,
        justifyContent: 'center',
        alignItems: 'center',
    },
    donutInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    legendSection: {
        flex: 1,
        gap: 6,
    },
    legendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 6,
        backgroundColor: '#F9FAFB',
        gap: 8,
        overflow: 'hidden',
    },
    legendBorder: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
    },
});

// ==================== TOP 5 PROFESORES SKELETON ====================
// Matches: Top 5 Profesores list with medals
export const TopProfesoresSkeleton: React.FC = () => (
    <View style={profStyles.container}>
        {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={[profStyles.row, i < 4 && profStyles.rowBorder]}>
                {/* Medal/Rank */}
                <View style={profStyles.medalContainer}>
                    {i < 3 ? (
                        <Shimmer width={24} height={24} borderRadius={4} />
                    ) : (
                        <Shimmer width={18} height={18} borderRadius={9} />
                    )}
                </View>
                {/* Avatar */}
                <CircleShimmer size={40} />
                {/* Info */}
                <View style={profStyles.info}>
                    <Shimmer width="70%" height={13} borderRadius={5} />
                    <View style={profStyles.stats}>
                        <Shimmer width={65} height={9} borderRadius={3} />
                        <View style={profStyles.statsDot} />
                        <Shimmer width={50} height={9} borderRadius={3} />
                    </View>
                </View>
                {/* Average Badge */}
                <View style={profStyles.avgBadge}>
                    <Shimmer width={28} height={16} borderRadius={4} style={{ opacity: 0.6 }} />
                </View>
            </View>
        ))}
    </View>
);

const profStyles = StyleSheet.create({
    container: {},
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    medalContainer: {
        width: 36,
        marginRight: 10,
        alignItems: 'center',
    },
    info: {
        flex: 1,
        marginLeft: 12,
        gap: 4,
    },
    stats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statsDot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
        backgroundColor: Colors.skeleton.base,
        marginHorizontal: 6,
    },
    avgBadge: {
        backgroundColor: Colors.success + '30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
    },
});

// ==================== MATERIAS DIFICULTAD SKELETON ====================
// Matches: Horizontal bar chart with subject names
export const MateriasDificultadSkeleton: React.FC = () => (
    <View style={materiasStyles.container}>
        {[0.92, 0.78, 0.65, 0.52, 0.38].map((width, i) => (
            <View key={i} style={materiasStyles.row}>
                <Shimmer width={90} height={10} borderRadius={4} />
                <View style={materiasStyles.barContainer}>
                    <View style={[materiasStyles.bar, { width: `${width * 100}%` }]} />
                </View>
                <Shimmer width={28} height={10} borderRadius={4} />
            </View>
        ))}
    </View>
);

const materiasStyles = StyleSheet.create({
    container: {
        gap: 12,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    barContainer: {
        flex: 1,
        height: 16,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    bar: {
        height: '100%',
        backgroundColor: Colors.skeleton.base,
        borderRadius: 4,
    },
});

// ==================== TIMELINE SKELETON ====================
// Matches: Últimas Observaciones timeline for Preescolar
interface TimelineSkeletonProps {
    items?: number;
    color?: string;
}

export const TimelineSkeleton: React.FC<TimelineSkeletonProps> = ({ items = 4, color = Colors.levelPre }) => (
    <View style={timelineStyles.container}>
        {/* Vertical Line */}
        <View style={[timelineStyles.line, { backgroundColor: color + '30' }]} />

        {Array.from({ length: items }).map((_, i) => (
            <View key={i} style={timelineStyles.item}>
                {/* Dot */}
                <View style={[timelineStyles.dot, { backgroundColor: color }]} />
                {/* Card */}
                <View style={timelineStyles.card}>
                    {/* Header */}
                    <View style={timelineStyles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <Shimmer width="50%" height={12} borderRadius={4} />
                            <View style={timelineStyles.sectionBadge}>
                                <Shimmer width={45} height={9} borderRadius={3} />
                            </View>
                        </View>
                        <Shimmer width={65} height={9} borderRadius={3} />
                    </View>
                    {/* Content */}
                    <View style={timelineStyles.cardContent}>
                        <Shimmer width="95%" height={10} borderRadius={4} style={{ marginBottom: 4 }} />
                        <Shimmer width="75%" height={10} borderRadius={4} />
                    </View>
                </View>
            </View>
        ))}
    </View>
);

const timelineStyles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    line: {
        position: 'absolute',
        left: 5.5,
        top: 0,
        bottom: 0,
        width: 3,
        borderRadius: 1.5,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    dot: {
        width: 14,
        height: 14,
        borderRadius: 7,
        marginRight: 12,
        marginTop: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    card: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: Colors.borderLight,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sectionBadge: {
        marginLeft: 8,
        backgroundColor: Colors.skeleton.base + '30',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
    },
    cardContent: {},
});

// ==================== NIVEL STATS TABLE SKELETON ====================
// Matches: Estadísticas por Tipo de Estudiante table
interface StatsTableSkeletonProps {
    rows?: number;
}

export const StatsTableSkeleton: React.FC<StatsTableSkeletonProps> = ({ rows = 4 }) => (
    <View style={statsTableStyles.container}>
        {/* Header */}
        <View style={statsTableStyles.header}>
            <View style={{ flex: 1 }}>
                <Shimmer width={50} height={10} borderRadius={3} style={{ opacity: 0.7 }} />
            </View>
            <View style={{ width: 60, alignItems: 'center' }}>
                <Shimmer width={40} height={10} borderRadius={3} style={{ opacity: 0.7 }} />
            </View>
            <View style={{ width: 70, alignItems: 'center' }}>
                <Shimmer width={50} height={10} borderRadius={3} style={{ opacity: 0.7 }} />
            </View>
            <View style={{ width: 70, alignItems: 'center' }}>
                <Shimmer width={55} height={10} borderRadius={3} style={{ opacity: 0.7 }} />
            </View>
        </View>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={[statsTableStyles.row, i % 2 === 1 && statsTableStyles.rowAlt]}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[statsTableStyles.levelDot, {
                        backgroundColor: [Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary, Colors.levelTecnico][i % 4]
                    }]} />
                    <Shimmer width={80} height={11} borderRadius={4} />
                </View>
                <View style={{ width: 60, alignItems: 'center' }}>
                    <Shimmer width={24} height={11} borderRadius={4} />
                </View>
                <View style={{ width: 70, alignItems: 'center' }}>
                    <Shimmer width={32} height={11} borderRadius={4} />
                </View>
                <View style={{ width: 70, alignItems: 'center' }}>
                    <Shimmer width={36} height={11} borderRadius={4} />
                </View>
            </View>
        ))}
    </View>
);

const statsTableStyles = StyleSheet.create({
    container: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: Colors.primary,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
    },
    rowAlt: {
        backgroundColor: '#F9FAFB',
    },
    levelDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
});

// ==================== LEVEL CARD GRID SKELETON ====================
// Matches: Rendimiento General del Año Escolar 2x2 grid
export const LevelCardGridSkeleton: React.FC = () => (
    <View style={levelGridStyles.container}>
        {[Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary, Colors.levelTecnico].map((color, i) => (
            <View key={i} style={levelGridStyles.card}>
                <View style={levelGridStyles.cardInner}>
                    {/* Header */}
                    <View style={[levelGridStyles.header, { backgroundColor: color + '15' }]}>
                        <CircleShimmer size={28} />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                            <Shimmer width="80%" height={12} borderRadius={4} />
                        </View>
                        <View style={levelGridStyles.countBadge}>
                            <Shimmer width={20} height={12} borderRadius={4} />
                        </View>
                    </View>
                    {/* Main Value */}
                    <View style={levelGridStyles.mainValue}>
                        <Shimmer width={38} height={32} borderRadius={8} />
                    </View>
                    {/* Footer */}
                    <View style={levelGridStyles.footer}>
                        <Shimmer width={50} height={10} borderRadius={4} />
                        <Shimmer width={50} height={10} borderRadius={4} />
                    </View>
                </View>
            </View>
        ))}
    </View>
);

const levelGridStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    card: {
        flexBasis: '48%',
        flexGrow: 1,
        minWidth: 140,
    },
    cardInner: {
        backgroundColor: '#fff',
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: Colors.borderLight,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    countBadge: {
        backgroundColor: Colors.skeleton.base + '50',
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    mainValue: {
        alignItems: 'center',
        paddingVertical: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.borderLight,
    },
});

// ==================== POLAR AREA CHART SKELETON ====================
// Matches: PolarAreaChart with chart + totalHeader + legend (left borders)
interface PolarAreaSkeletonProps {
    size?: number;
    legendItems?: number;
}

export const PolarAreaSkeleton: React.FC<PolarAreaSkeletonProps> = ({ size = 140, legendItems = 3 }) => (
    <View style={polarStyles.container}>
        {/* Chart Circle */}
        <View style={[polarStyles.chart, { width: size, height: size }]}>
            <CircleShimmer size={size} />
        </View>
        {/* Total Header */}
        <View style={polarStyles.totalHeader}>
            <CircleShimmer size={18} />
            <Shimmer width={20} height={14} borderRadius={4} />
            <Shimmer width={80} height={10} borderRadius={3} />
        </View>
        {/* Legend with left borders */}
        <View style={polarStyles.legend}>
            {[Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary].slice(0, legendItems).map((color, i) => (
                <View key={i} style={[polarStyles.legendItem, { borderLeftColor: color }]}>
                    <Shimmer width="50%" height={11} borderRadius={4} />
                    <Shimmer width={18} height={11} borderRadius={4} />
                </View>
            ))}
        </View>
    </View>
);

const polarStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    chart: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    totalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        width: '100%',
    },
    legend: {
        gap: 4,
        marginTop: 8,
        width: '100%',
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderLeftWidth: 3,
        backgroundColor: Colors.skeleton.base + '15',
    },
});

// ==================== SEMI CIRCLE GAUGE SKELETON ====================
// Matches: SemiCircleGauge with gauge + statsRow + levelStats
export const SemiCircleGaugeSkeleton: React.FC = () => (
    <View style={gaugeSkeletonStyles.container}>
        {/* Gauge - semi circle */}
        <View style={gaugeSkeletonStyles.gaugeContainer}>
            <View style={gaugeSkeletonStyles.semiCircle} />
            {/* Center label */}
            <View style={gaugeSkeletonStyles.centerLabel}>
                <Shimmer width={55} height={20} borderRadius={6} />
                <Shimmer width={50} height={10} borderRadius={3} style={{ marginTop: 4 }} />
            </View>
        </View>
        {/* Stats row */}
        <View style={gaugeSkeletonStyles.statsRow}>
            <View style={gaugeSkeletonStyles.statItem}>
                <CircleShimmer size={16} />
                <Shimmer width={22} height={12} borderRadius={4} />
                <Shimmer width={28} height={8} borderRadius={3} />
            </View>
            <View style={gaugeSkeletonStyles.statDivider} />
            <View style={gaugeSkeletonStyles.statItem}>
                <CircleShimmer size={16} />
                <Shimmer width={22} height={12} borderRadius={4} />
                <Shimmer width={24} height={8} borderRadius={3} />
            </View>
            <View style={gaugeSkeletonStyles.statDivider} />
            <View style={gaugeSkeletonStyles.statItem}>
                <CircleShimmer size={16} />
                <Shimmer width={22} height={12} borderRadius={4} />
                <Shimmer width={24} height={8} borderRadius={3} />
            </View>
        </View>
        {/* Level stats */}
        <View style={gaugeSkeletonStyles.levelStats}>
            {[Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary, Colors.levelTecnico].map((color, i) => (
                <View key={i} style={gaugeSkeletonStyles.levelRow}>
                    <View style={[gaugeSkeletonStyles.levelIcon, { backgroundColor: color + '20' }]}>
                        <CircleShimmer size={12} />
                    </View>
                    <Shimmer width="50%" height={10} borderRadius={4} />
                    <Shimmer width={28} height={10} borderRadius={4} />
                </View>
            ))}
        </View>
    </View>
);

const gaugeSkeletonStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        flex: 1,
    },
    gaugeContainer: {
        width: 140,
        height: 85,
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    semiCircle: {
        width: 126,
        height: 63,
        borderTopLeftRadius: 63,
        borderTopRightRadius: 63,
        borderWidth: 14,
        borderBottomWidth: 0,
        borderColor: Colors.skeleton.base,
        backgroundColor: 'transparent',
        position: 'absolute',
        top: 0,
    },
    centerLabel: {
        alignItems: 'center',
        paddingBottom: 20
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 5,
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
        gap: 12,
    },
    statItem: {
        alignItems: 'center',
        gap: 1,
    },
    statDivider: {
        width: 1,
        height: 25,
        backgroundColor: '#ddd',
    },
    levelStats: {
        width: '100%',
        paddingTop: 6,
        gap: 4,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        backgroundColor: '#f8f9fa',
        borderRadius: 6,
    },
    levelIcon: {
        width: 16,
        height: 16,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

// ==================== DONUT CHART SKELETON ====================
// Matches: Simple donut/polar charts in Dashboard General
interface DonutChartSkeletonProps {
    size?: number;
}

export const DonutChartSkeleton: React.FC<DonutChartSkeletonProps> = ({ size = 120 }) => (
    <View style={donutStyles.container}>
        <View style={[donutStyles.outer, { width: size, height: size, borderRadius: size / 2 }]}>
            <View style={[donutStyles.inner, {
                width: size * 0.6,
                height: size * 0.6,
                borderRadius: size * 0.3
            }]}>
                <Shimmer width={size * 0.3} height={size * 0.2} borderRadius={6} />
                <Shimmer width={size * 0.25} height={8} borderRadius={3} style={{ marginTop: 4 }} />
            </View>
        </View>
    </View>
);

const donutStyles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    outer: {
        backgroundColor: Colors.skeleton.base,
        justifyContent: 'center',
        alignItems: 'center',
    },
    inner: {
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

// ==================== LEVEL DISTRIBUTION SKELETON ====================
// Matches: Distribución por Nivel in StudentsTab with progress bars
// ==================== LEVEL DISTRIBUTION SKELETON ====================
// Matches: Distribución por Nivel in StudentsTab (row with name/count header + progress line)
export const LevelDistributionSkeleton: React.FC = () => (
    <View style={levelDistStyles.container}>
        {/* Total badge */}
        <View style={levelDistStyles.totalBadge}>
            <Shimmer width={80} height={10} borderRadius={4} />
        </View>
        {/* Level items */}
        {[Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary, Colors.levelTecnico].map((color, i) => (
            <View key={i} style={levelDistStyles.item}>
                <View style={levelDistStyles.header}>
                    <Shimmer width={80} height={11} borderRadius={4} />
                    <Shimmer width={30} height={11} borderRadius={4} />
                </View>
                <View style={levelDistStyles.barBg}>
                    <View style={[levelDistStyles.barFill, {
                        width: `${70 - i * 12}%`,
                        backgroundColor: color
                    }]} />
                </View>
            </View>
        ))}
    </View>
);

const levelDistStyles = StyleSheet.create({
    container: {
        gap: 8,
    },
    totalBadge: {
        alignSelf: 'center',
        backgroundColor: Colors.skeleton.base + '30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 8,
    },
    item: {
        gap: 6,
        paddingVertical: 2,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    barBg: {
        height: 10,
        backgroundColor: '#E5E7EB',
        borderRadius: 5,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 5,
        opacity: 0.7,
    },
});

// ==================== GENDER BAR SKELETON ====================
// Matches: Distribución por Género stacked bar with 2-col legend
export const GenderBarSkeleton: React.FC = () => (
    <View style={genderStyles.container}>
        {/* Total badge */}
        <View style={genderStyles.totalBadge}>
            <Shimmer width={70} height={10} borderRadius={4} />
        </View>

        {/* Centered Content Container */}
        <View style={genderStyles.centeredContent}>
            {/* Stacked Stack Bar */}
            <View style={genderStyles.bar}>
                <View style={[genderStyles.segment, { width: '55%', backgroundColor: Colors.primary }]}>
                    <Shimmer width={30} height={10} borderRadius={3} style={{ opacity: 0.5 }} />
                </View>
                <View style={[genderStyles.segment, { width: '45%', backgroundColor: '#EC4899' }]}>
                    <Shimmer width={30} height={10} borderRadius={3} style={{ opacity: 0.5 }} />
                </View>
            </View>

            {/* Legend - 2 columns */}
            <View style={genderStyles.legend}>
                <View style={genderStyles.legendItem}>
                    <CircleShimmer size={18} />
                    <Shimmer width={20} height={14} borderRadius={4} />
                    <Shimmer width={50} height={10} borderRadius={4} />
                </View>
                <View style={genderStyles.legendItem}>
                    <CircleShimmer size={18} />
                    <Shimmer width={20} height={14} borderRadius={4} />
                    <Shimmer width={50} height={10} borderRadius={4} />
                </View>
            </View>
        </View>
    </View>
);

const genderStyles = StyleSheet.create({
    container: {
        width: '100%',
    },
    totalBadge: {
        alignSelf: 'center',
        backgroundColor: Colors.skeleton.base + '30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 8,
    },
    centeredContent: {
        width: '100%',
        alignItems: 'center',
        gap: 12, // Gap between bar and legend
    },
    bar: {
        flexDirection: 'row',
        height: 28,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    segment: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24, // Space between male and female items
        width: '100%',
    },
    legendItem: {
        alignItems: 'center', // Vertical stack for each legend item
        gap: 4,
    },
});

// ==================== STATE STATS SKELETON ====================
// Matches: Estado de Inscripción items (Header[Icon+Label | Value] + Progress)
export const StateStatsSkeleton: React.FC = () => (
    <View style={stateStyles.container}>
        {/* Total badge */}
        <View style={stateStyles.totalBadge}>
            <Shimmer width={70} height={10} borderRadius={4} />
        </View>
        {/* Content Centered */}
        <View style={stateStyles.centeredContent}>
            {[Colors.success, Colors.warning, Colors.error].map((color, i) => (
                <View key={i} style={stateStyles.item}>
                    <View style={stateStyles.header}>
                        <View style={stateStyles.labelGroup}>
                            <CircleShimmer size={14} />
                            <Shimmer width={60} height={11} borderRadius={4} />
                        </View>
                        <Shimmer width={50} height={11} borderRadius={4} />
                    </View>
                    <View style={stateStyles.barBg}>
                        <View style={[stateStyles.barFill, {
                            width: `${80 - i * 25}%`,
                            backgroundColor: color
                        }]} />
                    </View>
                </View>
            ))}
        </View>
    </View>
);

const stateStyles = StyleSheet.create({
    container: {
        width: '100%',
    },
    totalBadge: {
        alignSelf: 'center',
        backgroundColor: Colors.skeleton.base + '30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 8,
    },
    centeredContent: {
        width: '100%',
        gap: 12, // Gap between items
    },
    item: {
        gap: 6, // Gap between header and progress bar
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    labelGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    barBg: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: 4,
        opacity: 0.7,
    },
});

// ==================== APPROVAL GAUGE SKELETON ====================
// Matches: Índice de Aprobación (Total Badge + Horizontal Gauge Bar + Stats Row)
export const ApprovalGaugeSkeleton: React.FC = () => (
    <View style={gaugeStyles.container}>
        {/* Total badge */}
        <View style={gaugeStyles.totalBadge}>
            <Shimmer width={80} height={10} borderRadius={4} />
        </View>

        {/* Gauge Container */}
        <View style={gaugeStyles.gaugeContainer}>
            {/* Horizontal Gauge Bar */}
            <View style={gaugeStyles.gaugeBg}>
                <View style={gaugeStyles.gaugeFill} />
            </View>
            {/* Percentage Value */}
            <Shimmer width={50} height={20} borderRadius={6} style={{ marginTop: 8 }} />
        </View>

        {/* Stats Row */}
        <View style={gaugeStyles.stats}>
            <View style={gaugeStyles.statItem}>
                <CircleShimmer size={16} />
                <Shimmer width={24} height={14} borderRadius={4} />
                <Shimmer width={50} height={9} borderRadius={3} />
            </View>
            <View style={gaugeStyles.statItem}>
                <CircleShimmer size={16} />
                <Shimmer width={24} height={14} borderRadius={4} />
                <Shimmer width={50} height={9} borderRadius={3} />
            </View>
        </View>
    </View>
);

const gaugeStyles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    totalBadge: {
        alignSelf: 'center',
        backgroundColor: Colors.skeleton.base + '30',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        marginBottom: 12,
    },
    gaugeContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
    },
    gaugeBg: {
        width: '100%',
        height: 18,
        backgroundColor: '#E5E7EB',
        borderRadius: 9,
        overflow: 'hidden',
    },
    gaugeFill: {
        width: '70%',
        height: '100%',
        backgroundColor: Colors.skeleton.base,
        borderRadius: 9,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 4,
    },
    statItem: {
        alignItems: 'center',
        gap: 4,
    },
});

// ==================== PROFESSORS LEVEL SKELETON ====================
// Matches: Distribución por Nivel in ProfessorsTab (Icon+Name Left, Badge Right)
export const ProfessorsLevelSkeleton: React.FC = () => (
    <View style={profLevelStyles.container}>
        {[Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary, Colors.levelTecnico].map((color, i) => (
            <View key={i} style={profLevelStyles.row}>
                {/* Left: Icon + Name */}
                <View style={profLevelStyles.levelInfo}>
                    <View style={[profLevelStyles.iconPlaceholder, { backgroundColor: color + '20' }]}>
                        <CircleShimmer size={16} />
                    </View>
                    <Shimmer width={100} height={12} borderRadius={4} />
                </View>
                {/* Right: Badge */}
                <View style={[profLevelStyles.levelBadge, { backgroundColor: color }]}>
                    <Shimmer width={70} height={10} borderRadius={4} style={{ opacity: 0.6 }} />
                </View>
            </View>
        ))}
    </View>
);

const profLevelStyles = StyleSheet.create({
    container: {
        gap: 12, // Gap between rows
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    levelInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    iconPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    levelBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
});

// ==================== SUBJECT DETAIL SKELETON ====================
// Matches: Detalle de Materias table in ProfessorsTab
export const SubjectDetailSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
    <View style={subjectDetailStyles.container}>
        {/* Table Header */}
        <View style={subjectDetailStyles.header}>
            <Shimmer width={60} height={10} borderRadius={3} style={{ flex: 2.5 }} />
            <Shimmer width={25} height={10} borderRadius={3} style={subjectDetailStyles.centerText} />
            <Shimmer width={30} height={10} borderRadius={3} style={subjectDetailStyles.centerText} />
            <Shimmer width={30} height={10} borderRadius={3} style={subjectDetailStyles.centerText} />
            <Shimmer width={50} height={10} borderRadius={3} style={{ flex: 1.3, alignSelf: 'center' }} />
        </View>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, i) => (
            <View key={i} style={[subjectDetailStyles.row, i % 2 !== 0 && subjectDetailStyles.rowAlt]}>
                {/* Materia Name - with icon */}
                <View style={[subjectDetailStyles.cell, { flex: 2.5, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                    <CircleShimmer size={12} />
                    <Shimmer width={'70%'} height={11} borderRadius={4} />
                </View>
                {/* Rep */}
                <View style={[subjectDetailStyles.cell, subjectDetailStyles.centerContent]}>
                    <Shimmer width={20} height={11} borderRadius={4} />
                </View>
                {/* Total */}
                <View style={[subjectDetailStyles.cell, subjectDetailStyles.centerContent]}>
                    <Shimmer width={25} height={11} borderRadius={4} />
                </View>
                {/* Prom Badge */}
                <View style={[subjectDetailStyles.cell, subjectDetailStyles.centerContent]}>
                    <View style={subjectDetailStyles.avgBadge}>
                        <Shimmer width={30} height={10} borderRadius={4} />
                    </View>
                </View>
                {/* Dificultad Badge */}
                <View style={[subjectDetailStyles.cell, { flex: 1.3, alignItems: 'center' }]}>
                    <View style={subjectDetailStyles.diffBadge}>
                        <Shimmer width={40} height={10} borderRadius={4} />
                    </View>
                </View>
            </View>
        ))}
    </View>
);

const subjectDetailStyles = StyleSheet.create({
    container: {
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    header: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 8,
        backgroundColor: '#F9FAFB',
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        alignItems: 'center',
    },
    centerText: {
        flex: 1,
        alignSelf: 'center',
    },
    row: {
        flexDirection: 'row',
        paddingVertical: 10,
        paddingHorizontal: 8,
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    rowAlt: {
        backgroundColor: '#F9FAFB',
    },
    cell: {
        flex: 1,
    },
    centerContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    avgBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        backgroundColor: Colors.skeleton.base + '20',
    },
    diffBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
    },
});

// ==================== LAPSOS TIMELINE SKELETON ====================
// Matches: Compact LapsosTimeline (3 circles with connectors)
export const LapsosTimelineSkeleton: React.FC = () => (
    <View style={lapsosTimelineStyles.container}>
        {/* Period Info (Dates) */}
        <View style={lapsosTimelineStyles.periodInfo}>
            <View style={lapsosTimelineStyles.iconPlaceholder}>
                <DarkCircleShimmer size={14} />
            </View>
            <DarkShimmer width={150} height={10} borderRadius={4} />
        </View>

        {/* Timeline (3 circles) */}
        <View style={lapsosTimelineStyles.timeline}>
            {[1, 2, 3].map((_, i) => (
                <View key={i} style={lapsosTimelineStyles.item}>
                    {/* Connector Left */}
                    {i > 0 && (
                        <View style={lapsosTimelineStyles.connector}>
                            <View style={lapsosTimelineStyles.connectorLine} />
                        </View>
                    )}

                    {/* Circle */}
                    <View style={lapsosTimelineStyles.circleWrapper}>
                        <DarkCircleShimmer size={28} />
                    </View>

                    {/* Connector Right */}
                    {i < 2 && (
                        <View style={lapsosTimelineStyles.connectorRight}>
                            <View style={lapsosTimelineStyles.connectorRightLine} />
                        </View>
                    )}

                    {/* Label */}
                    <DarkShimmer width={40} height={8} borderRadius={3} style={{ marginTop: 6 }} />
                </View>
            ))}
        </View>
    </View>
);

const lapsosTimelineStyles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 10,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(0,0,0,0.15)', // Match LapsosTimeline: Dark overlay on gradient
        borderRadius: 16,
        marginTop: 8,
    },
    periodInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 8,
    },
    iconPlaceholder: {
        opacity: 0.7, // Slightly visible placeholder
    },
    timeline: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 4, // Tighter padding
    },
    item: {
        alignItems: 'center',
        flex: 1,
        position: 'relative',
    },
    circleWrapper: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    connector: {
        position: 'absolute',
        top: 15,
        right: '50%',
        height: 2,
        width: '50%',
        zIndex: 1,
    },
    connectorLine: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginRight: 16, // Stop short of center
    },
    connectorRight: {
        position: 'absolute',
        top: 15,
        left: '50%',
        height: 2,
        width: '50%',
        zIndex: 1,
    },
    connectorRightLine: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        marginLeft: 16, // Stop short of center
    },
});

// ==================== SECTION CARDS SKELETON ====================
// Matches: Mejor Sección por Nivel cards
export const SectionCardsSkeleton: React.FC = () => (
    <View style={sectionCardsStyles.container}>
        {[Colors.levelPre, Colors.levelPrimary, Colors.levelSecundary, Colors.levelTecnico].map((color, i) => (
            <View key={i} style={[sectionCardsStyles.card, { borderLeftColor: color }]}>
                {/* Header */}
                <View style={sectionCardsStyles.header}>
                    <View style={{ flex: 1 }}>
                        <View style={[sectionCardsStyles.levelBadge, { backgroundColor: color }]}>
                            <Shimmer width={60} height={9} borderRadius={3} style={{ opacity: 0.6 }} />
                        </View>
                        <Shimmer width="85%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
                    </View>
                    <View style={sectionCardsStyles.avgBadge}>
                        <Shimmer width={24} height={16} borderRadius={4} />
                    </View>
                </View>
                {/* Stats */}
                <View style={sectionCardsStyles.stats}>
                    <Shimmer width={55} height={10} borderRadius={4} />
                    <Shimmer width={45} height={10} borderRadius={4} />
                </View>
                {/* Progress */}
                <View style={sectionCardsStyles.progressBg}>
                    <View style={[sectionCardsStyles.progressFill, { width: `${75 - i * 10}%` }]} />
                </View>
            </View>
        ))}
    </View>
);

const sectionCardsStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    card: {
        flexBasis: '48%',
        flexGrow: 1,
        backgroundColor: '#FAFAFA',
        borderRadius: 8,
        padding: 10,
        borderLeftWidth: 4,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    levelBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        alignSelf: 'flex-start',
    },
    avgBadge: {
        backgroundColor: Colors.backgroundTertiary,
        padding: 6,
        borderRadius: 8,
    },
    stats: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 8,
    },
    progressBg: {
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.skeleton.base,
        borderRadius: 2,
    },
});

// ==================== TOP 9 STUDENTS SKELETON ====================
// Matches: Top 9 Mejores Estudiantes grouped by level
export const Top9StudentsSkeleton: React.FC = () => (
    <View style={top9Styles.container}>
        {[
            { color: Colors.levelPrimary, label: 'Primaria' },
            { color: Colors.levelSecundary, label: 'Media General' },
            { color: Colors.levelTecnico, label: 'Técnico' }
        ].map((level, lvIndex) => (
            <View key={lvIndex} style={top9Styles.section}>
                {/* Level Badge */}
                <View style={[top9Styles.levelBadge, { backgroundColor: level.color + '15' }]}>
                    <CircleShimmer size={14} />
                    <Shimmer width={60} height={10} borderRadius={4} />
                </View>
                {/* 3 Students */}
                {[0, 1, 2].map((i) => (
                    <View key={i} style={[top9Styles.row, i < 2 && top9Styles.rowBorder]}>
                        <View style={[top9Styles.rankBadge, {
                            backgroundColor: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : '#CD7F32'
                        }]}>
                            <Shimmer width={10} height={10} borderRadius={3} style={{ opacity: 0.4 }} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Shimmer width="70%" height={12} borderRadius={4} />
                            <Shimmer width="40%" height={9} borderRadius={3} style={{ marginTop: 4 }} />
                        </View>
                        <Shimmer width={28} height={14} borderRadius={4} />
                    </View>
                ))}
            </View>
        ))}
    </View>
);

const top9Styles = StyleSheet.create({
    container: {
        gap: 16,
    },
    section: {
        gap: 8,
    },
    levelBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 8,
    },
    rowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    rankBadge: {
        width: 24,
        height: 24,
        borderRadius: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
