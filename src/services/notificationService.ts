import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const REMINDER_TIME_KEY = 'workout_reminder_time';
const REMINDER_ENABLED_KEY = 'workout_reminder_enabled';
const SCHEDULED_NOTIFICATION_ID = 'workout_reminder_notification_id';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request notification permissions from the user
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permissions not granted');
            return false;
        }

        // Set Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('workout-reminders', {
                name: 'Workout Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#4CAF50',
                sound: 'default',
            });
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}

/**
 * Schedule a daily workout reminder notification at the specified time
 */
export async function scheduleWorkoutReminder(hour: number, minute: number): Promise<boolean> {
    try {
        // Cancel existing reminder first
        await cancelWorkoutReminder();

        // Request permissions if not already granted
        const hasPermission = await requestNotificationPermissions();
        if (!hasPermission) {
            return false;
        }

        // Schedule daily repeating notification
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Time to Work Out! 💪",
                body: "Your daily workout is waiting. Let's crush those fitness goals!",
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DAILY,
                hour,
                minute,
                channelId: Platform.OS === 'android' ? 'workout-reminders' : undefined,
            },
        });

        // Store the notification ID for later cancellation
        await AsyncStorage.setItem(SCHEDULED_NOTIFICATION_ID, notificationId);

        console.log(`Scheduled workout reminder for ${hour}:${minute.toString().padStart(2, '0')}`);
        return true;
    } catch (error) {
        console.error('Error scheduling workout reminder:', error);
        return false;
    }
}

/**
 * Cancel any existing workout reminder notification
 */
export async function cancelWorkoutReminder(): Promise<void> {
    try {
        const existingId = await AsyncStorage.getItem(SCHEDULED_NOTIFICATION_ID);
        if (existingId) {
            await Notifications.cancelScheduledNotificationAsync(existingId);
            await AsyncStorage.removeItem(SCHEDULED_NOTIFICATION_ID);
            console.log('Cancelled existing workout reminder');
        }
    } catch (error) {
        console.error('Error cancelling workout reminder:', error);
    }
}

/**
 * Get the last workout start time from the database
 * Used as fallback when user hasn't set a reminder time
 */
export async function getLastWorkoutTime(): Promise<{ hour: number; minute: number } | null> {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data, error } = await supabase
            .from('workout_sessions')
            .select('started_at')
            .eq('user_id', session.user.id)
            .not('started_at', 'is', null)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data?.started_at) {
            return null;
        }

        const startTime = new Date(data.started_at);
        return {
            hour: startTime.getHours(),
            minute: startTime.getMinutes(),
        };
    } catch (error) {
        console.error('Error fetching last workout time:', error);
        return null;
    }
}

/**
 * Save reminder settings to both local storage and database
 */
export async function saveReminderSettings(
    hour: number,
    minute: number,
    enabled: boolean
): Promise<boolean> {
    try {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Save to AsyncStorage for quick local access
        await AsyncStorage.setItem(REMINDER_TIME_KEY, timeString);
        await AsyncStorage.setItem(REMINDER_ENABLED_KEY, enabled.toString());

        // Save to database
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            const { error } = await supabase
                .from('profiles')
                .update({
                    workout_reminder_time: timeString,
                    workout_reminder_enabled: enabled,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', session.user.id);

            if (error) {
                console.error('Error saving reminder to database:', error);
            }
        }

        // Schedule or cancel notification based on enabled state
        if (enabled) {
            return await scheduleWorkoutReminder(hour, minute);
        } else {
            await cancelWorkoutReminder();
            return true;
        }
    } catch (error) {
        console.error('Error saving reminder settings:', error);
        return false;
    }
}

/**
 * Load reminder settings from local storage or database
 */
export async function loadReminderSettings(): Promise<{
    hour: number;
    minute: number;
    enabled: boolean;
} | null> {
    try {
        // Try local storage first for speed
        const [storedTime, storedEnabled] = await Promise.all([
            AsyncStorage.getItem(REMINDER_TIME_KEY),
            AsyncStorage.getItem(REMINDER_ENABLED_KEY),
        ]);

        if (storedTime) {
            const [hour, minute] = storedTime.split(':').map(Number);
            return {
                hour,
                minute,
                enabled: storedEnabled === 'true',
            };
        }

        // Fall back to database
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return null;

        const { data, error } = await supabase
            .from('profiles')
            .select('workout_reminder_time, workout_reminder_enabled')
            .eq('id', session.user.id)
            .maybeSingle();

        if (error || !data?.workout_reminder_time) {
            return null;
        }

        const [hour, minute] = data.workout_reminder_time.split(':').map(Number);
        const enabled = data.workout_reminder_enabled || false;

        // Cache to local storage
        await AsyncStorage.setItem(REMINDER_TIME_KEY, data.workout_reminder_time);
        await AsyncStorage.setItem(REMINDER_ENABLED_KEY, enabled.toString());

        return { hour, minute, enabled };
    } catch (error) {
        console.error('Error loading reminder settings:', error);
        return null;
    }
}

/**
 * Initialize reminders on app start
 * Call this from app initialization
 */
export async function initializeWorkoutReminders(): Promise<void> {
    try {
        const settings = await loadReminderSettings();

        if (settings && settings.enabled) {
            await scheduleWorkoutReminder(settings.hour, settings.minute);
        }
    } catch (error) {
        console.error('Error initializing workout reminders:', error);
    }
}
