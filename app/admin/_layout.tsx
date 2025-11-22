import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>

      <Stack.Screen name="dashboard"/>
      <Stack.Screen name="academic-management/lists-persons/select-role" />
      <Stack.Screen name="academic-management/lists-persons/students-list" />
      <Stack.Screen name="academic-management/register-person/register-student" />
      <Stack.Screen name="academic-management/register-person/select-role" />
    </Stack>
  );
}
