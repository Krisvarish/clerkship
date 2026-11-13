import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '../../constants/Colors';
import ThemedText from '../../components/ui/ThemedText';
import Card from '../../components/ui/Card';
import PillButton from '../../components/ui/PillButton';
import Badge from '../../components/ui/Badge';
import MonthCalendarModal from '../../components/ui/MonthCalendarModal';
import SemesterModal from '../../components/ui/SemesterModal';
import WelcomeCard from '../../components/ui/WelcomeCard';
import {
  useAttendanceStore,
  useActiveSemester,
} from '../../store/attendanceStore';
import { AttendanceStatus, ClassSlot, SemesterProfile } from '../../types/attendance';
import {
  formatDateKey,
  formatTime12h,
  getClassesForDate,
  getDateDotStatus,
  getDayOfWeek,
  getSlotLockStatus,
  getWeekOfMonth,
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

export default function ScheduleScreen() {
  const insets = useSafeAreaInsets();
  const activeSemester = useActiveSemester();
  const {
    semesters,
    activeSemesterId,
    setActiveSemester,
    addSemester,
    setAttendanceStatus,
    clearAttendanceStatus,
    earlyUnlockedSlots,
    toggleEarlyUnlock,
  } = useAttendanceStore();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isMonthModalVisible, setIsMonthModalVisible] = useState(false);
  const [isSemesterPickerVisible, setIsSemesterPickerVisible] = useState(false);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const selectedDateKey = useMemo(() => formatDateKey(selectedDate), [selectedDate]);
  const todayKey = useMemo(() => formatDateKey(new Date()), []);
  const isToday = selectedDateKey === todayKey;

  // Retrieve classes for selected date based on template & week of month
  const classesForDay = useMemo(() => {
    return getClassesForDate(selectedDate, activeSemester);
  }, [selectedDate, activeSemester]);

  // Current day's recorded attendance
  const dayRecords = useMemo(() => {
    return (activeSemester && activeSemester.attendanceData)
      ? activeSemester.attendanceData[selectedDateKey] || {}
      : {};
  }, [activeSemester, selectedDateKey]);

  // 7-day horizontal calendar week strip centered on or containing selectedDate
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    const current = new Date(selectedDate);
    const dayOfWeek = current.getDay(); // 0 is Sunday, 1 is Monday
    const diffToMonday = (dayOfWeek + 6) % 7; // Monday becomes 0, Sunday 6
    const monday = new Date(current);
    monday.setDate(current.getDate() - diffToMonday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }, [selectedDate]);

  const handlePrevWeek = () => {
    const prev = new Date(selectedDate);
    prev.setDate(selectedDate.getDate() - 7);
    setSelectedDate(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + 7);
    setSelectedDate(next);
  };

  const handleJumpToToday = () => {
    setSelectedDate(new Date());
  };

  const handleToggleStatus = (slot: ClassSlot, status: AttendanceStatus) => {
    const current = dayRecords[slot.slotId]?.status;
    if (current === status) {
      clearAttendanceStatus(selectedDateKey, slot.slotId);
    } else {
      setAttendanceStatus(selectedDateKey, slot.slotId, slot.subject, status);
    }
  };

  const handleSaveFirstSemester = (sem: SemesterProfile) => {
    addSemester(sem);
  };

  const dayOfWeekName = getDayOfWeek(selectedDate);
  const weekOfMonth = getWeekOfMonth(selectedDate);

  // If no semester has been created yet, render the serene onboarding welcome card
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.titleRow}>
              <ThemedText variant="title" weight="semibold">
                Clerkship
              </ThemedText>
              <View style={styles.greetingDot} />
            </View>

            {/* Active Semester Pill Badge (tap to switch) */}
            <TouchableOpacity
              onPress={() => setIsSemesterPickerVisible(true)}
              style={styles.semesterPill}
              activeOpacity={0.8}
            >
              <Feather name="book" size={12} color={Colors.sage} style={{ marginRight: 5 }} />
              <ThemedText variant="caption" weight="medium" color={Colors.sage} numberOfLines={1}>
                {activeSemester.name}
              </ThemedText>
              <Feather name="chevron-down" size={13} color={Colors.sage} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Right Header: Calendar Icon & Month Label */}
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setIsMonthModalVisible(true)}
              style={styles.calendarIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="calendar" size={18} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Month / Jump-to-Today Subheader */}
        <View style={styles.subHeader}>
          <View style={styles.monthDisplay}>
            <ThemedText variant="subheading" weight="semibold">
              {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
            </ThemedText>
            <ThemedText variant="caption" color={Colors.textSecondary}>
              Week {weekOfMonth} • {dayOfWeekName}
            </ThemedText>
          </View>

          {!isToday && (
            <TouchableOpacity onPress={handleJumpToToday} style={styles.todayBtn}>
              <Feather name="corner-down-left" size={13} color={Colors.sage} style={{ marginRight: 4 }} />
              <ThemedText variant="caption" weight="medium" color={Colors.sage}>
                Today
              </ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* 7-Day Horizontal Calendar Strip */}
        <View style={styles.stripContainer}>
          <TouchableOpacity
            onPress={handlePrevWeek}
            style={styles.weekChevron}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="chevron-left" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>

          <View style={styles.weekDaysRow}>
            {weekDays.map((d) => {
              const dKey = formatDateKey(d);
              const isSelected = dKey === selectedDateKey;
              const isDateToday = dKey === todayKey;
              const dotStatus = getDateDotStatus(dKey, activeSemester);
              const dayAbbr = d.toLocaleDateString('en-US', { weekday: 'narrow' });

              return (
                <TouchableOpacity
                  key={dKey}
                  onPress={() => setSelectedDate(d)}
                  activeOpacity={0.7}
                  style={[
                    styles.dayPill,
                    isSelected && styles.dayPillSelected,
                    isDateToday && !isSelected && styles.dayPillToday,
                  ]}
                >
                  <ThemedText
                    variant="caption"
                    weight="medium"
                    color={isSelected ? Colors.white : Colors.textSecondary}
                  >
                    {dayAbbr}
                  </ThemedText>
                  <ThemedText
                    variant="body"
                    weight={isSelected ? 'semibold' : 'medium'}
                    color={isSelected ? Colors.white : Colors.textPrimary}
                    style={{ marginTop: 2 }}
                  >
                    {d.getDate()}
                  </ThemedText>

                  {/* Dot status */}
                  <View style={styles.stripDotContainer}>
                    {dotStatus ? (
                      <View
                        style={[
                          styles.stripDot,
                          {
                            backgroundColor:
                              dotStatus === 'present'
                                ? isSelected
                                  ? Colors.white
                                  : Colors.sage
                                : dotStatus === 'absent'
                                ? Colors.terracotta
                                : Colors.sand,
                          },
                        ]}
                      />
                    ) : (
                      <View style={styles.stripDotPlaceholder} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            onPress={handleNextWeek}
            style={styles.weekChevron}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="chevron-right" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Daily Timeline ScrollView with generous bottom padding for safe area */}
        <ScrollView
          style={styles.timelineScroll}
          contentContainerStyle={[
            styles.timelineContent,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {classesForDay.length === 0 ? (
            /* Empty state for Sundays, 2nd Saturdays, or unscheduled days */
            <Card style={styles.emptyCard} elevated>
              <View style={styles.emptyIconCircle}>
                <Feather name="sun" size={28} color={Colors.sage} />
              </View>
              <ThemedText variant="heading" weight="semibold" center style={styles.emptyTitle}>
                No theory postings scheduled today.
              </ThemedText>
              <ThemedText
                variant="body"
                color={Colors.textSecondary}
                center
                style={styles.emptySubtitle}
              >
                Take a breather, catch up on clinical logs, or prepare for upcoming ward rotations.
              </ThemedText>
            </Card>
          ) : (
            classesForDay.map((slot) => {
              const currentRecord = dayRecords[slot.slotId];
              const isUnlockedEarly = !!earlyUnlockedSlots[`${selectedDateKey}_${slot.slotId}`];
              const lockInfo = getSlotLockStatus(
                selectedDateKey,
                slot.startTime,
                slot.endTime,
                isUnlockedEarly
              );

              return (
                <View key={slot.slotId} style={styles.timelineRow}>
                  {/* Left Column: Formatted Time */}
                  <View style={styles.timeColumn}>
                    <ThemedText variant="body" weight="medium" color={Colors.textPrimary}>
                      {formatTime12h(slot.startTime)}
                    </ThemedText>
                    <ThemedText variant="caption" color={Colors.textSecondary}>
                      {formatTime12h(slot.endTime)}
                    </ThemedText>
                  </View>

                  {/* Right Column: Elevated Card */}
                  <View style={styles.cardColumn}>
                    <Card style={styles.slotCard} elevated>
                      {/* Top row: Subject Title & Status Badge */}
                      <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <ThemedText variant="subheading" weight="semibold">
                            {slot.subject}
                          </ThemedText>
                          <ThemedText variant="caption" color={Colors.textSecondary}>
                            {formatTime12h(slot.startTime)} – {formatTime12h(slot.endTime)}
                          </ThemedText>
                        </View>

                        {/* Current Status Badge if marked */}
                        {currentRecord ? (
                          <Badge
                            label={
                              currentRecord.status === 'present'
                                ? 'Present'
                                : currentRecord.status === 'absent'
                                ? 'Absent'
                                : 'Cancelled'
                            }
                            variant={currentRecord.status}
                            size="sm"
                          />
                        ) : null}
                      </View>

                      {/* Interactive Controls or Lock State */}
                      <View style={styles.cardActionsRow}>
                        {lockInfo.isLocked ? (
                          /* Locked State */
                          <View style={styles.lockedContainer}>
                            <Badge
                              label={lockInfo.label}
                              variant={lockInfo.status}
                              size="md"
                              icon={
                                <Feather
                                  name={lockInfo.status === 'scheduled' ? 'lock' : 'clock'}
                                  size={13}
                                  color={Colors.textSecondary}
                                />
                              }
                            />
                            {/* Early unlock button on today */}
                            {isToday && (
                              <TouchableOpacity
                                onPress={() => toggleEarlyUnlock(selectedDateKey, slot.slotId)}
                                style={styles.earlyUnlockBtn}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                              >
                                <ThemedText variant="caption" color={Colors.sage} weight="medium">
                                  Unlock early
                                </ThemedText>
                              </TouchableOpacity>
                            )}
                          </View>
                        ) : (
                          /* Unlocked: 3 Interactive Pill Buttons */
                          <View style={styles.buttonGroup}>
                            <PillButton
                              label="Present"
                              variant="present"
                              size="sm"
                              isActive={currentRecord?.status === 'present'}
                              onPress={() => handleToggleStatus(slot, 'present')}
                              icon={
                                <Feather
                                  name="check"
                                  size={13}
                                  color={currentRecord?.status === 'present' ? Colors.white : Colors.sage}
                                />
                              }
                            />
                            <PillButton
                              label="Absent"
                              variant="absent"
                              size="sm"
                              isActive={currentRecord?.status === 'absent'}
                              onPress={() => handleToggleStatus(slot, 'absent')}
                              icon={
                                <Feather
                                  name="x"
                                  size={13}
                                  color={currentRecord?.status === 'absent' ? Colors.white : Colors.terracotta}
                                />
                              }
                            />
                            <PillButton
                              label="Cancelled"
                              variant="cancelled"
                              size="sm"
                              isActive={currentRecord?.status === 'cancelled'}
                              onPress={() => handleToggleStatus(slot, 'cancelled')}
                              icon={
                                <Feather
                                  name="minus"
                                  size={13}
                                  color={currentRecord?.status === 'cancelled' ? Colors.white : Colors.sand}
                                />
                              }
                            />
                          </View>
                        )}
                      </View>
                    </Card>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        {/* Full-Month Calendar Modal */}
        <MonthCalendarModal
          visible={isMonthModalVisible}
          onClose={() => setIsMonthModalVisible(false)}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          semester={activeSemester}
        />

        {/* Quick Semester Switcher Modal */}
        <Modal
          visible={isSemesterPickerVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsSemesterPickerVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setIsSemesterPickerVisible(false)}>
            <View style={styles.modalBackdrop}>
              <TouchableWithoutFeedback>
                <View style={styles.semesterPickerCard}>
                  <ThemedText variant="subheading" weight="semibold" style={{ marginBottom: 12 }}>
                    Switch Semester
                  </ThemedText>
                  {semesters.map((s) => {
                    const isSelected = s.id === activeSemesterId;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        onPress={() => {
                          setActiveSemester(s.id);
                          setIsSemesterPickerVisible(false);
                        }}
                        style={[
                          styles.semesterOptionRow,
                          isSelected && styles.semesterOptionSelected,
                        ]}
                      >
                        <ThemedText
                          variant="body"
                          weight={isSelected ? 'semibold' : 'regular'}
                          color={isSelected ? Colors.sage : Colors.textPrimary}
                        >
                          {s.name}
                        </ThemedText>
                        {isSelected && <Feather name="check" size={16} color={Colors.sage} />}
                      </TouchableOpacity>
                    );
                  })}
                  <PillButton
                    label="Manage All Semesters"
                    variant="outline"
                    size="sm"
                    style={{ marginTop: 14 }}
                    onPress={() => {
                      setIsSemesterPickerVisible(false);
                      router.push('/semesters');
                    }}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Creation Modal for + New Semester */}
        <SemesterModal
          visible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onSave={handleSaveFirstSemester}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 18,
    paddingBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  greetingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sage,
    marginLeft: 6,
  },
  semesterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBE5DC',
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    maxWidth: 220,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: '#E6E0D6',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  monthDisplay: {
    flex: 1,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E7EFE7',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#C3D4C4',
  },
  stripContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  weekChevron: {
    padding: 6,
  },
  weekDaysRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 4,
  },
  dayPill: {
    width: 42,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: '#ECE6DC',
  },
  dayPillSelected: {
    backgroundColor: Colors.sage,
    borderColor: Colors.sage,
    ...Shadows.subtle,
  },
  dayPillToday: {
    borderColor: Colors.sage,
    borderWidth: 1.5,
  },
  stripDotContainer: {
    height: 6,
    marginTop: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  stripDotPlaceholder: {
    width: 4,
    height: 4,
  },
  timelineScroll: {
    flex: 1,
  },
  timelineContent: {
    paddingHorizontal: 20,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeColumn: {
    width: 68,
    paddingTop: 8,
  },
  cardColumn: {
    flex: 1,
  },
  slotCard: {
    backgroundColor: Colors.card,
    padding: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardActionsRow: {
    marginTop: 4,
  },
  lockedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  earlyUnlockBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  emptyCard: {
    backgroundColor: Colors.card,
    padding: 28,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E7EFE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptySubtitle: {
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  semesterPickerCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 20,
    ...Shadows.float,
  },
  semesterOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEBE4',
  },
  semesterOptionSelected: {
    backgroundColor: '#EFF5EF',
    paddingHorizontal: 8,
    borderRadius: 8,
  },
});
