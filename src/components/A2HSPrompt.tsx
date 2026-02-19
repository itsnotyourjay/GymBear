/**
 * A2HSPrompt — Add to Home Screen nudge
 * PRD Section 6.6 — surfaces after user's 2nd session
 * Works on Android Chrome (beforeinstallprompt) and shows a manual guide on iOS
 */
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download } from 'lucide-react'
import { loadAllSessions, lsGet, lsSet } from '../lib/storage'

type Platform = 'android' | 'ios' | 'other'

function detectPlatform(): Platform {
  const ua = navigator.userAgent
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/android/i.test(ua)) return 'android'
  return 'other'
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

export default function A2HSPrompt() {
  const [visible, setVisible]         = useState(false)
  const [platform, setPlatform]       = useState<Platform>('other')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferred] = useState<any>(null)

  useEffect(() => {
    // Don't show if already installed
    if (isInStandaloneMode()) return
    // Don't show if dismissed before
    if (lsGet<boolean>('a2hs_dismissed')) return
    // Show after 2nd session
    const sessions = loadAllSessions()
    if (sessions.length < 2) return

    const p = detectPlatform()
    setPlatform(p)

    if (p === 'android') {
      const handler = (e: Event) => {
        e.preventDefault()
        setDeferred(e)
        setVisible(true)
      }
      window.addEventListener('beforeinstallprompt', handler)
      return () => window.removeEventListener('beforeinstallprompt', handler)
    } else if (p === 'ios') {
      // Show manual guide on iOS
      setTimeout(() => setVisible(true), 3000)
    }
  }, [])

  const dismiss = () => {
    setVisible(false)
    lsSet('a2hs_dismissed', true)
  }

  const install = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') dismiss()
    }
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          className="fixed bottom-24 left-4 right-4 z-50 bg-blue-dark border border-red-elec/40
            rounded-2xl p-4 shadow-2xl"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-elec/20 flex items-center justify-center shrink-0">
              <Download size={18} className="text-red-elec" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-off-white font-semibold text-sm">Add GymBear to Home Screen</p>
              {platform === 'ios' ? (
                <p className="text-off-white/50 text-xs mt-0.5">
                  Tap the <strong className="text-off-white/70">Share</strong> button then{' '}
                  <strong className="text-off-white/70">"Add to Home Screen"</strong>
                </p>
              ) : (
                <p className="text-off-white/50 text-xs mt-0.5">
                  Install for instant access — works fully offline
                </p>
              )}
              {platform === 'android' && (
                <button
                  onClick={install}
                  className="mt-2 bg-red-elec text-off-white text-xs font-bold px-4 py-1.5 rounded-lg"
                >
                  Install
                </button>
              )}
            </div>
            <button onClick={dismiss} className="text-off-white/40 hover:text-off-white">
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
