// utils/notifications.ts
import * as Notifications from "expo-notifications";

// Foreground behavior (required for iOS SDK 51+ types)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensurePermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function secondsUntil(date: Date): number {
  return Math.max(1, Math.floor((date.getTime() - Date.now()) / 1000));
}

/**
 * Schedule a one-time local notification for a future date.
 * Returns the Expo-scheduled notification id (store this on the row).
 */
export async function scheduleReminder(
  _appLevelId: string, // kept for your own mapping if desired
  title: string,
  body: string,
  triggerDate: Date
): Promise<string | null> {
  const ok = await ensurePermissions();
  if (!ok) return null;

  const trigger: Notifications.TimeIntervalTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: secondsUntil(triggerDate),
    repeats: false,
  };

  const scheduledId = await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger,
  });

  return scheduledId;
}

/** Cancel a scheduled notification by its Expo id */
export async function cancelReminder(notificationId: string | null | undefined) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore if it's already gone
  }
}
