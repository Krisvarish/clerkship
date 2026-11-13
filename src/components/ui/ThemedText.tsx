import React from 'react';
import { Text, TextProps, StyleSheet, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';

export type TextVariant =
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'caption'
  | 'small'
  | 'pill';

export type TextWeight = 'light' | 'regular' | 'medium' | 'semibold';

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  weight?: TextWeight;
  color?: string;
  center?: boolean;
}

export const ThemedText: React.FC<ThemedTextProps> = ({
  variant = 'body',
  weight = 'regular',
  color,
  center,
  style,
  children,
  ...props
}) => {
  const getFontFamily = () => {
    switch (weight) {
      case 'light':
        return 'Inter_300Light';
      case 'medium':
        return 'Inter_500Medium';
      case 'semibold':
        return 'Inter_600SemiBold';
      case 'regular':
      default:
        return 'Inter_400Regular';
    }
  };

  return (
    <Text
      style={[
        styles.base,
        styles[variant],
        { fontFamily: getFontFamily() },
        color ? { color } : null,
        center ? { textAlign: 'center' } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    color: Colors.textPrimary,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heading: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  subheading: {
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    color: Colors.textSecondary,
  },
  small: {
    fontSize: 11,
    lineHeight: 14,
    color: Colors.textSecondary,
  },
  pill: {
    fontSize: 13,
    lineHeight: 16,
  },
});

export default ThemedText;
