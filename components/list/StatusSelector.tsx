import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

interface StatusSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({ 
  value, 
  onChange, 
  error 
}) => {
  return (
    <>
      <Text style={styles.label}>Estado *</Text>
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.button,
            value === 'Activo' && styles.buttonActiveA
          ]}
          onPress={() => onChange('Activo')}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={value === 'Activo' ? Colors.success : Colors.textSecondary}
          />
          <Text style={[
            styles.buttonText,
            value === 'Activo' && { color: Colors.success }
          ]}>
            Activo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            value === 'Inactivo' && styles.buttonActiveI
          ]}
          onPress={() => onChange('Inactivo')}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={value === 'Inactivo' ? Colors.error : Colors.textSecondary}
          />
          <Text style={[
            styles.buttonText,
            value === 'Inactivo' && { color: Colors.error }
          ]}>
            Inactivo
          </Text>
        </TouchableOpacity>
      </View>
      {error && (
        <View style={styles.errorWrapper}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  container: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    gap: 8,
  },
  buttonActiveA: {
    borderColor: Colors.success,
    backgroundColor: Colors.success + '10',
  },
  buttonActiveI: {
    borderColor: Colors.error,
    backgroundColor: Colors.error + '10',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  errorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -10,
    marginBottom: 16,
    marginLeft: 4,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
  },
});
