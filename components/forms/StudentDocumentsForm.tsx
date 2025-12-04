import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';
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
  getFileType?: (key: string) => 'image' | 'pdf';
  getImage?: (key: string) => { base64?: string; filename?: string } | undefined;
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
  getFileType, 
  getImage,  
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos Entregados</Text>
        
        <TouchableOpacity
          style={[styles.checkbox, brownFolder && styles.checkboxActive]}
          onPress={onToggleBrownFolder}
          activeOpacity={0.7}
        >
          <View style={[styles.checkboxIcon, brownFolder && styles.checkboxIconActive]}>
            <Ionicons 
              name={brownFolder ? "checkmark" : "close"} 
              size={20} 
              color={brownFolder ? Colors.success : 'transparent'} 
            />
          </View>
          <Text style={[styles.checkboxLabel, brownFolder && styles.checkboxLabelActive]}>
            Carpeta Marrón Tamaño Oficio
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.checkbox, boletinInformative && styles.checkboxActive]}
          onPress={onToggleBoletinInformative}
          activeOpacity={0.7}
        >
          <View style={[styles.checkboxIcon, boletinInformative && styles.checkboxIconActive]}>
            <Ionicons 
              name={boletinInformative ? "checkmark" : "close"} 
              size={20} 
              color={boletinInformative ? Colors.success : 'transparent'} 
            />
          </View>
          <Text style={[styles.checkboxLabel, boletinInformative && styles.checkboxLabelActive]}>
            Boletín Informativo
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos Requeridos</Text>
        
        <View style={styles.documentItem}>
          <Text style={styles.documentLabel}>Cédula de Identidad *</Text>
          <Text style={styles.documentHint}>Formatos: JPG, PNG, PDF</Text>
          <ImagePickerComponent
            value={ciDocument}
            onImageSelected={onCiDocumentSelected}
            circular={false}
            acceptPDF={true}
            initialFileType={getFileType ? getFileType('ci_document') : undefined}
            initialFilename={getImage ? getImage('ci_document')?.filename : undefined}
          />
        </View>

        <View style={styles.documentItem}>
          <Text style={styles.documentLabel}>Partida de Nacimiento *</Text>
          <Text style={styles.documentHint}>Formatos: JPG, PNG, PDF</Text>
          <ImagePickerComponent
            value={bornDocument}
            onImageSelected={onBornDocumentSelected}
            circular={false}
            acceptPDF={true}
            initialFileType={getFileType ? getFileType('born_document') : undefined}
            initialFilename={getImage ? getImage('born_document')?.filename : undefined}
          />
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  checkboxActive: {
    backgroundColor: '#f0fdf4',
    borderColor: Colors.success,
  },
  checkboxIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxIconActive: {
    backgroundColor: Colors.success + '20',
    borderColor: Colors.success,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  checkboxLabelActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  documentItem: {
    marginBottom: 24,
  },
  documentLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  documentHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '500',
  },
});