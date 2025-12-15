/**
 * Section Subject Layout
 * Stack navigation for section and subject management screens
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function SectionSubjectLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        />
    );
}
