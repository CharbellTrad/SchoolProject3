import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { FormStyles } from '../../../constants/Styles';
import { Student } from '../../../services-odoo/personService';
import { ImagePickerComponent } from '../../ImagePicker';
import {
    BloodTypeSelectorDropdown,
    GenderSelectorDropdown,
    NationalitySelectorDropdown,
    StudentLivesSelector
} from '../../selectors';
import { Input } from '../../ui/Input';

interface EditGeneralTabProps {
  formData: Student;
  errors: Record<string, string>;
  onFieldChange: (field: keyof Student, value: any) => void;
  onImageSelected: (base64: string, filename: string) => void;
  studentPhoto?: string;
}

export const EditGeneralTab: React.FC<EditGeneralTabProps> = ({
  formData,
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
    <View style={styles.container}>
      {/* Sección: Foto del Estudiante */}
      <View style={styles.photoSection}>
        <View style={styles.photoHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="camera" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Foto del Estudiante</Text>
        </View>
        <View style={styles.photoContent}>
          <ImagePickerComponent
            label=""
            value={studentPhoto}
            onImageSelected={onImageSelected}
            circular={true}
          />
        </View>
      </View>

      {/* Sección: Información Personal */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="person" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Información Personal</Text>
        </View>

        <View style={styles.sectionContent}>
          <Input
            label="Nombre Completo *"
            value={formData.name}
            onChangeText={(text) => onFieldChange('name', text)}
            leftIcon="person"
            placeholder="Juan Pérez"
            error={errors.name}
          />

          <View style={FormStyles.halfInput}>
            <NationalitySelectorDropdown
              value={formData.nationality}
              onChange={(value) => onFieldChange('nationality', value)}
              error={errors.nationality}
            />
          </View>
          <View style={FormStyles.halfInput}>
            <Input
              label="Cédula *"
              value={formData.vat}
              onChangeText={(text) => onFieldChange('vat', text)}
              leftIcon="card"
              placeholder="12345678"
              error={errors.vat}
              keyboardType="numeric"
            />
          </View>

          <View style={FormStyles.halfInput}>
            <Input
              label="Fecha de Nacimiento *"
              value={formData.born_date}
              onChangeText={(text) => onFieldChange('born_date', formatBirthDate(text))}
              leftIcon="calendar"
              placeholder="DD-MM-AAAA"
              error={errors.born_date}
              maxLength={10}
              keyboardType="numeric"
            />
          </View>
          <View style={FormStyles.halfInput}>
            <GenderSelectorDropdown
              value={formData.sex}
              onChange={(value) => onFieldChange('sex', value)}
              error={errors.sex}
            />
          </View>

          <BloodTypeSelectorDropdown
            value={formData.blood_type}
            onChange={(value) => onFieldChange('blood_type', value)}
            error={errors.blood_type}
          />
        </View>
      </View>

      {/* Sección: Contacto */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="call" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Contacto</Text>
        </View>

        <View style={styles.sectionContent}>
          <Input
            label="Email *"
            value={formData.email}
            onChangeText={(text) => onFieldChange('email', text)}
            leftIcon="mail"
            keyboardType="email-address"
            placeholder="correo@ejemplo.com"
            error={errors.email}
          />

          <Input
            label="Teléfono *"
            value={formData.phone}
            onChangeText={(text) => onFieldChange('phone', text)}
            leftIcon="call"
            keyboardType="phone-pad"
            placeholder="04141234567"
            error={errors.phone}
          />

          <Input
            label="Teléfono Residencia"
            value={formData.resident_number}
            onChangeText={(text) => onFieldChange('resident_number', text)}
            leftIcon="home"
            keyboardType="phone-pad"
            placeholder="02121234567"
            error={errors.resident_number}
          />

          <Input
            label="Teléfono Emergencia *"
            value={formData.emergency_phone_number}
            onChangeText={(text) => onFieldChange('emergency_phone_number', text)}
            leftIcon="warning"
            keyboardType="phone-pad"
            placeholder="04241234567"
            error={errors.emergency_phone_number}
          />
        </View>
      </View>

      {/* Sección: Dirección */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="location" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Dirección</Text>
        </View>

        <View style={styles.sectionContent}>
          <Input
            label="Calle/Avenida *"
            value={formData.street}
            onChangeText={(text) => onFieldChange('street', text)}
            leftIcon="location"
            placeholder="Av. Principal"
            error={errors.street}
          />

          <StudentLivesSelector
            value={formData.student_lives}
            onChange={(value) => onFieldChange('student_lives', value)}
            error={errors.student_lives}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  photoSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }
    }),
  },
  photoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  photoContent: {
    padding: 5,
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      }
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 14,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.1,
  },
  sectionContent: {
    padding: 5,
    gap: 5,
  },
});
