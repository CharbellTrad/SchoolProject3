import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, GestureResponderEvent, StyleSheet, Text, TextStyle, TouchableOpacity, TouchableOpacityProps, View, ViewStyle, } from 'react-native';
import Colors from '../../constants/Colors';

// Constantes de diseño (ajusta según tu nuevo Styles)
const borderRadius = 12;
const spacing = { sm: 10, md: 14, lg: 18, xl: 24 };
const fontSize = { sm: 14, md: 16, lg: 18 };

interface ButtonProps extends Omit<TouchableOpacityProps, 'onPress'> {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'right',
  fullWidth = true,
  disabled,
  style,
  onPress,
  ...props
}) => {
  const handlePress = (event: GestureResponderEvent) => {
    if (loading || disabled) return;
    if (event?.preventDefault) event.preventDefault();
    if (event?.stopPropagation) event.stopPropagation();
    if (onPress) onPress(event);
    return false;
  };

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.buttonPrimary);
        break;
      case 'secondary':
        baseStyle.push(styles.buttonSecondary);
        break;
      case 'outline':
        baseStyle.push(styles.buttonOutline);
        break;
      case 'danger':
        baseStyle.push(styles.buttonDanger);
        break;
    }
    switch (size) {
      case 'small':
        baseStyle.push(styles.buttonSmall);
        break;
      case 'medium':
        baseStyle.push(styles.buttonMedium);
        break;
      case 'large':
        baseStyle.push(styles.buttonLarge);
        break;
    }
    if (fullWidth) baseStyle.push(styles.fullWidth);
    if (disabled || loading) baseStyle.push(styles.buttonDisabled);
    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text];
    switch (variant) {
      case 'outline':
        baseStyle.push(styles.textOutline);
        break;
      default:
        baseStyle.push(styles.textDefault);
    }
    switch (size) {
      case 'small':
        baseStyle.push(styles.textSmall);
        break;
      case 'medium':
        baseStyle.push(styles.textMedium);
        break;
      case 'large':
        baseStyle.push(styles.textLarge);
        break;
    }
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      disabled={disabled || loading}
      onPress={handlePress}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? Colors.primary : Colors.white} />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 16 : 18}
              color={variant === 'outline' ? Colors.primary : Colors.white}
              style={styles.iconLeft}
            />
          )}
          <Text style={getTextStyle()}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={size === 'small' ? 16 : 18}
              color={variant === 'outline' ? Colors.primary : Colors.white}
              style={styles.iconRight}
            />
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  buttonDanger: {
    backgroundColor: Colors.error,
  },
  buttonSmall: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  buttonMedium: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  buttonLarge: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  buttonDisabled: {
    backgroundColor: Colors.gray[400] || '#a0aec0',
    opacity: 0.6,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
  textDefault: {
    color: Colors.white,
  },
  textOutline: {
    color: Colors.primary,
  },
  textSmall: {
    fontSize: fontSize.sm,
  },
  textMedium: {
    fontSize: fontSize.md,
  },
  textLarge: {
    fontSize: fontSize.lg,
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
});
