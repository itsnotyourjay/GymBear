/**
 * useWakeLock — prevents screen from sleeping during a workout
 * PRD Section 6.6
 * Uses Screen Wake Lock API (iOS 16.4+, all modern Chromium browsers)
 */
import { useEffect, useRef } from 'react'

export function useWakeLock(active: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!('wakeLock' in navigator)) return

    const acquire = async () => {
      try {
        lockRef.current = await (navigator as Navigator & { wakeLock: { request: (t: string) => Promise<WakeLockSentinel> } })
          .wakeLock.request('screen')
      } catch {
        // Permission denied or not supported — silent
      }
    }

    const release = () => {
      lockRef.current?.release().catch(() => {})
      lockRef.current = null
    }

    if (active) {
      acquire()
      // Re-acquire after page becomes visible again (e.g. user switches apps)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && active) acquire()
      })
    } else {
      release()
    }

    return release
  }, [active])
}
