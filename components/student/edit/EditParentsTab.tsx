import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { FormStyles, listStyles } from '../../../constants/Styles';
import { Parent, ParentFormData } from '../../../services-odoo/personService';
import { formatPhone } from '../../../utils/formatHelpers';
import { ImagePickerComponent } from '../../ImagePicker';
import {
  GenderSelectorDropdown,
  NationalitySelectorDropdown,
  YesNoSelectorDropdown
} from '../../selectors';
import { Input } from '../../ui/Input';

interface EditParentsTabProps {
  parents: Array<Partial<Parent> & { id?: number }>;
  showAddParent: boolean;
  showSearchParent: boolean;
  currentParent: ParentFormData;
  editingParentIndex: number | null;
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
  onEditParent: (index: number) => void;
  onRemoveParent: (index: number) => void;
  onCancelForm: () => void;
  onImageSelected: (key: string, base64: string, filename: string) => void;
  getImage: (key: string) => { base64?: string } | undefined;
  loading?: boolean;
}

export const EditParentsTab: React.FC<EditParentsTabProps> = ({
  parents,
  showAddParent,
  showSearchParent,
  currentParent,
  editingParentIndex,
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
  onImageSelected,
  getImage,
  loading = false,
}) => {
  const formatBirthDate = (text: string) => {
    let formatted = text.replace(/[^\d]/g, '');
    if (formatted.length >= 2) {
      formatted = formatted.slice(0, 2) + '-' + formatted.slice(2);
    }
    if (formatted.length >= 5) {
      formatted = formatted.slice(0, 5) + '-' + formatted.slice(5, 9);
    }
    return formatted;
  };

  if (showSearchParent) {
    return (
      <View style={listStyles.editSection}>
        <View style={styles.formHeader}>
          <Text style={listStyles.editSectionTitle}>Buscar Representante</Text>
          <TouchableOpacity onPress={onCancelForm}>
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
          <View style={styles.searchingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.searchingText}>Buscando...</Text>
          </View>
        )}

        {!searching && searchQuery.length >= 3 && searchResults.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No se encontraron representantes</Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <ScrollView style={styles.searchResultsContainer}>
            {searchResults.map((parent) => (
              <TouchableOpacity
                key={parent.id}
                style={listStyles.card}
                onPress={() => onSelectExistingParent(parent)}
              >
                <View style={styles.parentCardContent}>
                  {parent.image_128 ? (
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${parent.image_128}` }}
                      style={styles.parentAvatar}
                      resizeMode='cover'
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={28} color={Colors.secondary} />
                    </View>
                  )}

                  <View style={styles.parentInfo}>
                    <Text style={styles.parentName}>{parent.name}</Text>
                    <Text style={styles.parentDetail}>
                      {parent.nationality}-{parent.vat}
                    </Text>
                    <Text style={styles.parentDetail}>
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
  }

  if (showAddParent) {
    return (
      <View style={listStyles.editSection}>
        <View style={styles.formHeader}>
          <Text style={listStyles.editSectionTitle}>
            {editingParentIndex !== null ? 'Editar Representante' : 'Agregar Representante'}
          </Text>
          <TouchableOpacity onPress={onCancelForm}>
            <Ionicons name="close-circle" size={28} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <ImagePickerComponent
          label="Foto del Representante"
          value={getImage('parent_photo')?.base64}
          onImageSelected={(base64, filename) => onImageSelected('parent_photo', base64, filename)}
          circular={true}
        />

        <Input
          label="Nombre Completo *"
          placeholder="María Pérez"
          value={currentParent.name}
          onChangeText={(text) => onParentFieldChange('name', text)}
          leftIcon="person"
          error={errors.parent_name}
        />

        <View style={FormStyles.rowInputs}>
          <View style={FormStyles.halfInput}>
            <NationalitySelectorDropdown
              value={currentParent.nationality || ''}
              onChange={(value) => onParentFieldChange('nationality', value)}
              error={errors.parent_nationality}
            />
          </View>
          <View style={FormStyles.halfInput}>
            <Input
              label="Cédula *"
              placeholder="12345678"
              value={currentParent.vat}
              onChangeText={(text) => onParentFieldChange('vat', text)}
              leftIcon="card"
              error={errors.parent_vat}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={FormStyles.rowInputs}>
          <View style={FormStyles.halfInput}>
            <Input
              label="Fecha Nacimiento *"
              placeholder="DD-MM-AAAA"
              value={currentParent.born_date}
              onChangeText={(text) => onParentFieldChange('born_date', formatBirthDate(text))}
              leftIcon="calendar"
              error={errors.parent_born_date}
              maxLength={10}
              keyboardType="numeric"
            />
          </View>
          <View style={FormStyles.halfInput}>
            <GenderSelectorDropdown
              value={currentParent.sex || ''}
              onChange={(value) => onParentFieldChange('sex', value)}
              error={errors.parent_sex}
            />
          </View>
        </View>

        <Input
          label="Email *"
          placeholder="correo@ejemplo.com"
          value={currentParent.email}
          onChangeText={(text) => onParentFieldChange('email', text)}
          leftIcon="mail"
          error={errors.parent_email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Teléfono *"
          placeholder="04141234567"
          value={currentParent.phone}
          onChangeText={(text) => onParentFieldChange('phone', text)}
          leftIcon="call"
          error={errors.parent_phone}
          keyboardType="phone-pad"
        />

        <Input
          label="Teléfono Residencia"
          placeholder="02121234567"
          value={currentParent.resident_number}
          onChangeText={(text) => onParentFieldChange('resident_number', text)}
          leftIcon="home"
          keyboardType="phone-pad"
        />

        <Input
          label="Teléfono Emergencia *"
          placeholder="04241234567"
          value={currentParent.emergency_phone_number}
          onChangeText={(text) => onParentFieldChange('emergency_phone_number', text)}
          leftIcon="warning"
          error={errors.parent_emergency_phone_number}
          keyboardType="phone-pad"
        />

        <Input
          label="Calle/Avenida"
          placeholder="Av. Principal"
          value={currentParent.street}
          onChangeText={(text) => onParentFieldChange('street', text)}
          leftIcon="location"
        />

        <YesNoSelectorDropdown
          label="¿Vive con el estudiante?"
          value={currentParent.live_with_student || ''}
          onChange={(value) => onParentFieldChange('live_with_student', value)}
          error={errors.parent_live_with_student}
          required
        />

        <YesNoSelectorDropdown
          label="¿Tiene empleo actualmente?"
          value={currentParent.active_job || ''}
          onChange={(value) => onParentFieldChange('active_job', value)}
          error={errors.parent_active_job}
          required
        />

        {/* ✅ CAMBIO: Campos siempre visibles y obligatorios */}
        <Input
          label="Lugar de Trabajo *"
          placeholder="Empresa ABC"
          value={currentParent.job_place}
          onChangeText={(text) => onParentFieldChange('job_place', text)}
          leftIcon="business"
          error={errors.parent_job_place}
        />

        <Input
          label="Cargo *"
          placeholder="Ingeniero, Docente..."
          value={currentParent.job}
          onChangeText={(text) => onParentFieldChange('job', text)}
          leftIcon="briefcase"
          error={errors.parent_job}
        />

        <View style={styles.documentSection}>
          <Text style={styles.documentLabel}>Cédula de Identidad del Representante</Text>
          <Text style={styles.documentHint}>Formatos aceptados: JPG, PNG, PDF</Text>
          <ImagePickerComponent
            value={getImage('parent_ci_document')?.base64}
            onImageSelected={(base64, filename) => onImageSelected('parent_ci_document', base64, filename)}
            circular={false}
            acceptPDF={true}
          />
        </View>

        <View style={styles.documentSection}>
          <Text style={styles.documentLabel}>Firma del Representante</Text>
          <Text style={styles.documentHint}>Captura la firma del representante</Text>
          <ImagePickerComponent
            value={getImage('parent_signature')?.base64}
            onImageSelected={(base64, filename) => onImageSelected('parent_signature', base64, filename)}
            circular={false}
            acceptPDF={false}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={onSaveParent}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {editingParentIndex !== null ? 'Actualizar Representante' : 'Agregar Representante'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={listStyles.editSection}>
      <View style={styles.parentsHeader}>
        <Text style={listStyles.editSectionTitle}>Representantes</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddNewParent}
          >
            <Ionicons name="person-add" size={24} color={Colors.primary} />
            <Text style={styles.addButtonText}>Crear Nuevo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.searchButton}
            onPress={onSearchExisting}
          >
            <Ionicons name="search" size={24} color={Colors.secondary} />
            <Text style={styles.searchButtonText}>Buscar Existente</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.searchingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.searchingText}>Cargando representantes...</Text>
        </View>
      ) : parents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No hay representantes agregados</Text>
        </View>
      ) : (
        parents.map((parent, index) => (
          <View key={parent.id || index} style={listStyles.card}>
            <View style={styles.parentCardContent}>
              {parent.image_128 ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${parent.image_128}` }}
                  style={styles.parentAvatar}
                  resizeMode='cover'
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={28} color={Colors.primary} />
                </View>
              )}

              <View style={styles.parentInfo}>
                <Text style={styles.parentName}>{parent.name}</Text>
                <Text style={styles.parentDetail}>
                  {parent.nationality}-{parent.vat}
                </Text>
                <Text style={styles.parentDetail}>
                  {formatPhone(parent.phone)}
                </Text>
                {parent.ci_document && (
                  <View style={styles.documentBadge}>
                    <Ionicons name="document-text" size={12} color={Colors.success} />
                    <Text style={styles.documentBadgeText}>Cédula adjunta</Text>
                  </View>
                )}
              </View>

              <View style={styles.parentActions}>
                <TouchableOpacity onPress={() => onEditParent(index)}>
                  <Ionicons name="create" size={24} color={Colors.secondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => onRemoveParent(index)}>
                  <Ionicons name="trash" size={24} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  parentsHeader: {
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primary + '05',
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderStyle: 'dashed',
    backgroundColor: Colors.secondary + '05',
  },
  searchButtonText: {
    color: Colors.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  parentCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  parentAvatar: {
    width: 50,
    height: 50,
    borderRadius:8,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentInfo: {
    flex: 1,
  },
  parentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  parentDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  documentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  documentBadgeText: {
    fontSize: 11,
    color: Colors.success,
    marginLeft: 4,
  },
  parentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  searchingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  searchingText: {
    marginTop: 8,
    color: Colors.textSecondary,
  },
  searchResultsContainer: {
    maxHeight: 400,
    marginTop: 16,
  },
  studentCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  documentSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
