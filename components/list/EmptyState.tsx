import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';

interface EmptyStateProps {
  hasSearchQuery: boolean;
  entityName: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  hasSearchQuery, 
  entityName,
  icon = 'school-outline'
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={64} color={Colors.textTertiary} />
      <Text style={styles.text}>
        {hasSearchQuery 
          ? `No se encontraron ${entityName}` 
          : `No hay ${entityName} registrados`}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  text: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
});
