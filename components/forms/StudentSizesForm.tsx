import React from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { SizesJson } from '../../services-odoo/personService';
import { ShirtSizeSelector } from '../selectors';
import { Input } from '../ui/Input';

interface StudentSizesFormProps {
  data: SizesJson;
  onFieldChange: (field: keyof SizesJson, value: any) => void;
}

export const StudentSizesForm: React.FC<StudentSizesFormProps> = ({
  data,
  onFieldChange,
}) => {
  const normalizeDecimal = (text: string) => text.replace(',', '.');

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.layout}>
          <View style={styles.imageSection}>
            <Image
              source={require('../../assets/images/body-diagram.png')}
              style={styles.image}
              resizeMode='contain'
            />
          </View>

          <View style={styles.formSection}>
            <Input
              label="Altura (m)"
              placeholder="Ej: 1,65"
              value={data.height ? String(data.height).replace('.', ',') : ''}
              onChangeText={(text) => onFieldChange('height', normalizeDecimal(text))}
              keyboardType="decimal-pad"
              leftIcon="resize"
            />

            <Input
              label="Peso (kg)"
              placeholder="Ej: 50"
              value={data.weight ? String(data.weight).replace('.', ',') : ''}
              onChangeText={(text) => onFieldChange('weight', normalizeDecimal(text))}
              keyboardType="decimal-pad"
              leftIcon="fitness"
            />

            <ShirtSizeSelector
              value={data.size_shirt || ''}
              onChange={(value) => onFieldChange('size_shirt', value)}
            />

            <Input
              label="Talla Pantalón"
              placeholder="Ej: 28, 30, 32"
              value={data.size_pants?.toString() || ''}
              onChangeText={(text) => onFieldChange('size_pants', text ? parseFloat(text) : 0)}
              leftIcon="body"
              keyboardType="numeric"
            />

            <Input
              label="Talla Zapatos"
              placeholder="Ej: 35, 36, 37"
              value={data.size_shoes?.toString() || ''}
              onChangeText={(text) => onFieldChange('size_shoes', text ? parseFloat(text) : 0)}
              keyboardType="numeric"
              leftIcon="footsteps"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      }
    }),
  },
  layout: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  imageSection: {
    width: 100,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  image: {
    width: 175,
    height: 420,
  },
  formSection: {
    flex: 1,
  },
});
