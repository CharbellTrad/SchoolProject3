import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Styles';
import { Parent } from '../../services-odoo/personService';
import { formatPhone } from '../../utils/formatHelpers';
import { Input } from '../ui/Input';

interface ParentSearchListProps {
  searchQuery: string;
  searching: boolean;
  searchResults: Parent[];
  onSearchChange: (query: string) => void;
  onSelectParent: (parent: Parent) => void;
  onClose: () => void;
}

export const ParentSearchList: React.FC<ParentSearchListProps> = ({
  searchQuery,
  searching,
  searchResults,
  onSearchChange,
  onSelectParent,
  onClose,
}) => {
  return (
    <View style={GlobalStyles.card}>
      <View style={styles.header}>
        <Text style={GlobalStyles.subsectionTitle}>Buscar Representante</Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close-circle" size={28} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <Input
        label="Buscar por nombre o cédula"
        placeholder="Ej: María Pérez o 12345678"
        value={searchQuery}
        onChangeText={onSearchChange}
        leftIcon="search"
        autoFocus
      />

      {searching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      )}

      {!searching && searchQuery.length >= 3 && searchResults.length === 0 && (
        <View style={GlobalStyles.emptyState}>
          <Ionicons name="search-outline" size={64} color={Colors.textTertiary} />
          <Text style={GlobalStyles.emptyStateText}>
            No se encontraron representantes
          </Text>
        </View>
      )}

      {searchResults.length > 0 && (
        <ScrollView style={styles.resultsContainer}>
          {searchResults.map((parent) => (
            <TouchableOpacity
              key={parent.id}
              style={GlobalStyles.cardSmall}
              onPress={() => onSelectParent(parent)}
            >
              <View style={styles.resultItem}>
                <View style={[GlobalStyles.avatar, GlobalStyles.avatarSecondary]}>
                  {parent.image_128 ? (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${parent.image_128}` }}
                      style={styles.avatarImage}
                      resizeMode='cover'
                    />
                  ) : (
                    <Ionicons name="person" size={28} color={Colors.secondary} />
                  )}
                </View>
                
                <View style={styles.resultInfo}>
                  <Text style={styles.resultName}>{parent.name}</Text>
                  <Text style={styles.resultDetail}>
                    {parent.nationality}-{parent.vat}
                  </Text>
                  <Text style={styles.resultDetail}>
                    {formatPhone(parent.phone)}
                  </Text>
                  {parent.students_ids && parent.students_ids.length > 0 && (
                    <Text style={styles.studentCount}>
                      Tiene {parent.students_ids.length} estudiante(s) asociado(s)
                    </Text>
                  )}
                </View>
                
                <Ionicons name="add-circle" size={32} color={Colors.success} />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: Colors.textSecondary,
  },
  resultsContainer: {
    maxHeight: 400,
    marginTop: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  resultDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  studentCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
