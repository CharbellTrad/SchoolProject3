import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';
import { Parent } from '../../services-odoo/personService';
import { ImagePickerComponent } from '../ImagePicker';
import {
  GenderSelectorDropdown,
  NationalitySelectorDropdown,
  YesNoSelectorDropdown
} from '../selectors';
import { Input } from '../ui/Input';

interface ParentFormFieldsProps {
  parent: Partial<Parent>;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  onImageSelected: (key: string, base64: string, filename: string) => void;
  getImage: (key: string) => { base64?: string; filename?: string } | undefined;
  getFileType?: (key: string) => 'image' | 'pdf';
}

export const ParentFormFields: React.FC<ParentFormFieldsProps> = ({
  parent,
  errors,
  onFieldChange,
  onImageSelected,
  getImage,
  getFileType, 
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

  return (
    <View>
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
          value={parent.name}
          onChangeText={(text) => onFieldChange('name', text)}
          leftIcon="person"
          error={errors.parent_name}
        />

        <View style={styles.halfInput}>
          <NationalitySelectorDropdown
            value={parent.nationality || ''}
            onChange={(value) => onFieldChange('nationality', value)}
            error={errors.parent_nationality}
          />
        </View>
        <View style={styles.halfInput}>
          <Input
            label="Cédula *"
            placeholder="12345678"
            value={parent.vat}
            onChangeText={(text) => onFieldChange('vat', text)}
            leftIcon="card"
            error={errors.parent_vat}
            keyboardType="numeric"
          />
        </View>

        <View style={styles.halfInput}>
          <Input
            label="Fecha Nacimiento *"
            placeholder="DD-MM-AAAA"
            value={parent.born_date}
            onChangeText={(text) => onFieldChange('born_date', formatBirthDate(text))}
            leftIcon="calendar"
            error={errors.parent_born_date}
            maxLength={10}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.halfInput}>
          <GenderSelectorDropdown
            value={parent.sex || ''}
            onChange={(value) => onFieldChange('sex', value)}
            error={errors.parent_sex}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información de Contacto</Text>

        <Input
          label="Email *"
          placeholder="representante@ejemplo.com"
          value={parent.email}
          onChangeText={(text) => onFieldChange('email', text)}
          leftIcon="mail"
          error={errors.parent_email}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Teléfono *"
          placeholder="04141234567"
          value={parent.phone}
          onChangeText={(text) => onFieldChange('phone', text)}
          leftIcon="call"
          error={errors.parent_phone}
          keyboardType="phone-pad"
        />

        <Input
          label="Teléfono Residencia"
          placeholder="02121234567"
          value={parent.resident_number}
          onChangeText={(text) => onFieldChange('resident_number', text)}
          leftIcon="home"
          keyboardType="phone-pad"
        />

        <Input
          label="Teléfono Emergencia *"
          placeholder="04241234567"
          value={parent.emergency_phone_number}
          onChangeText={(text) => onFieldChange('emergency_phone_number', text)}
          leftIcon="alert-circle"
          error={errors.parent_emergency_phone_number}
          keyboardType="phone-pad"
        />

        <Input
          label="Calle/Avenida"
          placeholder="Ej: Av. Principal, Edificio Los Pinos"
          value={parent.street}
          onChangeText={(text) => onFieldChange('street', text)}
          leftIcon="location"
          multiline
          numberOfLines={2}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Adicional</Text>

        <YesNoSelectorDropdown
          label="¿Vive con el estudiante?"
          value={parent.live_with_student || ''}
          onChange={(value) => onFieldChange('live_with_student', value)}
          error={errors.parent_live_with_student}
          required
        />

        <YesNoSelectorDropdown
          label="¿Tiene empleo actualmente?"
          value={parent.active_job || ''}
          onChange={(value) => onFieldChange('active_job', value)}
          error={errors.parent_active_job}
          required
        />

        <Input
          label="Lugar de Trabajo *"
          placeholder="Ej: Empresa ABC, C.A."
          value={parent.job_place}
          onChangeText={(text) => onFieldChange('job_place', text)}
          leftIcon="business"
          error={errors.parent_job_place}
        />

        <Input
          label="Cargo *"
          placeholder="Ej: Ingeniero, Docente, Contador"
          value={parent.job}
          onChangeText={(text) => onFieldChange('job', text)}
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
    </View>
  );
};

const styles = StyleSheet.create({
  photoSection: {
    marginBottom: 15,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  halfInput: {
    flex: 1,
  },
  documentItem: {
    marginBottom: 15,
  },
});