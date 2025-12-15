/**
 * Register Person Layout
 * Stack navigation for person registration screens
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function RegisterPersonLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        />
    );
}
