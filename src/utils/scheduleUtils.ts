import {
  AttendanceRecord,
  AttendanceStatus,
  ClassSlot,
  DayOfWeek,
  DayScheduleVariation,
  SemesterProfile,
  SubjectAttendanceStats,
  AggregateAttendanceStats,
} from '../types/attendance';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

/**
 * Format a Date object into "YYYY-MM-DD" in local time.
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a "YYYY-MM-DD" string into a local Date object.
 */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get weekday name for a Date.
 */
export function getDayOfWeek(date: Date): DayOfWeek {
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday ...
  const mapping: DayOfWeek[] = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return mapping[dayIndex];
}

/**
 * Compute the Nth week of the month (1 to 5).
 * Rule: Math.ceil(date.getDate() / 7)
 * Days 1–7 = Week 1, 8–14 = Week 2, 15–21 = Week 3, 22–28 = Week 4, 29–31 = Week 5.
 */
export function getWeekOfMonth(date: Date): number {
  return Math.ceil(date.getDate() / 7);
}

/**
 * Retrieve applicable class slots for a given date in the active semester.
 */
export function getClassesForDate(
  date: Date,
  semester: SemesterProfile | null | undefined
): ClassSlot[] {
  if (!semester || !semester.scheduleTemplate) return [];
  const dayName = getDayOfWeek(date);
  const weekOfMonth = getWeekOfMonth(date);
  const variations = semester.scheduleTemplate[dayName] || [];

  const matchedVariation = variations.find((variation: DayScheduleVariation) =>
    variation.applicableWeeks.includes(weekOfMonth)
  );

  return matchedVariation ? matchedVariation.classes : [];
}

/**
 * Format 24-hour time "14:00" to 12-hour format "2:00 PM".
 */
export function formatTime12h(time24: string): string {
  if (!time24 || !time24.includes(':')) return time24;
  const [hStr, mStr] = time24.split(':');
  let hour = parseInt(hStr, 10);
  const minutes = mStr.padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minutes} ${ampm}`;
}

export type SlotLockStatus =
  | { isLocked: false; status: 'unlocked'; label?: string }
  | { isLocked: true; status: 'scheduled' | 'upcoming' | 'in_progress'; label: string };

/**
 * Time-Gated Attendance Lock Engine.
 * Past dates (< today): UNLOCKED
 * Future dates (> today): LOCKED ("Scheduled")
 * Today (=== today):
 *   - current time < startTime: LOCKED ("Upcoming • 2:00 PM")
 *   - startTime <= current time < endTime: LOCKED ("In Progress • Unlocks at 3:00 PM")
 *   - current time >= endTime (or unlockedEarly): UNLOCKED
 */
export function getSlotLockStatus(
  selectedDateKey: string,
  startTime: string,
  endTime: string,
  unlockedEarly: boolean = false,
  now: Date = new Date()
): SlotLockStatus {
  if (unlockedEarly) {
    return { isLocked: false, status: 'unlocked' };
  }

  const todayKey = formatDateKey(now);

  if (selectedDateKey < todayKey) {
    return { isLocked: false, status: 'unlocked' };
  }

  if (selectedDateKey > todayKey) {
    return { isLocked: true, status: 'scheduled', label: 'Scheduled' };
  }

  // Selected date is today: inspect hours and minutes
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = startTime.split(':').map(Number);
  const startMinutes = startH * 60 + startM;

  const [endH, endM] = endTime.split(':').map(Number);
  const endMinutes = endH * 60 + endM;

  if (currentMinutes < startMinutes) {
    return {
      isLocked: true,
      status: 'upcoming',
      label: `Upcoming • ${formatTime12h(startTime)}`,
    };
  }

  if (currentMinutes < endMinutes) {
    return {
      isLocked: true,
      status: 'in_progress',
      label: `In Progress • Unlocks at ${formatTime12h(endTime)}`,
    };
  }

  return { isLocked: false, status: 'unlocked' };
}

/**
 * Determine the dot color for a specific date in the calendar view:
 * - All logged classes 'present' => 'present' (Sage)
 * - Any logged class 'absent' => 'absent' (Terracotta)
 * - All logged classes 'cancelled' => 'cancelled' (Sand)
 */
export function getDateDotStatus(
  dateKey: string,
  semester: SemesterProfile | null | undefined
): 'present' | 'absent' | 'cancelled' | null {
  if (!semester || !semester.attendanceData) return null;
  const dayRecords = semester.attendanceData[dateKey];
  if (!dayRecords) return null;

  const records = Object.values(dayRecords);
  if (records.length === 0) return null;

  // Check if any class is marked absent
  const hasAbsent = records.some((r) => r.status === 'absent');
  if (hasAbsent) return 'absent';

  // Check if all classes are marked cancelled
  const allCancelled = records.every((r) => r.status === 'cancelled');
  if (allCancelled) return 'cancelled';

  // Check if all logged non-cancelled classes are present
  const hasPresent = records.some((r) => r.status === 'present');
  const allNonCancelledPresent = records
    .filter((r) => r.status !== 'cancelled')
    .every((r) => r.status === 'present');

  if (hasPresent && allNonCancelledPresent) return 'present';

  return null;
}

/**
 * Attendance Percentage Math Engine
 * Calculates individual subject statistics and 75% thresholds.
 */
export function calculateSubjectStats(
  semester: SemesterProfile | null | undefined,
  monthFilter?: string
): SubjectAttendanceStats[] {
  if (!semester || !semester.subjects) return [];

  // Aggregate record counts by subject
  const counts: Record<string, { present: number; absent: number; cancelled: number }> = {};

  for (const subject of semester.subjects) {
    counts[subject] = { present: 0, absent: 0, cancelled: 0 };
  }

  for (const [dateKey, dayRecords] of Object.entries(semester.attendanceData)) {
    if (monthFilter && !dateKey.startsWith(monthFilter)) {
      continue;
    }

    for (const record of Object.values(dayRecords)) {
      if (!counts[record.subject]) {
        counts[record.subject] = { present: 0, absent: 0, cancelled: 0 };
      }
      if (record.status === 'present') counts[record.subject].present += 1;
      else if (record.status === 'absent') counts[record.subject].absent += 1;
      else if (record.status === 'cancelled') counts[record.subject].cancelled += 1;
    }
  }

  return semester.subjects.map((subject) => {
    const { present, absent, cancelled } = counts[subject] || {
      present: 0,
      absent: 0,
      cancelled: 0,
    };
    const totalConducted = present + absent;
    const percentage = totalConducted === 0 ? 0 : Math.round((present / totalConducted) * 100);
    const isAboveThreshold = percentage >= 75;

    let classesToAttend = 0;
    let classesCanMiss = 0;

    if (totalConducted > 0) {
      if (!isAboveThreshold) {
        // Formula: Math.ceil((0.75 * totalConducted - present) / 0.25)
        classesToAttend = Math.max(1, Math.ceil((0.75 * totalConducted - present) / 0.25));
      } else {
        // Formula: Math.floor((present - 0.75 * totalConducted) / 0.75)
        classesCanMiss = Math.max(0, Math.floor((present - 0.75 * totalConducted) / 0.75));
      }
    }

    return {
      subject,
      present,
      absent,
      cancelled,
      totalConducted,
      percentage,
      isAboveThreshold,
      classesToAttend,
      classesCanMiss,
    };
  });
}

/**
 * Aggregate stats across all subjects.
 */
export function calculateAggregateStats(
  subjectStats: SubjectAttendanceStats[]
): AggregateAttendanceStats {
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalCancelled = 0;

  for (const s of subjectStats) {
    totalPresent += s.present;
    totalAbsent += s.absent;
    totalCancelled += s.cancelled;
  }

  const totalConducted = totalPresent + totalAbsent;
  const overallPercentage =
    totalConducted === 0 ? 0 : Math.round((totalPresent / totalConducted) * 100);
  const isAboveThreshold = overallPercentage >= 75;

  let classesToAttend = 0;
  let classesCanMiss = 0;

  if (totalConducted > 0) {
    if (!isAboveThreshold) {
      classesToAttend = Math.max(1, Math.ceil((0.75 * totalConducted - totalPresent) / 0.25));
    } else {
      classesCanMiss = Math.max(0, Math.floor((totalPresent - 0.75 * totalConducted) / 0.75));
    }
  }

  return {
    totalPresent,
    totalAbsent,
    totalCancelled,
    totalConducted,
    overallPercentage,
    isAboveThreshold,
    classesToAttend,
    classesCanMiss,
  };
}

/**
 * Generate Default Seed Data as specified:
 * Semester: "MBBS 3rd Year Part-I" (id: "sem_mbbs_3_1")
 */
export function createDefaultSemester(): SemesterProfile {
  const subjects = [
    'General Surgery',
    'Forensic Medicine',
    'Community Medicine',
    'General Medicine',
    'O.G',
    'Paediatrics',
    'ENT',
    'Ophthalmology',
  ];

  const scheduleTemplate: Record<string, DayScheduleVariation[]> = {
    Monday: [
      {
        id: 'mon_regular',
        applicableWeeks: [1, 2, 3, 4, 5],
        classes: [
          { slotId: 'mon_1', subject: 'General Surgery', startTime: '14:00', endTime: '15:00' },
          { slotId: 'mon_2', subject: 'Forensic Medicine', startTime: '15:00', endTime: '16:00' },
        ],
      },
    ],
    Tuesday: [
      {
        id: 'tue_regular',
        applicableWeeks: [1, 2, 3, 4, 5],
        classes: [
          { slotId: 'tue_1', subject: 'Community Medicine', startTime: '14:00', endTime: '15:00' },
          { slotId: 'tue_2', subject: 'General Medicine', startTime: '15:00', endTime: '16:00' },
        ],
      },
    ],
    Wednesday: [
      {
        id: 'wed_regular',
        applicableWeeks: [1, 2, 3, 4, 5],
        classes: [
          { slotId: 'wed_1', subject: 'O.G', startTime: '14:00', endTime: '15:00' },
          { slotId: 'wed_2', subject: 'Community Medicine', startTime: '15:00', endTime: '16:00' },
        ],
      },
    ],
    Thursday: [
      {
        id: 'thu_regular',
        applicableWeeks: [1, 2, 3, 4, 5],
        classes: [
          { slotId: 'thu_1', subject: 'Paediatrics', startTime: '14:00', endTime: '15:00' },
          { slotId: 'thu_2', subject: 'ENT', startTime: '15:00', endTime: '16:00' },
        ],
      },
    ],
    Friday: [
      {
        id: 'fri_regular',
        applicableWeeks: [1, 2, 3, 4, 5],
        classes: [
          { slotId: 'fri_1', subject: 'Forensic Medicine', startTime: '14:00', endTime: '15:00' },
          { slotId: 'fri_2', subject: 'Ophthalmology', startTime: '15:00', endTime: '16:00' },
        ],
      },
    ],
    Saturday: [
      {
        id: 'sat_var_13',
        applicableWeeks: [1, 3],
        classes: [
          { slotId: 'sat_13_1', subject: 'Forensic Medicine', startTime: '14:00', endTime: '15:00' },
          { slotId: 'sat_13_2', subject: 'Forensic Medicine', startTime: '15:00', endTime: '16:00' },
        ],
      },
      {
        id: 'sat_var_45',
        applicableWeeks: [4, 5],
        classes: [
          { slotId: 'sat_45_1', subject: 'Community Medicine', startTime: '14:00', endTime: '15:00' },
          { slotId: 'sat_45_2', subject: 'Community Medicine', startTime: '15:00', endTime: '16:00' },
        ],
      },
    ],
    Sunday: [],
  };

  // Seed sample realistic attendance for the past 14 days so the app shows meaningful data on initial load
  const attendanceData: Record<string, Record<string, AttendanceRecord>> = {};
  const today = new Date();

  for (let i = 1; i <= 21; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayName = getDayOfWeek(d);
    if (dayName === 'Sunday') continue;

    const weekNum = getWeekOfMonth(d);
    const variations = scheduleTemplate[dayName] || [];
    const variation = variations.find((v) => v.applicableWeeks.includes(weekNum));
    if (!variation || variation.classes.length === 0) continue;

    const dateKey = formatDateKey(d);
    attendanceData[dateKey] = {};

    variation.classes.forEach((slot, idx) => {
      // Create a realistic mix of mostly present, occasional absent, occasional cancelled
      let status: AttendanceStatus = 'present';
      if ((i + idx) % 7 === 0) {
        status = 'absent';
      } else if ((i + idx) % 11 === 0) {
        status = 'cancelled';
      }

      attendanceData[dateKey][slot.slotId] = {
        slotId: slot.slotId,
        subject: slot.subject,
        status,
        timestamp: `${dateKey}T${slot.startTime}:00`,
      };
    });
  }

  // Semester created ~1 month ago
  const createdDate = new Date(today);
  createdDate.setMonth(today.getMonth() - 2);

  return {
    id: 'sem_mbbs_3_1',
    name: 'MBBS 3rd Year Part-I',
    createdAt: createdDate.toISOString(),
    subjects,
    scheduleTemplate,
    attendanceData,
  };
}
