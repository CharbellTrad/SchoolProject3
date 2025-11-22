import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/Colors';

interface GenderSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const GenderSelector: React.FC<GenderSelectorProps> = ({ 
  value, 
  onChange, 
  error 
}) => {
  return (
    <>
      <Text style={styles.label}>Género *</Text>
      <View style={styles.container}>
        <TouchableOpacity
          style={[
            styles.button,
            value === 'Masculino' && styles.buttonActiveM
          ]}
          onPress={() => onChange('Masculino')}
        >
          <Ionicons
            name="male"
            size={20}
            color={value === 'Masculino' ? '#0000FF' : Colors.textSecondary}
          />
          <Text style={[
            styles.buttonText,
            value === 'Masculino' && { color: '#0000FF' }
          ]}>
            Masculino
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            value === 'Femenino' && styles.buttonActiveF
          ]}
          onPress={() => onChange('Femenino')}
        >
          <Ionicons
            name="female"
            size={20}
            color={value === 'Femenino' ? '#FF1493' : Colors.textSecondary}
          />
          <Text style={[
            styles.buttonText,
            value === 'Femenino' && { color: '#FF1493' }
          ]}>
            Femenino
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
  buttonActiveM: {
    borderColor: '#0000FF',
    backgroundColor: '#0000FF' + '10',
  },
  buttonActiveF: {
    borderColor: '#FF1493',
    backgroundColor: '#FF1493' + '10',
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
