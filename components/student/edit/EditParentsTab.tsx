import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { Parent, ParentFormData } from '../../../services-odoo/personService';
import { formatPhone } from '../../../utils/formatHelpers';
import { ImagePickerComponent } from '../../ImagePicker';
import { GenderSelectorDropdown, NationalitySelectorDropdown, YesNoSelectorDropdown } from '../../selectors';
import { Input } from '../../ui/Input';
import { EditParentsTabSkeleton } from './skeletons';

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
  getImage: (key: string) => { base64?: string; filename?: string } | undefined;
  loading?: boolean;
  getFileType?: (key: string) => 'image' | 'pdf';
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
  getFileType,
}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    if (!loading && showSkeleton) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowSkeleton(false);
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    } else if (loading) {
      setShowSkeleton(true);
      fadeAnim.setValue(1);
    }
  }, [loading, showSkeleton, fadeAnim]);

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

  // Vista: Buscar Representante
  if (showSearchParent) {
    return (
      <View>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>Buscar Representante</Text>
          <TouchableOpacity onPress={onCancelForm} activeOpacity={0.7}>
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
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={64} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No se encontraron representantes</Text>
          </View>
        )}

        {searchResults.length > 0 && (
          <ScrollView style={styles.searchResultsContainer} showsVerticalScrollIndicator={false}>
            {searchResults.map((parent) => (
              <TouchableOpacity
                key={parent.id}
                style={styles.parentCard}
                onPress={() => onSelectExistingParent(parent)}
                activeOpacity={0.8}
              >
                {parent.image_1920 ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${parent.image_1920}` }}
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
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    );
  }

  // Vista: Agregar/Editar Representante
  if (showAddParent) {
    return (
      <View>
        <View style={styles.formHeader}>
          <Text style={styles.formTitle}>
            {editingParentIndex !== null ? 'Editar Representante' : 'Agregar Representante'}
          </Text>
          <TouchableOpacity onPress={onCancelForm} activeOpacity={0.7}>
            <Ionicons name="close-circle" size={28} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <View style={styles.photoSection}>
          <ImagePickerComponent
            label="Foto del Representante"
            value={getImage('parent_photo')?.base64}
            onImageSelected={(base64, filename) => onImageSelected('parent_photo', base64, filename)}
            circular
            initialFileType={getFileType ? getFileType('parent_photo') : undefined}
            initialFilename={getImage('parent_photo')?.filename}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos Personales</Text>

          <Input
            label="Nombre Completo *"
            placeholder="Ej: María Pérez González"
            value={currentParent.name}
            onChangeText={(text) => onParentFieldChange('name', text)}
            leftIcon="person"
            error={errors.parent_name}
          />

          <View style={styles.halfInput}>
            <NationalitySelectorDropdown
              value={currentParent.nationality || ''}
              onChange={(value) => onParentFieldChange('nationality', value)}
              error={errors.parent_nationality}
            />
          </View>
          <View style={styles.halfInput}>
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

          <View style={styles.halfInput}>
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
          <View style={styles.halfInput}>
            <GenderSelectorDropdown
              value={currentParent.sex || ''}
              onChange={(value) => onParentFieldChange('sex', value)}
              error={errors.parent_sex}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Contacto</Text>

          <Input
            label="Email *"
            placeholder="representante@ejemplo.com"
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
            leftIcon="alert-circle"
            error={errors.parent_emergency_phone_number}
            keyboardType="phone-pad"
          />

          <Input
            label="Calle/Avenida"
            placeholder="Ej: Av. Principal, Edificio Los Pinos"
            value={currentParent.street}
            onChangeText={(text) => onParentFieldChange('street', text)}
            leftIcon="location"
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Adicional</Text>

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

          <Input
            label="Lugar de Trabajo *"
            placeholder="Ej: Empresa ABC, C.A."
            value={currentParent.job_place}
            onChangeText={(text) => onParentFieldChange('job_place', text)}
            leftIcon="business"
            error={errors.parent_job_place}
          />

          <Input
            label="Cargo *"
            placeholder="Ej: Ingeniero, Docente, Contador"
            value={currentParent.job}
            onChangeText={(text) => onParentFieldChange('job', text)}
            leftIcon="briefcase"
            error={errors.parent_job}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentos</Text>

          <View style={styles.documentItem}>
            <ImagePickerComponent
              label="Cédula de Identidad del Representante"
              value={getImage('parent_ci_document')?.base64}
              onImageSelected={(base64, filename) => onImageSelected('parent_ci_document', base64, filename)}
              circular={false}
              acceptPDF={true}
              initialFileType={getFileType ? getFileType('parent_ci_document') : undefined}
              initialFilename={getImage('parent_ci_document')?.filename || 'ci_document.pdf'}
            />
          </View>

          <View style={styles.documentItem}>
            <ImagePickerComponent
              label="Firma del Representante"
              value={getImage('parent_signature')?.base64}
              onImageSelected={(base64, filename) => onImageSelected('parent_signature', base64, filename)}
              circular={false}
              acceptPDF={false}
              initialFileType={getFileType ? getFileType('parent_signature') : undefined}
              initialFilename={getImage('parent_signature')?.filename}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={onSaveParent} activeOpacity={0.8}>
          <Ionicons name="checkmark-circle" size={20} color="#fff" />
          <Text style={styles.saveButtonText}>
            {editingParentIndex !== null ? 'Actualizar Representante' : 'Agregar Representante'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Vista: Lista de Representantes
  return (
    <View>
      <Text style={styles.mainTitle}>Representantes</Text>

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
          <Text style={styles.searchButtonText}>Buscar Existente</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <EditParentsTabSkeleton />
      ) : parents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No hay representantes agregados</Text>
          <Text style={styles.emptySubtext}>Usa los botones de arriba para agregar</Text>
        </View>
      ) : (
        parents.map((parent, index) => (
          <View key={parent.id || index} style={styles.parentCard}>
            {parent.image_1920 ? (
              <Image
                source={{ uri: `data:image/jpeg;base64,${parent.image_1920}` }}
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
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onEditParent(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="create" size={20} color={Colors.secondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => onRemoveParent(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash" size={20} color={Colors.error} />
              </TouchableOpacity>
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
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.4,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  photoSection: {
    marginBottom: 28,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  halfInput: {
    flex: 1,
  },
  documentItem: {
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.primary + '08',
  },
  addButtonText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: -0.1,
  },
  searchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderStyle: 'dashed',
    backgroundColor: Colors.secondary + '08',
  },
  searchButtonText: {
    color: Colors.secondary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: -0.1,
  },
  parentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  parentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 10,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentInfo: {
    flex: 1,
    minWidth: 0,
  },
  parentName: {
    fontSize: 15.5,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 3,
    letterSpacing: -0.2,
  },
  parentDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  documentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  documentBadgeText: {
    fontSize: 11,
    color: Colors.success,
    fontWeight: '600',
  },
  studentCount: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 4,
    fontWeight: '500',
  },
  parentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
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
  emptySubtext: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginTop: 6,
  },
  searchResultsContainer: {
    maxHeight: 400,
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});