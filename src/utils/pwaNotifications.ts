/**
 * PWA Badging and Kitchen Notification Manager
 * Handles OS-level Badging API (e.g. badge count '2' on the app icon when closed or installed),
 * Service Worker push/sync notifications, and kitchen loud alert audio playback.
 */
import { playKitchenChime } from './audio';

export interface KitchenTicketNotification {
  title: string;
  body: string;
  badgeCount: number;
  ticketType: 'order' | 'waiter';
  tableNumber?: string;
}

/**
 * Updates the PWA App Badge on supported operating systems (Chromium, Android, Windows, macOS).
 * Sets the badge number on the home screen / taskbar / dock icon.
 */
export async function setAppBadgeCount(count: number): Promise<boolean> {
  const safeCount = Math.max(0, Math.floor(count));
  try {
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (safeCount > 0) {
        await (navigator as any).setAppBadge(safeCount);
      } else {
        await (navigator as any).clearAppBadge();
      }
    }
  } catch (err) {
    console.debug('Navigator setAppBadge not permitted or supported:', err);
  }

  // Also post to Service Worker so the background worker tracks current badge count
  try {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SET_BADGE',
        count: safeCount,
      });
    }
  } catch {}

  return true;
}

/**
 * Clears the PWA App Badge counter back to 0.
 */
export async function clearAppBadge(): Promise<void> {
  await setAppBadgeCount(0);
}

/**
 * Checks if Notification API is supported and granted.
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Requests browser permission for notifications.
 */
export async function requestKitchenNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return false;
  }
}

/**
 * Sends a high-priority system notification to kitchen staff,
 * updates the OS App Badge count (e.g. 2 for 2 active tickets),
 * and triggers the loud audio chime.
 */
export async function notifyKitchenNewTicket(params: KitchenTicketNotification): Promise<void> {
  // 1. Play loud kitchen chime
  playKitchenChime();

  // 2. Set App Badge count immediately
  await setAppBadgeCount(params.badgeCount);

  // 3. Dispatch system notification if granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration && registration.showNotification) {
          await registration.showNotification(params.title, {
            body: params.body,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            tag: 'kitchen-active-ticket',
            renotify: true,
            requireInteraction: true,
            silent: false,
            vibrate: [300, 150, 300, 150, 450],
            data: {
              url: '/?view=kitchen',
              ticketType: params.ticketType,
              tableNumber: params.tableNumber,
              timestamp: Date.now(),
            },
            actions: [
              { action: 'open_kds', title: 'Open Kitchen KDS' },
              { action: 'clear', title: 'Acknowledge' },
            ],
          } as NotificationOptions);
          return;
        }
      }

      // Fallback to window Notification constructor
      new Notification(params.title, {
        body: params.body,
        icon: '/pwa-192x192.png',
        tag: 'kitchen-active-ticket',
      });
    } catch (err) {
      console.debug('Failed to show system notification:', err);
    }
  }
}
