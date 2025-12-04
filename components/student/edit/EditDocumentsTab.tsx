import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { Student } from '../../../services-odoo/personService';
import { ImagePickerComponent } from '../../ImagePicker';

interface EditDocumentsTabProps {
  formData: Student;
  onFieldChange: (field: keyof Student, value: any) => void;
  ciDocument?: string;
  bornDocument?: string;
  onCiDocumentSelected: (base64: string, filename: string) => void;
  onBornDocumentSelected: (base64: string, filename: string) => void;
  getFileType?: (key: string) => 'image' | 'pdf';
}

export const EditDocumentsTab: React.FC<EditDocumentsTabProps> = ({
  formData,
  onFieldChange,
  ciDocument,
  bornDocument,
  onCiDocumentSelected,
  onBornDocumentSelected,
  getFileType, 
}) => {
  return (
    <View style={styles.container}>
      {/* Sección: Documentos Entregados */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="checkmark-done" size={20} color={Colors.primary} />
          </View>
          <Text style={styles.sectionTitle}>Documentos Entregados</Text>
        </View>

        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={[
              styles.checkbox,
              formData.brown_folder && styles.checkboxChecked
            ]}
            onPress={() => onFieldChange('brown_folder', !formData.brown_folder)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxIconBox}>
              <Ionicons 
                name={formData.brown_folder ? "checkbox" : "square-outline"} 
                size={26} 
                color={formData.brown_folder ? Colors.success : Colors.textSecondary} 
              />
            </View>
            <Text style={[
              styles.checkboxLabel,
              formData.brown_folder && styles.checkboxLabelChecked
            ]}>
              Carpeta Marrón Tamaño Oficio
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.checkbox,
              formData.boletin_informative && styles.checkboxChecked
            ]}
            onPress={() => onFieldChange('boletin_informative', !formData.boletin_informative)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxIconBox}>
              <Ionicons 
                name={formData.boletin_informative ? "checkbox" : "square-outline"} 
                size={26} 
                color={formData.boletin_informative ? Colors.success : Colors.textSecondary} 
              />
            </View>
            <Text style={[
              styles.checkboxLabel,
              formData.boletin_informative && styles.checkboxLabelChecked
            ]}>
              Boletín Informativo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sección: Cédula de Identidad */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="card" size={20} color={Colors.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.sectionTitle}>Cédula de Identidad</Text>
            <Text style={styles.hint}>Formatos: JPG, PNG, PDF</Text>
          </View>
        </View>

        <View style={styles.sectionContent}>
          <ImagePickerComponent
            value={ciDocument}
            onImageSelected={onCiDocumentSelected}
            circular={false}
            acceptPDF={true}
            initialFileType={getFileType ? getFileType('ci_document') : undefined}
            initialFilename={formData.ci_document_filename || 'ci_document.pdf'}
          />
        </View>
      </View>

      {/* Sección: Partida de Nacimiento */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.iconBox}>
            <Ionicons name="document-text" size={20} color={Colors.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.sectionTitle}>Partida de Nacimiento</Text>
            <Text style={styles.hint}>Formatos: JPG, PNG, PDF</Text>
          </View>
        </View>

        <View style={styles.sectionContent}>
          <ImagePickerComponent
            value={bornDocument}
            onImageSelected={onBornDocumentSelected}
            circular={false}
            acceptPDF={true}
            initialFileType={getFileType ? getFileType('born_document') : undefined}
            initialFilename={formData.born_document_filename || 'born_document.pdf'}
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
  headerTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.1,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionContent: {
    padding: 5,
    gap: 12,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 5,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    gap: 12,
  },
  checkboxChecked: {
    backgroundColor: Colors.success + '08',
    borderColor: Colors.success + '40',
  },
  checkboxIconBox: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  checkboxLabelChecked: {
    color: Colors.success,
    fontWeight: '700',
  },
});