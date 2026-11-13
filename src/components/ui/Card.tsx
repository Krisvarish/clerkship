import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { Colors, Shadows } from '../../constants/Colors';

interface CardProps extends ViewProps {
  elevated?: boolean;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  elevated = true,
  padding = 18,
  ...props
}) => {
  return (
    <View
      style={[
        styles.base,
        elevated && Shadows.card,
        { padding },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EFE9DE',
  },
});

export default Card;
