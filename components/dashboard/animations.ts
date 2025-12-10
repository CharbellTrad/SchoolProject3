/**
 * Dashboard Animation Utilities
 * Reusable animation configurations and helpers for the dashboard redesign
 */
import { Animated, Easing } from 'react-native';

// ==================== ANIMATION CONFIGS ====================

/**
 * Spring configuration for natural motion
 */
export const SPRING_CONFIG = {
    tension: 100,
    friction: 10,
    useNativeDriver: true,
};

/**
 * Duration constants for consistent timing
 */
export const DURATIONS = {
    fast: 150,
    normal: 250,
    slow: 400,
    stagger: 50, // Delay between staggered items
};

// ==================== FADE ANIMATIONS ====================

/**
 * Fade in animation
 */
export const fadeIn = (
    animValue: Animated.Value,
    duration = DURATIONS.normal,
    delay = 0
): Animated.CompositeAnimation => {
    return Animated.timing(animValue, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
    });
};

/**
 * Fade out animation
 */
export const fadeOut = (
    animValue: Animated.Value,
    duration = DURATIONS.normal
): Animated.CompositeAnimation => {
    return Animated.timing(animValue, {
        toValue: 0,
        duration,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
    });
};

// ==================== SLIDE ANIMATIONS ====================

/**
 * Slide up and fade in animation (entry effect)
 */
export const slideUpFadeIn = (
    translateY: Animated.Value,
    opacity: Animated.Value,
    duration = DURATIONS.normal,
    delay = 0
): Animated.CompositeAnimation => {
    return Animated.parallel([
        Animated.timing(translateY, {
            toValue: 0,
            duration,
            delay,
            easing: Easing.out(Easing.back(1.1)),
            useNativeDriver: true,
        }),
        Animated.timing(opacity, {
            toValue: 1,
            duration,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }),
    ]);
};

// ==================== SCALE ANIMATIONS ====================

/**
 * Press scale animation (scale down and back)
 */
export const createPressAnimation = (scaleValue: Animated.Value) => ({
    onPressIn: () => {
        Animated.spring(scaleValue, {
            toValue: 0.96,
            ...SPRING_CONFIG,
        }).start();
    },
    onPressOut: () => {
        Animated.spring(scaleValue, {
            toValue: 1,
            ...SPRING_CONFIG,
        }).start();
    },
});

/**
 * Pulse animation (subtle breathing effect)
 */
export const createPulseAnimation = (
    scaleValue: Animated.Value,
    minScale = 0.98,
    maxScale = 1.02
): Animated.CompositeAnimation => {
    return Animated.loop(
        Animated.sequence([
            Animated.timing(scaleValue, {
                toValue: maxScale,
                duration: 1000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(scaleValue, {
                toValue: minScale,
                duration: 1000,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true,
            }),
        ])
    );
};

// ==================== STAGGERED ANIMATIONS ====================

/**
 * Create staggered animation for list items
 */
export const createStaggeredAnimation = (
    items: { translateY: Animated.Value; opacity: Animated.Value }[],
    staggerDelay = DURATIONS.stagger
): Animated.CompositeAnimation => {
    return Animated.stagger(
        staggerDelay,
        items.map((item) =>
            Animated.parallel([
                Animated.timing(item.translateY, {
                    toValue: 0,
                    duration: DURATIONS.normal,
                    easing: Easing.out(Easing.back(1.1)),
                    useNativeDriver: true,
                }),
                Animated.timing(item.opacity, {
                    toValue: 1,
                    duration: DURATIONS.normal,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ])
        )
    );
};

// ==================== SHIMMER ANIMATION ====================

/**
 * Create shimmer animation for skeleton loading
 */
export const createShimmerAnimation = (
    translateX: Animated.Value,
    width: number
): Animated.CompositeAnimation => {
    return Animated.loop(
        Animated.timing(translateX, {
            toValue: width,
            duration: 1200,
            easing: Easing.linear,
            useNativeDriver: true,
        })
    );
};

/**
 * Create enhanced diagonal shimmer animation for skeleton loading
 * Longer duration (1.8s) with smooth ease-in-out for premium feel
 */
export const createDiagonalShimmerAnimation = (
    translateX: Animated.Value,
    width: number
): Animated.CompositeAnimation => {
    return Animated.loop(
        Animated.timing(translateX, {
            toValue: width * 2,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
        })
    );
};

/**
 * Create fade transition animation for skeleton → content
 */
export const createFadeTransition = (
    opacity: Animated.Value,
    duration = 300
): Animated.CompositeAnimation => {
    return Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
    });
};

// ==================== COUNTER ANIMATION ====================

/**
 * Animate a number from start to end value
 * Returns a cleanup function
 */
export const animateCounter = (
    startValue: number,
    endValue: number,
    duration: number,
    onUpdate: (value: number) => void,
    onComplete?: () => void
): (() => void) => {
    const startTime = Date.now();
    let animationFrame: number;

    const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const eased = 1 - Math.pow(1 - progress, 3);
        const currentValue = Math.round(startValue + (endValue - startValue) * eased);

        onUpdate(currentValue);

        if (progress < 1) {
            animationFrame = requestAnimationFrame(animate);
        } else {
            onComplete?.();
        }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
        if (animationFrame) {
            cancelAnimationFrame(animationFrame);
        }
    };
};

// ==================== TAB INDICATOR ANIMATION ====================

/**
 * Animate tab indicator position
 */
export const animateTabIndicator = (
    position: Animated.Value,
    toValue: number,
    width: Animated.Value,
    toWidth: number
): Animated.CompositeAnimation => {
    return Animated.parallel([
        Animated.spring(position, {
            toValue,
            tension: 120,
            friction: 12,
            useNativeDriver: true,
        }),
        Animated.spring(width, {
            toValue: toWidth,
            tension: 120,
            friction: 12,
            useNativeDriver: false, // width can't use native driver
        }),
    ]);
};

// ==================== GLOW ANIMATION ====================

/**
 * Create glow/highlight animation for new data
 */
export const createGlowAnimation = (
    opacity: Animated.Value
): Animated.CompositeAnimation => {
    return Animated.sequence([
        Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }),
        Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }),
    ]);
};

export default {
    SPRING_CONFIG,
    DURATIONS,
    fadeIn,
    fadeOut,
    slideUpFadeIn,
    createPressAnimation,
    createPulseAnimation,
    createStaggeredAnimation,
    createShimmerAnimation,
    createDiagonalShimmerAnimation,
    createFadeTransition,
    animateCounter,
    animateTabIndicator,
    createGlowAnimation,
};
