import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';

interface EmptyStateProps {
  hasSearchQuery?: boolean;
  entityName?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  hasSearchQuery = false,
  entityName = "resultados"
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name={hasSearchQuery ? "search-outline" : "document-text-outline"}
          size={48}
          color={Colors.textTertiary}
        />
      </View>
      <Text style={styles.title}>
        {hasSearchQuery
          ? `No se encontraron ${entityName}`
          : `Sin ${entityName} para mostrar`}
      </Text>
      <Text style={styles.subtitle}>
        {hasSearchQuery
          ? "Intenta otra búsqueda o revisa los filtros."
          : "Actualmente no hay datos en esta sección."}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  iconContainer: {
    backgroundColor: Colors.backgroundTertiary,
    borderRadius: 32,
    padding: 18,
    marginBottom: 20,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});
