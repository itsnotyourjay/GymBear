import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useGymBearStore } from '../store/useGymBearStore'
import { saveUserProfile } from '../lib/storage'
import { hashPIN } from '../lib/pin'
import type { UserProfile, BrunoState } from '../store/useGymBearStore'
import { DAY_NAMES, DAY_LABELS, type DayName } from '../lib/dates'
import Bruno from '../components/Bruno'

// ── Step configuration ────────────────────────────────────────────────────────
const TOTAL_STEPS = 6

// ── Main component ─────────────────────────────────────────────────────────────
export default function Onboarding() {
  const navigate   = useNavigate()
  const setOnboarded = useGymBearStore((s) => s.setOnboarded)
  const setUserProfile = useGymBearStore((s) => s.setUserProfile)

  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)

  // Form state
  const [goal, setGoal]               = useState<UserProfile['goal'] | ''>('')
  const [gymDays, setGymDays]         = useState<DayName[]>(['monday', 'wednesday', 'friday'])
  const [duration, setDuration]       = useState<30 | 45 | 60>(45)
  const [increments, setIncrements]   = useState({ chest: 5, lat: 5, leg: 10 })
  const [pin, setPin]                 = useState('')
  const [pinConfirm, setPinConfirm]   = useState('')
  const [pinError, setPinError]       = useState('')

  // ── Navigation ──────────────────────────────────────────────────────────────
  const canAdvance = () => {
    if (step === 1) return goal !== ''
    if (step === 2) return gymDays.length >= 1
    if (step === 3) return true
    if (step === 4) return true
    if (step === 5) return pin.length >= 4 && pin === pinConfirm
    if (step === 6) return true
    return false
  }

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
    } else {
      void handleFinish()
    }
  }

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1)
  }

  // ── Finish ──────────────────────────────────────────────────────────────────
  const handleFinish = async () => {
    if (pin !== pinConfirm) {
      setPinError('PINs do not match')
      return
    }
    setSaving(true)
    const pinHash = await hashPIN(pin)
    const profile: UserProfile = {
      goal:             goal as UserProfile['goal'],
      gymDays,
      duration,
      machineIncrements: increments,
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
    enter:  { x: 60, opacity: 0 },
    center: { x: 0,  opacity: 1 },
    exit:   { x: -60, opacity: 0 },
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-between px-6 py-10">
      {/* Progress dots */}
      <div className="flex gap-2 mt-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-2 rounded-full transition-all duration-300 ${
              i + 1 <= step ? 'bg-red-elec w-8' : 'bg-blue-dark w-2'
            }`}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 w-full max-w-md flex flex-col justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {step === 1 && (
              <StepGoal value={goal} onChange={setGoal} />
            )}
            {step === 2 && (
              <StepGymDays selected={gymDays} onToggle={toggleDay} />
            )}
            {step === 3 && (
              <StepDuration value={duration} onChange={setDuration} />
            )}
            {step === 4 && (
              <StepIncrements values={increments} onChange={setIncrements} />
            )}
            {step === 5 && (
              <StepPIN
                pin={pin}
                pinConfirm={pinConfirm}
                error={pinError}
                onKey={handlePinKey}
              />
            )}
            {step === 6 && (
              <StepBruno />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="w-full max-w-md flex items-center justify-between mt-8">
        <button
          onClick={handleBack}
          className={`flex items-center gap-1 text-off-white/60 px-4 py-3 rounded-xl
            transition-opacity ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        >
          <ChevronLeft size={20} />
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={!canAdvance() || saving}
          className="flex items-center gap-2 bg-red-elec text-off-white font-bold
            px-8 py-3 rounded-xl disabled:opacity-40 transition-all active:scale-95"
        >
          {step === TOTAL_STEPS ? (
            saving ? 'Saving…' : <><Check size={18} /> Let's Go!</>
          ) : (
            <>Next <ChevronRight size={18} /></>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Step 1 — Goal ─────────────────────────────────────────────────────────────
type GoalOption = { value: UserProfile['goal']; label: string; desc: string }
const GOALS: GoalOption[] = [
  { value: 'strength',        label: 'Strength',        desc: 'Max lifts, low reps, big weights' },
  { value: 'hypertrophy',     label: 'Hypertrophy',     desc: 'Muscle size, 8–12 rep range' },
  { value: 'general_fitness', label: 'General Fitness', desc: 'Stay healthy, feel great' },
]

function StepGoal({
  value,
  onChange,
}: {
  value: UserProfile['goal'] | ''
  onChange: (v: UserProfile['goal']) => void
}) {
  return (
    <div>
      <h1 className="font-heading text-4xl text-off-white mb-2">WHAT'S YOUR GOAL?</h1>
      <p className="text-off-white/60 mb-8">We'll tailor your plan around this.</p>
      <div className="flex flex-col gap-3">
        {GOALS.map((g) => (
          <button
            key={g.value}
            onClick={() => onChange(g.value)}
            className={`w-full text-left px-6 py-4 rounded-2xl border-2 transition-all
              ${value === g.value
                ? 'border-red-elec bg-red-elec/10'
                : 'border-blue-dark bg-blue-dark/30 hover:border-off-white/30'
              }`}
          >
            <div className="font-bold text-off-white">{g.label}</div>
            <div className="text-off-white/60 text-sm mt-0.5">{g.desc}</div>
          </button>
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
    <div>
      <h1 className="font-heading text-4xl text-off-white mb-2">GYM DAYS</h1>
      <p className="text-off-white/60 mb-8">Pick the days you'll train.</p>
      <div className="grid grid-cols-7 gap-2">
        {DAY_NAMES.map((day) => (
          <button
            key={day}
            onClick={() => onToggle(day)}
            className={`aspect-square rounded-xl flex items-center justify-center
              font-bold text-sm transition-all
              ${selected.includes(day)
                ? 'bg-red-elec text-off-white'
                : 'bg-blue-dark/40 text-off-white/60 hover:bg-blue-dark/70'
              }`}
          >
            {DAY_LABELS[day]}
          </button>
        ))}
      </div>
      <p className="text-off-white/40 text-sm mt-4 text-center">
        {selected.length} day{selected.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  )
}

// ── Step 3 — Duration ─────────────────────────────────────────────────────────
const DURATIONS: Array<{ value: 30 | 45 | 60; label: string }> = [
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
]

function StepDuration({
  value,
  onChange,
}: {
  value: 30 | 45 | 60
  onChange: (v: 30 | 45 | 60) => void
}) {
  return (
    <div>
      <h1 className="font-heading text-4xl text-off-white mb-2">SESSION LENGTH</h1>
      <p className="text-off-white/60 mb-8">How long is a typical gym session?</p>
      <div className="flex flex-col gap-3">
        {DURATIONS.map((d) => (
          <button
            key={d.value}
            onClick={() => onChange(d.value)}
            className={`w-full py-5 rounded-2xl border-2 font-heading text-3xl transition-all
              ${value === d.value
                ? 'border-red-elec bg-red-elec/10 text-off-white'
                : 'border-blue-dark bg-blue-dark/30 text-off-white/70 hover:border-off-white/30'
              }`}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Step 4 — Machine Increments ────────────────────────────────────────────────
type IncrementField = 'chest' | 'lat' | 'leg'
const INCREMENT_FIELDS: Array<{ key: IncrementField; label: string; note: string }> = [
  { key: 'chest', label: 'Chest Press',   note: 'Cable/machine increment (kg)' },
  { key: 'lat',   label: 'Lat Pulldown',  note: 'Cable/machine increment (kg)' },
  { key: 'leg',   label: 'Leg Press',     note: 'Plate increment (kg)' },
]

function StepIncrements({
  values,
  onChange,
}: {
  values: { chest: number; lat: number; leg: number }
  onChange: (v: { chest: number; lat: number; leg: number }) => void
}) {
  const adjust = (field: IncrementField, delta: number) => {
    const current = values[field]
    const next = Math.max(1, Math.round((current + delta) * 10) / 10)
    onChange({ ...values, [field]: next })
  }

  return (
    <div>
      <h1 className="font-heading text-4xl text-off-white mb-2">MACHINE STEPS</h1>
      <p className="text-off-white/60 mb-8">
        The smallest weight increase available on each machine. Used for progressive overload.
      </p>
      <div className="flex flex-col gap-4">
        {INCREMENT_FIELDS.map(({ key, label, note }) => (
          <div key={key} className="bg-blue-dark/30 rounded-2xl px-6 py-4">
            <div className="font-bold text-off-white mb-0.5">{label}</div>
            <div className="text-off-white/50 text-xs mb-3">{note}</div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => adjust(key, -1)}
                className="w-10 h-10 rounded-xl bg-blue-dark text-off-white text-xl font-bold
                  flex items-center justify-center active:scale-90 transition-transform"
              >
                −
              </button>
              <span className="font-heading text-3xl text-off-white min-w-[60px] text-center">
                {values[key]} kg
              </span>
              <button
                onClick={() => adjust(key, 1)}
                className="w-10 h-10 rounded-xl bg-blue-dark text-off-white text-xl font-bold
                  flex items-center justify-center active:scale-90 transition-transform"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Step 6 — Meet Bruno ───────────────────────────────────────────────────────
const ACCESSORIES: Array<{ id: string; label: string }> = [
  { id: 'sunglasses', label: 'Sunglasses' },
  { id: 'headband', label: 'Headband' },
  { id: 'gold_chain', label: 'Gold Chain' },
  { id: 'grind_headphones', label: 'Headphones' },
  { id: 'challenge_crown', label: 'Crown' },
]

function StepBruno() {
  const [preview, setPreview] = useState<string | null>(null)
  const brunoState: BrunoState['animationState'] = 'champion'

  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="font-display text-4xl text-bear-bright mb-2 tracking-wide">MEET BRUNO</h1>
      <p className="text-bear-muted mb-6 text-sm leading-relaxed">
        Your personal gym bear. He grows stronger as you do — earn XP, level up, and unlock accessories.
      </p>

      {/* Bruno preview */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        className="mb-6"
      >
        <Bruno state={brunoState} accessory={preview} size={140} />
      </motion.div>

      {/* Accessory preview chips */}
      <p className="text-bear-muted text-xs uppercase tracking-wider mb-3">Preview accessories</p>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {ACCESSORIES.map((a) => (
          <button
            key={a.id}
            onClick={() => setPreview(preview === a.id ? null : a.id)}
            className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
              preview === a.id
                ? 'bg-ember text-white'
                : 'bg-bear-surface border border-bear-rim/40 text-bear-muted'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <p className="text-bear-muted/60 text-xs">
        Unlock accessories at levels 2, 3, 4, 5… keep grinding!
      </p>
    </div>
  )
}

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'del'],
]

function PINDots({ value, max = 6 }: { value: string; max?: number }) {
  return (
    <div className="flex gap-3 justify-center my-4">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-4 h-4 rounded-full border-2 transition-all duration-150
            ${i < value.length ? 'bg-red-elec border-red-elec' : 'bg-transparent border-off-white/40'}`}
        />
      ))}
    </div>
  )
}

function StepPIN({
  pin,
  pinConfirm,
  error,
  onKey,
}: {
  pin: string
  pinConfirm: string
  error: string
  onKey: (digit: string) => void
}) {
  const phase: 'pin' | 'confirm' = pin.length >= 4 ? 'confirm' : 'pin'

  return (
    <div>
      <h1 className="font-heading text-4xl text-off-white mb-2">SET YOUR PIN</h1>
      <p className="text-off-white/60 mb-6">4 digits. Used to unlock the app.</p>

      <div className="mb-2">
        <p className="text-off-white/60 text-sm text-center">
          {phase === 'pin' ? 'Enter PIN' : 'Confirm PIN'}
        </p>
        <PINDots value={phase === 'pin' ? pin : pinConfirm} max={4} />
      </div>

      {error && (
        <p className="text-red-elec text-sm text-center mb-3">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        {KEYPAD.flat().map((key, i) => (
          key === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => onKey(key)}
              className="h-16 rounded-2xl bg-blue-dark/40 text-off-white font-bold text-xl
                active:scale-90 transition-transform hover:bg-blue-dark/70"
            >
              {key === 'del' ? '⌫' : key}
            </button>
          )
        ))}
      </div>
    </div>
  )
}
