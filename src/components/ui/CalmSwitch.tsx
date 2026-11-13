import React from 'react';
import { TouchableOpacity, StyleSheet, View, Animated } from 'react-native';
import { Colors } from '../../constants/Colors';

interface CalmSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export const CalmSwitch: React.FC<CalmSwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={[
        styles.track,
        {
          backgroundColor: value ? Colors.sage : '#D9E1D9',
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.thumb,
          {
            alignSelf: value ? 'flex-end' : 'flex-start',
          },
        ]}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 3,
    justifyContent: 'center',
  },
  thumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.white,
    shadowColor: '#2C352E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
});

export default CalmSwitch;
