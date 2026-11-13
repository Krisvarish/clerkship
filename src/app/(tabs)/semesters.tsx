import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import ThemedText from '../../components/ui/ThemedText';
import Card from '../../components/ui/Card';
import PillButton from '../../components/ui/PillButton';
import Badge from '../../components/ui/Badge';
import CalmSwitch from '../../components/ui/CalmSwitch';
import SemesterModal from '../../components/ui/SemesterModal';
import { useAttendanceStore } from '../../store/attendanceStore';
import { SemesterProfile } from '../../types/attendance';
import { pluralize } from '../../utils/scheduleUtils';

export default function SemestersScreen() {
  const insets = useSafeAreaInsets();
  const {
    semesters,
    activeSemesterId,
    setActiveSemester,
    addSemester,
    updateSemester,
    deleteSemester,
    notificationsEnabled,
    setNotificationsEnabled,
    clearAllData,
  } = useAttendanceStore();

  const [isSemesterModalVisible, setIsSemesterModalVisible] = useState(false);
  const [editingSemester, setEditingSemester] = useState<SemesterProfile | null>(null);

  const handleCreateNew = () => {
    setEditingSemester(null);
    setIsSemesterModalVisible(true);
  };

  const handleEdit = (semester: SemesterProfile) => {
    setEditingSemester(semester);
    setIsSemesterModalVisible(true);
  };

  const handleDelete = (semester: SemesterProfile) => {
    const isOnlyRemaining = semesters.length <= 1;
    Alert.alert(
      'Delete Semester',
      isOnlyRemaining
        ? `Are you sure you want to delete "${semester.name}"? This will return Clerkship to its initial onboarding state.`
        : `Are you sure you want to delete "${semester.name}" and all of its attendance logs? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteSemester(semester.id);
          },
        },
      ]
    );
  };

  const handleSaveSemester = (semester: SemesterProfile) => {
    if (editingSemester) {
      updateSemester(semester);
    } else {
      addSemester(semester);
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Clear All App Data',
      'Are you sure you want to permanently erase all semesters, timetables, and attendance logs? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText variant="title" weight="semibold">
              Semesters
            </ThemedText>
            <ThemedText variant="caption" color={Colors.textSecondary}>
              Manage schedules, subjects & postings
            </ThemedText>
          </View>

          <PillButton
            label="+ New"
            variant="primary"
            size="sm"
            onPress={handleCreateNew}
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 100 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Notification Settings Card */}
          <Card style={styles.card} elevated>
            <View style={styles.notifRow}>
              <View style={styles.notifIconCircle}>
                <Feather name="bell" size={20} color={Colors.sage} />
              </View>
              <View style={styles.notifTextCol}>
                <ThemedText variant="body" weight="semibold">
                  Pre-Class Reminders
                </ThemedText>
                <ThemedText variant="caption" color={Colors.textSecondary}>
                  Receive an alert 10 minutes prior to theory postings (e.g. 13:50 & 14:50)
                </ThemedText>
              </View>
              <CalmSwitch
                value={notificationsEnabled}
                onValueChange={(val) => setNotificationsEnabled(val)}
              />
            </View>

            {Platform.OS === 'web' && (
              <View style={styles.webNoteBox}>
                <Feather name="info" size={13} color={Colors.sage} style={{ marginRight: 6 }} />
                <ThemedText variant="small" color={Colors.sage}>
                  Running on web preview: Notifications are simulated safely and will fire natively on Android / iOS builds.
                </ThemedText>
              </View>
            )}
          </Card>

          {/* Section: Saved Semesters */}
          <View style={styles.sectionHeaderRow}>
            <ThemedText variant="subheading" weight="semibold">
              {semesters.length === 0
                ? 'Your Semesters'
                : `Your Semesters (${semesters.length})`}
            </ThemedText>
          </View>

          {semesters.length === 0 ? (
            <Card style={styles.emptySemestersCard} elevated padding={24}>
              <View style={styles.emptyIconCircle}>
                <Feather name="folder-plus" size={28} color={Colors.sage} />
              </View>
              <ThemedText variant="heading" weight="semibold" center style={{ marginBottom: 6 }}>
                No Semesters Configured
              </ThemedText>
              <ThemedText variant="body" color={Colors.textSecondary} center style={{ marginBottom: 16 }}>
                Create your first semester timetable to start tracking clinical postings and attendance.
              </ThemedText>
              <PillButton
                label="+ Create Semester"
                variant="primary"
                size="md"
                onPress={handleCreateNew}
              />
            </Card>
          ) : (
            semesters.map((sem) => {
              const isActive = sem.id === activeSemesterId;
              const attendanceDaysCount = Object.keys(sem.attendanceData || {}).length;

              return (
                <Card
                  key={sem.id}
                  style={[styles.semesterCard, isActive && styles.activeSemesterCard]}
                  elevated
                >
                  <View style={styles.semCardTop}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <View style={styles.semTitleRow}>
                        <ThemedText variant="subheading" weight="semibold">
                          {sem.name}
                        </ThemedText>
                        {isActive && (
                          <Badge
                            label="Active"
                            variant="present"
                            size="sm"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </View>
                      <ThemedText variant="caption" color={Colors.textSecondary}>
                        {pluralize(sem.subjects.length, 'Subject', 'Subjects')} • {pluralize(attendanceDaysCount, 'Day', 'Days')} Logged
                      </ThemedText>
                    </View>

                    <View style={styles.semActionsRow}>
                      <TouchableOpacity
                        onPress={() => handleEdit(sem)}
                        style={styles.actionIconBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="edit-2" size={16} color={Colors.textSecondary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDelete(sem)}
                        style={styles.actionIconBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Feather name="trash-2" size={16} color={Colors.terracotta} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Subjects preview chips */}
                  <View style={styles.subjectsPreviewRow}>
                    {sem.subjects.slice(0, 4).map((sub) => (
                      <View key={sub} style={styles.subPreviewChip}>
                        <ThemedText variant="small" color={Colors.textSecondary}>
                          {sub}
                        </ThemedText>
                      </View>
                    ))}
                    {sem.subjects.length > 4 && (
                      <View style={styles.subPreviewChip}>
                        <ThemedText variant="small" color={Colors.textSecondary}>
                          +{sem.subjects.length - 4} more
                        </ThemedText>
                      </View>
                    )}
                  </View>

                  {/* Activate button if not active */}
                  {!isActive && (
                    <PillButton
                      label="Switch to this Semester"
                      variant="secondary"
                      size="sm"
                      style={{ marginTop: 12 }}
                      onPress={() => setActiveSemester(sem.id)}
                    />
                  )}
                </Card>
              );
            })
          )}

          {/* Clear All App Data Danger Action */}
          {semesters.length > 0 && (
            <View style={styles.resetContainer}>
              <TouchableOpacity
                onPress={handleClearAllData}
                style={styles.dangerBtn}
                activeOpacity={0.7}
              >
                <Feather name="alert-triangle" size={14} color={Colors.terracotta} style={{ marginRight: 6 }} />
                <ThemedText variant="caption" color={Colors.terracotta} weight="medium">
                  Clear All App Data
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* Create / Edit Semester Modal */}
        <SemesterModal
          visible={isSemesterModalVisible}
          onClose={() => setIsSemesterModalVisible(false)}
          onSave={handleSaveSemester}
          editingSemester={editingSemester}
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
    paddingBottom: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 14,
  },
  card: {
    backgroundColor: Colors.card,
    padding: 16,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E7EFE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  notifTextCol: {
    flex: 1,
    marginRight: 10,
  },
  webNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF5EF',
    borderRadius: 10,
    padding: 8,
    marginTop: 12,
  },
  sectionHeaderRow: {
    marginTop: 6,
    marginBottom: 2,
  },
  semesterCard: {
    backgroundColor: Colors.card,
    padding: 18,
  },
  activeSemesterCard: {
    borderColor: Colors.sage,
    borderWidth: 1.5,
  },
  semCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  semTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  semActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFEBE4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectsPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  subPreviewChip: {
    backgroundColor: '#EDE8E0',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  emptySemestersCard: {
    backgroundColor: Colors.card,
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E7EFE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  resetContainer: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: '#FAF1EF',
    borderWidth: 1,
    borderColor: '#F3D8D2',
  },
});
