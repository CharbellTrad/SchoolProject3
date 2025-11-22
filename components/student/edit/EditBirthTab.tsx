import React from 'react';
import { Text, View } from 'react-native';
import { listStyles } from '../../../constants/Styles';
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
    <View style={listStyles.editSection}>
      <Text style={listStyles.editSectionTitle}>Complicaciones de Salud</Text>

      <YesNoSelectorDropdown
        label="¿Sufre alguna enfermedad o está en tratamiento?"
        value={formData.suffer_illness_treatment}
        onChange={(value) => onFieldChange('suffer_illness_treatment', value)}
        error={errors.suffer_illness_treatment}
        required
      />

      {isYes(formData.suffer_illness_treatment) && (
        <Input
          label="¿Cuál enfermedad o tratamiento?"
          value={formData.what_illness_treatment || ''}
          onChangeText={(text) => onFieldChange('what_illness_treatment', text)}
          leftIcon="medical"
          placeholder="Especifique..."
          error={errors.what_illness_treatment}
        />
      )}

      <YesNoSelectorDropdown
        label="¿Autoriza atención primaria en la institución?"
        value={formData.authorize_primary_atention}
        onChange={(value) => onFieldChange('authorize_primary_atention', value)}
        error={errors.authorize_primary_atention}
        required
      />

      <Text style={listStyles.editSectionTitle}>Información del Embarazo</Text>

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
        <Input
          label="¿Qué complicación?"
          value={formData.complication || ''}
          onChangeText={(text) => onFieldChange('complication', text)}
          leftIcon="alert-circle"
          placeholder="Especifique la complicación"
          error={errors.complication}
        />
      )}
    </View>
  );
};
