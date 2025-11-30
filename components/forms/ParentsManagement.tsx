import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { Parent } from '../../services-odoo/personService';
import { Button } from '../ui/Button';
import { ParentCard } from './ParentCard';
import { ParentFormFields } from './ParentFormFields';
import { ParentSearchList } from './ParentSearchList';

interface ParentsManagementProps {
  parents: Array<Partial<Parent> & { id?: number }>;
  currentParent: Partial<Parent>;
  editingParentIndex: number | null;
  showAddParent: boolean;
  showSearchParent: boolean;
  searchQuery: string;
  searchResults: Parent[];
  searching: boolean;
  errors: Record<string, string>;
  onAddNewParent: () => void;
  onSearchExisting: () => void;
  onParentFieldChange: (field: string, value: string) => void;
  onSearchChange: (query: string) => void;
  onSelectExistingParent: (parent: Parent) => void;
  onSaveParent: () => void;
  onEditParent: (index: number, parent: Partial<Parent>) => void;
  onRemoveParent: (index: number) => void;
  onCancelForm: () => void;
  onCloseSearch: () => void;
  onImageSelected: (key: string, base64: string, filename: string) => void;
  getImage: (key: string) => { base64?: string } | undefined;
}

export const ParentsManagement: React.FC<ParentsManagementProps> = ({
  parents,
  currentParent,
  editingParentIndex,
  showAddParent,
  showSearchParent,
  searchQuery,
  searchResults,
  searching,
  errors,
  onAddNewParent,
  onSearchExisting,
  onParentFieldChange,
  onSearchChange,
  onSelectExistingParent,
  onSaveParent,
  onEditParent,
  onRemoveParent,
  onCancelForm,
  onCloseSearch,
  onImageSelected,
  getImage,
}) => {
  if (showSearchParent) {
    return (
      <View style={styles.container}>
        <ParentSearchList
          searchQuery={searchQuery}
          searching={searching}
          searchResults={searchResults}
          onSearchChange={onSearchChange}
          onSelectParent={onSelectExistingParent}
          onClose={onCloseSearch}
        />
      </View>
    );
  }

  if (showAddParent) {
    return (
      <View style={styles.container}>
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>
              {editingParentIndex !== null ? 'Editar Representante' : 'Agregar Representante'}
            </Text>
            <TouchableOpacity 
              onPress={onCancelForm}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <Ionicons name="close-circle" size={28} color={Colors.error} />
            </TouchableOpacity>
          </View>

          <ParentFormFields
            parent={currentParent}
            errors={errors}
            onFieldChange={onParentFieldChange}
            onImageSelected={onImageSelected}
            getImage={getImage}
          />

          <View style={styles.saveButtonContainer}>
            <Button
              title={editingParentIndex !== null ? "Actualizar Representante" : "Agregar Representante"}
              onPress={onSaveParent}
              icon="checkmark-circle"
              iconPosition="left"
              variant="primary"
              size="large"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Representantes Asociados</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={onAddNewParent}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add" size={20} color={Colors.primary} />
            <Text style={styles.addButtonText}>Crear Nuevo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={onSearchExisting}
            activeOpacity={0.7}
          >
            <Ionicons name="search" size={20} color={Colors.secondary} />
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {parents.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="people" size={64} color={Colors.textTertiary} />
          </View>
          <Text style={styles.emptyStateTitle}>
            No hay representantes agregados
          </Text>
          <Text style={styles.emptyStateText}>
            Debe agregar al menos un representante para continuar
          </Text>
        </View>
      ) : (
        <View style={styles.parentsList}>
          {parents.map((parent, index) => (
            <ParentCard
              key={parent.id ? parent.id.toString() : `parent-${index}`}
              parent={parent}
              index={index}
              onEdit={!parent.id ? () => onEditParent(index, parent) : undefined}
              onRemove={() => onRemoveParent(index)}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary + '15',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary + '15',
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
    borderStyle: 'dashed',
  },
  searchButtonText: {
    color: Colors.secondary,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  parentsList: {
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.backgroundTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      }
    }),
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  formTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  saveButtonContainer: {
    marginTop: 24,
  },
});
