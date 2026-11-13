import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AttendanceRecord, AttendanceStatus, SemesterProfile } from '../types/attendance';
import { scheduleSemesterReminders, cancelSemesterReminders } from '../utils/notifications';

interface AttendanceStoreState {
  semesters: SemesterProfile[];
  activeSemesterId: string | null;
  notificationsEnabled: boolean;
  earlyUnlockedSlots: Record<string, boolean>; // Keyed by `${dateKey}_${slotId}`

  // Actions
  setActiveSemester: (id: string | null) => void;
  addSemester: (semester: SemesterProfile) => void;
  updateSemester: (semester: SemesterProfile) => void;
  deleteSemester: (id: string) => boolean;

  setAttendanceStatus: (
    dateKey: string,
    slotId: string,
    subject: string,
    status: AttendanceStatus
  ) => void;
  clearAttendanceStatus: (dateKey: string, slotId: string) => void;
  toggleEarlyUnlock: (dateKey: string, slotId: string) => void;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  clearAllData: () => Promise<void>;
}

export const useAttendanceStore = create<AttendanceStoreState>()(
  persist(
    (set, get) => ({
      semesters: [],
      activeSemesterId: null,
      notificationsEnabled: false,
      earlyUnlockedSlots: {},

      setActiveSemester: (id: string | null) => {
        set({ activeSemesterId: id });
        const state = get();
        if (state.notificationsEnabled) {
          const active = state.semesters.find((s) => s.id === id);
          if (active) {
            scheduleSemesterReminders(active);
          } else {
            cancelSemesterReminders();
          }
        }
      },

      addSemester: (semester: SemesterProfile) => {
        set((state) => ({
          semesters: [...state.semesters, semester],
          activeSemesterId: semester.id,
        }));
        const state = get();
        if (state.notificationsEnabled) {
          scheduleSemesterReminders(semester);
        }
      },

      updateSemester: (semester: SemesterProfile) => {
        set((state) => ({
          semesters: state.semesters.map((s) => (s.id === semester.id ? semester : s)),
        }));
        const state = get();
        if (state.notificationsEnabled && state.activeSemesterId === semester.id) {
          scheduleSemesterReminders(semester);
        }
      },

      deleteSemester: (id: string) => {
        const state = get();
        const remaining = state.semesters.filter((s) => s.id !== id);
        const newActiveId =
          state.activeSemesterId === id
            ? remaining.length > 0
              ? remaining[0].id
              : null
            : state.activeSemesterId;

        set({
          semesters: remaining,
          activeSemesterId: newActiveId,
        });

        if (state.notificationsEnabled) {
          const newActive = remaining.find((s) => s.id === newActiveId);
          if (newActive) {
            scheduleSemesterReminders(newActive);
          } else {
            cancelSemesterReminders();
          }
        }

        return true;
      },

      setAttendanceStatus: (
        dateKey: string,
        slotId: string,
        subject: string,
        status: AttendanceStatus
      ) => {
        set((state) => {
          if (!state.activeSemesterId) return state;
          const semester = state.semesters.find((s) => s.id === state.activeSemesterId);
          if (!semester) return state;

          const updatedAttendanceData = { ...semester.attendanceData };
          const dayRecords = { ...(updatedAttendanceData[dateKey] || {}) };

          // If same status is clicked, we toggle it off (clear)
          if (dayRecords[slotId]?.status === status) {
            delete dayRecords[slotId];
          } else {
            dayRecords[slotId] = {
              slotId,
              subject,
              status,
              timestamp: new Date().toISOString(),
            };
          }

          updatedAttendanceData[dateKey] = dayRecords;

          const updatedSemester: SemesterProfile = {
            ...semester,
            attendanceData: updatedAttendanceData,
          };

          return {
            semesters: state.semesters.map((s) =>
              s.id === state.activeSemesterId ? updatedSemester : s
            ),
          };
        });
      },

      clearAttendanceStatus: (dateKey: string, slotId: string) => {
        set((state) => {
          if (!state.activeSemesterId) return state;
          const semester = state.semesters.find((s) => s.id === state.activeSemesterId);
          if (!semester) return state;

          const updatedAttendanceData = { ...semester.attendanceData };
          const dayRecords = { ...(updatedAttendanceData[dateKey] || {}) };
          delete dayRecords[slotId];
          updatedAttendanceData[dateKey] = dayRecords;

          const updatedSemester: SemesterProfile = {
            ...semester,
            attendanceData: updatedAttendanceData,
          };

          return {
            semesters: state.semesters.map((s) =>
              s.id === state.activeSemesterId ? updatedSemester : s
            ),
          };
        });
      },

      toggleEarlyUnlock: (dateKey: string, slotId: string) => {
        set((state) => {
          const key = `${dateKey}_${slotId}`;
          const current = !!state.earlyUnlockedSlots[key];
          return {
            earlyUnlockedSlots: {
              ...state.earlyUnlockedSlots,
              [key]: !current,
            },
          };
        });
      },

      setNotificationsEnabled: async (enabled: boolean) => {
        set({ notificationsEnabled: enabled });
        const state = get();
        const active = state.semesters.find((s) => s.id === state.activeSemesterId);

        if (enabled && active) {
          await scheduleSemesterReminders(active);
        } else {
          await cancelSemesterReminders();
        }
      },

      clearAllData: async () => {
        await cancelSemesterReminders();
        set({
          semesters: [],
          activeSemesterId: null,
          notificationsEnabled: false,
          earlyUnlockedSlots: {},
        });
      },
    }),
    {
      name: 'clerkship_attendance_store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Selector helper to obtain the currently active semester (or null if none exist).
 */
export function useActiveSemester(): SemesterProfile | null {
  return useAttendanceStore((state) => {
    if (!state.activeSemesterId || state.semesters.length === 0) return null;
    return state.semesters.find((s) => s.id === state.activeSemesterId) || null;
  });
}
