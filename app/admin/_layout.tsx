import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AdminLayout() {
  return (
      <Stack
        screenOptions={{
          animation: Platform.OS === 'android' ? 'fade' : 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
          headerShown: false,
        }}
      >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="academic-management/list-section-subject/sections-list" />
      <Stack.Screen name="academic-management/list-section-subject/register-section" />
      <Stack.Screen name="academic-management/lists-persons/select-role" />
      <Stack.Screen name="academic-management/lists-persons/students-list" />
      <Stack.Screen name="academic-management/register-person/select-role" />
      <Stack.Screen name="academic-management/register-person/register-student" />
    </Stack>
  );
}
