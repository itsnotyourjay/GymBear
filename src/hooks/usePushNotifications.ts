/**
 * usePushNotifications.ts — Enhancement §13.2
 * Web Push API + VAPID subscribe/unsubscribe.
 * Posts subscription to /api/push/subscribe on the Cloudflare Worker.
 */

import { useState, useCallback, useEffect } from 'react'

const WORKER_URL = import.meta.env.VITE_WORKER_URL as string | undefined
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

/** Convert VAPID base64 URL-safe string to Uint8Array */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

type PermissionStatus = 'default' | 'granted' | 'denied' | 'unsupported'

interface UsePushNotifications {
  permission: PermissionStatus
  subscription: PushSubscription | null
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
  isLoading: boolean
  error: string | null
}

export function usePushNotifications(): UsePushNotifications {
  const [permission, setPermission] = useState<PermissionStatus>('default')
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check current status on mount
  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PermissionStatus)

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setSubscription(sub)
      })
    }).catch(() => {/* no SW registered yet */})
  }, [])

  const subscribe = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setError('Push notifications not supported in this browser.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Request permission
      const perm = await Notification.requestPermission()
      setPermission(perm as PermissionStatus)

      if (perm !== 'granted') {
        setError('Notification permission denied.')
        return
      }

      if (!VAPID_PUBLIC_KEY) {
        setError('Push service not configured.')
        return
      }

      // Register service worker if not already registered
      const reg = await navigator.serviceWorker.ready

      // Subscribe with VAPID
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as unknown as BufferSource,
      })

      setSubscription(sub)

      // Post to worker
      if (WORKER_URL) {
        await fetch(`${WORKER_URL}/api/push/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub.toJSON()),
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const unsubscribe = useCallback(async () => {
    if (!subscription) return
    setIsLoading(true)
    setError(null)

    try {
      await subscription.unsubscribe()
      setSubscription(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unsubscribe failed')
    } finally {
      setIsLoading(false)
    }
  }, [subscription])

  return { permission, subscription, subscribe, unsubscribe, isLoading, error }
}
