/**
 * Daily Operations Layout
 * Stack navigation for enrollment and list screens
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function DailyOperationsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        />
    );
}
