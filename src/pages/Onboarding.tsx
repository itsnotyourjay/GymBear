import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ArrowRight, Zap } from 'lucide-react'
import { useGymBearStore } from '../store/useGymBearStore'
import { saveUserProfile } from '../lib/storage'
import { hashPIN } from '../lib/pin'
import type { UserProfile } from '../store/useGymBearStore'
import { DAY_NAMES, DAY_LABELS, type DayName } from '../lib/dates'
import Bruno from '../components/Bruno'

// ── 3-step fast onboarding ─────────────────────────────────────────────────
const TOTAL_STEPS = 3

export default function Onboarding() {
  const navigate       = useNavigate()
  const setOnboarded   = useGymBearStore((s) => s.setOnboarded)
  const setUserProfile = useGymBearStore((s) => s.setUserProfile)

  const [step, setStep]   = useState(1)
  const [saving, setSaving] = useState(false)

  const [goal, setGoal]       = useState<UserProfile['goal'] | ''>('')
  const [gymDays, setGymDays] = useState<DayName[]>(['monday', 'wednesday', 'friday'])
  const [pin, setPin]         = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError]     = useState('')
  const [skipPin, setSkipPin]       = useState(false)

  const canAdvance = () => {
    if (step === 1) return goal !== ''
    if (step === 2) return gymDays.length >= 1
    if (step === 3) return skipPin || (pin.length >= 4 && pin === pinConfirm)
    return false
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1)
    else void handleFinish()
  }

  const handleFinish = async () => {
    if (!skipPin && pin !== pinConfirm) { setPinError('PINs do not match'); return }
    setSaving(true)
    const pinHash = skipPin ? null : await hashPIN(pin)
    const profile: UserProfile = {
      goal: goal as UserProfile['goal'],
      gymDays,
      duration: 45,
      machineIncrements: { chest: 5, lat: 5, leg: 10 },
      pinHash,
      onboardingComplete: true,
      createdAt: new Date().toISOString(),
    }
    setUserProfile(profile)
    setOnboarded()
    await saveUserProfile(profile)
    setSaving(false)
    navigate('/home')
  }

  // ── Toggle gym day ──────────────────────────────────────────────────────────
  const toggleDay = (day: DayName) => {
    setGymDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  // ── PIN input handler ───────────────────────────────────────────────────────
  const handlePinKey = (digit: string) => {
    setPinError('')
    
    if (digit === 'del') {
      // Delete from confirm first, then pin
      if (pinConfirm.length > 0) {
        setPinConfirm((p) => p.slice(0, -1))
      } else {
        setPin((p) => p.slice(0, -1))
      }
      return
    }

    // Fill PIN first (4–6 digits); once PIN complete (user hasn't started confirm), go to confirm
    if (pin.length < 4) {
      setPin((p) => p + digit)
    } else if (pin.length < 6 && pinConfirm.length === 0) {
      // Still filling PIN (optional 5th / 6th digit) — pressing a key starts confirm phase
      // UX: 4 digits fills PIN, immediately start confirm
      setPinConfirm((p) => p.length < 6 ? p + digit : p)
    } else {
      setPinConfirm((p) => p.length < 6 ? p + digit : p)
    }
  }

  // ── Slide animation ─────────────────────────────────────────────────────────
  const variants = {
    enter:  { x: 40, opacity: 0 },
    center: { x: 0,  opacity: 1 },
    exit:   { x: -40, opacity: 0 },
  }

  return (
    <div
      className="min-h-screen mesh-bg flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header: step indicator */}
      <div className="flex items-center justify-between px-6 pt-8 pb-2">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="w-10 h-10 glass rounded-full flex items-center justify-center active:scale-90 transition-transform"
          >
            <ChevronRight size={18} className="text-white/70 rotate-180" />
          </button>
        ) : <div className="w-10" />}

        {/* Track pills */}
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ width: i + 1 === step ? 24 : 6, opacity: i + 1 <= step ? 1 : 0.25 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="h-1.5 rounded-full bg-white"
            />
          ))}
        </div>

        <div className="w-10 text-right">
          <span className="text-white/30 text-xs font-medium">{step}/{TOTAL_STEPS}</span>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex flex-col px-6 pt-6 pb-10 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-1 flex flex-col"
          >
            {step === 1 && <StepGoal value={goal} onChange={(v) => { setGoal(v); setTimeout(handleNext, 280) }} />}
            {step === 2 && <StepGymDays selected={gymDays} onToggle={toggleDay} />}
            {step === 3 && (
              <StepPIN
                pin={pin}
                pinConfirm={pinConfirm}
                error={pinError}
                onKey={handlePinKey}
                skipped={skipPin}
                onSkip={() => { setSkipPin(true); setTimeout(handleNext, 100) }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA button — not shown on Step 1 (auto-advances) */}
      {step !== 1 && (
        <div className="px-6 pb-8">
          <motion.button
            key={`cta-${step}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={handleNext}
            disabled={!canAdvance() || saving}
            className="w-full bg-white text-black font-bold py-5 rounded-2xl
              flex items-center justify-center gap-3 text-lg shadow-lg
              disabled:opacity-30 active:scale-[0.98] transition-transform"
          >
            {saving ? (
              'Just a sec…'
            ) : step === TOTAL_STEPS ? (
              <><Zap size={22} /> Let's Go</>
            ) : (
              <>Continue <ArrowRight size={20} /></>
            )}
          </motion.button>
        </div>
      )}
    </div>
  )
}

// ── Step 1 — Goal ─────────────────────────────────────────────────────────────
const GOALS = [
  { value: 'strength'        as UserProfile['goal'], label: 'Strength',        emoji: '🏋️', desc: 'Max lifts, low reps' },
  { value: 'hypertrophy'     as UserProfile['goal'], label: 'Hypertrophy',     emoji: '💪', desc: 'Muscle size & shape' },
  { value: 'general_fitness' as UserProfile['goal'], label: 'General Fitness', emoji: '⚡', desc: 'Stay fit, feel great' },
]

function StepGoal({
  value,
  onChange,
}: {
  value: UserProfile['goal'] | ''
  onChange: (v: UserProfile['goal']) => void
}) {
  return (
    <div className="flex flex-col flex-1">
      <div className="mb-10">
        <p className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-3">Step 1 of 3</p>
        <h1 className="font-display text-[52px] leading-none text-white mb-3 tracking-wide">WHAT'S YOUR<br/>GOAL?</h1>
        <p className="text-white/50 text-base">Tap one to continue.</p>
      </div>
      <div className="flex flex-col gap-3">
        {GOALS.map((g, i) => (
          <motion.button
            key={g.value!}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 400, damping: 28 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onChange(g.value)}
            className={`relative w-full text-left glass rounded-2xl px-6 py-5 overflow-hidden border transition-all
              ${value === g.value ? 'border-white/30 shadow-lg' : 'border-white/0 hover:border-white/10'}`}
          >
            {value === g.value && (
              <motion.div
                layoutId="goalHighlight"
                className="absolute inset-0 bg-white/10 rounded-2xl"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <div className="relative z-10 flex items-center gap-4">
              <span className="text-3xl">{g.emoji}</span>
              <div>
                <div className="font-bold text-white text-lg">{g.label}</div>
                <div className="text-white/50 text-sm mt-0.5">{g.desc}</div>
              </div>
              {value === g.value && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-6 h-6 rounded-full bg-white flex items-center justify-center"
                >
                  <ChevronRight size={14} className="text-black" />
                </motion.div>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ── Step 2 — Gym Days ─────────────────────────────────────────────────────────
function StepGymDays({
  selected,
  onToggle,
}: {
  selected: DayName[]
  onToggle: (d: DayName) => void
}) {
  return (
    <div className="flex flex-col flex-1">
      <div className="mb-8">
        <p className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-3">Step 2 of 3</p>
        <h1 className="font-display text-[52px] leading-none text-white mb-3 tracking-wide">GYM<br/>DAYS</h1>
        <p className="text-white/50 text-base">Which days do you hit the gym?</p>
      </div>
      <div className="grid grid-cols-7 gap-2 mb-4">
        {DAY_NAMES.map((day) => {
          const active = selected.includes(day)
          return (
            <motion.button
              key={day}
              whileTap={{ scale: 0.88 }}
              onClick={() => onToggle(day)}
              className={`aspect-square rounded-2xl flex flex-col items-center justify-center gap-0.5
                font-semibold text-xs transition-all border
                ${active ? 'bg-white text-black border-white' : 'glass border-white/10 text-white/60'}`}
            >
              <span>{DAY_LABELS[day]}</span>
            </motion.button>
          )
        })}
      </div>
      <div className="glass rounded-2xl px-5 py-4 mt-2 border border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-white/50 text-sm">Days selected</span>
          <span className="text-white font-bold text-xl font-display">{selected.length}</span>
        </div>
        <div className="mt-2 text-white/40 text-xs">
          {selected.length >= 3 ? 'Push / Pull / Legs split available' : selected.length === 2 ? 'Upper / Lower split' : 'Full body recommended'}
        </div>
      </div>
    </div>
  )
}

// ── Step 3 — PIN (optional) ─────────────────────────────────────────────────
const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
]

function StepPIN({
  pin,
  pinConfirm,
  error,
  onKey,
  skipped,
  onSkip,
}: {
  pin: string
  pinConfirm: string
  error: string
  onKey: (digit: string) => void
  skipped: boolean
  onSkip: () => void
}) {
  const phase: 'pin' | 'confirm' = pin.length >= 4 ? 'confirm' : 'pin'
  const currentVal = phase === 'pin' ? pin : pinConfirm

  return (
    <div className="flex flex-col flex-1">
      <div className="mb-6">
        <p className="text-white/40 text-sm font-semibold uppercase tracking-widest mb-3">Step 3 of 3</p>
        <h1 className="font-display text-[52px] leading-none text-white mb-2 tracking-wide">
          {skipped ? 'ALL SET!' : 'SECURE<br/>IT'}
        </h1>
        {!skipped && <p className="text-white/50 text-sm">4-digit PIN to lock the app. Optional.</p>}
      </div>

      {!skipped && (
        <>
          <p className="text-white/60 text-sm text-center mb-3 font-medium">
            {phase === 'pin' ? 'Enter your PIN' : 'Confirm your PIN'}
          </p>

          {/* PIN dots */}
          <div className="flex gap-4 justify-center mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <motion.div
                key={i}
                animate={i < currentVal.length ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.15 }}
                className={`w-5 h-5 rounded-full border-2 transition-all
                  ${i < currentVal.length ? 'bg-white border-white' : 'bg-transparent border-white/30'}`}
              />
            ))}
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-400 text-sm text-center mb-3"
            >
              {error}
            </motion.p>
          )}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            {KEYPAD.flat().map((key, i) =>
              key === '' ? (
                <div key={i} />
              ) : (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => onKey(key)}
                  className="h-16 rounded-2xl glass border border-white/10 text-white font-semibold text-xl
                    active:bg-white/20 transition-colors"
                >
                  {key === 'del' ? '⌫' : key}
                </motion.button>
              )
            )}
          </div>
        </>
      )}

      {/* Skip option */}
      {!skipped && (
        <button
          onClick={onSkip}
          className="text-white/40 text-sm font-medium text-center mt-2 py-2 hover:text-white/70 transition-colors"
        >
          Skip for now → set PIN in Settings later
        </button>
      )}

      {skipped && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Bruno state="champion" accessory={null} size={140} />
          </motion.div>
          <p className="text-white/60 text-base text-center leading-relaxed">
            Bruno is ready.<br/>Let's build something great.
          </p>
        </div>
      )}
    </div>
  )
}
