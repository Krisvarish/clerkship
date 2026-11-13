import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { SemesterProfile, DayOfWeek } from '../types/attendance';

// Configure notification presentation when app is foregrounded
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.warn('Failed to request notification permissions:', error);
    return false;
  }
}

/**
 * Map DayOfWeek name to Expo Notifications weekday number:
 * Expo: 1 = Sunday, 2 = Monday, 3 = Tuesday, 4 = Wednesday, 5 = Thursday, 6 = Friday, 7 = Saturday
 */
function getWeekdayNumber(day: DayOfWeek): number {
  const map: Record<DayOfWeek, number> = {
    Sunday: 1,
    Monday: 2,
    Tuesday: 3,
    Wednesday: 4,
    Thursday: 5,
    Friday: 6,
    Saturday: 7,
  };
  return map[day];
}

/**
 * Schedule 10-minute pre-class reminders for all classes in the active semester template.
 */
export async function scheduleSemesterReminders(semester: SemesterProfile): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true;
  }

  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    // Clear existing notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (const day of days) {
      const variations = semester.scheduleTemplate[day] || [];
      const weekdayNumber = getWeekdayNumber(day);

      // Track already-scheduled triggers for this day to avoid duplicate alerts at the same time
      const scheduledTimes = new Set<string>();

      for (const variation of variations) {
        for (const slot of variation.classes) {
          if (!slot.startTime || !slot.startTime.includes(':')) continue;

          const [hStr, mStr] = slot.startTime.split(':');
          let hour = parseInt(hStr, 10);
          let minute = parseInt(mStr, 10);

          // Calculate 10 minutes prior
          minute -= 10;
          if (minute < 0) {
            minute += 60;
            hour -= 1;
            if (hour < 0) hour = 23;
          }

          const timeKey = `${day}_${hour}:${minute}_${slot.subject}`;
          if (scheduledTimes.has(timeKey)) continue;
          scheduledTimes.add(timeKey);

          await Notifications.scheduleNotificationAsync({
            content: {
              title: `Upcoming Class: ${slot.subject}`,
              body: `Starts in 10 minutes at ${slot.startTime}. Remember to mark attendance!`,
              sound: true,
              data: { slotId: slot.slotId, subject: slot.subject },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: weekdayNumber,
              hour,
              minute,
            },
          });
        }
      }
    }

    return true;
  } catch (error) {
    console.warn('Error scheduling notifications:', error);
    return false;
  }
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelSemesterReminders(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn('Error cancelling notifications:', error);
  }
}
