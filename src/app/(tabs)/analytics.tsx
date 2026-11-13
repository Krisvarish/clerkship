import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import ThemedText from '../../components/ui/ThemedText';
import Card from '../../components/ui/Card';
import ProgressBar from '../../components/ui/ProgressBar';
import Badge from '../../components/ui/Badge';
import SemesterModal from '../../components/ui/SemesterModal';
import WelcomeCard from '../../components/ui/WelcomeCard';
import { useActiveSemester, useAttendanceStore } from '../../store/attendanceStore';
import { SemesterProfile } from '../../types/attendance';
import {
  calculateSubjectStats,
  calculateAggregateStats,
  pluralize,
} from '../../utils/scheduleUtils';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const activeSemester = useActiveSemester();
  const { semesters, addSemester } = useAttendanceStore();
  const [segmentMode, setSegmentMode] = useState<'overall' | 'month'>('overall');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  // Month-wise filter setup
  // Collect all distinct months from recorded attendance, creation date, and current date
  const availableMonths = useMemo(() => {
    const monthKeysSet = new Set<string>();

    // Current month
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    monthKeysSet.add(currentKey);

    // Semester creation month
    if (activeSemester?.createdAt) {
      const created = new Date(activeSemester.createdAt);
      if (!isNaN(created.getTime())) {
        const createdKey = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, '0')}`;
        monthKeysSet.add(createdKey);
      }
    }

    // Attendance data dates
    if (activeSemester?.attendanceData) {
      for (const dateKey of Object.keys(activeSemester.attendanceData)) {
        if (dateKey.length >= 7) {
          monthKeysSet.add(dateKey.substring(0, 7));
        }
      }
    }

    const sortedKeys = Array.from(monthKeysSet).sort();
    return sortedKeys.map((key) => {
      const [yStr, mStr] = key.split('-');
      const y = parseInt(yStr, 10);
      const m = parseInt(mStr, 10) - 1;
      const monthLabel = MONTH_NAMES[m] ? MONTH_NAMES[m].substring(0, 3) : mStr;
      return {
        key,
        label: `${monthLabel} ${y}`,
      };
    });
  }, [activeSemester]);

  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(
    availableMonths[availableMonths.length - 1]?.key || ''
  );

  const selectedMonthIndex = availableMonths.findIndex((m) => m.key === selectedMonthKey);

  const handlePrevMonth = () => {
    if (selectedMonthIndex > 0) {
      setSelectedMonthKey(availableMonths[selectedMonthIndex - 1].key);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonthIndex < availableMonths.length - 1) {
      setSelectedMonthKey(availableMonths[selectedMonthIndex + 1].key);
    }
  };

  const handleSaveFirstSemester = (sem: SemesterProfile) => {
    addSemester(sem);
  };

  // Calculate statistics based on current mode
  const activeMonthFilter = segmentMode === 'month' ? selectedMonthKey : undefined;
  const subjectStats = useMemo(() => {
    return calculateSubjectStats(activeSemester, activeMonthFilter);
  }, [activeSemester, activeMonthFilter]);

  const aggregateStats = useMemo(() => {
    return calculateAggregateStats(subjectStats);
  }, [subjectStats]);

  // If no semester exists, render the Calm Kit onboarding card
  if (!activeSemester || semesters.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <WelcomeCard onCreatePress={() => setIsCreateModalVisible(true)} />
          <SemesterModal
            visible={isCreateModalVisible}
            onClose={() => setIsCreateModalVisible(false)}
            onSave={handleSaveFirstSemester}
          />
        </View>
      </SafeAreaView>
    );
  }

  const hasConductedClasses = aggregateStats.totalConducted > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText variant="title" weight="semibold">
            Subjects & Analytics
          </ThemedText>
          <ThemedText variant="caption" color={Colors.textSecondary}>
            {activeSemester.name}
          </ThemedText>
        </View>

        {/* Calm Kit Segmented Tabs Control */}
        <View style={styles.segmentContainer}>
          <View style={styles.segmentTrack}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSegmentMode('overall')}
              style={[
                styles.segmentTab,
                segmentMode === 'overall' && styles.segmentTabActive,
              ]}
            >
              <ThemedText
                variant="caption"
                weight={segmentMode === 'overall' ? 'semibold' : 'medium'}
                color={segmentMode === 'overall' ? Colors.white : Colors.textPrimary}
              >
                Overall
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSegmentMode('month')}
              style={[
                styles.segmentTab,
                segmentMode === 'month' && styles.segmentTabActive,
              ]}
            >
              <ThemedText
                variant="caption"
                weight={segmentMode === 'month' ? 'semibold' : 'medium'}
                color={segmentMode === 'month' ? Colors.white : Colors.textPrimary}
              >
                Month-wise
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Selector Pill Strip (visible only when Month-wise is active) */}
        {segmentMode === 'month' && (
          <View style={styles.monthStripWrapper}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              disabled={selectedMonthIndex <= 0}
              style={[
                styles.monthArrowBtn,
                selectedMonthIndex <= 0 && styles.monthArrowDisabled,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather
                name="chevron-left"
                size={16}
                color={selectedMonthIndex <= 0 ? Colors.sand : Colors.textPrimary}
              />
            </TouchableOpacity>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.monthScrollContent}
            >
              {availableMonths.map((m) => {
                const isSelected = m.key === selectedMonthKey;
                return (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => setSelectedMonthKey(m.key)}
                    style={[
                      styles.monthPill,
                      isSelected && styles.monthPillActive,
                    ]}
                  >
                    <ThemedText
                      variant="caption"
                      weight={isSelected ? 'semibold' : 'regular'}
                      color={isSelected ? Colors.white : Colors.textPrimary}
                    >
                      {m.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              onPress={handleNextMonth}
              disabled={selectedMonthIndex >= availableMonths.length - 1}
              style={[
                styles.monthArrowBtn,
                selectedMonthIndex >= availableMonths.length - 1 && styles.monthArrowDisabled,
              ]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather
                name="chevron-right"
                size={16}
                color={
                  selectedMonthIndex >= availableMonths.length - 1
                    ? Colors.sand
                    : Colors.textPrimary
                }
              />
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Aggregate Summary Card */}
          <Card style={styles.summaryCard} elevated>
            <View style={styles.summaryTopRow}>
              <View>
                <ThemedText variant="caption" color={Colors.textSecondary} weight="medium">
                  {segmentMode === 'overall' ? 'OVERALL ATTENDANCE' : 'MONTHLY ATTENDANCE'}
                </ThemedText>
                <View style={styles.percentageRow}>
                  <ThemedText variant="title" weight="semibold" style={styles.largePercentage}>
                    {hasConductedClasses ? `${aggregateStats.overallPercentage}%` : '—'}
                  </ThemedText>
                  <Badge
                    label={
                      !hasConductedClasses
                        ? 'No Classes Yet'
                        : aggregateStats.isAboveThreshold
                        ? 'Above 75%'
                        : 'Below 75%'
                    }
                    variant={
                      !hasConductedClasses
                        ? 'neutral'
                        : aggregateStats.isAboveThreshold
                        ? 'present'
                        : 'absent'
                    }
                    size="sm"
                    style={{ marginLeft: 10, alignSelf: 'center' }}
                  />
                </View>
              </View>

              <View style={styles.attendedBadge}>
                <ThemedText variant="body" weight="semibold" color={Colors.sage}>
                  {aggregateStats.totalPresent} / {aggregateStats.totalConducted}
                </ThemedText>
                <ThemedText variant="small" color={Colors.textSecondary}>
                  Conducted
                </ThemedText>
              </View>
            </View>

            {/* Progress bar */}
            <ProgressBar
              progress={hasConductedClasses ? aggregateStats.overallPercentage : 0}
              height={10}
              fillColor={!hasConductedClasses ? Colors.sand : undefined}
              style={{ marginVertical: 14 }}
            />

            {/* Threshold Helper Note */}
            <View style={styles.summaryFooterRow}>
              <View style={styles.footerNoteRow}>
                <Feather
                  name={
                    !hasConductedClasses
                      ? 'info'
                      : aggregateStats.isAboveThreshold
                      ? 'check-circle'
                      : 'alert-circle'
                  }
                  size={14}
                  color={
                    !hasConductedClasses
                      ? Colors.textSecondary
                      : aggregateStats.isAboveThreshold
                      ? Colors.sage
                      : Colors.terracotta
                  }
                  style={{ marginRight: 6 }}
                />
                <ThemedText
                  variant="caption"
                  weight="medium"
                  color={
                    !hasConductedClasses
                      ? Colors.textSecondary
                      : aggregateStats.isAboveThreshold
                      ? Colors.sage
                      : Colors.terracotta
                  }
                >
                  {!hasConductedClasses
                    ? 'No classes conducted yet in this period.'
                    : aggregateStats.isAboveThreshold
                    ? `Safe • Can miss ${pluralize(aggregateStats.classesCanMiss, 'class', 'classes')} and remain >= 75%`
                    : `Attend next ${pluralize(aggregateStats.classesToAttend, 'consecutive class', 'consecutive classes')} to reach 75%`}
                </ThemedText>
              </View>

              {aggregateStats.totalCancelled > 0 && (
                <ThemedText variant="small" color={Colors.sand}>
                  {pluralize(aggregateStats.totalCancelled, 'class', 'classes')} cancelled
                </ThemedText>
              )}
            </View>
          </Card>

          {/* Section Title */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText variant="subheading" weight="semibold">
              Subject Breakdown
            </ThemedText>
            <ThemedText variant="caption" color={Colors.textSecondary}>
              {pluralize(subjectStats.length, 'Subject', 'Subjects')}
            </ThemedText>
          </View>

          {/* Subject Cards List */}
          {subjectStats.map((sub) => {
            const hasSubClasses = sub.totalConducted > 0;

            return (
              <Card key={sub.subject} style={styles.subjectCard} elevated>
                {/* Top: Name & Percentage */}
                <View style={styles.subCardTopRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <ThemedText variant="body" weight="semibold">
                      {sub.subject}
                    </ThemedText>
                    <ThemedText variant="caption" color={Colors.textSecondary}>
                      {sub.present} attended of {pluralize(sub.totalConducted, 'class', 'classes')} conducted
                    </ThemedText>
                  </View>

                  <ThemedText
                    variant="heading"
                    weight="semibold"
                    color={
                      !hasSubClasses
                        ? Colors.textSecondary
                        : sub.isAboveThreshold
                        ? Colors.sage
                        : Colors.terracotta
                    }
                  >
                    {hasSubClasses ? `${sub.percentage}%` : '—'}
                  </ThemedText>
                </View>

                {/* Progress bar */}
                <ProgressBar
                  progress={hasSubClasses ? sub.percentage : 0}
                  fillColor={!hasSubClasses ? Colors.sand : undefined}
                  height={8}
                  style={{ marginVertical: 10 }}
                />

                {/* Counts Row: Present • Absent • Cancelled */}
                <View style={styles.countsRow}>
                  <View style={styles.countItem}>
                    <View style={[styles.countDot, { backgroundColor: Colors.sage }]} />
                    <ThemedText variant="small" color={Colors.textSecondary}>
                      Present: <ThemedText variant="small" weight="semibold">{sub.present}</ThemedText>
                    </ThemedText>
                  </View>

                  <View style={styles.countItem}>
                    <View style={[styles.countDot, { backgroundColor: Colors.terracotta }]} />
                    <ThemedText variant="small" color={Colors.textSecondary}>
                      Absent: <ThemedText variant="small" weight="semibold">{sub.absent}</ThemedText>
                    </ThemedText>
                  </View>

                  <View style={styles.countItem}>
                    <View style={[styles.countDot, { backgroundColor: Colors.sand }]} />
                    <ThemedText variant="small" color={Colors.textSecondary}>
                      Cancelled: <ThemedText variant="small" weight="semibold">{sub.cancelled}</ThemedText>
                    </ThemedText>
                  </View>
                </View>

                {/* 75% Threshold Helper Note */}
                <View
                  style={[
                    styles.thresholdNoteBox,
                    !hasSubClasses
                      ? styles.thresholdBoxNeutral
                      : sub.isAboveThreshold
                      ? styles.thresholdBoxSafe
                      : styles.thresholdBoxAlert,
                  ]}
                >
                  <ThemedText
                    variant="caption"
                    weight="medium"
                    color={
                      !hasSubClasses
                        ? Colors.textSecondary
                        : sub.isAboveThreshold
                        ? Colors.sage
                        : Colors.terracotta
                    }
                  >
                    {!hasSubClasses
                      ? 'No classes conducted yet.'
                      : sub.isAboveThreshold
                      ? `Safe • Can miss ${pluralize(sub.classesCanMiss, 'class', 'classes')}`
                      : `Attend next ${pluralize(sub.classesToAttend, 'consecutive class', 'consecutive classes')} to reach 75%`}
                  </ThemedText>
                </View>
              </Card>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 18,
    paddingBottom: 10,
  },
  segmentContainer: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: '#EBE5DC',
    borderRadius: 999,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentTabActive: {
    backgroundColor: Colors.sage,
  },
  monthStripWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  monthArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EBE5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthArrowDisabled: {
    opacity: 0.4,
  },
  monthScrollContent: {
    paddingHorizontal: 6,
    gap: 6,
  },
  monthPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: '#E7E0D6',
  },
  monthPillActive: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  summaryCard: {
    backgroundColor: Colors.card,
    padding: 20,
  },
  summaryTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  largePercentage: {
    fontSize: 34,
    lineHeight: 40,
    color: Colors.textPrimary,
  },
  attendedBadge: {
    backgroundColor: '#EFF5EF',
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  summaryFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 2,
  },
  subjectCard: {
    backgroundColor: Colors.card,
    padding: 16,
  },
  subCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  countsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  countItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  thresholdNoteBox: {
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  thresholdBoxSafe: {
    backgroundColor: '#F0F6F0',
  },
  thresholdBoxAlert: {
    backgroundColor: '#FDF3F1',
  },
  thresholdBoxNeutral: {
    backgroundColor: '#F3EFEA',
  },
});
