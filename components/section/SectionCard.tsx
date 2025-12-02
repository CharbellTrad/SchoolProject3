import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import Colors from '../../constants/Colors';
import type { Section } from '../../services-odoo/sectionService';
import { formatSectionType } from '../../services-odoo/sectionService';

interface SectionCardProps {
  section: Section;
  index: number;
  onEdit: () => void;
  isOfflineMode?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  pre: '#ec4899',
  primary: '#3b82f6',
  secundary: '#10b981',
};

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  pre: 'color-palette',
  primary: 'book',
  secundary: 'school',
};

export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  index,
  onEdit,
  isOfflineMode = false,
}) => {
  const accentColor = TYPE_COLORS[section.type] || Colors.primary;
  const icon = TYPE_ICONS[section.type] || 'folder';

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(300)}
      style={styles.container}
    >
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: accentColor }]}
        onPress={onEdit}
        activeOpacity={0.7}
      >
        {/* Indicador de tipo */}
        <View style={[styles.typeIndicator, { backgroundColor: accentColor + '15' }]}>
          <Ionicons name={icon} size={32} color={accentColor} />
        </View>

        {/* Contenido */}
        <View style={styles.content}>
          <Text style={styles.name} numberOfLines={1}>
            {section.name}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: accentColor + '15' }]}>
            <Text style={[styles.typeText, { color: accentColor }]}>
              {formatSectionType(section.type)}
            </Text>
          </View>
        </View>

        {/* Acción */}
        <View style={styles.actions}>
          {isOfflineMode && (
            <View style={styles.offlineBadge}>
              <Ionicons name="cloud-offline" size={12} color={Colors.warning} />
              <Text style={styles.offlineText}>Offline</Text>
            </View>
          )}
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
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      }
    }),
  },
  typeIndicator: {
    width: 64,
    height: 64,
    borderRadius: 16,
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
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginLeft: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonDisabled: {
    backgroundColor: Colors.backgroundTertiary,
    opacity: 0.5,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: Colors.warning + '15',
    gap: 4,
  },
  offlineText: {
    fontSize: 11,
    color: Colors.warning,
    fontWeight: '600',
  },
});