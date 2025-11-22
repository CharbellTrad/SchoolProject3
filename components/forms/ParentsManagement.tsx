import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { GlobalStyles } from '../../constants/Styles';
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
      <View style={GlobalStyles.contentPadding}>
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
      <View style={GlobalStyles.contentPadding}>
        <View style={GlobalStyles.card}>
          <View style={styles.formHeader}>
            <Text style={GlobalStyles.subsectionTitle}>
              {editingParentIndex !== null ? 'Editar Representante' : 'Agregar Representante'}
            </Text>
            <TouchableOpacity onPress={onCancelForm}>
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

          <Button
            title={editingParentIndex !== null ? "Actualizar Representante" : "Agregar Representante"}
            onPress={onSaveParent}
            icon="checkmark-circle"
            variant="primary"
            size="large"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={GlobalStyles.contentPadding}>
      <View style={styles.header}>
        <Text style={GlobalStyles.subsectionTitle}>Representantes Agregados</Text>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[GlobalStyles.dashedButton, styles.addButton]}
            onPress={onAddNewParent}
          >
            <Ionicons name="person-add" size={24} color={Colors.primary} />
            <Text style={styles.addButtonText}>Crear Nuevo</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[GlobalStyles.dashedButton, styles.searchButton]}
            onPress={onSearchExisting}
          >
            <Ionicons name="search" size={24} color={Colors.secondary} />
            <Text style={styles.searchButtonText}>Buscar Existente</Text>
          </TouchableOpacity>
        </View>
      </View>

      {parents.length === 0 ? (
        <View style={GlobalStyles.emptyState}>
          <Ionicons name="people-outline" size={64} color={Colors.textTertiary} />
          <Text style={GlobalStyles.emptyStateText}>
            No hay representantes agregados
          </Text>
          <Text style={GlobalStyles.emptyStateSubtext}>
            Debe agregar al menos un representante
          </Text>
        </View>
      ) : (
        parents.map((parent, index) => (
          <ParentCard
            key={index}
            parent={parent}
            index={index}
            onEdit={!parent.id ? () => onEditParent(index, parent) : undefined}
            onRemove={() => onRemoveParent(index)}
          />
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addButton: {
    flex: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '05',
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  searchButton: {
    flex: 1,
    borderColor: Colors.secondary,
    backgroundColor: Colors.secondary + '05',
  },
  searchButtonText: {
    color: Colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
});
