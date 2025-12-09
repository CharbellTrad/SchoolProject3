/**
 * ProgressLine - Horizontal animated progress bar with gradient
 */
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';

interface ProgressLineProps {
    value: number;
    maxValue?: number;
    color?: string;
    height?: number;
    showLabel?: boolean;
    label?: string;
    animate?: boolean;
}

export const ProgressLine: React.FC<ProgressLineProps> = ({
    value,
    maxValue = 100,
    color,
    height = 8,
    showLabel = true,
    label,
    animate = true,
}) => {
    const percentage = Math.min((value / maxValue) * 100, 100);
    const animValue = useRef(new Animated.Value(0)).current;

    // Determine color based on percentage if not provided
    const barColor = color || (percentage >= 70 ? Colors.success : percentage >= 50 ? Colors.warning : Colors.error);

    useEffect(() => {
        if (animate) {
            Animated.timing(animValue, {
                toValue: percentage,
                duration: 800,
                useNativeDriver: false,
            }).start();
        } else {
            animValue.setValue(percentage);
        }
    }, [percentage, animate]);

    const width = animValue.interpolate({
        inputRange: [0, 100],
        outputRange: ['0%', '100%'],
    });

    return (
        <View style={styles.container}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.row}>
                <View style={[styles.track, { height }]}>
                    <Animated.View style={[styles.fill, { width, backgroundColor: barColor, height }]} />
                </View>
                {showLabel && <Text style={[styles.value, { color: barColor }]}>{percentage.toFixed(0)}%</Text>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { width: '100%' },
    label: { fontSize: 12, color: Colors.textSecondary, marginBottom: 6 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    track: { flex: 1, backgroundColor: Colors.borderLight, borderRadius: 4, overflow: 'hidden' },
    fill: { borderRadius: 4 },
    value: { fontSize: 14, fontWeight: '700', minWidth: 45, textAlign: 'right' },
});

export default ProgressLine;
