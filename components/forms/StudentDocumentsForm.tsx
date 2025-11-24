import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
import { FormStyles, GlobalStyles } from '../../constants/Styles';
import { ImagePickerComponent } from '../ImagePicker';

interface StudentDocumentsFormProps {
  brownFolder: boolean;
  boletinInformative: boolean;
  onToggleBrownFolder: () => void;
  onToggleBoletinInformative: () => void;
  ciDocument?: string;
  bornDocument?: string;
  onCiDocumentSelected: (base64: string, filename: string) => void;
  onBornDocumentSelected: (base64: string, filename: string) => void;
}

export const StudentDocumentsForm: React.FC<StudentDocumentsFormProps> = ({
  brownFolder,
  boletinInformative,
  onToggleBrownFolder,
  onToggleBoletinInformative,
  ciDocument,
  bornDocument,
  onCiDocumentSelected,
  onBornDocumentSelected,
}) => {
  return (
    <View style={GlobalStyles.contentPadding}>
      <Text style={GlobalStyles.subsectionTitle}>Documentos Requeridos</Text>
      
      <View style={FormStyles.section}>
        <Text style={FormStyles.label}>Documentos Entregados *</Text>
        
        <TouchableOpacity
          style={styles.checkbox}
          onPress={onToggleBrownFolder}
        >
          <Ionicons 
            name={brownFolder ? "checkbox" : "square-outline"} 
            size={28} 
            color={brownFolder ? Colors.success : Colors.textSecondary} 
          />
          <Text style={styles.checkboxLabel}>
            Carpeta Marrón Tamaño Oficio
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.checkbox}
          onPress={onToggleBoletinInformative}
        >
          <Ionicons 
            name={boletinInformative ? "checkbox" : "square-outline"} 
            size={28} 
            color={boletinInformative ? Colors.success : Colors.textSecondary} 
          />
          <Text style={styles.checkboxLabel}>
            Boletín Informativo
          </Text>
        </TouchableOpacity>
      </View>

      <View style={FormStyles.section}>
        <Text style={FormStyles.label}>Cédula de Identidad *</Text>
        <Text style={FormStyles.hint}>Formatos aceptados: JPG, PNG, PDF</Text>
        <ImagePickerComponent
          value={ciDocument}
          onImageSelected={onCiDocumentSelected}
          circular={false}
          acceptPDF={true}
        />
      </View>

      <View style={FormStyles.section}>
        <Text style={FormStyles.label}>Partida de Nacimiento *</Text>
        <Text style={FormStyles.hint}>Formatos aceptados: JPG, PNG, PDF</Text>
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
});
