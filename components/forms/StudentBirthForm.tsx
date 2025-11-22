import React from 'react';
import { Text, View } from 'react-native';
import { GlobalStyles } from '../../constants/Styles';
import { BirthData } from '../../hooks';
import { YesNoSelectorDropdown } from '../selectors';
import { Input } from '../ui/Input';

interface StudentBirthFormProps {
  data: BirthData;
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
}

export const StudentBirthForm: React.FC<StudentBirthFormProps> = ({
  data,
  errors,
  onFieldChange,
}) => {
  const isYes = (value: string) => 
    value.toLowerCase() === 'si' || value.toLowerCase() === 'sí';

  return (
    <View style={GlobalStyles.contentPadding}>
      <Text style={GlobalStyles.subsectionTitle}>Complicaciones de Salud</Text>

      <YesNoSelectorDropdown
        label="¿Sufre alguna enfermedad o está en tratamiento?"
        value={data.suffer_illness_treatment}
        onChange={(value) => onFieldChange('suffer_illness_treatment', value)}
        error={errors.suffer_illness_treatment}
        required
      />

      {isYes(data.suffer_illness_treatment) && (
        <Input
          label="¿Cuál enfermedad o tratamiento? *"
          placeholder="Especifique..."
          value={data.what_illness_treatment}
          onChangeText={(text) => onFieldChange('what_illness_treatment', text)}
          leftIcon="medical"
          error={errors.what_illness_treatment}
        />
      )}

      <YesNoSelectorDropdown
        label="¿Autoriza atención primaria en la institución?"
        value={data.authorize_primary_atention}
        onChange={(value) => onFieldChange('authorize_primary_atention', value)}
        error={errors.authorize_primary_atention}
        required
      />

      <Text style={GlobalStyles.subsectionTitle}>Información del Embarazo</Text>

      <YesNoSelectorDropdown
        label="¿El embarazo llegó a término?"
        value={data.pregnat_finished}
        onChange={(value) => onFieldChange('pregnat_finished', value)}
        error={errors.pregnat_finished}
        required
      />

      <Input
        label="Tiempo de Gestación *"
        placeholder="9 meses / 40 semanas"
        value={data.gestation_time}
        onChangeText={(text) => onFieldChange('gestation_time', text)}
        leftIcon="time"
        error={errors.gestation_time}
      />

      <Input
        label="Peso al Nacer (kg) *"
        placeholder="3,5"
        value={data.peso_al_nacer ? String(data.peso_al_nacer).replace('.', ',') : ''}
        onChangeText={(text) => onFieldChange('peso_al_nacer', text.replace(',', '.'))}
        leftIcon="fitness"
        keyboardType="decimal-pad"
        error={errors.peso_al_nacer}
      />

      <YesNoSelectorDropdown
        label="¿Hubo complicaciones en el nacimiento?"
        value={data.born_complication}
        onChange={(value) => onFieldChange('born_complication', value)}
        error={errors.born_complication}
        required
      />

      {isYes(data.born_complication) && (
        <Input
          label="¿Qué complicación? *"
          placeholder="Especifique la complicación"
          value={data.complication}
          onChangeText={(text) => onFieldChange('complication', text)}
          leftIcon="alert-circle"
          error={errors.complication}
        />
      )}
    </View>
  );
};
