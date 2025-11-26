import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../../constants/Colors';
import { listStyles } from '../../../constants/Styles';
import { Student } from '../../../services-odoo/personService';
import { formatDateToDisplay, formatGender, formatPhone, formatYesNo } from '../../../utils/formatHelpers';
import { InfoRow, InfoSection } from '../../list';

interface ParentsTabProps {
  student: Student;
  loading?: boolean;
}

export const ParentsTab: React.FC<ParentsTabProps> = ({ student, loading = false }) => {
  const [expandedParent, setExpandedParent] = useState<number | null>(null);

  if (loading) {
    return (
      <InfoSection title="Representantes del Estudiante">
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.emptyText}>Cargando representantes...</Text>
        </View>
      </InfoSection>
    );
  }

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
    <InfoSection title="Representantes del Estudiante">
      {student.parents.map((parent) => {
        const isExpanded = expandedParent === parent.id;
        const isYes = (value?: string) =>
          value?.toLowerCase() === 'si' || value?.toLowerCase() === 'sí';

        return (
          <View key={parent.id} style={listStyles.card}>
            <TouchableOpacity
              onPress={() => setExpandedParent(isExpanded ? null : parent.id)}
              style={listStyles.cardMain}
            >
              <View style={listStyles.avatarContainer}>
                {parent.image_128 ? (
                  <Image
                    source={{ uri: `data:image/jpeg;base64,${parent.image_128}` }}
                    style={styles.parentAvatar}
                  />
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

                {isYes(parent.active_job) && (
                  <>
                    {parent.job_place && <InfoRow label="Lugar de Trabajo" value={parent.job_place} icon="business" />}
                    {parent.job && <InfoRow label="Cargo" value={parent.job} icon="briefcase" />}
                  </>
                )}

                {parent.ci_document && (
                  <View style={styles.documentSection}>
                    <Text style={listStyles.editSectionTitle}>Cédula de Identidad</Text>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${parent.ci_document}` }}
                      style={styles.documentImage}
                      resizeMode="contain"
                    />
                  </View>
                )}

                {parent.parent_singnature && (
                  <View style={styles.documentSection}>
                    <Text style={listStyles.editSectionTitle}>Firma</Text>
                    <Image
                      source={{ uri: `data:image/jpeg;base64,${parent.parent_singnature}` }}
                      style={styles.signatureImage}
                      resizeMode="contain"
                    />
                  </View>
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
  documentImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  signatureImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    marginTop: 8,
  },
});
