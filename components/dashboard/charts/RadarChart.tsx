import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Svg, { Circle, Line, Polygon } from 'react-native-svg';

interface DataItem {
    value: number;
    label: string;
    color: string;
}

interface RadarChartProps {
    data: DataItem[];
    size?: number;
    interactive?: boolean;
    totalLabel?: string;
}

export const RadarChart: React.FC<RadarChartProps> = ({
    data,
    size = 140,
    interactive = true,
    totalLabel = 'profesores en total',
}) => {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const maxValue = Math.max(...data.map(d => d.value), 1);

    if (!data.length || total === 0) {
        return (
            <View style={[styles.container, { height: size }]}>
                <Text style={styles.noData}>Sin datos</Text>
            </View>
        );
    }

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size / 2) - 20;
    const angleStep = (2 * Math.PI) / data.length;
    const startAngle = -Math.PI / 2;

    const dataPoints = data.map((item, index) => {
        const angle = startAngle + (index * angleStep);
        const valueRadius = (item.value / maxValue) * radius;
        return {
            x: centerX + valueRadius * Math.cos(angle),
            y: centerY + valueRadius * Math.sin(angle),
        };
    });

    const polygonPoints = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    const axisPoints = data.map((_, index) => {
        const angle = startAngle + (index * angleStep);
        return {
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle),
        };
    });

    return (
        <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
            {/* Chart */}
            <View style={{ width: size, height: size }}>
                <Svg width={size} height={size}>
                    {[0.33, 0.66, 1].map((ratio, i) => (
                        <Circle
                            key={i}
                            cx={centerX}
                            cy={centerY}
                            r={radius * ratio}
                            stroke={Colors.borderDark}
                            strokeWidth={2}
                            fill="none"
                            opacity={0.3}
                        />
                    ))}

                    {axisPoints.map((point, index) => (
                        <Line
                            key={index}
                            x1={centerX}
                            y1={centerY}
                            x2={point.x}
                            y2={point.y}
                            stroke={Colors.borderDark}
                            strokeWidth={2}
                            opacity={0.5}
                        />
                    ))}

                    <Polygon
                        points={polygonPoints}
                        fill={selectedIndex !== null ? `${data[selectedIndex].color}25` : 'rgba(79, 70, 229, 0.25)'}
                        stroke={selectedIndex !== null ? data[selectedIndex].color : '#4F46E5'}
                        strokeWidth={2}
                        opacity={selectedIndex !== null ? 0.6 : 1}
                    />

                    {dataPoints.map((point, index) => {
                        const isSelected = selectedIndex === index;
                        const isOther = selectedIndex !== null && selectedIndex !== index;
                        return (
                            <Circle
                                key={index}
                                cx={point.x}
                                cy={point.y}
                                r={isSelected ? 12 : 8}
                                fill={data[index].color}
                                stroke={isSelected ? '#fff' : '#fff'}
                                strokeWidth={isSelected ? 3 : 2}
                                opacity={isOther ? 0.4 : 1}
                                onPress={interactive ? () => setSelectedIndex(selectedIndex === index ? null : index) : undefined}
                            />
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
                    name={selectedIndex !== null ? 'radio-button-on' : 'person-outline'}
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
        alignItems: 'center', marginTop: -7
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

export default RadarChart;
