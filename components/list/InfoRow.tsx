import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Colors from '../../constants/Colors';

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  highlight?: boolean;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  icon,
  label,
  value,
  highlight = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={[
        styles.iconBox,
        highlight && styles.iconBoxHighlight
      ]}>
        <Ionicons
          name={icon}
          size={20}
          color={highlight ? Colors.warning : Colors.textSecondary}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[
          styles.value,
          highlight && styles.valueHighlight
        ]}>
          {value}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  iconBoxHighlight: {
    backgroundColor: '#fef3c7',
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.1,
  },
  valueHighlight: {
    color: Colors.warning,
  },
});
