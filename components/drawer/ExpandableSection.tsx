/**
 * ExpandableSection Component
 * Collapsible menu section with animated expand/collapse
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';
import Colors from '../../constants/Colors';
import type { DrawerMenuItem, DrawerMenuSection } from '../../constants/drawerMenu';
import { DrawerMenuItem as DrawerMenuItemComponent } from './DrawerMenuItem';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableSectionProps {
    section: DrawerMenuSection;
    currentRoute?: string;
    onNavigate: (route: string) => void;
    indentLevel?: number;
}

export const ExpandableSection: React.FC<ExpandableSectionProps> = ({
    section,
    currentRoute,
    onNavigate,
    indentLevel = 0,
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpanded = useCallback(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    }, [isExpanded]);

    const hasChildren = section.children && section.children.length > 0;

    // Check if any child is active
    const isChildActive = useCallback((): boolean => {
        if (!section.children || !currentRoute) return false;

        const checkActive = (items: (DrawerMenuItem | DrawerMenuSection)[]): boolean => {
            for (const item of items) {
                if (item.route && currentRoute.includes(item.route)) {
                    return true;
                }
                if ('children' in item && item.children && Array.isArray(item.children)) {
                    if (checkActive(item.children)) return true;
                }
            }
            return false;
        };

        return checkActive(section.children);
    }, [section.children, currentRoute]);

    const childActive = isChildActive();

    if (!hasChildren && section.route) {
        // Simple menu item with route
        return (
            <DrawerMenuItemComponent
                label={section.label}
                icon={section.icon}
                isActive={currentRoute === section.route}
                disabled={section.disabled}
                onPress={() => onNavigate(section.route!)}
                indentLevel={indentLevel}
            />
        );
    }

    return (
        <View style={styles.container}>
            {/* Section header */}
            <TouchableOpacity
                style={[
                    styles.header,
                    childActive && styles.headerActive,
                    { paddingLeft: 16 + indentLevel * 16 },
                ]}
                onPress={toggleExpanded}
                activeOpacity={0.7}
            >
                <View style={[styles.iconContainer, childActive && styles.iconContainerActive]}>
                    <Ionicons
                        name={section.icon}
                        size={20}
                        color={childActive ? Colors.primary : Colors.textSecondary}
                    />
                </View>

                <Text style={[styles.label, childActive && styles.labelActive]}>{section.label}</Text>

                <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={childActive ? Colors.primary : Colors.textTertiary}
                />
            </TouchableOpacity>

            {/* Children */}
            {isExpanded && hasChildren && (
                <View style={styles.children}>
                    {section.children!.map((child) => {
                        if ('children' in child && child.children && child.children.length > 0) {
                            // Nested expandable section
                            return (
                                <ExpandableSection
                                    key={child.id}
                                    section={child as DrawerMenuSection}
                                    currentRoute={currentRoute}
                                    onNavigate={onNavigate}
                                    indentLevel={indentLevel + 1}
                                />
                            );
                        }

                        // Regular menu item
                        return (
                            <DrawerMenuItemComponent
                                key={child.id}
                                label={child.label}
                                icon={child.icon}
                                isActive={child.route ? currentRoute === child.route : false}
                                disabled={child.disabled}
                                badge={child.badge}
                                onPress={() => child.route && onNavigate(child.route)}
                                indentLevel={indentLevel + 1}
                            />
                        );
                    })}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingRight: 16,
        marginHorizontal: 8,
        borderRadius: 12,
    },
    headerActive: {
        backgroundColor: Colors.primary + '08',
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
    children: {
        marginTop: 4,
    },
});

export default ExpandableSection;
