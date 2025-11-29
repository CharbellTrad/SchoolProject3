import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { listStyles } from '../../../constants/Styles';
import { Inscription, Student } from '../../../services-odoo/personService';
import { formatInscriptionType, formatNumber, formatShirtSize } from '../../../utils/formatHelpers';
import { InfoRow, InfoSection } from '../../list';

interface InscriptionsTabProps {
  student: Student;
}

export const InscriptionsTab: React.FC<InscriptionsTabProps> = ({ student }) => {
  const [expandedInscription, setExpandedInscription] = useState<number | null>(null);

  const displayInscriptions = (student.inscriptions || []) as Inscription[];

  if (displayInscriptions.length === 0) {
    return (
      <InfoSection title="Inscripciones del Estudiante">
        <View style={styles.emptyContainer}>
          <Ionicons name="school-outline" size={64} color={Colors.textTertiary} />
          <Text style={styles.emptyText}>No hay inscripciones registradas</Text>
        </View>
      </InfoSection>
    );
  }

  return (
    <InfoSection title="Inscripciones del Estudiante">
      {displayInscriptions
        .sort((a, b) => {
          const order = { done: 0, draft: 1, cancel: 2 };
          return order[a.state] - order[b.state];
        })
        .map((inscription, index) => {
          const isExpanded = expandedInscription === inscription.id;
          const isActive = inscription.state === 'done';

          return (
            <View
              key={inscription.id}
              style={[
                listStyles.card,
                styles.inscriptionCard,
                {
                  borderLeftColor:
                    inscription.state === 'done' ? Colors.success :
                      inscription.state === 'cancel' ? Colors.error :
                        Colors.warning,
                }
              ]}
            >
              <TouchableOpacity
                onPress={() => setExpandedInscription(isExpanded ? null : inscription.id)}
                style={listStyles.cardMain}
              >
                <View style={styles.inscriptionHeader}>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>ACTIVA</Text>
                    </View>
                  )}

                  <Text style={styles.inscriptionName} numberOfLines={2}>
                    {inscription.name || `Inscripción ${index + 1}`}
                  </Text>

                  <Text style={[listStyles.cardDetail, styles.inscriptionDetail]}>
                    {inscription.year_id} • {inscription.section_id} • {formatInscriptionType(inscription.type)}
                  </Text>

                  <Text style={[listStyles.cardDetail, styles.inscriptionDate]}>
                    <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                    Fecha: {inscription.inscription_date}
                  </Text>
                </View>

                <View style={styles.inscriptionActions}>
                  <View
                    style={[
                      listStyles.statusBadge,
                      {
                        backgroundColor:
                          inscription.state === 'done' ? Colors.success + '20' :
                            inscription.state === 'cancel' ? Colors.error + '20' :
                              Colors.warning + '20',
                      }
                    ]}
                  >
                    <Text style={[
                      listStyles.statusText,
                      {
                        color:
                          inscription.state === 'done' ? Colors.success :
                            inscription.state === 'cancel' ? Colors.error :
                              Colors.warning,
                      }
                    ]}>
                      {inscription.state === 'done' ? 'Inscrito' :
                        inscription.state === 'cancel' ? 'Cancelada' : 'Borrador'}
                    </Text>
                  </View>

                  <Ionicons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={24}
                    color={Colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  {(inscription.from_school || inscription.observations || inscription.uninscription_date) && (
                    <>
                      <View style={styles.sectionSpacer}>
                        <Text style={listStyles.editSectionTitle}>Información General</Text>
                      </View>

                      {inscription.from_school && (
                        <InfoRow label="Procedencia" value={inscription.from_school} icon="business" />
                      )}

                      {inscription.observations && (
                        <InfoRow label="Observaciones" value={inscription.observations} icon="document-text" />
                      )}

                      {inscription.uninscription_date && (
                        <InfoRow label="Fecha de Desinscripción" value={inscription.uninscription_date} icon="calendar-outline" />
                      )}

                      <View style={styles.sectionSpacer} />
                    </>
                  )}

                  {(inscription.height || inscription.weight || inscription.size_shirt) && (
                    <>
                      <View style={styles.sectionSpacer}>
                        <Text style={listStyles.editSectionTitle}>Tallas Registradas</Text>
                      </View>

                      {inscription.height && <InfoRow label="Altura" value={`${formatNumber(inscription.height, 2)} m`} icon="resize" />}
                      {inscription.weight && <InfoRow label="Peso" value={`${formatNumber(inscription.weight, 1)} kg`} icon="fitness" />}
                      {inscription.size_shirt && <InfoRow label="Talla Camisa" value={formatShirtSize(inscription.size_shirt)} icon="shirt" />}
                      {inscription.size_pants && <InfoRow label="Talla Pantalón" value={formatNumber(inscription.size_pants, 0)} icon="body" />}
                      {inscription.size_shoes && <InfoRow label="Talla Zapatos" value={formatNumber(inscription.size_shoes, 0)} icon="footsteps" />}

                      <View style={styles.sectionSpacer} />
                    </>
                  )}

                  {inscription.parent_singnature && (
                    <>
                      <View style={styles.sectionSpacer}>
                        <Text style={listStyles.editSectionTitle}>Firma del Representante</Text>
                      </View>

                      <Image
                        source={{ uri: `data:image/jpeg;base64,${inscription.parent_singnature}` }}
                        style={styles.signatureImage}
                        resizeMode='contain'
                      />
                      {inscription.parent_siganture_date && (
                        <Text style={styles.signatureDate}>
                          Firmado el {inscription.parent_siganture_date} por {inscription.parent_name}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>
          );
        })}
    </InfoSection>
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
  inscriptionCard: {
    borderLeftWidth: 4,
  },
  inscriptionHeader: {
    flex: 1,
    marginRight: 12,
  },
  activeBadge: {
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
  },
  inscriptionName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    flexShrink: 1,
  },
  inscriptionDetail: {
    marginTop: 4,
  },
  inscriptionDate: {
    marginTop: 2,
  },
  inscriptionActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  sectionSpacer: {
    marginTop: 16,
  },
  signatureImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginTop: 8,
  },
  signatureDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 8,
    textAlign: 'center',
  },
});
