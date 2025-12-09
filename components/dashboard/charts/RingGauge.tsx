/**
 * RingGauge - Enhanced circular progress
 * Features: Gradient, rounded caps, smooth animation
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import Colors from '../../../constants/Colors';

interface RingGaugeProps {
    percentage: number;
    color?: string;
    gradientColor?: string;
    label?: string;
    size?: number;
    strokeWidth?: number;
    showPercentSymbol?: boolean;
}

export const RingGauge: React.FC<RingGaugeProps> = ({
    percentage,
    color = Colors.success,
    gradientColor,
    label,
    size = 120,
    strokeWidth = 15,
    showPercentSymbol = true,
}) => {
    const radius = size / 2;
    const innerRadius = radius - strokeWidth;
    const remaining = 100 - percentage;

    // Ensure accurate representation
    const safePercentage = Math.min(Math.max(percentage, 0), 100);
    const safeRemaining = 100 - safePercentage;

    const data = [
        {
            value: safePercentage,
            color,
            gradientCenterColor: gradientColor || color,
            focused: true, // Highlights the main section
        },
        {
            value: safeRemaining,
            color: Colors.backgroundTertiary,
            gradientCenterColor: Colors.backgroundSecondary
        },
    ];

    return (
        <View style={styles.container}>
            <PieChart
                data={data}
                donut
                showGradient
                radius={radius}
                innerRadius={innerRadius}
                innerCircleColor={'#fff'}
                strokeWidth={0} // Remove jagged edges
                centerLabelComponent={() => (
                    <View style={styles.center}>
                        <Text style={[styles.value, { color, fontSize: size * 0.22 }]}>
                            {safePercentage.toFixed(0)}{showPercentSymbol ? '%' : ''}
                        </Text>
                        {label && <Text style={[styles.label, { fontSize: size * 0.09 }]}>{label}</Text>}
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 8 },
    center: { alignItems: 'center', justifyContent: 'center' },
    value: { fontWeight: '800' },
    label: { color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
});

export default RingGauge;
