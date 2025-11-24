import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { listStyles } from '../../../constants/Styles';
import { Student } from '../../../services-odoo/personService';
import { ImagePickerComponent } from '../../ImagePicker';

interface EditDocumentsTabProps {
  formData: Student;
  onFieldChange: (field: keyof Student, value: any) => void;
  ciDocument?: string;
  bornDocument?: string;
  onCiDocumentSelected: (base64: string, filename: string) => void;
  onBornDocumentSelected: (base64: string, filename: string) => void;
}

export const EditDocumentsTab: React.FC<EditDocumentsTabProps> = ({
  formData,
  onFieldChange,
  ciDocument,
  bornDocument,
  onCiDocumentSelected,
  onBornDocumentSelected,
}) => {
  return (
    <View style={listStyles.editSection}>
      <Text style={listStyles.editSectionTitle}>Documentos</Text>
      <Text style={styles.sectionTitle}>Documentos Entregados</Text>

      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onFieldChange('brown_folder', !formData.brown_folder)}
      >
        <Ionicons 
          name={formData.brown_folder ? "checkbox" : "square-outline"} 
          size={28} 
          color={formData.brown_folder ? Colors.success : Colors.textSecondary} 
        />
        <Text style={styles.checkboxLabel}>
          Carpeta Marrón Tamaño Oficio
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onFieldChange('boletin_informative', !formData.boletin_informative)}
      >
        <Ionicons 
          name={formData.boletin_informative ? "checkbox" : "square-outline"} 
          size={28} 
          color={formData.boletin_informative ? Colors.success : Colors.textSecondary} 
        />
        <Text style={styles.checkboxLabel}>
          Boletín Informativo
        </Text>
      </TouchableOpacity>

      <View style={styles.documentSection}>
        <Text style={styles.sectionTitle}>Cédula de Identidad</Text>
        <Text style={styles.hint}>Formatos aceptados: JPG, PNG, PDF</Text>
        <ImagePickerComponent
          value={ciDocument}
          onImageSelected={onCiDocumentSelected}
          circular={false}
          acceptPDF={true}
        />
      </View>

      <View style={styles.documentSection}>
        <Text style={styles.sectionTitle}>Partida de Nacimiento</Text>
        <Text style={styles.hint}>Formatos aceptados: JPG, PNG, PDF</Text>
        <ImagePickerComponent
          value={bornDocument}
          onImageSelected={onBornDocumentSelected}
          circular={false}
          acceptPDF={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 12,
  },
  checkboxLabel: {
    marginLeft: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  documentSection: {
    marginBottom: 24,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
});
