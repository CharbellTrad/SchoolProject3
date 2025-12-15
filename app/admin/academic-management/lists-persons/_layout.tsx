/**
 * Lists Persons Layout
 * Stack navigation for person list screens
 */

import { Stack } from 'expo-router';
import React from 'react';

export default function ListsPersonsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
            }}
        />
    );
}
