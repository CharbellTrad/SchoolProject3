import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { Student } from '../../../services-odoo/personService';
import { cleanBase64 } from '../../../utils/pdfUtils';
import { InfoSection } from '../../list';
import { DocumentViewer } from '../../ui/DocumentViewer';

interface DocumentsTabProps {
  student: Student;
}

export const DocumentsTab: React.FC<DocumentsTabProps> = ({ student }) => {
  // ========== ESTADO PARA CONTROLAR MODALES ==========
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{
    uri: string;
    type: 'image' | 'pdf';
    filename: string;
  } | null>(null);

  // ========== FUNCIÓN PARA ABRIR DOCUMENTO ==========
  const openDocument = (uri: string, filename: string) => {
    // Detectar si es PDF por el filename o por el contenido base64
    const isPdf = filename.toLowerCase().endsWith('.pdf') || 
                  cleanBase64(uri).startsWith('JVBERi0');
    
    setCurrentDocument({
      uri,
      type: isPdf ? 'pdf' : 'image',
      filename,
    });
    setViewerVisible(true);
  };

  // ========== FUNCIÓN PARA CERRAR VISOR ==========
  const closeViewer = () => {
    setViewerVisible(false);
    // Pequeño delay antes de limpiar para animación suave
    setTimeout(() => {
      setCurrentDocument(null);
    }, 300);
  };

  return (
    <>
      <InfoSection title="Documentos">
        {/* ========== DOCUMENTOS ENTREGADOS ========== */}
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

        {/* ========== CÉDULA DE IDENTIDAD ========== */}
        <View style={styles.documentSection}>
          <Text style={styles.sectionTitle}>Cédula de Identidad</Text>
          {student.ci_document ? (
            <TouchableOpacity 
              onPress={() => openDocument(
                student.ci_document!, 
                student.ci_document_filename || 'cedula.pdf'
              )}
              activeOpacity={0.8}
            >
              <View style={styles.documentPreview}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${cleanBase64(student.ci_document)}` }}
                  style={styles.documentImage}
                  resizeMode='contain'
                />
                {/* Overlay con icono de expandir */}
                <View style={styles.imageOverlay}>
                  <View style={styles.expandIconContainer}>
                    <Ionicons name="expand" size={24} color="#fff" />
                  </View>
                </View>
              </View>
              <Text style={styles.tapToViewText}>Toca para ver completo</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.notAvailable}>No disponible</Text>
          )}
        </View>

        {/* ========== PARTIDA DE NACIMIENTO ========== */}
        <View style={styles.documentSection}>
          <Text style={styles.sectionTitle}>Partida de Nacimiento</Text>
          {student.born_document ? (
            <TouchableOpacity 
              onPress={() => openDocument(
                student.born_document!, 
                student.born_document_filename || 'partida.pdf'
              )}
              activeOpacity={0.8}
            >
              <View style={styles.documentPreview}>
                <Image
                  source={{ uri: `data:image/jpeg;base64,${cleanBase64(student.born_document)}` }}
                  style={styles.documentImage}
                  resizeMode='contain'
                />
                {/* Overlay con icono de expandir */}
                <View style={styles.imageOverlay}>
                  <View style={styles.expandIconContainer}>
                    <Ionicons name="expand" size={24} color="#fff" />
                  </View>
                </View>
              </View>
              <Text style={styles.tapToViewText}>Toca para ver completo</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.notAvailable}>No disponible</Text>
          )}
        </View>
      </InfoSection>

      {/* ========== MODAL DE VISUALIZACIÓN ========== */}
      {currentDocument && (
        <DocumentViewer
          visible={viewerVisible}
          uri={currentDocument.uri}
          fileType={currentDocument.type}
          filename={currentDocument.filename}
          onClose={closeViewer}
        />
      )}
    </>
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
    color: Colors.textPrimary,
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
  documentPreview: {
    position: 'relative',
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapToViewText: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  notAvailable: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontStyle: 'italic',
  },
});