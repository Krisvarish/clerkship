import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  trackColor?: string;
  fillColor?: string;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  trackColor = Colors.mist,
  fillColor,
  style,
}) => {
  const clampedProgress = Math.min(100, Math.max(0, isNaN(progress) ? 0 : progress));

  // Default color logic: Sage if >= 75%, Terracotta if < 75%
  const resolvedFillColor =
    fillColor || (clampedProgress >= 75 ? Colors.sage : Colors.terracotta);

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            height,
            borderRadius: height / 2,
            backgroundColor: resolvedFillColor,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    minWidth: 0,
  },
});

export default ProgressBar;
