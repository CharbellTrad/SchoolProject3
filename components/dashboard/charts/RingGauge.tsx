/**
 * RingGauge - Circular progress gauge with gradient
 * Perfect for showing percentages and approval rates
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

    const data = [
        { value: percentage, color, gradientCenterColor: gradientColor || color },
        { value: remaining, color: Colors.borderLight, gradientCenterColor: Colors.border },
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
                centerLabelComponent={() => (
                    <View style={styles.center}>
                        <Text style={[styles.value, { color }]}>
                            {percentage.toFixed(0)}{showPercentSymbol ? '%' : ''}
                        </Text>
                        {label && <Text style={styles.label}>{label}</Text>}
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 12 },
    center: { alignItems: 'center', justifyContent: 'center' },
    value: { fontSize: 24, fontWeight: '800' },
    label: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});

export default RingGauge;
