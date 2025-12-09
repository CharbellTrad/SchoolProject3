/**
 * DonutChart - Enhanced circular chart
 * Features: Animated entry, flexible legend
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
                strokeWidth={2}
                strokeColor={'#fff'}
                centerLabelComponent={hasCenter ? () => (
                    <View style={styles.center}>
                        {centerValue !== undefined && (
                            <Text style={[styles.centerValue, { color: centerColor, fontSize: radius * 0.35 }]}>
                                {centerValue}
                            </Text>
                        )}
                        {centerLabel && (
                            <Text style={[styles.centerLabel, { fontSize: radius * 0.15 }]}>{centerLabel}</Text>
                        )}
                    </View>
                ) : undefined}
            />
            {showLegend && data.some(d => d.label) && (
                <View style={styles.legend}>
                    {data.filter(d => d.label).map((item, i) => (
                        <View key={i} style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                            <Text style={styles.legendText}>{item.label}</Text>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 8 },
    center: { alignItems: 'center', justifyContent: 'center' },
    centerValue: { fontWeight: '800' },
    centerLabel: { color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
    legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500' },
});

export default DonutChart;
