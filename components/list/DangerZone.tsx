import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

interface DangerZoneProps {
  label: string;
  actionText: string;
  onPress: () => void;
  loading?: boolean;
}

export const DangerZone: React.FC<DangerZoneProps> = ({
  label,
  actionText,
  onPress,
  loading,
}) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity
      style={styles.dangerButton}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.75}
    >
      <Ionicons name="warning" size={18} color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.dangerText}>
        {loading ? 'Procesando...' : actionText}
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    marginBottom: 10,
    padding: 20,
    backgroundColor: Colors.error + '12',
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.error,
    ...Platform.select({
      ios: {
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      }
    }),
  },
  label: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 2,
  },
  dangerText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.1,
  },
});
