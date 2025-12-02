import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import Colors from '../../constants/Colors';
import type { Subject } from '../../services-odoo/subjectService';

interface SubjectCardProps {
  subject: Subject;
  index: number;
  onEdit: () => void;
  isOfflineMode?: boolean;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  index,
  onEdit,
  isOfflineMode = false,
}) => {
  const sectionCount = subject.section_ids.length;
  const professorCount = subject.professor_ids.length;

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(300)}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.card}
        onPress={onEdit}
        activeOpacity={0.7}
        disabled={isOfflineMode}
      >
        {/* Icono de materia */}
        <View style={styles.iconContainer}>
          <Ionicons name="book" size={32} color={Colors.primary} />
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={2}>
            {subject.name}
          </Text>

          {/* Badges de información */}
          <View style={styles.badgesContainer}>
            {/* Badge de secciones */}
            <View style={[styles.badge, styles.badgeSections]}>
              <Ionicons name="folder-outline" size={14} color="#3b82f6" />
              <Text style={[styles.badgeText, styles.badgeTextSections]}>
                {sectionCount} {sectionCount === 1 ? 'sección' : 'secciones'}
              </Text>
            </View>

            {/* Badge de profesores */}
            <View style={[styles.badge, styles.badgeProfessors]}>
              <Ionicons name="person-outline" size={14} color="#10b981" />
              <Text style={[styles.badgeText, styles.badgeTextProfessors]}>
                {professorCount} {professorCount === 1 ? 'profesor' : 'profesores'}
              </Text>
            </View>
          </View>
        </View>

        {/* Chevron */}
        <View style={styles.actions}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={isOfflineMode ? Colors.textTertiary : Colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
    }),
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  badgeSections: {
    backgroundColor: '#3b82f615',
  },
  badgeProfessors: {
    backgroundColor: '#10b98115',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  badgeTextSections: {
    color: '#3b82f6',
  },
  badgeTextProfessors: {
    color: '#10b981',
  },
  actions: {
    marginLeft: 8,
  },
});