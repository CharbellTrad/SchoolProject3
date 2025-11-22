import React from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps, } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/Colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  isFocused?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
}

export const Input: React.FC<InputProps> = (props) => {
  const {
    label,
    error,
    leftIcon,
    rightIcon,
    onRightIconPress,
    isFocused,
    showClearButton,
    onClear,
    value,
    style,
    ...restProps
  } = props;

  return (
    <View style={styles.wrapper}>
      {/* Label siempre envuelto en Text */}
      {label ? <Text style={styles.label}>{label}</Text> : null}
      
      <View style={[
        styles.container,
        isFocused && styles.containerFocused,
        error && styles.containerError,
      ]}>
        {leftIcon && (
          <View style={styles.iconWrapper}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={isFocused ? Colors.secondary : Colors.textSecondary}
            />
          </View>
        )}
        
        <TextInput
          {...restProps}
          value={value}
          style={[styles.input, style]}
          placeholderTextColor={Colors.textTertiary}
          selectionColor={Colors.primary}
        />
        
        {showClearButton && value ? (
          <TouchableOpacity 
            style={styles.iconWrapper} 
            onPress={onClear}
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={isFocused ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {/* Error siempre envuelto en View con Text */}
      {error ? (
        <View style={styles.errorWrapper}>
          <Ionicons name="alert-circle" size={14} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 8,
    paddingLeft: 4,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minHeight: 52,
    paddingHorizontal: 4,
  },
  containerFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  containerError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
    paddingVertical: 14,
    paddingHorizontal: 8,
    minHeight: 48,
  },
  errorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
    paddingLeft: 8,
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
});