/**
 * DonutChart - Enhanced interactive circular chart
 * Features: Touch on slices, animated entry, tooltip display
 */
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import Animated, {
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';
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
    legendPosition?: 'bottom' | 'right';
    animate?: boolean;
    interactive?: boolean;
    onSliceSelect?: (item: DonutDataItem | null, index: number) => void;
    // Legend customization
    legendTextSize?: number;
    legendValueSize?: number;
    legendPercentSize?: number;
    legendItemGap?: number;
    legendItemPaddingVertical?: number;
    legendItemPaddingHorizontal?: number;
    legendBorderWidth?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
    data,
    centerValue,
    centerLabel,
    centerColor = Colors.textPrimary,
    radius = 80,
    innerRadius = 55,
    showLegend = true,
    legendPosition = 'bottom',
    animate = true,
    interactive = true,
    onSliceSelect,
    // Legend customization with defaults
    legendTextSize = 11,
    legendValueSize = 11,
    legendPercentSize = 10,
    legendItemGap = 4,
    legendItemPaddingVertical = 6,
    legendItemPaddingHorizontal = 8,
    legendBorderWidth = 3,
}) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const scale = useSharedValue(1);

    // Calculate total for percentages
    const total = data.reduce((sum, item) => sum + item.value, 0);

    // Handle slice press
    const handleSlicePress = (item: DonutDataItem, index: number) => {
        if (!interactive) return;

        const newIndex = selectedIndex === index ? null : index;
        setSelectedIndex(newIndex);
        onSliceSelect?.(newIndex !== null ? item : null, index);
    };

    // Animated container style
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // Get display values for center
    const displayValue = selectedIndex !== null
        ? data[selectedIndex].value
        : centerValue;
    const displayLabel = selectedIndex !== null
        ? data[selectedIndex].label
        : centerLabel;
    const displayColor = selectedIndex !== null
        ? data[selectedIndex].color
        : centerColor;

    // Prepare chart data with focus and fading effect
    const chartData = data.map((item, index) => {
        const isSelected = selectedIndex === index;
        const isOther = selectedIndex !== null && selectedIndex !== index;

        return {
            ...item,
            // Fade non-selected items by using a lighter color
            color: isOther ? item.color + '50' : item.color,
            focused: isSelected,
            onPress: () => handleSlicePress(item, index),
        };
    });

    return (
        <View style={[
            styles.container,
            legendPosition === 'right' && styles.containerRow
        ]}>
            <Animated.View style={animatedStyle}>
                <PieChart
                    data={chartData}
                    donut
                    sectionAutoFocus={animate}
                    focusOnPress={interactive}
                    radius={radius}
                    innerRadius={innerRadius}
                    innerCircleColor={'#fff'}
                    strokeWidth={0.5}
                    strokeColor={'#fff'}
                    centerLabelComponent={() => (
                        <View style={styles.center}>
                            {displayValue !== undefined && (
                                <Text style={[styles.centerValue, { color: displayColor, fontSize: radius * 0.35 }]}>
                                    {displayValue}
                                </Text>
                            )}
                            {displayLabel && (
                                <Text style={[styles.centerLabel, { fontSize: radius * 0.13 }]} numberOfLines={2}>
                                    {displayLabel}
                                </Text>
                            )}
                            {selectedIndex !== null && total > 0 && (
                                <Text style={[styles.percentage, { color: displayColor }]}>
                                    {((data[selectedIndex].value / total) * 100).toFixed(0)}%
                                </Text>
                            )}
                        </View>
                    )}
                />
            </Animated.View>

            {/* Legend - Odoo style with left border */}
            {showLegend && data.some(d => d.label) && (
                <View style={[
                    styles.legend,
                    { gap: legendItemGap },
                    legendPosition === 'right' && styles.legendRight
                ]}>
                    {data.filter(d => d.label).map((item, i) => {
                        const isSelected = selectedIndex === i;
                        const percentage = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;

                        return (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.legendItem,
                                    {
                                        backgroundColor: isSelected ? item.color + '30' : item.color + '15',
                                        borderLeftColor: item.color,
                                        borderLeftWidth: isSelected ? legendBorderWidth + 1 : legendBorderWidth,
                                        transform: [{ scale: isSelected ? 1.02 : 1 }],
                                        paddingVertical: legendItemPaddingVertical,
                                        paddingHorizontal: legendItemPaddingHorizontal,
                                    },
                                    isSelected && styles.legendItemSelected
                                ]}
                                onPress={() => handleSlicePress(item, i)}
                                activeOpacity={0.7}
                            >
                                <Text style={[
                                    styles.legendText,
                                    { fontSize: legendTextSize },
                                    isSelected && { fontWeight: '700', color: item.color }
                                ]} numberOfLines={1}>{item.label}</Text>
                                <Text style={[
                                    styles.legendValue,
                                    { fontSize: legendValueSize },
                                    isSelected && { color: item.color }
                                ]}>{item.value}</Text>
                                {isSelected && (
                                    <Text style={[
                                        styles.legendPercent,
                                        { color: item.color, fontSize: legendPercentSize }
                                    ]}>
                                        {percentage}%
                                    </Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    containerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    center: { alignItems: 'center', justifyContent: 'center' },
    centerValue: { fontWeight: '800' },
    centerLabel: { color: Colors.textSecondary, marginTop: 2, fontWeight: '600', maxWidth: 80, textAlign: 'center' },
    percentage: { fontSize: 11, fontWeight: '600', marginTop: 2 },

    // Total Header
    totalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
        width: '100%',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    totalLabel: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    // Legend styles
    legend: {
        flexDirection: 'column',
        gap: 4,
        marginTop: 8,
        width: '100%',
    },
    legendRight: {
        flex: 1,
        marginTop: 0,
        marginLeft: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 6,
        borderLeftWidth: 3,
    },
    legendItemSelected: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    legendText: { flex: 1, fontSize: 11, fontWeight: '500', color: Colors.textPrimary },
    legendValue: { fontSize: 11, fontWeight: '700', color: Colors.textPrimary },
    legendPercent: { fontSize: 10, fontWeight: '600', marginLeft: 4 },
});

export default DonutChart;
