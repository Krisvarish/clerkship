import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/Colors';
import ThemedText from './ThemedText';
import PillButton from './PillButton';
import { SemesterProfile } from '../../types/attendance';
import {
  formatDateKey,
  getDateDotStatus,
  parseDateKey,
} from '../../utils/scheduleUtils';

interface MonthCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  semester: SemesterProfile | null;
}

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

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export const MonthCalendarModal: React.FC<MonthCalendarModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  semester,
}) => {
  const [viewDate, setViewDate] = useState<Date>(selectedDate);

  useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate, visible]);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    onSelectDate(newDate);
    onClose();
  };

  const handleJumpToToday = () => {
    const today = new Date();
    setViewDate(today);
    onSelectDate(today);
    onClose();
  };

  // Build grid days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Convert Sunday (0) to 6, Monday (1) to 0
  const startingDayIndex = (firstDayOfMonth.getDay() + 6) % 7;

  const todayKey = formatDateKey(new Date());
  const selectedDateKey = formatDateKey(selectedDate);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={styles.navButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="chevron-left" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                  <ThemedText variant="heading" weight="semibold">
                    {MONTH_NAMES[viewMonth]} {viewYear}
                  </ThemedText>
                </View>

                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={styles.navButton}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="chevron-right" size={20} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Weekday headers */}
              <View style={styles.weekdaysRow}>
                {WEEKDAYS.map((day, idx) => (
                  <View key={idx} style={styles.weekdayCell}>
                    <ThemedText variant="caption" weight="medium" color={Colors.textSecondary}>
                      {day}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* Days Grid */}
              <View style={styles.daysGrid}>
                {/* Empty cells before 1st of month */}
                {Array.from({ length: startingDayIndex }).map((_, index) => (
                  <View key={`empty-${index}`} style={styles.dayCell} />
                ))}

                {/* Actual month days */}
                {Array.from({ length: totalDaysInMonth }).map((_, index) => {
                  const day = index + 1;
                  const dateObj = new Date(viewYear, viewMonth, day);
                  const dateKey = formatDateKey(dateObj);
                  const isSelected = dateKey === selectedDateKey;
                  const isToday = dateKey === todayKey;
                  const dotStatus = getDateDotStatus(dateKey, semester);

                  return (
                    <TouchableOpacity
                      key={`day-${day}`}
                      onPress={() => handleSelectDay(day)}
                      activeOpacity={0.7}
                      style={[
                        styles.dayCell,
                        isSelected && styles.selectedDayCell,
                        isToday && !isSelected && styles.todayDayCell,
                      ]}
                    >
                      <ThemedText
                        variant="body"
                        weight={isSelected ? 'semibold' : 'regular'}
                        color={isSelected ? Colors.white : Colors.textPrimary}
                      >
                        {day}
                      </ThemedText>

                      {/* Status Dot */}
                      <View style={styles.dotContainer}>
                        {dotStatus ? (
                          <View
                            style={[
                              styles.dot,
                              {
                                backgroundColor:
                                  dotStatus === 'present'
                                    ? Colors.sage
                                    : dotStatus === 'absent'
                                    ? Colors.terracotta
                                    : Colors.sand,
                              },
                              isSelected && { backgroundColor: Colors.white },
                            ]}
                          />
                        ) : (
                          <View style={styles.dotPlaceholder} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Legend */}
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.sage }]} />
                  <ThemedText variant="small" color={Colors.textSecondary}>
                    Present
                  </ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.terracotta }]} />
                  <ThemedText variant="small" color={Colors.textSecondary}>
                    Absent
                  </ThemedText>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: Colors.sand }]} />
                  <ThemedText variant="small" color={Colors.textSecondary}>
                    Cancelled
                  </ThemedText>
                </View>
              </View>

              {/* Actions Footer */}
              <View style={styles.footer}>
                <PillButton
                  label="Jump to Today"
                  variant="secondary"
                  size="sm"
                  onPress={handleJumpToToday}
                />
                <PillButton
                  label="Close"
                  variant="primary"
                  size="sm"
                  onPress={onClose}
                />
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#ECE5DB',
    ...Shadows.float,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0ECE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE7DE',
    paddingBottom: 8,
  },
  weekdayCell: {
    width: 38,
    alignItems: 'center',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    marginVertical: 2,
  },
  selectedDayCell: {
    backgroundColor: Colors.sage,
  },
  todayDayCell: {
    borderWidth: 1.5,
    borderColor: Colors.sage,
  },
  dotContainer: {
    height: 5,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EDE7DE',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
});

export default MonthCalendarModal;
