import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
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
    <View style={styles.container}>
      {/* Sección: Medidas Corporales */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="resize" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Medidas Corporales</Text>
        </View>

        <View style={styles.sectionContent}>
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
        </View>
      </View>

      {/* Sección: Tallas de Ropa y Calzado */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="shirt" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Tallas de Ropa y Calzado</Text>
        </View>

        <View style={styles.sectionContent}>
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
});
