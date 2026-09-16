'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

export default function PushNotificationInit() {
  useEffect(() => {
    // Only execute on native Capacitor platforms (Android/iOS)
    if (!Capacitor.isNativePlatform()) return;

    let isMounted = true;

    async function initPush() {
      try {
        let permStatus = await PushNotifications.checkPermissions();

        if (permStatus.receive === 'prompt') {
          permStatus = await PushNotifications.requestPermissions();
        }

        if (permStatus.receive === 'granted') {
          await PushNotifications.register();
        }

        // Listen for successful token registration
        await PushNotifications.addListener('registration', (token) => {
          if (isMounted) {
            console.log('====================================');
            console.log('FCM REGISTRATION TOKEN:', token.value);
            console.log('====================================');
          }
        });

        // Listen for registration errors
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('FCM Registration Error:', JSON.stringify(error));
        });

        // Listen for incoming notifications when app is active
        await PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push Notification Received in Foreground:', notification);
        });
      } catch (err) {
        console.error('Failed to initialize push notifications:', err);
      }
    }

    initPush();

    return () => {
      isMounted = false;
    };
  }, []);

  return null;
}
