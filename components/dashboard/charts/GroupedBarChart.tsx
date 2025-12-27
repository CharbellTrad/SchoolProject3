/**
 * GroupedBarChart - Interactive dual-axis bar chart
 * Features: Touch for tooltips, animated entry, dual axis
 * Left Y-axis: Promedio (0-20), Right Y-axis: Aprobación (0-100%)
 */
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import Colors from '../../../constants/Colors';

export interface GroupedBarItem {
    label: string;
    value1: number;  // Promedio (0-20)
    value2: number;  // Aprobación (0-100%)
    fullLabel?: string; // Full section name for tooltip
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
    interactive?: boolean;
    onBarPress?: (item: GroupedBarItem, index: number) => void;
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
    interactive = true,
    onBarPress,
}) => {
    const [containerWidth, setContainerWidth] = useState(0);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const scale = useSharedValue(1);

    const onLayout = (event: LayoutChangeEvent) => {
        setContainerWidth(event.nativeEvent.layout.width);
    };

    // Both bars use the same internal scale (0-20)
    const scaleRatio = maxValue1 / maxValue2;
    const chartWidth = containerWidth > 0 ? containerWidth - 75 : undefined;

    const handleBarPress = (item: GroupedBarItem, index: number) => {
        if (!interactive) return;
        setSelectedIndex(selectedIndex === index ? null : index);
        onBarPress?.(item, index);
        scale.value = withSpring(1.02, { damping: 15, stiffness: 200 }, () => {
            scale.value = withSpring(1, { damping: 15, stiffness: 150 });
        });
    };

    const containerStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const barData = data.flatMap((item, index) => [
        {
            value: item.value1,
            frontColor: selectedIndex === index ? value1Color : value1Color + 'CC',
            gradientColor: value1Color + 'BB',
            spacing: 6,
            label: '',
            onPress: () => handleBarPress(item, index),
            topLabelComponent: () => (
                <Text style={[styles.topLabel, { color: value1Color }]}>
                    {typeof item.value1 === 'number' ? item.value1.toFixed(1) : '-'}
                </Text>
            ),
        },
        {
            value: item.value2 * scaleRatio,
            frontColor: selectedIndex === index ? value2Color : value2Color + 'CC',
            gradientColor: value2Color + 'BB',
            spacing: index < data.length - 1 ? 26 : 8,
            onPress: () => handleBarPress(item, index),
            labelComponent: () => (
                <Text style={styles.centerLabel}>{item.label}</Text>
            ),
            topLabelComponent: () => (
                <Text style={[styles.topLabel, { color: value2Color }]}>
                    {typeof item.value2 === 'number' ? item.value2.toFixed(0) : '-'}%
                </Text>
            ),
        },
    ]);

    return (
        <Animated.View style={[styles.container, containerStyle]} onLayout={onLayout}>
            {/* Interactive Legend */}
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

            {/* Selected Section Tooltip */}
            {selectedIndex !== null && data[selectedIndex] && (
                <View style={styles.tooltip}>
                    <Text style={styles.tooltipTitle}>
                        {data[selectedIndex].fullLabel || data[selectedIndex].label}
                    </Text>
                    <View style={styles.tooltipRow}>
                        <View style={[styles.tooltipDot, { backgroundColor: value1Color }]} />
                        <Text style={styles.tooltipLabel}>Promedio:</Text>
                        <Text style={[styles.tooltipValue, { color: value1Color }]}>
                            {typeof data[selectedIndex].value1 === 'number'
                                ? data[selectedIndex].value1.toFixed(1)
                                : '-'}
                        </Text>
                    </View>
                    <View style={styles.tooltipRow}>
                        <View style={[styles.tooltipDot, { backgroundColor: value2Color }]} />
                        <Text style={styles.tooltipLabel}>Aprobación:</Text>
                        <Text style={[styles.tooltipValue, { color: value2Color }]}>
                            {typeof data[selectedIndex].value2 === 'number'
                                ? data[selectedIndex].value2.toFixed(0)
                                : '-'}%
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.tooltipClose}
                        onPress={() => setSelectedIndex(null)}
                    >
                        <Text style={styles.tooltipCloseText}>✕</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.chartRow}>
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
                        yAxisLabelTexts={['0', '5', '10', '15', '20']}
                        yAxisTextStyle={[styles.yAxisText, { color: value1Color }]}
                        yAxisThickness={1}
                        yAxisColor={value1Color + '80'}
                        yAxisLabelWidth={30}
                        secondaryYAxis={{
                            maxValue: maxValue1,
                            noOfSections: 4,
                            yAxisLabelTexts: ['0%', '25%', '50%', '75%', '100%'],
                            yAxisTextStyle: { fontSize: 10, color: value2Color, fontWeight: '500' },
                            yAxisColor: value2Color + '80',
                            yAxisThickness: 1,
                            yAxisLabelWidth: 30,
                        }}
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
        </Animated.View>
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

    // Tooltip
    tooltip: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 12,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    tooltipTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    tooltipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginVertical: 4,
    },
    tooltipDot: { width: 10, height: 10, borderRadius: 5 },
    tooltipLabel: { fontSize: 12, color: Colors.textSecondary, flex: 1 },
    tooltipValue: { fontSize: 14, fontWeight: '700' },
    tooltipClose: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 4,
    },
    tooltipCloseText: { fontSize: 14, color: Colors.textTertiary },

    chartRow: { flexDirection: 'row' },
    yAxisText: { fontSize: 10, fontWeight: '500' },
    topLabel: { fontSize: 10, fontWeight: '700', textAlign: 'center' },
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
