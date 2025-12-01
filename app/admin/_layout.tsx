import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
        presentation: 'containedTransparentModal', 
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="biometric-devices" />
      <Stack.Screen name="academic-management/list-section-subject/sections-list" />
      <Stack.Screen name="academic-management/list-section-subject/register-section" />
      <Stack.Screen name="academic-management/lists-persons/select-role" />
      <Stack.Screen name="academic-management/lists-persons/students-list" />
      <Stack.Screen name="academic-management/register-person/select-role" />
      <Stack.Screen name="academic-management/register-person/register-student" />
    </Stack>
  );
}