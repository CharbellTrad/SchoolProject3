/**
 * Admin Layout with Drawer Navigation
 * Uses expo-router's Drawer component for file-based routing
 */

import { Ionicons } from '@expo/vector-icons';
import { Drawer } from 'expo-router/drawer';
import React from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CustomDrawerContent } from '../../components/drawer';
import Colors from '../../constants/Colors';

/**
 * Main Admin Layout with Drawer Navigation
 * Expo Router handles the file-based screen registration automatically
 */
export default function AdminLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerType: 'front',
          drawerStyle: styles.drawer,
          swipeEnabled: true,
          swipeEdgeWidth: 50,
        }}
      >
        {/* Dashboard/Home screen */}
        <Drawer.Screen
          name="dashboard"
          options={{
            title: 'Tablero',
            drawerLabel: 'Tablero',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
          }}
        />

        {/* Hide other screens from drawer - they're accessed via navigation */}
        <Drawer.Screen
          name="biometric-devices"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="auth-history"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="academic-management"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  drawer: {
    width: '80%',
    maxWidth: 320,
    backgroundColor: Colors.background,
  },
});