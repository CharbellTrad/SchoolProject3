/**
 * DrawerMenuItem Component
 * Individual menu item with icon, label, optional badge including disabled state
 */

import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import type { MenuIcon } from '../../constants/drawerMenu';

interface DrawerMenuItemProps {
    label: string;
    icon: MenuIcon;
    isActive?: boolean;
    disabled?: boolean;
    badge?: number;
    onPress: () => void;
    indentLevel?: number;
}

export const DrawerMenuItem: React.FC<DrawerMenuItemProps> = ({
    label,
    icon,
    isActive = false,
    disabled = false,
    badge,
    onPress,
    indentLevel = 0,
}) => {
    const handlePress = () => {
        if (!disabled) {
            onPress();
        }
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                isActive && styles.containerActive,
                disabled && styles.containerDisabled,
                { paddingLeft: 16 + indentLevel * 16 },
            ]}
            onPress={handlePress}
            activeOpacity={disabled ? 1 : 0.7}
        >
            <View style={[styles.iconContainer, isActive && styles.iconContainerActive]}>
                <Ionicons
                    name={icon}
                    size={20}
                    color={disabled ? Colors.textTertiary : isActive ? Colors.primary : Colors.textSecondary}
                />
            </View>

            <Text
                style={[
                    styles.label,
                    isActive && styles.labelActive,
                    disabled && styles.labelDisabled,
                ]}
                numberOfLines={1}
            >
                {label}
            </Text>

            {badge !== undefined && badge > 0 && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
            )}

            {disabled && (
                <Ionicons
                    name="lock-closed"
                    size={14}
                    color={Colors.textTertiary}
                    style={styles.lockIcon}
                />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingRight: 16,
        marginHorizontal: 8,
        marginVertical: 2,
        borderRadius: 12,
    },
    containerActive: {
        backgroundColor: Colors.primary + '15',
    },
    containerDisabled: {
        opacity: 0.6,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconContainerActive: {
        backgroundColor: Colors.primary + '20',
    },
    label: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    labelActive: {
        color: Colors.primary,
        fontWeight: '700',
    },
    labelDisabled: {
        color: Colors.textTertiary,
    },
    badge: {
        backgroundColor: Colors.error,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
        marginLeft: 8,
    },
    badgeText: {
        color: Colors.white,
        fontSize: 11,
        fontWeight: '700',
    },
    lockIcon: {
        marginLeft: 8,
    },
});

export default DrawerMenuItem;
