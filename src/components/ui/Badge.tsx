import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';
import ThemedText from './ThemedText';

export type BadgeVariant =
  | 'present'
  | 'absent'
  | 'cancelled'
  | 'upcoming'
  | 'in_progress'
  | 'scheduled'
  | 'neutral'
  | 'sage';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  style,
  icon,
}) => {
  const getBadgeStyle = () => {
    switch (variant) {
      case 'present':
        return {
          backgroundColor: '#E7EFE7',
          borderColor: '#C3D4C4',
          textColor: Colors.sage,
        };
      case 'absent':
        return {
          backgroundColor: '#FDEEEA',
          borderColor: '#F1CCC2',
          textColor: Colors.terracotta,
        };
      case 'cancelled':
        return {
          backgroundColor: '#ECEAE6',
          borderColor: '#DDD8D1',
          textColor: Colors.textSecondary,
        };
      case 'upcoming':
        return {
          backgroundColor: '#EFF3F0',
          borderColor: '#D4DDD5',
          textColor: Colors.sage,
        };
      case 'in_progress':
        return {
          backgroundColor: '#FFF7E6',
          borderColor: '#F3DEC2',
          textColor: '#A06D20',
        };
      case 'scheduled':
        return {
          backgroundColor: '#ECE9E2',
          borderColor: '#DDD7CE',
          textColor: Colors.textSecondary,
        };
      case 'sage':
        return {
          backgroundColor: Colors.sage,
          borderColor: Colors.sage,
          textColor: Colors.white,
        };
      case 'neutral':
      default:
        return {
          backgroundColor: '#ECEAE5',
          borderColor: '#DFDBD4',
          textColor: Colors.textSecondary,
        };
    }
  };

  const styling = getBadgeStyle();

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: styling.backgroundColor,
          borderColor: styling.borderColor,
          paddingVertical: size === 'sm' ? 3 : 5,
          paddingHorizontal: size === 'sm' ? 8 : 12,
        },
        style,
      ]}
    >
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <ThemedText
        variant={size === 'sm' ? 'small' : 'caption'}
        weight="medium"
        color={styling.textColor}
      >
        {label}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
});

export default Badge;
