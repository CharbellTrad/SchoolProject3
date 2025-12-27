/**
 * LapsosTimeline - Timeline visualization for school year periods (Lapsos)
 * Enhanced design with school year dates - matches Odoo layout
 */
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming
} from 'react-native-reanimated';

interface Props {
    currentLapso: '1' | '2' | '3' | string;
    state: 'draft' | 'active' | 'finished' | string;
    startDate?: string;
    endDate?: string;
}

const LAPSOS = [
    { id: '1', label: '1er Lapso' },
    { id: '2', label: '2do Lapso' },
    { id: '3', label: '3er Lapso' },
];

export const LapsosTimeline: React.FC<Props> = ({ currentLapso, state, startDate, endDate }) => {
    // Don't show for draft state
    if (state === 'draft') return null;

    const pulseScale = useSharedValue(1);

    useEffect(() => {
        if (state === 'active') {
            pulseScale.value = withRepeat(
                withTiming(1.15, { duration: 800 }),
                -1,
                true
            );
        }
    }, [state]);

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    const getCurrentIndex = () => {
        const idx = LAPSOS.findIndex(l => l.id === currentLapso);
        return idx >= 0 ? idx : 0;
    };

    const currentIndex = getCurrentIndex();

    // Format date for display
    const formatDate = (dateStr: string | undefined) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <View style={styles.container}>
            {/* School Year Period Info */}
            {(startDate || endDate) && (
                <View style={styles.periodInfo}>
                    <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.periodText}>
                        {startDate ? formatDate(startDate) : 'No Iniciado'} - {endDate ? formatDate(endDate) : 'No Finalizado'}
                    </Text>
                </View>
            )}

            {/* Lapsos Timeline */}
            <View style={styles.timelineContainer}>
                <View style={styles.timeline}>
                    {LAPSOS.map((lapso, index) => {
                        const isCompleted = index < currentIndex;
                        const isCurrent = index === currentIndex;
                        const isUpcoming = index > currentIndex;

                        return (
                            <View key={lapso.id} style={styles.lapsoItem}>
                                {/* Connector line (before) */}
                                {index > 0 && (
                                    <View
                                        style={[
                                            styles.connector,
                                            styles.connectorLeft,
                                            (isCompleted || isCurrent) ? styles.connectorActive : styles.connectorInactive
                                        ]}
                                    />
                                )}

                                {/* Circle indicator */}
                                <View style={styles.circleWrapper}>
                                    {/* Background to mask connector lines */}
                                    {isUpcoming && <View style={styles.circleBg} />}

                                    {isCurrent && state === 'active' ? (
                                        <>
                                            <Animated.View style={[styles.pulseBg, pulseStyle]} />
                                            <View style={[styles.circle, styles.circleCurrent]}>
                                                <Text style={styles.circleNumber}>{lapso.id}</Text>
                                            </View>
                                        </>
                                    ) : (
                                        <View
                                            style={[
                                                styles.circle,
                                                isCompleted ? styles.circleCompleted :
                                                    isCurrent ? styles.circleCurrent :
                                                        styles.circleUpcoming
                                            ]}
                                        >
                                            {isCompleted ? (
                                                <Ionicons name="checkmark" size={16} color="#fff" />
                                            ) : (
                                                <Text style={[
                                                    styles.circleNumber,
                                                    isUpcoming && styles.circleNumberUpcoming
                                                ]}>{lapso.id}</Text>
                                            )}
                                        </View>
                                    )}
                                </View>

                                {/* Connector line (after) */}
                                {index < LAPSOS.length - 1 && (
                                    <View
                                        style={[
                                            styles.connector,
                                            styles.connectorRight,
                                            isCompleted ? styles.connectorActive : styles.connectorInactive
                                        ]}
                                    />
                                )}

                                {/* Label */}
                                <Text
                                    style={[
                                        styles.lapsoLabel,
                                        isCurrent && styles.lapsoLabelCurrent,
                                        isUpcoming && styles.lapsoLabelUpcoming
                                    ]}
                                >
                                    {lapso.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 16,
        paddingHorizontal: 12,
        backgroundColor: 'rgba(0,0,0,0.15)',
        borderRadius: 16,
        marginTop: 16,
    },
    periodInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginBottom: 16,
    },
    periodText: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.9)',
    },
    timelineContainer: {
        paddingHorizontal: 8,
    },
    timeline: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
    },
    lapsoItem: {
        alignItems: 'center',
        flex: 1,
        position: 'relative',
    },
    circleWrapper: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
    },
    // Solid background to mask connector lines behind circles
    circleBg: {
        position: 'absolute',
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(48, 75, 167, 1)', // Matches header gradient
    },
    pulseBg: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(52, 211, 153, 0.3)',
    },
    circle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
    },
    circleCompleted: {
        backgroundColor: '#34d399',
    },
    circleCurrent: {
        backgroundColor: '#fff',
        borderWidth: 3,
        borderColor: '#34d399',
    },
    circleUpcoming: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    circleNumber: {
        fontSize: 15,
        fontWeight: '800',
        color: '#1e40af',
    },
    circleNumberUpcoming: {
        color: 'rgba(255,255,255,0.7)',
    },
    connector: {
        position: 'absolute',
        top: 18,
        height: 3,
        width: '50%',
        zIndex: 1,
    },
    connectorLeft: {
        right: '50%',
    },
    connectorRight: {
        left: '50%',
    },
    connectorActive: {
        backgroundColor: '#34d399',
    },
    connectorInactive: {
        backgroundColor: 'rgba(255,255,255,0.25)',
    },
    lapsoLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#fff',
        marginTop: 8,
        textAlign: 'center',
    },
    lapsoLabelCurrent: {
        fontWeight: '800',
        color: '#34d399',
    },
    lapsoLabelUpcoming: {
        color: 'rgba(255,255,255,0.5)',
    },
});

export default LapsosTimeline;
