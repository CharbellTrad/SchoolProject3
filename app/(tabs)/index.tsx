import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import Colors from '../../constants/Colors';

export default function DashboardScreen() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      // Si no hay usuario, ir a login
      router.replace('/login');
      return;
    }

    // Si hay usuario, redirigir según el rol
    switch (user.role) {
      case 'admin':
        router.replace('/admin/dashboard');
        break;
      case 'teacher':
        router.replace('/teacher/dashboard');
        break;
      case 'student':
        router.replace('/student/dashboard');
        break;
      default:
        router.replace('/login');
    }
  }, [user, loading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});