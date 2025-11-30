import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
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
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Buscar Representante</Text>
        <TouchableOpacity onPress={onClose} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={28} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* Input de búsqueda */}
      <Input
        label="Buscar por nombre o cédula"
        placeholder="Ej: María Pérez o 12345678"
        value={searchQuery}
        onChangeText={onSearchChange}
        leftIcon="search"
        autoFocus
      />

      {/* Estado: Buscando */}
      {searching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      )}

      {/* Estado: Sin resultados */}
      {!searching && searchQuery.length >= 3 && searchResults.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No se encontraron representantes</Text>
        </View>
      )}

      {/* Lista de resultados */}
      {searchResults.length > 0 && (
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          {searchResults.map((parent) => (
            <TouchableOpacity
              key={parent.id}
              style={styles.resultCard}
              onPress={() => onSelectParent(parent)}
              activeOpacity={0.8}
            >
              {/* Avatar */}
              {parent.image_1920 ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${parent.image_1920}` }}
                  style={styles.avatarImage}
                  resizeMode='cover'
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={28} color={Colors.secondary} />
                </View>
              )}

              {/* Info */}
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

              {/* Icono de agregar */}
              <Ionicons name="add-circle" size={32} color={Colors.success} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: 16,
  },
  resultsContainer: {
    maxHeight: 400,
    marginTop: 16,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    }),
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.secondary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultInfo: {
    flex: 1,
    minWidth: 0,
  },
  resultName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  resultDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  studentCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
    fontWeight: '500',
  },
});
