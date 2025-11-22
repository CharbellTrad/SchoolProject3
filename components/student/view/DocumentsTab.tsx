import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { Student } from '../../../services-odoo/personService';
import { InfoSection } from '../../list';

interface DocumentsTabProps {
  student: Student;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ student }) => {
  return (
    <InfoSection title="Documentos">
      <View style={styles.deliveredSection}>
        <Text style={styles.sectionTitle}>Documentos Entregados</Text>
        
        <View style={styles.checkboxRow}>
          <Ionicons 
            name={student.brown_folder ? "checkbox" : "square-outline"} 
            size={24} 
            color={student.brown_folder ? Colors.success : Colors.textSecondary} 
          />
          <Text style={styles.checkboxLabel}>Carpeta Marrón Tamaño Oficio</Text>
        </View>
        
        <View style={styles.checkboxRow}>
          <Ionicons 
            name={student.boletin_informative ? "checkbox" : "square-outline"} 
            size={24} 
            color={student.boletin_informative ? Colors.success : Colors.textSecondary} 
          />
          <Text style={styles.checkboxLabel}>Boletín Informativo</Text>
        </View>
      </View>

      <View style={styles.documentSection}>
        <Text style={styles.sectionTitle}>Cédula de Identidad</Text>
        {student.ci_document ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${student.ci_document}` }}
            style={styles.documentImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.notAvailable}>No disponible</Text>
        )}
      </View>

      <View style={styles.documentSection}>
        <Text style={styles.sectionTitle}>Partida de Nacimiento</Text>
        {student.born_document ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${student.born_document}` }}
            style={styles.documentImage}
            resizeMode="contain"
          />
        ) : (
          <Text style={styles.notAvailable}>No disponible</Text>
        )}
      </View>
    </InfoSection>
  );
};

const styles = StyleSheet.create({
  deliveredSection: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  documentSection: {
    marginBottom: 20,
  },
  documentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  notAvailable: {
    color: Colors.textSecondary,
  },
});
