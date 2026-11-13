import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import ThemedText from './ThemedText';
import Card from './Card';
import PillButton from './PillButton';

interface WelcomeCardProps {
  onCreatePress: () => void;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ onCreatePress }) => {
  return (
    <View style={styles.container}>
      <Card style={styles.card} elevated padding={28}>
        {/* Serene Icon Circle */}
        <View style={styles.iconCircle}>
          <Feather name="book-open" size={32} color={Colors.sage} />
        </View>

        {/* Title */}
        <ThemedText variant="title" weight="semibold" center style={styles.title}>
          Welcome to Clerkship
        </ThemedText>

        {/* Subtitle */}
        <ThemedText
          variant="body"
          color={Colors.textSecondary}
          center
          style={styles.subtitle}
        >
          Set up your first semester timetable and subjects to start tracking your clinical & theory attendance.
        </ThemedText>

        {/* Feature Highlights */}
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <ThemedText variant="caption" color={Colors.textSecondary}>
              Offline-first persistence with weekly variations
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <ThemedText variant="caption" color={Colors.textSecondary}>
              Automated 75% attendance threshold tracking
            </ThemedText>
          </View>
          <View style={styles.featureItem}>
            <View style={styles.featureDot} />
            <ThemedText variant="caption" color={Colors.textSecondary}>
              Time-gated anti-mispress attendance locks
            </ThemedText>
          </View>
        </View>

        {/* Primary Action Button */}
        <PillButton
          label="+ Create Your First Semester"
          variant="primary"
          size="lg"
          weight="semibold"
          onPress={onCreatePress}
          style={styles.actionButton}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: Colors.card,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E7EFE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    lineHeight: 22,
    marginBottom: 20,
  },
  featuresList: {
    width: '100%',
    backgroundColor: '#F3EFE9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 24,
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sage,
    marginRight: 10,
  },
  actionButton: {
    width: '100%',
  },
});

export default WelcomeCard;
