export type AttendanceStatus = 'present' | 'absent' | 'cancelled';

export interface ClassSlot {
  slotId: string;       // Unique ID e.g., "mon_1", "sat_v1_slot2"
  subject: string;      // e.g., "General Surgery"
  startTime: string;    // 24h format "14:00"
  endTime: string;      // 24h format "15:00"
}

export interface DayScheduleVariation {
  id: string;
  applicableWeeks: number[]; // [1, 2, 3, 4, 5] for regular weekly days, or [1, 3] / [4, 5] for alternating Saturdays
  classes: ClassSlot[];
}

export interface AttendanceRecord {
  slotId: string;
  subject: string;
  status: AttendanceStatus;
  timestamp: string;
}

export interface SemesterProfile {
  id: string;
  name: string;
  createdAt: string;
  subjects: string[];
  // Keyed by day name: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
  scheduleTemplate: Record<string, DayScheduleVariation[]>;
  // Keyed by date string "YYYY-MM-DD", then by slotId
  attendanceData: Record<string, Record<string, AttendanceRecord>>;
}

export interface SubjectAttendanceStats {
  subject: string;
  present: number;
  absent: number;
  cancelled: number;
  totalConducted: number;
  percentage: number;
  isAboveThreshold: boolean;
  classesToAttend: number;
  classesCanMiss: number;
}

export interface AggregateAttendanceStats {
  totalPresent: number;
  totalAbsent: number;
  totalCancelled: number;
  totalConducted: number;
  overallPercentage: number;
  isAboveThreshold: boolean;
  classesToAttend: number;
  classesCanMiss: number;
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
