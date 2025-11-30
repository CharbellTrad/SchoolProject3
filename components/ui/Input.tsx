import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
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
      {label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      
      <View style={[
        styles.container,
        isFocused && styles.containerFocused,
        error && styles.containerError,
      ]}>
        {leftIcon && (
          <View style={styles.iconWrapper}>
            <Ionicons
              name={leftIcon}
              size={22}
              color={isFocused ? Colors.primary : Colors.textSecondary}
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
            activeOpacity={0.6}
          >
            <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            style={styles.iconWrapper}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            activeOpacity={0.6}
          >
            <Ionicons
              name={rightIcon}
              size={22}
              color={isFocused ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>
      
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
    marginBottom: 18,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 10,
    paddingLeft: 2,
    letterSpacing: 0.2,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    minHeight: 56,
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
      }
    }),
  },
  containerFocused: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: '#ffffff',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      }
    }),
  },
  containerError: {
    borderColor: Colors.error,
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '500',
    paddingVertical: 16,
    paddingHorizontal: 4,
    minHeight: 52,
  },
  errorWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 4,
    paddingLeft: 4,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
    letterSpacing: 0.1,
  },
});
