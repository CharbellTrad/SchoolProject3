import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { listStyles } from '../../../constants/Styles';
import { Student } from '../../../services-odoo/personService';
import { formatDateToDisplay, formatGender, formatPhone, formatYesNo } from '../../../utils/formatHelpers';
import { cleanBase64 } from '../../../utils/pdfUtils';
import { InfoRow, InfoSection } from '../../list';
import { DocumentViewer } from '../../ui/DocumentViewer';

interface ParentsTabProps {
  student: Student;
}

export const ParentsTab: React.FC<ParentsTabProps> = ({ student }) => {
  const [expandedParent, setExpandedParent] = useState<number | null>(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [currentDocument, setCurrentDocument] = useState<{
    uri: string;
    type: 'image' | 'pdf';
    filename: string;
  } | null>(null);

  const openDocument = (uri: string, filename: string) => {
    const isPdf = filename.toLowerCase().endsWith('.pdf') || 
                  cleanBase64(uri).startsWith('JVBERi0');
    
    setCurrentDocument({
      uri,
      type: isPdf ? 'pdf' : 'image',
      filename,
    });
    setViewerVisible(true);
  };

  const closeViewer = () => {
    setViewerVisible(false);
    setTimeout(() => {
      setCurrentDocument(null);
    }, 300);
  };

  if (!student.parents || student.parents.length === 0) {
    return (
      <InfoSection title="Representantes del Estudiante">
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No hay representantes registrados</Text>
        </View>
      </InfoSection>
    );
  }

  return (
    <>
      <InfoSection title="Representantes del Estudiante">
        {student.parents.map((parent) => {
          const isExpanded = expandedParent === parent.id;

          return (
            <View key={parent.id} style={listStyles.card}>
              <TouchableOpacity
                onPress={() => setExpandedParent(isExpanded ? null : parent.id)}
                style={listStyles.cardMain}
              >
                {/* ========== AVATAR CLICKEABLE ========== */}
                <View style={listStyles.avatarContainer}>
                  {parent.image_1920 ? (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation(); // Evitar que abra/cierre el accordion
                        openDocument(parent.image_1920!, `${parent.name}_foto.jpg`);
                      }}
                      activeOpacity={0.8}
                      style={{
                        position: 'relative',
                        width: 50,
                        height: 50,
                        borderRadius: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        source={{ uri: `data:image/jpeg;base64,${parent.image_1920}` }}
                        style={styles.parentAvatar}
                        resizeMode='cover'
                      />
                      {/* Indicador de expandir */}
                      <View style={{
                        position: 'absolute',
                        bottom: 2,
                        right: 2,
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Ionicons name="expand" size={10} color="#fff" />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <Ionicons name="person" size={32} color={Colors.primary} />
                  )}
                </View>

                <View style={listStyles.cardInfo}>
                  <Text style={listStyles.cardName} numberOfLines={1}>{parent.name}</Text>
                  <Text style={listStyles.cardDetail}>
                    <Ionicons name="card" size={14} color={Colors.textSecondary} /> {parent.nationality}-{parent.vat}
                  </Text>
                  <Text style={listStyles.cardDetail}>
                    <Ionicons name="call" size={14} color={Colors.textSecondary} /> {formatPhone(parent.phone)}
                  </Text>
                </View>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  <InfoRow label="Fecha de Nacimiento" value={formatDateToDisplay(parent.born_date)} icon="calendar" />
                  <InfoRow label="Edad" value={parent.age ? `${parent.age} años` : 'No disponible'} icon="time" />
                  <InfoRow label="Género" value={formatGender(parent.sex)} icon={parent.sex === 'M' ? 'male' : 'female'} />
                  <InfoRow label="Email" value={parent.email || "No disponible"} icon="mail" />
                  <InfoRow label="Teléfono Residencia" value={formatPhone(parent.resident_number)} icon="home" />
                  <InfoRow label="Teléfono Emergencia" value={formatPhone(parent.emergency_phone_number)} icon="warning" />

                  {parent.street && <InfoRow label="Dirección" value={parent.street} icon="location" />}

                  <InfoRow label="¿Vive con el estudiante?" value={formatYesNo(parent.live_with_student)} icon="home" />
                  <InfoRow label="¿Tiene empleo?" value={formatYesNo(parent.active_job)} icon="briefcase" />
                  <InfoRow label="Lugar de Trabajo" value={parent.job_place || "No disponible"} icon="business" />
                  <InfoRow label="Cargo" value={parent.job || "No disponible"} icon="briefcase" />

                  {parent.ci_document && (
                    <View style={styles.documentSection}>
                      <Text style={styles.documentSectionTitle}>Cédula de Identidad</Text>
                      <TouchableOpacity 
                        onPress={() => openDocument(
                          parent.ci_document!,
                          parent.ci_document_filename || `cedula_${parent.name}.pdf`
                        )}
                        activeOpacity={0.8}
                      >
                        <View style={styles.documentPreview}>
                          <Image
                            source={{ uri: `data:image/jpeg;base64,${cleanBase64(parent.ci_document)}` }}
                            style={styles.documentImage}
                            resizeMode='contain'
                          />
                          <View style={styles.imageOverlay}>
                            <View style={styles.expandIconContainer}>
                              <Ionicons name="expand" size={20} color="#fff" />
                            </View>
                          </View>
                        </View>
                        <Text style={styles.tapToViewText}>Toca para ver completo</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {parent.parent_singnature && (
                    <View style={styles.documentSection}>
                      <Text style={styles.documentSectionTitle}>Firma</Text>
                      <TouchableOpacity 
                        onPress={() => openDocument(
                          parent.parent_singnature!,
                          `firma_${parent.name}.jpg`
                        )}
                        activeOpacity={0.8}
                      >
                        <View style={styles.documentPreview}>
                          <Image
                            source={{ uri: `data:image/jpeg;base64,${cleanBase64(parent.parent_singnature)}` }}
                            style={styles.signatureImage}
                            resizeMode='contain'
                          />
                          <View style={styles.imageOverlay}>
                            <View style={styles.expandIconContainer}>
                              <Ionicons name="expand" size={20} color="#fff" />
                            </View>
                          </View>
                        </View>
                        <Text style={styles.tapToViewText}>Toca para ver completo</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </InfoSection>

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
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  parentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  documentSection: {
    marginTop: 16,
  },
  documentSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 10,
  },
  documentPreview: {
    position: 'relative',
    width: '100%',
    height: 300,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  signatureImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f9fafb',
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapToViewText: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
});