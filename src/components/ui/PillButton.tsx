import React from 'react';
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import ThemedText, { TextWeight } from './ThemedText';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'present'
  | 'absent'
  | 'cancelled'
  | 'outline'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface PillButtonProps extends TouchableOpacityProps {
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isActive?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  weight?: TextWeight;
}

export const PillButton: React.FC<PillButtonProps> = ({
  label,
  variant = 'secondary',
  size = 'md',
  isActive = false,
  isLoading = false,
  icon,
  weight = 'medium',
  style,
  disabled,
  children,
  ...props
}) => {
  const getContainerStyle = (): ViewStyle => {
    // If an interactive attendance pill is selected:
    if (variant === 'present' && isActive) {
      return { backgroundColor: Colors.sage, borderColor: Colors.sage };
    }
    if (variant === 'absent' && isActive) {
      return { backgroundColor: Colors.terracotta, borderColor: Colors.terracotta };
    }
    if (variant === 'cancelled' && isActive) {
      return { backgroundColor: Colors.sand, borderColor: Colors.sand };
    }

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: Colors.sage,
          borderColor: Colors.sage,
        };
      case 'present':
        return {
          backgroundColor: '#F3F6F3',
          borderColor: '#D4DDD4',
        };
      case 'absent':
        return {
          backgroundColor: '#FDF4F2',
          borderColor: '#F3D5CE',
        };
      case 'cancelled':
        return {
          backgroundColor: '#F7F6F4',
          borderColor: '#E2DDD6',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: Colors.sage,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderColor: 'transparent',
        };
      case 'secondary':
      default:
        return {
          backgroundColor: Colors.card,
          borderColor: '#DDE2DC',
        };
    }
  };

  const getTextColor = (): string => {
    if (isActive) {
      return Colors.white;
    }
    switch (variant) {
      case 'primary':
        return Colors.white;
      case 'present':
        return Colors.sage;
      case 'absent':
        return Colors.terracotta;
      case 'cancelled':
        return Colors.textSecondary;
      case 'outline':
        return Colors.sage;
      case 'ghost':
        return Colors.textSecondary;
      case 'secondary':
      default:
        return Colors.textPrimary;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'sm':
        return { paddingVertical: 6, paddingHorizontal: 12 };
      case 'lg':
        return { paddingVertical: 14, paddingHorizontal: 24 };
      case 'md':
      default:
        return { paddingVertical: 9, paddingHorizontal: 16 };
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || isLoading}
      style={[
        styles.base,
        getContainerStyle(),
        getSizeStyle(),
        disabled ? styles.disabled : null,
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || isActive ? Colors.white : Colors.sage}
        />
      ) : (
        <View style={styles.content}>
          {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
          {label ? (
            <ThemedText
              variant={size === 'sm' ? 'caption' : 'pill'}
              weight={weight}
              color={getTextColor()}
            >
              {label}
            </ThemedText>
          ) : (
            children
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 6,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default PillButton;
