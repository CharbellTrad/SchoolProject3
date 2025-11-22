import React from 'react';
import { Text, View } from 'react-native';
import { listStyles } from '../../../constants/Styles';
import { SizesJson } from '../../../services-odoo/personService';
import { ShirtSizeSelector } from '../../selectors';
import { Input } from '../../ui/Input';

interface EditSizesTabProps {
  sizesData: SizesJson;
  onFieldChange: (field: keyof SizesJson, value: any) => void;
}

export const EditSizesTab: React.FC<EditSizesTabProps> = ({
  sizesData,
  onFieldChange,
}) => {
  const normalizeDecimal = (text: string) => text.replace(',', '.');

  return (
    <View style={listStyles.editSection}>
      <Text style={listStyles.editSectionTitle}>Tallas Actuales</Text>

      <Input
        label="Altura (m)"
        value={sizesData.height ? String(sizesData.height).replace('.', ',') : ''}
        onChangeText={(text) => onFieldChange('height', normalizeDecimal(text))}
        keyboardType="decimal-pad"
        leftIcon="resize"
        placeholder="1,65"
      />

      <Input
        label="Peso (kg)"
        value={sizesData.weight ? String(sizesData.weight).replace('.', ',') : ''}
        onChangeText={(text) => onFieldChange('weight', normalizeDecimal(text))}
        keyboardType="decimal-pad"
        leftIcon="fitness"
        placeholder="50,5"
      />

      <ShirtSizeSelector
        value={sizesData.size_shirt || ''}
        onChange={(value) => onFieldChange('size_shirt', value)}
      />

      <Input
        label="Talla Pantalón"
        value={sizesData.size_pants?.toString() || ''}
        onChangeText={(text) => onFieldChange('size_pants', text ? parseFloat(text) : 0)}
        leftIcon="body"
        keyboardType="numeric"
        placeholder="28, 30, 32"
      />

      <Input
        label="Talla Zapatos"
        value={sizesData.size_shoes?.toString() || ''}
        onChangeText={(text) => onFieldChange('size_shoes', text ? parseFloat(text) : 0)}
        keyboardType="numeric"
        leftIcon="footsteps"
        placeholder="35, 36, 37"
      />
    </View>
  );
};
