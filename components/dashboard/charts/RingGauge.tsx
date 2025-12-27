/**
 * RingGauge - Enhanced circular progress with animations
 * Features: Animated entry, tap for details, gradient ring
 */
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import Colors from '../../../constants/Colors';

interface RingGaugeProps {
    percentage: number;
    color?: string;
    gradientColor?: string;
    label?: string;
    size?: number;
    strokeWidth?: number;
    showPercentSymbol?: boolean;
    interactive?: boolean;
    details?: {
        total?: number;
        approved?: number;
        failed?: number;
    };
}

export const RingGauge: React.FC<RingGaugeProps> = ({
    percentage,
    color = Colors.success,
    gradientColor,
    label,
    size = 120,
    strokeWidth = 15,
    showPercentSymbol = true,
    interactive = true,
    details,
}) => {
    const [showDetails, setShowDetails] = useState(false);
    const radius = size / 2;
    const innerRadius = radius - strokeWidth;

    // Animation values
    const animatedPercent = useSharedValue(0);
    const scale = useSharedValue(0.9);
    const opacity = useSharedValue(0);

    useEffect(() => {
        // Animate on mount
        opacity.value = withTiming(1, { duration: 300 });
        scale.value = withSpring(1, { damping: 12, stiffness: 100 });
        animatedPercent.value = withDelay(200, withTiming(percentage, { duration: 800 }));
    }, [percentage]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    // Ensure accurate representation
    const safePercentage = Math.min(Math.max(percentage, 0), 100);
    const safeRemaining = 100 - safePercentage;

    const data = [
        {
            value: safePercentage,
            color,
            gradientCenterColor: gradientColor || color,
            focused: true,
        },
        {
            value: safeRemaining,
            color: Colors.backgroundTertiary,
            gradientCenterColor: Colors.backgroundSecondary
        },
    ];

    const handlePress = () => {
        if (interactive && details) {
            setShowDetails(true);
        }
    };

    return (
        <>
            <TouchableOpacity
                activeOpacity={interactive ? 0.8 : 1}
                onPress={handlePress}
                disabled={!interactive || !details}
            >
                <Animated.View style={[styles.container, containerStyle]}>
                    <PieChart
                        data={data}
                        donut
                        showGradient
                        radius={radius}
                        innerRadius={innerRadius}
                        innerCircleColor={'#fff'}
                        strokeWidth={0}
                        centerLabelComponent={() => (
                            <View style={styles.center}>
                                <Text style={[styles.value, { color, fontSize: size * 0.24 }]}>
                                    {safePercentage.toFixed(0)}{showPercentSymbol ? '%' : ''}
                                </Text>
                                {label && <Text style={[styles.label, { fontSize: size * 0.09 }]}>{label}</Text>}
                                {interactive && details && (
                                    <Text style={styles.tapHint}>Tap para detalles</Text>
                                )}
                            </View>
                        )}
                    />
                </Animated.View>
            </TouchableOpacity>

            {/* Details Modal */}
            <Modal
                visible={showDetails}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDetails(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setShowDetails(false)}>
                    <View style={[styles.modalContent, { borderColor: color }]}>
                        <View style={[styles.modalHeader, { backgroundColor: color + '15' }]}>
                            <Text style={[styles.modalTitle, { color }]}>Desglose de Aprobación</Text>
                        </View>
                        <View style={styles.modalBody}>
                            {details?.total !== undefined && (
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Total Estudiantes</Text>
                                    <Text style={styles.modalValue}>{details.total}</Text>
                                </View>
                            )}
                            {details?.approved !== undefined && (
                                <View style={styles.modalRow}>
                                    <Text style={styles.modalLabel}>Aprobados</Text>
                                    <Text style={[styles.modalValue, { color: Colors.success }]}>{details.approved}</Text>
                                </View>
                            )}
                            {details?.failed !== undefined && (
                                <View style={[styles.modalRow, { borderBottomWidth: 0 }]}>
                                    <Text style={styles.modalLabel}>Reprobados</Text>
                                    <Text style={[styles.modalValue, { color: Colors.error }]}>{details.failed}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </Pressable>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    container: { alignItems: 'center', paddingVertical: 8 },
    center: { alignItems: 'center', justifyContent: 'center' },
    value: { fontWeight: '800' },
    label: { color: Colors.textSecondary, marginTop: 2, fontWeight: '600' },
    tapHint: { fontSize: 9, color: Colors.textTertiary, marginTop: 4 },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        width: '80%',
        maxWidth: 300,
        overflow: 'hidden',
        borderWidth: 2,
    },
    modalHeader: {
        padding: 16,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    modalBody: {
        padding: 16,
    },
    modalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },
    modalLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    modalValue: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
});

export default RingGauge;
