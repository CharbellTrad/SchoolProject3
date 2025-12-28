import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, G, Path } from 'react-native-svg';

interface DataItem {
    value: number;
    label: string;
    color: string;
    icon?: string;
}

interface PolarAreaChartProps {
    data: DataItem[];
    size?: number;
    interactive?: boolean;
    totalLabel?: string;
}

export const PolarAreaChart: React.FC<PolarAreaChartProps> = ({
    data,
    size = 140,
    interactive = true,
    totalLabel = 'secciones en total',
}) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const maxValue = Math.max(...data.map(d => d.value));

    if (!data.length || total === 0) {
        return (
            <View style={[styles.container, { height: size }]}>
                <Text style={styles.noData}>Sin datos</Text>
            </View>
        );
    }

    const centerX = size / 2;
    const centerY = size / 2;
    const maxRadius = (size / 2) - 5;
    const anglePerSlice = (2 * Math.PI) / data.length;
    const startAngle = -Math.PI / 2;

    const createPolarPath = (index: number, value: number) => {
        const radius = (value / maxValue) * maxRadius;
        const angle1 = startAngle + (index * anglePerSlice);
        const angle2 = startAngle + ((index + 1) * anglePerSlice);

        const x1 = centerX + radius * Math.cos(angle1);
        const y1 = centerY + radius * Math.sin(angle1);
        const x2 = centerX + radius * Math.cos(angle2);
        const y2 = centerY + radius * Math.sin(angle2);

        const largeArc = anglePerSlice > Math.PI ? 1 : 0;
        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            {/* Chart - NO white center */}
            <View style={{ width: size, height: size }}>
                <Svg width={size} height={size}>
                    {[0.33, 0.66, 1].map((ratio, i) => (
                        <Circle
                            key={i}
                            cx={centerX}
                            cy={centerY}
                            r={maxRadius * ratio}
                            stroke={Colors.borderDark}
                            strokeWidth={2}
                            fill="none"
                            opacity={0.3}
                        />
                    ))}

                    {data.map((item, index) => {
                        const isSelected = selectedIndex === index;
                        const isOther = selectedIndex !== null && selectedIndex !== index;
                        return (
                            <G key={index}>
                                <Path
                                    d={createPolarPath(index, item.value)}
                                    fill={item.color}
                                    opacity={isOther ? 0.3 : isSelected ? 1 : 0.85}
                                    stroke={isSelected ? item.color : '#fff'}
                                    strokeWidth={0.5}
                                    onPress={interactive ? () => setSelectedIndex(isSelected ? null : index) : undefined}
                                />
                            </G>
                        );
                    })}
                </Svg>
            </View>

            {/* Total Header - Odoo style - shows selected item or total */}
            <View style={[
                styles.totalHeader,
                selectedIndex !== null && { borderBottomColor: data[selectedIndex].color }
            ]}>
                <Ionicons
                    name={selectedIndex !== null ? 'radio-button-on' : 'business-outline'}
                    size={18}
                    color={selectedIndex !== null ? data[selectedIndex].color : Colors.info}
                />
                <Text style={[
                    styles.totalValue,
                    selectedIndex !== null && { color: data[selectedIndex].color }
                ]}>
                    {selectedIndex !== null ? data[selectedIndex].value : total}
                </Text>
                <Text style={styles.totalLabel}>
                    {selectedIndex !== null ? data[selectedIndex].label : totalLabel}
                </Text>
            </View>

            {/* Legend - Odoo style with left border */}
            <View style={styles.legend}>
                {data.map((item, index) => {
                    const isSelected = selectedIndex === index;
                    const percentage = Math.round((item.value / total) * 100);

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.legendItem,
                                {
                                    backgroundColor: isSelected ? item.color + '30' : item.color + '15',
                                    borderLeftColor: item.color,
                                    borderLeftWidth: isSelected ? 4 : 3,
                                    transform: [{ scale: isSelected ? 1.02 : 1 }]
                                },
                                isSelected && styles.legendItemSelected
                            ]}
                            onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.legendLabel,
                                isSelected && { fontWeight: '700', color: item.color }
                            ]} numberOfLines={1}>{item.label}</Text>
                            <Text style={[
                                styles.legendValue,
                                isSelected && { color: item.color }
                            ]}>{item.value}</Text>
                            {isSelected && (
                                <Text style={[styles.legendPercent, { color: item.color }]}>
                                    {percentage}%
                                </Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    noData: {
        color: Colors.textSecondary,
        fontSize: 12,
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
    totalValue: {
        fontSize: 14,
        fontWeight: '800',
        color: Colors.textPrimary,
    },
    totalLabel: {
        fontSize: 10,
        color: Colors.textSecondary,
    },
    legend: {
        flexDirection: 'column',
        gap: 4,
        marginTop: 8,
        width: '100%',
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
    legendLabel: {
        flex: 1,
        fontSize: 11,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    legendValue: {
        fontSize: 11,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    legendPercent: {
        fontSize: 10,
        fontWeight: '600',
        marginLeft: 4
    },
});

export default PolarAreaChart;
