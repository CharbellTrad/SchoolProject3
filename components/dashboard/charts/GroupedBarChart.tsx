/**
 * GroupedBarChart - Dual-axis grouped bar chart
 * Left Y-axis: Promedio (0-20)
 * Right Y-axis: Aprobación (0-100%)
 * 
 * Both bars normalized to 0-20 scale internally
 * Custom labels show correct values for each axis
 */
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import Colors from '../../../constants/Colors';

export interface GroupedBarItem {
    label: string;
    value1: number;  // Promedio (0-20)
    value2: number;  // Aprobación (0-100%)
}

interface GroupedBarChartProps {
    data: GroupedBarItem[];
    value1Color?: string;
    value2Color?: string;
    value1Label?: string;
    value2Label?: string;
    maxValue1?: number;
    maxValue2?: number;
    height?: number;
}

export const GroupedBarChart: React.FC<GroupedBarChartProps> = ({
    data,
    value1Color = Colors.success,
    value2Color = Colors.primary,
    value1Label = 'Promedio',
    value2Label = 'Aprobación',
    maxValue1 = 20,
    maxValue2 = 100,
    height = 180,
}) => {
    // Track container width for responsive chart
    const [containerWidth, setContainerWidth] = useState(0);

    const onLayout = (event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
    };

    // Both bars use the same internal scale (0-20)
    // value2 (0-100) is normalized to 0-20
    const scaleRatio = maxValue1 / maxValue2; // 0.2

    // Calculate chart width (container - left axis - right axis)
    const chartWidth = containerWidth > 0 ? containerWidth - 75 : undefined;

    const barData = data.flatMap((item, index) => [
        {
            value: item.value1, // 0-20 scale
            frontColor: value1Color,
            gradientColor: value1Color + 'BB',
            spacing: 6,
            label: '',
            topLabelComponent: () => (
                <Text style={[styles.topLabel, { color: value1Color }]}>
                    {item.value1.toFixed(1)}
                </Text>
            ),
        },
        {
            value: item.value2 * scaleRatio, // Normalize 0-100 to 0-20
            frontColor: value2Color,
            gradientColor: value2Color + 'BB',
            spacing: index < data.length - 1 ? 26 : 8,
            labelComponent: () => (
                <Text style={styles.centerLabel}>{item.label}</Text>
            ),
            topLabelComponent: () => (
                <Text style={[styles.topLabel, { color: value2Color }]}>
                    {item.value2.toFixed(0)}%
                </Text>
            ),
        },
    ]);

    return (
        <View style={styles.container} onLayout={onLayout}>
            {/* Legend */}
            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: value1Color }]} />
                    <Text style={styles.legendText}>{value1Label}</Text>
                </View>
                <View style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: value2Color }]} />
                    <Text style={styles.legendText}>{value2Label}</Text>
                </View>
            </View>

            <View style={styles.chartRow}>
                {/* Chart */}
                {containerWidth > 0 && (
                    <BarChart
                        data={barData}
                        width={chartWidth}
                        barWidth={30}
                        spacing={6}
                        roundedTop
                        roundedBottom
                        showGradient
                        maxValue={maxValue1}
                        noOfSections={4}
                        // Left axis: 0-20
                        yAxisLabelTexts={['0', '5', '10', '15', '20']}
                        yAxisTextStyle={[styles.yAxisText, { color: value1Color }]}
                        yAxisThickness={1}
                        yAxisColor={value1Color + '80'}
                        yAxisLabelWidth={30}
                        // Right axis: 0-100%
                        secondaryYAxis={{
                            maxValue: maxValue1, // Same internal scale
                            noOfSections: 4,
                            yAxisLabelTexts: ['0%', '25%', '50%', '75%', '100%'],
                            yAxisTextStyle: { fontSize: 10, color: value2Color, fontWeight: '500' },
                            yAxisColor: value2Color + '80',
                            yAxisThickness: 1,
                            yAxisLabelWidth: 30,
                        }}
                        // Common
                        xAxisThickness={1}
                        xAxisColor={Colors.border}
                        isAnimated
                        animationDuration={700}
                        height={height}
                        barBorderRadius={4}
                        initialSpacing={10}
                        endSpacing={10}
                        xAxisLabelTextStyle={{ fontSize: 0 }}
                        rulesColor={Colors.border + '40'}
                        rulesType="dashed"
                    />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingVertical: 8 },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 24,
        marginBottom: 12
    },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    legendDot: { width: 12, height: 12, borderRadius: 6 },
    legendText: { fontSize: 12, color: Colors.textPrimary, fontWeight: '600' },

    chartRow: {
        flexDirection: 'row',
    },

    yAxisText: {
        fontSize: 10,
        fontWeight: '500',
    },

    topLabel: {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
    },
    centerLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: Colors.textPrimary,
        textAlign: 'center',
        marginTop: 5,
        width: 60,
        marginLeft: -25,
    },
});

export default GroupedBarChart;
