import { ActivityIndicator, StyleSheet, View } from 'react-native';

export default function Index() {
  // Este componente solo se ve por un instante
  // mientras _layout.tsx redirige al login o dashboard
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
