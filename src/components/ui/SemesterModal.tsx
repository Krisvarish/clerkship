import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import ThemedText from './ThemedText';
import Card from './Card';
import PillButton from './PillButton';
import CalmSwitch from './CalmSwitch';
import {
  ClassSlot,
  DayOfWeek,
  DayScheduleVariation,
  SemesterProfile,
} from '../../types/attendance';
import {
  formatOrdinal,
  formatApplicableWeeks,
  isValid24hTime,
  timeToMinutes,
} from '../../utils/scheduleUtils';

interface SemesterModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (semester: SemesterProfile) => void;
  editingSemester?: SemesterProfile | null;
}

const TIMETABLE_DAYS: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const WEEKS = [1, 2, 3, 4, 5];

export const SemesterModal: React.FC<SemesterModalProps> = ({
  visible,
  onClose,
  onSave,
  editingSemester,
}) => {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubjectInput, setNewSubjectInput] = useState('');
  const [scheduleTemplate, setScheduleTemplate] = useState<Record<string, DayScheduleVariation[]>>({});
  const [activeDay, setActiveDay] = useState<DayOfWeek>('Monday');
  const [activeVariationIndex, setActiveVariationIndex] = useState(0);

  // Initialize or reset form
  useEffect(() => {
    if (editingSemester) {
      setName(editingSemester.name);
      setSubjects([...editingSemester.subjects]);
      setScheduleTemplate(JSON.parse(JSON.stringify(editingSemester.scheduleTemplate)));
    } else {
      setName('');
      const defaultSubs = [
        'General Surgery',
        'Forensic Medicine',
        'Community Medicine',
        'General Medicine',
        'O.G',
        'Paediatrics',
        'ENT',
        'Ophthalmology',
      ];
      setSubjects(defaultSubs);

      // Default schedule with 1 weekly variation per day
      const initialTemplate: Record<string, DayScheduleVariation[]> = {
        Sunday: [],
      };
      TIMETABLE_DAYS.forEach((day) => {
        initialTemplate[day] = [
          {
            id: `${day.toLowerCase()}_var_1`,
            applicableWeeks: [1, 2, 3, 4, 5],
            classes: [],
          },
        ];
      });
      setScheduleTemplate(initialTemplate);
    }
    setActiveDay('Monday');
    setActiveVariationIndex(0);
  }, [editingSemester, visible]);

  // Subject Management
  const handleAddSubject = () => {
    const trimmed = newSubjectInput.trim();
    if (!trimmed) return;
    if (subjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate Subject', 'This subject is already in your list.');
      return;
    }
    setSubjects([...subjects, trimmed]);
    setNewSubjectInput('');
  };

  const handleRemoveSubject = (subjectToRemove: string) => {
    if (subjects.length <= 1) {
      Alert.alert('Minimum Subjects', 'A semester requires at least one subject.');
      return;
    }
    setSubjects(subjects.filter((s) => s !== subjectToRemove));
  };

  // Active day variations
  const currentDayVariations = scheduleTemplate[activeDay] || [];
  const currentVariation: DayScheduleVariation = currentDayVariations[activeVariationIndex] || {
    id: `${activeDay.toLowerCase()}_var_0`,
    applicableWeeks: [1, 2, 3, 4, 5],
    classes: [],
  };

  const isRepeatsEveryWeek =
    currentDayVariations.length === 1 &&
    [1, 2, 3, 4, 5].every((w) => currentDayVariations[0]?.applicableWeeks?.includes(w));

  const handleToggleRepeatsEveryWeek = (repeats: boolean) => {
    const updated = { ...scheduleTemplate };
    if (repeats) {
      const existingClasses = currentDayVariations[0]?.classes || [];
      updated[activeDay] = [
        {
          id: `${activeDay.toLowerCase()}_weekly`,
          applicableWeeks: [1, 2, 3, 4, 5],
          classes: existingClasses,
        },
      ];
      setActiveVariationIndex(0);
    } else {
      const existingClasses = currentDayVariations[0]?.classes || [];
      updated[activeDay] = [
        {
          id: `${activeDay.toLowerCase()}_var_1`,
          applicableWeeks: [1, 3],
          classes: existingClasses,
        },
      ];
      setActiveVariationIndex(0);
    }
    setScheduleTemplate(updated);
  };

  const handleAddVariation = () => {
    const updated = { ...scheduleTemplate };
    const dayVars = [...(updated[activeDay] || [])];
    dayVars.push({
      id: `${activeDay.toLowerCase()}_var_${Date.now()}`,
      applicableWeeks: [4, 5],
      classes: [],
    });
    updated[activeDay] = dayVars;
    setScheduleTemplate(updated);
    setActiveVariationIndex(dayVars.length - 1);
  };

  const handleRemoveVariation = (indexToRemove: number) => {
    if (currentDayVariations.length <= 1) return;
    const updated = { ...scheduleTemplate };
    const dayVars = currentDayVariations.filter((_, idx) => idx !== indexToRemove);
    updated[activeDay] = dayVars;
    setScheduleTemplate(updated);
    setActiveVariationIndex(Math.max(0, indexToRemove - 1));
  };

  const handleToggleWeekForVariation = (weekNum: number) => {
    const updated = { ...scheduleTemplate };
    const dayVars = [...(updated[activeDay] || [])];
    const targetVar = { ...dayVars[activeVariationIndex] };
    const weeks = [...targetVar.applicableWeeks];

    if (weeks.includes(weekNum)) {
      if (weeks.length === 1) {
        Alert.alert('Week Selection', 'Each variation must apply to at least one week.');
        return;
      }
      targetVar.applicableWeeks = weeks.filter((w) => w !== weekNum);
    } else {
      targetVar.applicableWeeks = [...weeks, weekNum].sort((a, b) => a - b);
    }

    dayVars[activeVariationIndex] = targetVar;
    updated[activeDay] = dayVars;
    setScheduleTemplate(updated);
  };

  // Class Slot Management
  const handleAddSlot = () => {
    if (subjects.length === 0) {
      Alert.alert('No Subjects', 'Please add at least one subject first.');
      return;
    }

    const updated = { ...scheduleTemplate };
    const dayVars = [...(updated[activeDay] || [])];
    const targetVar = { ...dayVars[activeVariationIndex] };
    const classes = [...targetVar.classes];

    let defaultStart = '14:00';
    let defaultEnd = '15:00';
    if (classes.length > 0) {
      const lastClass = classes[classes.length - 1];
      defaultStart = lastClass.endTime || '15:00';
      if (isValid24hTime(defaultStart)) {
        const [h, m] = defaultStart.split(':').map(Number);
        const nextH = Math.min(23, (h || 14) + 1);
        defaultEnd = `${String(nextH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
      }
    }

    const newSlot: ClassSlot = {
      slotId: `${activeDay.toLowerCase()}_slot_${Date.now()}_${classes.length + 1}`,
      subject: subjects[0],
      startTime: defaultStart,
      endTime: defaultEnd,
    };

    targetVar.classes = [...classes, newSlot];
    dayVars[activeVariationIndex] = targetVar;
    updated[activeDay] = dayVars;
    setScheduleTemplate(updated);
  };

  const handleUpdateSlot = (slotIdx: number, updates: Partial<ClassSlot>) => {
    const updated = { ...scheduleTemplate };
    const dayVars = [...(updated[activeDay] || [])];
    const targetVar = { ...dayVars[activeVariationIndex] };
    const classes = [...targetVar.classes];

    classes[slotIdx] = { ...classes[slotIdx], ...updates };
    targetVar.classes = classes;
    dayVars[activeVariationIndex] = targetVar;
    updated[activeDay] = dayVars;
    setScheduleTemplate(updated);
  };

  const handleRemoveSlot = (slotIdx: number) => {
    const updated = { ...scheduleTemplate };
    const dayVars = [...(updated[activeDay] || [])];
    const targetVar = { ...dayVars[activeVariationIndex] };
    targetVar.classes = targetVar.classes.filter((_, idx) => idx !== slotIdx);
    dayVars[activeVariationIndex] = targetVar;
    updated[activeDay] = dayVars;
    setScheduleTemplate(updated);
  };

  // Comprehensive Save Validation
  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Semester Name Required', 'Please enter a valid semester name.');
      return;
    }
    if (subjects.length === 0) {
      Alert.alert('Subjects Required', 'Please add at least one subject to your semester.');
      return;
    }

    // Validate timetable slots and variations
    for (const day of TIMETABLE_DAYS) {
      const variations = scheduleTemplate[day] || [];
      for (let vIdx = 0; vIdx < variations.length; vIdx++) {
        const variation = variations[vIdx];
        if (!variation.applicableWeeks || variation.applicableWeeks.length === 0) {
          Alert.alert(
            'Missing Weeks',
            `Please select at least one week for ${day} (Variation ${vIdx + 1}).`
          );
          return;
        }

        for (let sIdx = 0; sIdx < variation.classes.length; sIdx++) {
          const slot = variation.classes[sIdx];
          const slotNum = sIdx + 1;

          if (!isValid24hTime(slot.startTime)) {
            Alert.alert(
              'Invalid Start Time',
              `Please enter a valid 24-hour start time (HH:mm) for Slot ${slotNum} on ${day}.`
            );
            return;
          }

          if (!isValid24hTime(slot.endTime)) {
            Alert.alert(
              'Invalid End Time',
              `Please enter a valid 24-hour end time (HH:mm) for Slot ${slotNum} on ${day}.`
            );
            return;
          }

          if (timeToMinutes(slot.startTime) >= timeToMinutes(slot.endTime)) {
            Alert.alert(
              'Invalid Time Range',
              `${day} Slot ${slotNum} (${slot.subject}): Start time (${slot.startTime}) must be earlier than end time (${slot.endTime}).`
            );
            return;
          }
        }
      }
    }

    const savedSemester: SemesterProfile = {
      id: editingSemester ? editingSemester.id : `sem_${Date.now()}`,
      name: trimmedName,
      createdAt: editingSemester ? editingSemester.createdAt : new Date().toISOString(),
      subjects,
      scheduleTemplate,
      attendanceData: editingSemester ? editingSemester.attendanceData : {},
    };

    onSave(savedSemester);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View style={styles.container}>
          {/* Top Bar with dynamic notch/status bar insets */}
          <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 16) }]}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
            <ThemedText variant="heading" weight="semibold">
              {editingSemester ? 'Edit Semester' : 'New Semester'}
            </ThemedText>
            <PillButton
              label="Save"
              variant="primary"
              size="sm"
              onPress={handleSave}
            />
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Section 1: Semester Name */}
            <Card style={styles.card}>
              <ThemedText variant="subheading" weight="semibold" style={styles.cardHeader}>
                Semester Details
              </ThemedText>
              <ThemedText variant="caption" color={Colors.textSecondary} style={styles.helperText}>
                E.g., MBBS 3rd Year Part-I, Fall 2026, Clinical Postings
              </ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Enter semester name..."
                placeholderTextColor={Colors.sand}
                style={styles.textInput}
              />
            </Card>

            {/* Section 2: Subject Manager */}
            <Card style={styles.card}>
              <ThemedText variant="subheading" weight="semibold" style={styles.cardHeader}>
                Subjects ({subjects.length})
              </ThemedText>
              <ThemedText variant="caption" color={Colors.textSecondary} style={styles.helperText}>
                Add or remove subjects offered this semester:
              </ThemedText>

              {/* Add Subject Row */}
              <View style={styles.addSubjectRow}>
                <TextInput
                  value={newSubjectInput}
                  onChangeText={setNewSubjectInput}
                  placeholder="New subject (e.g., Ophthalmology)"
                  placeholderTextColor={Colors.sand}
                  style={[styles.textInput, styles.flexInput]}
                  onSubmitEditing={handleAddSubject}
                />
                <PillButton
                  label="Add"
                  variant="primary"
                  size="md"
                  onPress={handleAddSubject}
                />
              </View>

              {/* Subject Chips */}
              <View style={styles.chipsContainer}>
                {subjects.map((sub) => (
                  <View key={sub} style={styles.subjectChip}>
                    <ThemedText variant="caption" weight="medium" color={Colors.textPrimary}>
                      {sub}
                    </ThemedText>
                    <TouchableOpacity
                      onPress={() => handleRemoveSubject(sub)}
                      style={styles.chipRemoveBtn}
                      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    >
                      <Feather name="x" size={13} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </Card>

            {/* Section 3: Dynamic Timetable Builder */}
            <Card style={styles.card}>
              <ThemedText variant="subheading" weight="semibold" style={styles.cardHeader}>
                Timetable Builder
              </ThemedText>
              <ThemedText variant="caption" color={Colors.textSecondary} style={styles.helperText}>
                Configure classes and alternating week schedules:
              </ThemedText>

              {/* Day Selector Strip */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayScroll}>
                <View style={styles.daySelectorRow}>
                  {TIMETABLE_DAYS.map((day) => {
                    const isDayActive = day === activeDay;
                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => {
                          setActiveDay(day);
                          setActiveVariationIndex(0);
                        }}
                        style={[
                          styles.dayTab,
                          isDayActive && styles.activeDayTab,
                        ]}
                      >
                        <ThemedText
                          variant="caption"
                          weight={isDayActive ? 'semibold' : 'regular'}
                          color={isDayActive ? Colors.white : Colors.textPrimary}
                        >
                          {day.substring(0, 3)}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Repeats Every Week Toggle */}
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextCol}>
                  <ThemedText variant="body" weight="medium">
                    Repeats every week
                  </ThemedText>
                  <ThemedText variant="caption" color={Colors.textSecondary}>
                    {isRepeatsEveryWeek
                      ? 'Applies to all 5 weeks uniformly'
                      : 'Alternating variation mode active'}
                  </ThemedText>
                </View>
                <CalmSwitch
                  value={isRepeatsEveryWeek}
                  onValueChange={handleToggleRepeatsEveryWeek}
                />
              </View>

              {/* Alternating Weeks Config (if not repeating every week) */}
              {!isRepeatsEveryWeek && (
                <View style={styles.variationConfigBox}>
                  {/* Variation Selector Pills */}
                  <View style={styles.variationTabsRow}>
                    {currentDayVariations.map((v, vIdx) => (
                      <TouchableOpacity
                        key={v.id || vIdx}
                        onPress={() => setActiveVariationIndex(vIdx)}
                        style={[
                          styles.variationTab,
                          activeVariationIndex === vIdx && styles.activeVariationTab,
                        ]}
                      >
                        <ThemedText
                          variant="caption"
                          weight={activeVariationIndex === vIdx ? 'semibold' : 'regular'}
                          color={activeVariationIndex === vIdx ? Colors.white : Colors.textPrimary}
                        >
                          Variation {vIdx + 1}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                      onPress={handleAddVariation}
                      style={styles.addVariationBtn}
                    >
                      <Feather name="plus" size={14} color={Colors.sage} />
                      <ThemedText variant="caption" weight="medium" color={Colors.sage}>
                        Add
                      </ThemedText>
                    </TouchableOpacity>
                  </View>

                  {/* Week selector pills with accurate ordinals: 1st, 2nd, 3rd, 4th, 5th */}
                  <ThemedText variant="caption" weight="medium" style={styles.weekPillsLabel}>
                    Select applicable weeks for Variation {activeVariationIndex + 1}:
                  </ThemedText>
                  <View style={styles.weekPillsRow}>
                    {WEEKS.map((week) => {
                      const isSelected = currentVariation.applicableWeeks?.includes(week);
                      return (
                        <TouchableOpacity
                          key={week}
                          onPress={() => handleToggleWeekForVariation(week)}
                          style={[
                            styles.weekPill,
                            isSelected && styles.activeWeekPill,
                          ]}
                        >
                          <ThemedText
                            variant="small"
                            weight={isSelected ? 'semibold' : 'regular'}
                            color={isSelected ? Colors.white : Colors.textSecondary}
                          >
                            {formatOrdinal(week)}
                          </ThemedText>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {currentDayVariations.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveVariation(activeVariationIndex)}
                      style={styles.deleteVariationBtn}
                    >
                      <ThemedText variant="small" color={Colors.terracotta}>
                        Remove Variation {activeVariationIndex + 1}
                      </ThemedText>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Class Slots for current variation */}
              <View style={styles.classesSection}>
                <View style={styles.classesHeaderRow}>
                  <ThemedText variant="body" weight="semibold">
                    Classes for {activeDay}
                  </ThemedText>
                  <PillButton
                    label="+ Add Slot"
                    variant="outline"
                    size="sm"
                    onPress={handleAddSlot}
                  />
                </View>

                {currentVariation.classes?.length === 0 ? (
                  <View style={styles.emptySlotBox}>
                    <ThemedText variant="caption" color={Colors.textSecondary} center>
                      No classes scheduled for this day variation.
                    </ThemedText>
                  </View>
                ) : (
                  currentVariation.classes?.map((slot, slotIdx) => (
                    <View key={slot.slotId || slotIdx} style={styles.slotCard}>
                      <View style={styles.slotTopRow}>
                        <ThemedText variant="caption" weight="semibold" color={Colors.sage}>
                          Slot {slotIdx + 1}
                        </ThemedText>
                        <TouchableOpacity
                          onPress={() => handleRemoveSlot(slotIdx)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Feather name="trash-2" size={16} color={Colors.terracotta} />
                        </TouchableOpacity>
                      </View>

                      {/* Subject Picker (Pill choices) */}
                      <ThemedText variant="small" color={Colors.textSecondary} style={styles.inputLabel}>
                        Subject:
                      </ThemedText>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slotSubjectScroll}>
                        {subjects.map((sub) => {
                          const isPicked = slot.subject === sub;
                          return (
                            <TouchableOpacity
                              key={sub}
                              onPress={() => handleUpdateSlot(slotIdx, { subject: sub })}
                              style={[
                                styles.subPickPill,
                                isPicked && styles.activeSubPickPill,
                              ]}
                            >
                              <ThemedText
                                variant="caption"
                                weight={isPicked ? 'semibold' : 'regular'}
                                color={isPicked ? Colors.white : Colors.textPrimary}
                              >
                                {sub}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      {/* Time Inputs */}
                      <View style={styles.timeInputsRow}>
                        <View style={styles.timeCol}>
                          <ThemedText variant="small" color={Colors.textSecondary} style={styles.inputLabel}>
                            Start Time (24h)
                          </ThemedText>
                          <TextInput
                            value={slot.startTime}
                            onChangeText={(val) => handleUpdateSlot(slotIdx, { startTime: val })}
                            placeholder="14:00"
                            placeholderTextColor={Colors.sand}
                            style={styles.timeInput}
                            maxLength={5}
                          />
                        </View>
                        <View style={styles.timeDivider}>
                          <ThemedText variant="caption" color={Colors.sand}>
                            to
                          </ThemedText>
                        </View>
                        <View style={styles.timeCol}>
                          <ThemedText variant="small" color={Colors.textSecondary} style={styles.inputLabel}>
                            End Time (24h)
                          </ThemedText>
                          <TextInput
                            value={slot.endTime}
                            onChangeText={(val) => handleUpdateSlot(slotIdx, { endTime: val })}
                            placeholder="15:00"
                            placeholderTextColor={Colors.sand}
                            style={styles.timeInput}
                            maxLength={5}
                          />
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </Card>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE7DE',
    backgroundColor: Colors.card,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFEAE2',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  card: {
    backgroundColor: Colors.card,
  },
  cardHeader: {
    marginBottom: 4,
  },
  helperText: {
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: '#F3EFE8',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2DDD4',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  addSubjectRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  flexInput: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBE6DC',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  chipRemoveBtn: {
    padding: 2,
  },
  dayScroll: {
    marginBottom: 14,
  },
  daySelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dayTab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: '#EBE6DD',
  },
  activeDayTab: {
    backgroundColor: Colors.sage,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#EFEAE2',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEAE2',
    marginBottom: 14,
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 10,
  },
  variationConfigBox: {
    backgroundColor: '#F3EFE9',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
  },
  variationTabsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginBottom: 10,
  },
  variationTab: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#E5DFD6',
  },
  activeVariationTab: {
    backgroundColor: Colors.sage,
  },
  addVariationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.sage,
    gap: 4,
  },
  weekPillsLabel: {
    marginBottom: 6,
  },
  weekPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  weekPill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#E3DDD4',
  },
  activeWeekPill: {
    backgroundColor: Colors.sage,
  },
  deleteVariationBtn: {
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  classesSection: {
    marginTop: 6,
  },
  classesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptySlotBox: {
    backgroundColor: '#F3EFE8',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  slotCard: {
    backgroundColor: '#F5F1EB',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E2D8',
  },
  slotTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    marginBottom: 4,
  },
  slotSubjectScroll: {
    marginBottom: 10,
  },
  subPickPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#E7E2D9',
    marginRight: 6,
  },
  activeSubPickPill: {
    backgroundColor: Colors.sage,
  },
  timeInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeCol: {
    flex: 1,
  },
  timeDivider: {
    marginTop: 18,
  },
  timeInput: {
    backgroundColor: '#FAF7F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DED8CD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
});

export default SemesterModal;
