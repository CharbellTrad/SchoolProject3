import React from 'react';
import { Text, View } from 'react-native';
import { FormStyles, GlobalStyles } from '../../constants/Styles';
import { StudentFormData } from '../../hooks/useStudentForm';
import { ImagePickerComponent } from '../ImagePicker';
import { BloodTypeSelectorDropdown, GenderSelectorDropdown, NationalitySelectorDropdown, StudentLivesSelector } from '../selectors';
import { Input } from '../ui/Input';

interface StudentGeneralFormProps {
  data: StudentFormData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string | boolean) => void;
  onImageSelected: (base64: string, filename: string) => void;
  studentPhoto?: string;
}

export const StudentGeneralForm: React.FC<StudentGeneralFormProps> = ({
  data,
  errors,
  onFieldChange,
  onImageSelected,
  studentPhoto,
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
    <View style={GlobalStyles.contentPadding}>
      <ImagePickerComponent
        label="Foto del Estudiante"
        value={studentPhoto}
        onImageSelected={onImageSelected}
        circular={true}
      />

      <Text style={GlobalStyles.subsectionTitle}>Datos Personales</Text>

      <Input
        label="Nombre Completo *"
        placeholder="Juan Pérez"
        value={data.name}
        onChangeText={(text) => onFieldChange('name', text)}
        leftIcon="person"
        error={errors.name}
      />

      <View style={FormStyles.rowInputs}>
        <View style={FormStyles.halfInput}>
          <NationalitySelectorDropdown
            value={data.nationality}
            onChange={(value) => onFieldChange('nationality', value)}
            error={errors.nationality}
          />
        </View>
        <View style={FormStyles.halfInput}>
          <Input
            label="Cédula *"
            placeholder="12345678"
            value={data.vat}
            onChangeText={(text) => onFieldChange('vat', text)}
            leftIcon="card"
            error={errors.vat}
            keyboardType="numeric"
          />
        </View>
      </View>

      <View style={FormStyles.rowInputs}>
        <View style={FormStyles.halfInput}>
          <Input
            label="Fecha de Nacimiento *"
            placeholder="DD-MM-AAAA"
            value={data.born_date}
            onChangeText={(text) => onFieldChange('born_date', formatBirthDate(text))}
            leftIcon="calendar"
            error={errors.born_date}
            maxLength={10}
            keyboardType="numeric"
          />
        </View>
        <View style={FormStyles.halfInput}>
          <GenderSelectorDropdown
            value={data.sex}
            onChange={(value) => onFieldChange('sex', value)}
            error={errors.sex}
          />
        </View>
      </View>

      <BloodTypeSelectorDropdown
        value={data.blood_type}
        onChange={(value) => onFieldChange('blood_type', value)}
        error={errors.blood_type}
      />

      <Text style={GlobalStyles.subsectionTitle}>Contacto</Text>

      <Input
        label="Correo Electrónico *"
        placeholder="correo@ejemplo.com"
        value={data.email}
        onChangeText={(text) => onFieldChange('email', text)}
        leftIcon="mail"
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Input
        label="Teléfono *"
        placeholder="04141234567"
        value={data.phone}
        onChangeText={(text) => onFieldChange('phone', text)}
        leftIcon="call"
        error={errors.phone}
        keyboardType="phone-pad"
      />

      <Input
        label="Teléfono de Residencia"
        placeholder="02121234567"
        value={data.resident_number}
        onChangeText={(text) => onFieldChange('resident_number', text)}
        leftIcon="home"
        keyboardType="phone-pad"
      />

      <Input
        label="Teléfono de Emergencia *"
        placeholder="04241234567"
        value={data.emergency_phone_number}
        onChangeText={(text) => onFieldChange('emergency_phone_number', text)}
        leftIcon="warning"
        error={errors.emergency_phone_number}
        keyboardType="phone-pad"
      />

      <Text style={GlobalStyles.subsectionTitle}>Dirección</Text>

      <Input
        label="Calle/Avenida *"
        placeholder="Av. Principal..."
        value={data.street}
        onChangeText={(text) => onFieldChange('street', text)}
        leftIcon="location"
        error={errors.street}
      />

      <StudentLivesSelector
        value={data.student_lives}
        onChange={(value) => onFieldChange('student_lives', value)}
        error={errors.student_lives}
      />
    </View>
  );
};
