import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { Student } from '../../../services-odoo/personService';
import { YesNoSelectorDropdown } from '../../selectors';
import { Input } from '../../ui/Input';

interface EditBirthTabProps {
  formData: Student;
  errors: Record<string, string>;
  onFieldChange: (field: keyof Student, value: any) => void;
}

export const EditBirthTab: React.FC<EditBirthTabProps> = ({
  formData,
  errors,
  onFieldChange,
}) => {
  const isYes = (value?: string) => 
    value?.toLowerCase() === 'si' || value?.toLowerCase() === 'sí';

  return (
    <View style={styles.container}>
      {/* Sección: Complicaciones de Salud */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="medical" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Complicaciones de Salud</Text>
        </View>

        <View style={styles.sectionContent}>
          <YesNoSelectorDropdown
            label="¿Sufre alguna enfermedad o está en tratamiento?"
            value={formData.suffer_illness_treatment}
            onChange={(value) => onFieldChange('suffer_illness_treatment', value)}
            error={errors.suffer_illness_treatment}
            required
          />

          {isYes(formData.suffer_illness_treatment) && (
            <View style={styles.conditionalField}>
              <Input
                label="¿Cuál enfermedad o tratamiento?"
                value={formData.what_illness_treatment || ''}
                onChangeText={(text) => onFieldChange('what_illness_treatment', text)}
                leftIcon="list"
                placeholder="Especifique..."
                error={errors.what_illness_treatment}
              />
            </View>
          )}

          <YesNoSelectorDropdown
            label="¿Autoriza atención primaria en la institución?"
            value={formData.authorize_primary_atention}
            onChange={(value) => onFieldChange('authorize_primary_atention', value)}
            error={errors.authorize_primary_atention}
            required
          />
        </View>
      </View>

      {/* Sección: Información del Embarazo */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="heart" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Información del Embarazo</Text>
        </View>

        <View style={styles.sectionContent}>
          <YesNoSelectorDropdown
            label="¿El embarazo llegó a término?"
            value={formData.pregnat_finished}
            onChange={(value) => onFieldChange('pregnat_finished', value)}
            error={errors.pregnat_finished}
            required
          />

          <Input
            label="Tiempo de Gestación"
            value={formData.gestation_time}
            onChangeText={(text) => onFieldChange('gestation_time', text)}
            leftIcon="time"
            placeholder="9 meses / 40 semanas"
            error={errors.gestation_time}
          />

          <Input
            label="Peso al Nacer (kg)"
            value={formData.peso_al_nacer ? String(formData.peso_al_nacer).replace('.', ',') : ''}
            onChangeText={(text) => {
              const formattedText = text.replace(',', '.');
              onFieldChange('peso_al_nacer', formattedText);
            }}
            leftIcon="fitness"
            keyboardType="decimal-pad"
            placeholder="3,5"
            error={errors.peso_al_nacer}
          />

          <YesNoSelectorDropdown
            label="¿Hubo complicaciones en el nacimiento?"
            value={formData.born_complication}
            onChange={(value) => onFieldChange('born_complication', value)}
            error={errors.born_complication}
            required
          />

          {isYes(formData.born_complication) && (
            <View style={styles.conditionalField}>
              <Input
                label="¿Qué complicación?"
                value={formData.complication || ''}
                onChangeText={(text) => onFieldChange('complication', text)}
                leftIcon="alert-circle"
                placeholder="Especifique la complicación"
                error={errors.complication}
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 20,
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
  conditionalField: {
    marginTop: -4,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary + '30',
  },
});
