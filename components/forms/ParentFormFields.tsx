import React from 'react';
import { View } from 'react-native';
import { FormStyles } from '../../constants/Styles';
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
  getImage: (key: string) => { base64?: string } | undefined;
}

export const ParentFormFields: React.FC<ParentFormFieldsProps> = ({
  parent,
  errors,
  onFieldChange,
  onImageSelected,
  getImage,
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
    <>
      <ImagePickerComponent
        label="Foto del Representante"
        value={getImage('parent_photo')?.base64}
        onImageSelected={(base64, filename) => onImageSelected('parent_photo', base64, filename)}
        circular
      />

      <Input
        label="Nombre Completo *"
        placeholder="María Pérez"
        value={parent.name}
        onChangeText={(text) => onFieldChange('name', text)}
        leftIcon="person"
        error={errors.parent_name}
      />

      <View style={FormStyles.rowInputs}>
        <View style={FormStyles.halfInput}>
          <NationalitySelectorDropdown
            value={parent.nationality || ''}
            onChange={(value) => onFieldChange('nationality', value)}
            error={errors.parent_nationality}
          />
        </View>
        <View style={FormStyles.halfInput}>
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
      </View>

      <View style={FormStyles.rowInputs}>
        <View style={FormStyles.halfInput}>
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
        <View style={FormStyles.halfInput}>
          <GenderSelectorDropdown
            value={parent.sex || ''}
            onChange={(value) => onFieldChange('sex', value)}
            error={errors.parent_sex}
          />
        </View>
      </View>

      <Input
        label="Email *"
        placeholder="correo@ejemplo.com"
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
        leftIcon="warning"
        error={errors.parent_emergency_phone_number}
        keyboardType="phone-pad"
      />

      <Input
        label="Calle/Avenida"
        placeholder="Av. Principal"
        value={parent.street}
        onChangeText={(text) => onFieldChange('street', text)}
        leftIcon="location"
      />

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

      {/* ✅ CAMBIO: Campos siempre visibles y obligatorios */}
      <Input
        label="Lugar de Trabajo *"
        placeholder="Empresa ABC"
        value={parent.job_place}
        onChangeText={(text) => onFieldChange('job_place', text)}
        leftIcon="business"
        error={errors.parent_job_place}
      />

      <Input
        label="Cargo *"
        placeholder="Ingeniero, Docente..."
        value={parent.job}
        onChangeText={(text) => onFieldChange('job', text)}
        leftIcon="briefcase"
        error={errors.parent_job}
      />

      <View style={FormStyles.section}>
        <ImagePickerComponent
          label="Cédula de Identidad del Representante"
          value={getImage('parent_ci_document')?.base64}
          onImageSelected={(base64, filename) => onImageSelected('parent_ci_document', base64, filename)}
          circular={false}
          acceptPDF={true}
        />
      </View>

      <View style={FormStyles.section}>
        <ImagePickerComponent
          label="Firma del Representante"
          value={getImage('parent_signature')?.base64}
          onImageSelected={(base64, filename) => onImageSelected('parent_signature', base64, filename)}
          circular={false}
          acceptPDF={false}
        />
      </View>
    </>
  );
};
