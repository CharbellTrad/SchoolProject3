/**
 * DonutChart - Animated donut/ring chart with gradient
 * Uses react-native-gifted-charts for impressive visuals
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import Colors from '../../../constants/Colors';

export interface DonutDataItem {
    value: number;
    color: string;
    gradientCenterColor?: string;
    label?: string;
    text?: string;
}

interface DonutChartProps {
    data: DonutDataItem[];
    centerValue?: string | number;
    centerLabel?: string;
    centerColor?: string;
    radius?: number;
    innerRadius?: number;
    showLegend?: boolean;
    animate?: boolean;
}

export const DonutChart: React.FC<DonutChartProps> = ({
    data,
    centerValue,
    centerLabel,
    centerColor = Colors.textPrimary,
    radius = 80,
    innerRadius = 55,
    showLegend = true,
    animate = true,
}) => {
    const hasCenter = centerValue !== undefined || centerLabel !== undefined;

    return (
        <View style={styles.container}>
            <PieChart
                data={data}
                donut
                showGradient
                sectionAutoFocus={animate}
                radius={radius}
                innerRadius={innerRadius}
                innerCircleColor={'#fff'}
                centerLabelComponent={hasCenter ? () => (
                    <View style={styles.center}>
                        {centerValue !== undefined && (
                            <Text style={[styles.centerValue, { color: centerColor }]}>{centerValue}</Text>
                        )}
                        {centerLabel && (
                            <Text style={styles.centerLabel}>{centerLabel}</Text>
                        )}
                    </View>
                ) : undefined}
            />
            {showLegend && data.some(d => d.label) && (
                <View style={styles.legend}>
                    {data.filter(d => d.label).map((item, i) => (
                        <View key={i} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                            <Text style={styles.legendText}>{item.label}: {item.value}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 12 },
    center: { alignItems: 'center', justifyContent: 'center' },
    centerValue: { fontSize: 26, fontWeight: '800' },
    centerLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
    legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 12, color: Colors.textSecondary },
});

export default DonutChart;
