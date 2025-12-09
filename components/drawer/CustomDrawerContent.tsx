/**
 * CustomDrawerContent Component
 * Main drawer content with user header, menu items, and logout button
 */

import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { DRAWER_MENU } from '../../constants/drawerMenu';
import { useAuth } from '../../contexts/AuthContext';
import { UserAvatar } from '../common/UserAvatar';
import { showAlert } from '../showAlert';
import { ExpandableSection } from './ExpandableSection';

interface CustomDrawerContentProps {
    state: any;
    navigation: any;
    descriptors: any;
}

export const CustomDrawerContent: React.FC<CustomDrawerContentProps> = (props) => {
    const { user, logout } = useAuth();

    // Get current route name
    const currentRouteName = props.state?.routes?.[props.state?.index]?.name || '';

    const handleNavigate = (route: string) => {
        props.navigation.closeDrawer();
        // Small delay to allow drawer animation to complete
        setTimeout(() => {
            router.push(route as any);
        }, 100);
    };

    const handleLogout = async () => {
        props.navigation.closeDrawer();
        await logout();
        router.replace('/login');
    };

    const handleDisabledPress = (label: string) => {
        showAlert('Función no disponible', `"${label}" está deshabilitado temporalmente.`);
    };

    return (
        <View style={styles.container}>
            {/* Header with user info */}
            <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                style={styles.header}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <View style={styles.headerContent}>
                    <UserAvatar
                        imageUrl={user?.imageUrl}
                        size={60}
                        iconColor={Colors.primary}
                        gradientColors={['#ffffff', '#ffffff']}
                        borderRadius={14}
                    />
                    <View style={styles.userInfo}>
                        <Text style={styles.userName} numberOfLines={1}>
                            {user?.fullName || 'Administrador'}
                        </Text>
                        <Text style={styles.userEmail} numberOfLines={1}>
                            {user?.email || ''}
                        </Text>
                        <View style={styles.roleBadge}>
                            <Ionicons name="shield-checkmark" size={10} color="#fff" />
                            <Text style={styles.roleText}>Administrador</Text>
                        </View>
                    </View>
                </View>

                {/* School name */}
                <View style={styles.schoolBanner}>
                    <Ionicons name="school" size={14} color="rgba(255,255,255,0.8)" />
                    <Text style={styles.schoolName}>U.E.N.B. Ciudad Jardín</Text>
                </View>
            </LinearGradient>

            {/* Menu items */}
            <DrawerContentScrollView
                {...props}
                contentContainerStyle={styles.menuContent}
                showsVerticalScrollIndicator={false}
            >
                {DRAWER_MENU.map((section) => (
                    <ExpandableSection
                        key={section.id}
                        section={section}
                        currentRoute={currentRouteName}
                        onNavigate={handleNavigate}
                    />
                ))}

                {/* Divider */}
                <View style={styles.divider} />

                {/* Configuration shortcut */}
                <TouchableOpacity
                    style={styles.configItem}
                    onPress={() => handleNavigate('/admin/biometric-devices')}
                    activeOpacity={0.7}
                >
                    <View style={styles.configIconContainer}>
                        <Ionicons name="finger-print-outline" size={20} color={Colors.textSecondary} />
                    </View>
                    <Text style={styles.configLabel}>Dispositivos Biométricos</Text>
                </TouchableOpacity>
            </DrawerContentScrollView>

            {/* Logout button */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.8}>
                <LinearGradient
                    colors={[Colors.error, '#b91c1c']}
                    style={styles.logoutGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                >
                    <Ionicons name="log-out-outline" size={20} color="#fff" />
                    <Text style={styles.logoutText}>Cerrar Sesión</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        paddingTop: Platform.OS === 'android' ? 50 : 60,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userInfo: {
        flex: 1,
        marginLeft: 14,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 6,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        alignSelf: 'flex-start',
        gap: 4,
    },
    roleText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#fff',
    },
    schoolBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    schoolName: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '600',
    },
    menuContent: {
        paddingTop: 12,
        paddingBottom: 20,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.border,
        marginHorizontal: 20,
        marginVertical: 16,
    },
    configItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginHorizontal: 8,
        borderRadius: 12,
    },
    configIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: Colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    configLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    logoutButton: {
        marginHorizontal: 16,
        marginBottom: Platform.OS === 'android' ? 24 : 34,
        borderRadius: 16,
        overflow: 'hidden',
    },
    logoutGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 10,
    },
    logoutText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
});

export default CustomDrawerContent;
