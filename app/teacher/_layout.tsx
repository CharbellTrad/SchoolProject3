import { Stack } from 'expo-router';

export default function TeacherLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'slide_from_right',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        headerShown: false,
      }}
    >
      <Stack.Screen name="dashboard" />
    </Stack>
  );
}