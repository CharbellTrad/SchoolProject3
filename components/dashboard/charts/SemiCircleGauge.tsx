import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    FadeIn
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

interface LevelStat {
    name: string;
    type: string;
    rate: number;
}

interface SemiCircleGaugeProps {
    percentage: number;
    total: number;
    approved: number;
    failed: number;
    byLevel?: LevelStat[];
    size?: number;
}

export const SemiCircleGauge: React.FC<SemiCircleGaugeProps> = ({
    percentage,
    total,
    approved,
    failed,
    byLevel = [],
    size = 140,
}) => {
    const [animatedPercent, setAnimatedPercent] = useState(0);

    useEffect(() => {
        // Animate the percentage
        const duration = 1500;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setAnimatedPercent(Math.round(percentage * easeOut * 10) / 10);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [percentage]);

    const strokeWidth = 14;
    const radius = (size / 2) - (strokeWidth / 2) - 5;
    const centerX = size / 2;
    const centerY = size / 2;

    // Semi-circle arc (180 degrees)
    const arcLength = Math.PI * radius;
    const progressLength = (animatedPercent / 100) * arcLength;

    const getColor = (rate: number) => {
        if (rate >= 90) return '#4caf50';
        if (rate >= 80) return '#8bc34a';
        if (rate >= 70) return '#ffc107';
        if (rate >= 60) return '#ff9800';
        return '#f44336';
    };

    const getLevelIcon = (type: string) => {
        switch (type) {
            case 'pre': return 'school-outline';
            case 'primary': return 'book-outline';
            case 'secundary': return 'library-outline';
            case 'tecnico': return 'construct-outline';
            default: return 'school-outline';
        }
    };

    const getLevelColor = (type: string) => {
        switch (type) {
            case 'pre': return Colors.levelPre;
            case 'primary': return Colors.levelPrimary;
            case 'secundary': return Colors.levelSecundary;
            case 'tecnico': return Colors.levelTecnico;
            default: return Colors.textSecondary;
        }
    };

    // Semi-circle path
    const createArcPath = (r: number) => {
        // Start from left, go to right in a half-circle
        const startX = centerX - r;
        const startY = centerY;
        const endX = centerX + r;
        const endY = centerY;
        return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
    };

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            {/* Gauge */}
            <View style={[styles.gaugeContainer, { width: size, height: size / 2 + 20 }]}>
                <Svg width={size} height={size / 2 + 10} style={{ overflow: 'visible' }}>
                    {/* Background arc */}
                    <Path
                        d={createArcPath(radius)}
                        stroke={Colors.backgroundTertiary}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                    />

                    {/* Progress arc */}
                    <Path
                        d={createArcPath(radius)}
                        stroke={getColor(animatedPercent)}
                        strokeWidth={strokeWidth}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${progressLength} ${arcLength}`}
                    />
                </Svg>

                {/* Center percentage */}
                <View style={[styles.centerLabel, { top: size / 2 - 35 }]}>
                    <Text style={[styles.percentValue, { color: getColor(animatedPercent) }]}>
                        {animatedPercent.toFixed(1)}%
                    </Text>
                    <Text style={styles.percentLabel}>Aprobación</Text>
                </View>
            </View>

            {/* Stats row - compact horizontal */}
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <Ionicons name="people" size={16} color={Colors.textSecondary} />
                    <Text style={styles.statValue}>{total}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={[styles.statValue, { color: Colors.success }]}>{approved}</Text>
                    <Text style={styles.statLabel}>Apr.</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Ionicons name="close-circle" size={16} color={Colors.error} />
                    <Text style={[styles.statValue, { color: Colors.error }]}>{failed}</Text>
                    <Text style={styles.statLabel}>Rep.</Text>
                </View>
            </View>

            {/* Stats by level */}
            {byLevel.length > 0 && (
                <View style={styles.levelStats}>
                    {byLevel.map((level, index) => (
                        <View key={index} style={styles.levelStatRow}>
                            <View style={[styles.levelIcon, { backgroundColor: getLevelColor(level.type) + '20' }]}>
                                <Ionicons
                                    name={getLevelIcon(level.type) as any}
                                    size={12}
                                    color={getLevelColor(level.type)}
                                />
                            </View>
                            <Text style={styles.levelName} numberOfLines={1}>{level.name}</Text>
                            <Text style={[styles.levelRate, { color: getColor(level.rate) }]}>
                                {level.rate.toFixed(0)}%
                            </Text>
                        </View>
                    ))}
                </View>
            )}
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    gaugeContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerLabel: {
        position: 'absolute',
        alignItems: 'center',
        width: '100%',
    },
    percentValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    percentLabel: {
        fontSize: 10,
        color: Colors.textSecondary,
        marginTop: 2,
        fontWeight: '500',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 5,
        marginTop: 0,
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
    statValue: {
        fontSize: 12,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    statLabel: {
        fontSize: 8,
        color: Colors.textTertiary,
        fontWeight: '500',
    },
    levelStats: {
        width: '100%',
        paddingTop: 6,
        gap: 4,
    },
    levelStatRow: {
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
    levelName: {
        flex: 1,
        fontSize: 10,
        fontWeight: '500',
        color: Colors.textSecondary,
    },
    levelRateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        width: 70,
    },
    levelRateBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#e5e5e5',
        borderRadius: 2,
        overflow: 'hidden',
    },
    levelRateFill: {
        height: '100%',
        borderRadius: 2,
    },
    levelRate: {
        fontSize: 10,
        fontWeight: '700',
        width: 30,
        textAlign: 'right',
    },
});

export default SemiCircleGauge;
