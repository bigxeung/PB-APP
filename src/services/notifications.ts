/**
 * Push Notification Service
 *
 * Handles push notification setup, permissions, and token management
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Failed to get push token for push notification!');
      return;
    }

    try {
      // Get the Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;

      if (!projectId) {
        console.log('⚠️ No project ID found. Using legacy method.');
        token = (await Notifications.getExpoPushTokenAsync()).data;
      } else {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      }

      console.log('📱 Push token:', token);
    } catch (error) {
      console.log('❌ Error getting push token:', error);
    }
  } else {
    console.log('⚠️ Must use physical device for Push Notifications');
  }

  return token;
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null, // null means show immediately
  });
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get notification permissions status
 */
export async function getNotificationPermissionsStatus() {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Clear all delivered notifications
 */
export async function clearAllNotifications() {
  await Notifications.dismissAllNotificationsAsync();
}
