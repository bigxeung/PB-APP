import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../services/notifications';
import { useToast } from './ToastContext';

interface NotificationContextType {
  expoPushToken: string | undefined;
  notification: Notifications.Notification | undefined;
  hasPermission: boolean;
  requestPermissions: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: undefined,
  notification: undefined,
  hasPermission: false,
  requestPermissions: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const [hasPermission, setHasPermission] = useState(false);
  const toast = useToast();

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  const requestPermissions = async () => {
    try {
      const token = await registerForPushNotificationsAsync();
      if (token) {
        setExpoPushToken(token);
        setHasPermission(true);
        toast.success('Notifications enabled!');
        console.log('📱 Expo Push Token:', token);

        // TODO: Send this token to your backend to store for sending notifications
        // await apiClient.post('/api/users/push-token', { token });
      } else {
        toast.error('Failed to enable notifications');
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      toast.error('Failed to enable notifications');
    }
  };

  useEffect(() => {
    // Check initial permission status
    Notifications.getPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });

    // Listener for when a notification is received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
      setNotification(notification);

      // Show toast for foreground notifications
      if (notification.request.content.title) {
        toast.info(
          notification.request.content.body || notification.request.content.title,
          5000
        );
      }
    });

    // Listener for when a user taps on a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      const data = response.notification.request.content.data;

      // Handle notification tap - navigate to appropriate screen
      // You can use navigation here based on data
      if (data) {
        console.log('Notification data:', data);
        // Example: navigation.navigate(data.screen, data.params);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        hasPermission,
        requestPermissions,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
