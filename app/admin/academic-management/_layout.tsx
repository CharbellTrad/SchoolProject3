/**
 * Academic Management Layout
 * Uses Stack navigation for proper back navigation between screens
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function AcademicManagementLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        />
    );
}
