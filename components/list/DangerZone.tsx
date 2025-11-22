import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

interface DangerZoneProps {
  onDelete: () => void;
  entityName: string;
}

export const DangerZone: React.FC<DangerZoneProps> = ({ 
  onDelete, 
  entityName 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Zona de Peligro</Text>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
      >
        <Ionicons name="trash" size={20} color="#fff" />
        <Text style={styles.deleteButtonText}>Eliminar {entityName}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    padding: 14,
    borderRadius: 8,
    gap: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
