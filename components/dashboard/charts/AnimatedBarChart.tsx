/**
 * AnimatedBarChart - Animated bar chart with rounded corners and gradients
 * Uses react-native-gifted-charts for impressive visuals
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import Colors from '../../../constants/Colors';

export interface BarDataItem {
    value: number;
    label?: string;
    frontColor?: string;
    gradientColor?: string;
    topLabelComponent?: () => React.ReactNode;
}

interface AnimatedBarChartProps {
    data: BarDataItem[];
    maxValue?: number;
    barWidth?: number;
    spacing?: number;
    showValuesOnTop?: boolean;
    height?: number;
    noOfSections?: number;
    yAxisSuffix?: string;
}

export const AnimatedBarChart: React.FC<AnimatedBarChartProps> = ({
    data,
    maxValue = 100,
    barWidth = 32,
    spacing = 18,
    showValuesOnTop = true,
    height = 180,
    noOfSections = 4,
    yAxisSuffix = '%',
}) => {
    // Add top label component if showValuesOnTop
    const enhancedData = showValuesOnTop ? data.map(item => ({
        ...item,
        topLabelComponent: item.topLabelComponent || (() => (
            <Text style={styles.topLabel}>{item.value.toFixed(0)}{yAxisSuffix}</Text>
        )),
    })) : data;

    return (
        <View style={styles.container}>
            <BarChart
                data={enhancedData}
                barWidth={barWidth}
                spacing={spacing}
                roundedTop
                roundedBottom
                hideRules
                xAxisThickness={1}
                yAxisThickness={0}
                xAxisColor={Colors.border}
                yAxisTextStyle={styles.yAxisText}
                xAxisLabelTextStyle={styles.xAxisLabel}
                noOfSections={noOfSections}
                maxValue={maxValue}
                isAnimated
                animationDuration={800}
                showGradient
                frontColor={Colors.primary}
                gradientColor={'#60a5fa'}
                height={height}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { paddingVertical: 8, paddingLeft: 8 },
    topLabel: { fontSize: 10, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
    yAxisText: { color: Colors.textSecondary, fontSize: 10 },
    xAxisLabel: { color: Colors.textSecondary, fontSize: 9, marginTop: 4 },
});

export default AnimatedBarChart;
