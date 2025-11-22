import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const InfoRow: React.FC<InfoRowProps> = ({ label, value, icon }) => {
  const displayValue = value !== null && value !== undefined 
    ? String(value) 
    : 'No especificado';

  return (
    <View style={styles.container}>
      {icon && (
        <Ionicons 
          name={icon} 
          size={18} 
          color={Colors.textSecondary} 
          style={styles.icon} 
        />
      )}
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{displayValue}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', 
    paddingVertical: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f0f0f0',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13, 
    color: Colors.textSecondary, 
    marginBottom: 4,
  },
  value: {
    fontSize: 15, 
    color: Colors.textPrimary, 
    fontWeight: '500',
  },
});
