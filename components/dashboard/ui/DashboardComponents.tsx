/**
 * Dashboard UI Components - Enhanced Visual Design
 * Reusable UI components for the admin dashboard with modern styling
 * Features: Glassmorphism, animations, layered shadows, improved micro-interactions
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from 'react-native';
import Colors from '../../../constants/Colors';
import {
    animateCounter,
    createPressAnimation,
    createPulseAnimation,
    createShimmerAnimation,
    DURATIONS,
    slideUpFadeIn,
} from '../animations';

// ==================== SHIMMER SKELETON ====================
interface ShimmerProps {
    width: number | string;
    height: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export const Shimmer: React.FC<ShimmerProps> = ({ width, height, borderRadius = 8, style }) => {
    const translateX = useRef(new Animated.Value(-100)).current;

    useEffect(() => {
        const animation = createShimmerAnimation(translateX, 200);
        animation.start();
        return () => animation.stop();
    }, [translateX]);

    return (
        <View style={[{ width: width as number, height, borderRadius, backgroundColor: Colors.backgroundTertiary, overflow: 'hidden' }, style]}>
            <Animated.View
                style={[
                    styles.shimmerWave,
                    {
                        transform: [{ translateX }],
                    },
                ]}
            />
        </View>
    );
};

// ==================== CARD ====================
interface CardProps {
    title?: string;
    children: React.ReactNode;
    style?: ViewStyle;
    glassmorphism?: boolean;
    animate?: boolean;
    delay?: number;
}

export const Card: React.FC<CardProps> = ({ title, children, style, glassmorphism = false, animate = true, delay = 0 }) => {
    const translateY = useRef(new Animated.Value(animate ? 20 : 0)).current;
    const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;

    useEffect(() => {
        if (animate) {
            slideUpFadeIn(translateY, opacity, DURATIONS.normal, delay).start();
        }
    }, [animate, translateY, opacity, delay]);


    return (
        <Animated.View
            style={[
                styles.card,
                glassmorphism && styles.cardGlass,
                style,
                {
                    opacity,
                    transform: [{ translateY }],
                },
            ]}
        >
            {title && (
                <View style={styles.cardTitleContainer}>
                    <View style={styles.cardTitleAccent} />
                    <Text style={styles.cardTitle}>{title}</Text>
                </View>
            )}
            {children}
        </Animated.View>
    );
};

// ==================== SEPARATOR ====================
interface SeparatorProps {
    title: string;
}

export const Separator: React.FC<SeparatorProps> = ({ title }) => (
    <View style={styles.separatorContainer}>
        <LinearGradient
            colors={[Colors.primary + '40', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.separatorLine}
        />
        <Text style={styles.separator}>{title}</Text>
    </View>
);

// ==================== STAT CARD ====================
interface StatCardProps {
    value: number | string;
    label: string;
    color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ value, label, color = Colors.primary }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const pressHandlers = createPressAnimation(scaleValue);

    return (
        <Pressable {...pressHandlers} style={{ flex: 1 }}>
            <Animated.View style={[styles.statCard, { transform: [{ scale: scaleValue }] }]}>
                <LinearGradient
                    colors={[color + '15', color + '05']}
                    style={styles.statCardGradient}
                />
                <View style={[styles.statCardBorder, { backgroundColor: color }]} />
                <Text style={styles.statValue}>{value}</Text>
                <Text style={styles.statLabel}>{label}</Text>
            </Animated.View>
        </Pressable>
    );
};

// ==================== KPI CARD ====================
interface KPICardProps {
    icon: keyof typeof Ionicons.glyphMap;
    value: number | string;
    label: string;
    color: string;
    loading?: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ icon, value, label, color, loading }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const glowOpacity = useRef(new Animated.Value(0)).current;
    const [displayValue, setDisplayValue] = useState<number | string>(0);
    const prevValueRef = useRef<number | string>(0);
    const pressHandlers = createPressAnimation(scaleValue);

    // Count-up animation when value changes
    useEffect(() => {
        if (loading) return;

        const numValue = typeof value === 'number' ? value : parseInt(value as string, 10);
        const prevNum = typeof prevValueRef.current === 'number'
            ? prevValueRef.current
            : parseInt(prevValueRef.current as string, 10) || 0;

        if (!isNaN(numValue) && numValue !== prevNum) {
            const cleanup = animateCounter(prevNum, numValue, 600, setDisplayValue);
            prevValueRef.current = numValue;
            return cleanup;
        } else if (isNaN(numValue)) {
            setDisplayValue(value);
            prevValueRef.current = value;
        }
    }, [value, loading]);

    // Glow animation on load
    useEffect(() => {
        if (!loading && value) {
            Animated.sequence([
                Animated.timing(glowOpacity, { toValue: 0.6, duration: 200, useNativeDriver: true }),
                Animated.timing(glowOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
            ]).start();
        }
    }, [loading, value, glowOpacity]);

    return (
        <Pressable {...pressHandlers} style={{ flex: 1 }}>
            <Animated.View style={[styles.kpiCardShadow, { transform: [{ scale: scaleValue }] }]}>
                <View style={[styles.kpiCardContent, { alignItems: 'flex-start', paddingHorizontal: 20, justifyContent: 'center' }]}>
                    {/* Glow overlay */}
                    <Animated.View style={[styles.kpiGlow, { backgroundColor: color, opacity: glowOpacity }]} />

                    {/* Backdrop Icon - Space Saver */}
                    <View style={styles.kpiBackdropIcon}>
                        <Ionicons name={icon} size={70} color={color} />
                    </View>

                    {/* Value with loading state */}
                    {loading ? (
                        <Shimmer width={60} height={32} borderRadius={8} style={{ marginBottom: 4 }} />
                    ) : (
                        <Text style={styles.kpiValue}>{displayValue}</Text>
                    )}

                    {/* Label */}
                    <Text style={styles.kpiLabel}>{label}</Text>

                    {/* Mini trend indicator */}
                    <View style={[styles.kpiTrend, { backgroundColor: color + '15', marginTop: 5 }]}>
                        <View style={[styles.kpiTrendBar, { backgroundColor: color, width: '60%' }]} />
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
};

// ==================== EMPTY STATE ====================
interface EmptyProps {
    message?: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const Empty: React.FC<EmptyProps> = ({ message = 'Sin datos disponibles', icon = 'analytics-outline' }) => {
    const opacity = useRef(new Animated.Value(0)).current;
    const scale = useRef(new Animated.Value(0.9)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, tension: 100, friction: 10, useNativeDriver: true }),
        ]).start();
    }, [opacity, scale]);

    return (
        <Animated.View style={[styles.empty, { opacity, transform: [{ scale }] }]}>
            <View style={styles.emptyIconContainer}>
                <Ionicons name={icon} size={48} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>{message}</Text>
        </Animated.View>
    );
};

// ==================== INFO NOTE ====================
interface InfoNoteProps {
    message: string;
}

export const InfoNote: React.FC<InfoNoteProps> = ({ message }) => (
    <View style={styles.infoNote}>
        <View style={styles.infoIconContainer}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.info} />
        </View>
        <Text style={styles.infoText}>{message}</Text>
    </View>
);

// ==================== BADGE ====================
interface BadgeProps {
    value: number | string;
    color?: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

export const Badge: React.FC<BadgeProps> = ({ value, color = Colors.primary, icon }) => (
    <View style={[styles.badge, { backgroundColor: color + '12' }]}>
        {icon && <Ionicons name={icon} size={11} color={color} />}
        <Text style={[styles.badgeText, { color }]}>{value}</Text>
    </View>
);

// ==================== ANIMATED BADGE (with pulse) ====================
interface AnimatedBadgeProps {
    value: string;
    color?: string;
    pulse?: boolean;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({ value, color = Colors.success, pulse = false }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (pulse) {
            const animation = createPulseAnimation(scaleValue, 1, 1.03);
            animation.start();
            return () => animation.stop();
        }
    }, [pulse, scaleValue]);

    return (
        <Animated.View style={[styles.animatedBadge, { backgroundColor: color + '25', transform: [{ scale: scaleValue }] }]}>
            <View style={[styles.animatedBadgeDot, { backgroundColor: color }]} />
            <Text style={[styles.animatedBadgeText, { color }]}>{value}</Text>
        </Animated.View>
    );
};

// ==================== LIST ROW ====================
interface ListRowProps {
    children: React.ReactNode;
    borderBottom?: boolean;
    onPress?: () => void;
}

export const ListRow: React.FC<ListRowProps> = ({ children, borderBottom = true, onPress }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const pressHandlers = onPress ? createPressAnimation(scaleValue) : {};

    const content = (
        <Animated.View style={[styles.listRow, borderBottom && styles.listRowBorder, { transform: [{ scale: scaleValue }] }]}>
            {children}
        </Animated.View>
    );

    if (onPress) {
        return <Pressable onPress={onPress} {...pressHandlers}>{content}</Pressable>;
    }
    return content;
};

// ==================== STUDENT AVATAR ====================
interface StudentAvatarProps {
    name: string;
    color?: string;
    size?: number;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({ name, color = Colors.primary, size = 40 }) => (
    <View style={[styles.avatarOuter, { width: size + 4, height: size + 4, borderColor: color + '30' }]}>
        <View style={[styles.avatar, { width: size, height: size, backgroundColor: color + '15' }]}>
            <Text style={[styles.avatarText, { color, fontSize: size * 0.4 }]}>{name.charAt(0).toUpperCase()}</Text>
        </View>
    </View>
);

// ==================== RANK BADGE ====================
interface RankBadgeProps {
    rank: number;
}

export const RankBadge: React.FC<RankBadgeProps> = ({ rank }) => {
    const isTop3 = rank <= 3;
    const medals = ['🥇', '🥈', '🥉'];
    const colors = [Colors.warning, Colors.textTertiary, '#cd7f32'];

    return (
        <View style={[
            styles.rankBadge,
            isTop3 && styles.rankBadgeTop,
            isTop3 && { backgroundColor: colors[rank - 1] + '20' }
        ]}>
            <Text style={[styles.rankText, isTop3 && styles.rankTextTop]}>
                {isTop3 ? medals[rank - 1] : rank}
            </Text>
        </View>
    );
};

// ==================== GLASSMORPHISM BUTTON ====================
interface GlassButtonProps {
    onPress: () => void;
    children: React.ReactNode;
    size?: number;
}

export const GlassButton: React.FC<GlassButtonProps> = ({ onPress, children, size = 44 }) => {
    const scaleValue = useRef(new Animated.Value(1)).current;
    const pressHandlers = createPressAnimation(scaleValue);

    return (
        <Pressable onPress={onPress} {...pressHandlers}>
            <Animated.View style={[
                styles.glassButton,
                { width: size, height: size, transform: [{ scale: scaleValue }] }
            ]}>
                {children}
            </Animated.View>
        </Pressable>
    );
};

// ==================== STYLES ====================
const styles = StyleSheet.create({
    // Shimmer
    shimmerWave: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 100,
        backgroundColor: 'rgba(255,255,255,0.4)',
        transform: [{ skewX: '-20deg' }],
    },

    // Card - Enhanced with layered shadows
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    cardGlass: {
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    cardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 10,
    },
    cardTitleAccent: {
        width: 4,
        height: 20,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: Colors.textPrimary,
        letterSpacing: -0.3,
    },

    // Separator - Enhanced with gradient
    separatorContainer: {
        marginBottom: 12,
        marginTop: 8,
    },
    separatorLine: {
        height: 2,
        borderRadius: 1,
        marginBottom: 8,
    },
    separator: {
        fontSize: 13,
        fontWeight: '700',
        color: Colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // Stat Card - Enhanced
    statCard: {
        flex: 1,
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    statCardGradient: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 16,
    },
    statCardBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: Colors.textPrimary,
        fontVariant: ['tabular-nums'],
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: Colors.textSecondary,
        marginTop: 6,
        textAlign: 'center',
    },

    // KPI Card - Significantly enhanced
    kpiCardShadow: {
        flex: 1,
        minHeight: 60,
        backgroundColor: '#fff',
        borderRadius: 20,
        ...Platform.select({
            ios: {
                shadowColor: Colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    kpiCardContent: {
        flex: 1,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    kpiGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 20,
    },
    kpiBackdropIcon: {
        position: 'absolute',
        right: -10,
        bottom: -15,
        opacity: 0.25,
        transform: [{ rotate: '-10deg' }],
    },
    kpiValue: {
        marginTop: -15,
        fontSize: 20,
        fontWeight: '800',
        color: Colors.textPrimary,
        fontVariant: ['tabular-nums'],
        letterSpacing: -1,
    },
    kpiLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: Colors.textSecondary,
    },
    kpiTrend: {
        marginBottom: -10,
        width: 32,
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    kpiTrendBar: {
        height: '100%',
        borderRadius: 2,
    },

    // Empty - Enhanced
    empty: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: Colors.backgroundTertiary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 14,
        color: Colors.textTertiary,
        textAlign: 'center',
    },

    // Info Note - Enhanced
    infoNote: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: Colors.info + '08',
        padding: 14,
        borderRadius: 14,
        gap: 12,
        borderWidth: 1,
        borderColor: Colors.info + '15',
    },
    infoIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: Colors.info + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 20,
    },

    // Badge - Enhanced
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 5,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },

    // Animated Badge
    animatedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 12,
        gap: 6,
    },
    animatedBadgeDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    animatedBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },

    // List Row - Enhanced with gradient border effect
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    listRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.borderLight,
    },

    // Avatar - Enhanced with outer ring
    avatarOuter: {
        borderRadius: 14,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatar: {
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontWeight: '700',
    },

    // Rank Badge - Enhanced
    rankBadge: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: Colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rankBadgeTop: {
        ...Platform.select({
            ios: {
                shadowColor: Colors.warning,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    rankText: {
        fontSize: 14,
        fontWeight: '700',
        color: Colors.textSecondary,
    },
    rankTextTop: {
        fontSize: 18,
    },

    // Glass Button
    glassButton: {
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 2,
            },
        }),
    },
});
