/**
 * Settings screen
 * PRD Section 5.5, Phase 6
 * Sections: Profile, Increments, PIN, Data
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Target, Calendar, Clock, Sliders,
  Lock, Download, Trash2, Check, AlertTriangle,
} from 'lucide-react'
import { useGymBearStore } from '../store/useGymBearStore'
import { saveUserProfile, clearAllLocalData, loadAllSessions, loadPR } from '../lib/storage'
import { EXERCISES } from '../data/exercises'
import { hashPIN } from '../lib/pin'
import { DAY_NAMES, DAY_LABELS, type DayName } from '../lib/dates'
import BottomNav from '../components/BottomNav'

// ── Small reusable row ────────────────────────────────────────────────────────
function SettingsRow({
  icon: Icon, label, value, onClick,
}: { icon: typeof Target; label: string; value?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors
        ${onClick ? 'active:bg-white/5' : 'cursor-default'}`}
    >
      <div className="w-8 h-8 rounded-lg bg-blue-dark/60 flex items-center justify-center shrink-0">
        <Icon size={15} className="text-off-white/60" />
      </div>
      <span className="flex-1 text-off-white/80 text-sm">{label}</span>
      {value && <span className="text-off-white/40 text-xs mr-1">{value}</span>}
      {onClick && <ChevronRight size={14} className="text-off-white/30 shrink-0" />}
    </button>
  )
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-dark/30 rounded-2xl overflow-hidden border border-blue-dark/50 divide-y divide-blue-dark/50">
      {children}
    </div>
  )
}

// ── Modal overlay ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-lg bg-navy rounded-t-3xl p-6"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-2xl text-off-white">{title}</h2>
          <button onClick={onClose} className="text-off-white/40 hover:text-off-white w-8 h-8 flex items-center justify-center">×</button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
type ActiveModal = 'goal' | 'days' | 'duration' | 'increments' | 'pin' | 'clear' | null

export default function Settings() {
  const navigate       = useNavigate()
  const userProfile    = useGymBearStore((s) => s.userProfile)
  const setUserProfile = useGymBearStore((s) => s.setUserProfile)

  const [modal, setModal]       = useState<ActiveModal>(null)
  const [saved, setSaved]       = useState(false)
  const [exporting, setExport]  = useState(false)

  // Edit buffers
  const [editGoal, setEditGoal]             = useState(userProfile.goal)
  const [editDays, setEditDays]             = useState<DayName[]>(userProfile.gymDays as DayName[])
  const [editDuration, setEditDuration]     = useState<30|45|60>(userProfile.duration ?? 45)
  const [editIncrements, setEditIncrements] = useState({ ...userProfile.machineIncrements })
  const [newPin, setNewPin]                 = useState('')
  const [pinConfirm, setPinConfirm]         = useState('')
  const [pinErr, setPinErr]                 = useState('')
  const [clearConfirm, setClearConfirm]     = useState(false)

  const openModal = (m: ActiveModal) => {
    // Reset edit buffers from current profile
    setEditGoal(userProfile.goal)
    setEditDays(userProfile.gymDays as DayName[])
    setEditDuration(userProfile.duration ?? 45)
    setEditIncrements({ ...userProfile.machineIncrements })
    setNewPin(''); setPinConfirm(''); setPinErr('')
    setClearConfirm(false)
    setModal(m)
    setSaved(false)
  }

  const saveAndClose = async (updates: Partial<typeof userProfile>) => {
    const updated = { ...userProfile, ...updates }
    setUserProfile(updates)
    await saveUserProfile(updated)
    setSaved(true)
    setTimeout(() => { setModal(null); setSaved(false) }, 700)
  }

  // ── JSON export ─────────────────────────────────────────────────────────────
  const exportData = () => {
    setExport(true)
    try {
      const sessions = loadAllSessions()
      const prs      = EXERCISES.map((ex) => ({ id: ex.id, name: ex.name, pr: loadPR(ex.id) }))
                                 .filter((e) => e.pr !== null)

      const dump = {
        exportDate:  new Date().toISOString(),
        version:     '1.0',
        profile:     userProfile,
        sessions,
        personalRecords: prs,
      }

      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `gymbear-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setTimeout(() => setExport(false), 1200)
    }
  }

  // Labels
  const GOAL_LABELS: Record<string, string> = {
    strength: 'Strength', hypertrophy: 'Hypertrophy', general_fitness: 'General Fitness',
  }
  const goalLabel = GOAL_LABELS[userProfile.goal ?? ''] ?? 'Not set'

  const daysLabel = (userProfile.gymDays as DayName[])
    .map((d) => DAY_LABELS[d].slice(0, 3))
    .join(', ') || 'None set'

  return (
    <div className="min-h-screen bg-navy flex flex-col pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex items-center gap-3">
        <button
          onClick={() => navigate('/home')}
          className="w-10 h-10 rounded-xl bg-blue-dark/40 flex items-center justify-center"
        >
          <ChevronLeft size={20} className="text-off-white" />
        </button>
        <h1 className="font-heading text-3xl text-off-white tracking-wide">SETTINGS</h1>
      </div>

      <div className="flex-1 px-4 space-y-5">

        {/* Profile */}
        <div>
          <p className="text-off-white/40 text-xs font-bold uppercase tracking-wider mb-2 px-1">
            Training Profile
          </p>
          <SectionCard>
            <SettingsRow icon={Target}   label="Fitness Goal"    value={goalLabel}                onClick={() => openModal('goal')} />
            <SettingsRow icon={Calendar} label="Training Days"   value={daysLabel}               onClick={() => openModal('days')} />
            <SettingsRow icon={Clock}    label="Session Duration" value={`${userProfile.duration ?? 45} min`} onClick={() => openModal('duration')} />
          </SectionCard>
        </div>

        {/* Equipment */}
        <div>
          <p className="text-off-white/40 text-xs font-bold uppercase tracking-wider mb-2 px-1">
            Equipment Increments
          </p>
          <SectionCard>
            <SettingsRow
              icon={Sliders}
              label="Machine increments"
              value={`Chest ${userProfile.machineIncrements.chest}kg · Lat ${userProfile.machineIncrements.lat}kg · Leg ${userProfile.machineIncrements.leg}kg`}
              onClick={() => openModal('increments')}
            />
          </SectionCard>
        </div>

        {/* Security */}
        <div>
          <p className="text-off-white/40 text-xs font-bold uppercase tracking-wider mb-2 px-1">
            Security
          </p>
          <SectionCard>
            <SettingsRow icon={Lock} label="Change PIN" onClick={() => openModal('pin')} />
          </SectionCard>
        </div>

        {/* Data */}
        <div>
          <p className="text-off-white/40 text-xs font-bold uppercase tracking-wider mb-2 px-1">
            Data
          </p>
          <SectionCard>
            <button
              onClick={exportData}
              disabled={exporting}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-dark/60 flex items-center justify-center shrink-0">
                <Download size={15} className="text-neon-green" />
              </div>
              <span className="flex-1 text-off-white/80 text-sm">
                {exporting ? 'Exporting…' : 'Export all data as JSON'}
              </span>
              <ChevronRight size={14} className="text-off-white/30 shrink-0" />
            </button>
            <button
              onClick={() => openModal('clear')}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left active:bg-white/5"
            >
              <div className="w-8 h-8 rounded-lg bg-red-elec/20 flex items-center justify-center shrink-0">
                <Trash2 size={15} className="text-red-elec" />
              </div>
              <span className="flex-1 text-red-elec/90 text-sm">Clear all data</span>
              <ChevronRight size={14} className="text-red-elec/30 shrink-0" />
            </button>
          </SectionCard>
        </div>

        {/* Version */}
        <p className="text-center text-off-white/20 text-xs pb-2">
          GymBear v1.0 · No excuses. Just reps. 🐻
        </p>
      </div>

      <BottomNav />

      {/* ── Modals ── */}
      <AnimatePresence>

        {/* Goal */}
        {modal === 'goal' && (
          <Modal title="Fitness Goal" onClose={() => setModal(null)}>
            {(['strength', 'hypertrophy', 'general_fitness'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setEditGoal(g)}
                className={`w-full mb-3 p-4 rounded-2xl border text-left flex items-center justify-between ${
                  editGoal === g ? 'border-red-elec bg-red-elec/10' : 'border-blue-dark/60 bg-blue-dark/20'
                }`}
              >
                <span className="text-off-white text-sm font-medium">
                  {{ strength: 'Strength', hypertrophy: 'Hypertrophy', general_fitness: 'General Fitness' }[g]}
                </span>
                {editGoal === g && <Check size={16} className="text-red-elec" />}
              </button>
            ))}
            <button
              onClick={() => saveAndClose({ goal: editGoal })}
              className="w-full bg-red-elec text-off-white font-bold py-3.5 rounded-xl mt-1"
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </Modal>
        )}

        {/* Days */}
        {modal === 'days' && (
          <Modal title="Training Days" onClose={() => setModal(null)}>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {DAY_NAMES.map((d) => {
                const active = editDays.includes(d as DayName)
                return (
                  <button
                    key={d}
                    onClick={() => setEditDays((prev) =>
                      active ? prev.filter((x) => x !== d) : [...prev, d as DayName]
                    )}
                    className={`py-3 rounded-xl text-sm font-medium transition-all ${
                      active ? 'bg-red-elec text-off-white' : 'bg-blue-dark/40 text-off-white/50'
                    }`}
                  >
                    {DAY_LABELS[d as DayName].slice(0, 3)}
                  </button>
                )
              })}
            </div>
            <button
              disabled={editDays.length === 0}
              onClick={() => saveAndClose({ gymDays: editDays })}
              className="w-full bg-red-elec text-off-white font-bold py-3.5 rounded-xl disabled:opacity-40"
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </Modal>
        )}

        {/* Duration */}
        {modal === 'duration' && (
          <Modal title="Session Duration" onClose={() => setModal(null)}>
            <div className="flex gap-3 mb-5">
              {([30, 45, 60] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setEditDuration(d)}
                  className={`flex-1 py-4 rounded-2xl text-center font-heading text-2xl transition-all ${
                    editDuration === d ? 'bg-red-elec text-off-white' : 'bg-blue-dark/40 text-off-white/60'
                  }`}
                >
                  {d}<span className="text-sm font-sans ml-1">min</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => saveAndClose({ duration: editDuration })}
              className="w-full bg-red-elec text-off-white font-bold py-3.5 rounded-xl"
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </Modal>
        )}

        {/* Increments */}
        {modal === 'increments' && (
          <Modal title="Machine Increments" onClose={() => setModal(null)}>
            {(['chest', 'lat', 'leg'] as const).map((m) => (
              <div key={m} className="flex items-center justify-between mb-4">
                <span className="text-off-white/70 text-sm capitalize w-16">{m}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setEditIncrements((p) => ({ ...p, [m]: Math.max(1, p[m] - 1) }))}
                    className="w-10 h-10 rounded-xl bg-blue-dark/50 text-off-white text-lg font-bold"
                  >−</button>
                  <span className="text-off-white font-heading text-xl w-10 text-center">
                    {editIncrements[m]}
                  </span>
                  <button
                    onClick={() => setEditIncrements((p) => ({ ...p, [m]: Math.min(20, p[m] + 1) }))}
                    className="w-10 h-10 rounded-xl bg-blue-dark/50 text-off-white text-lg font-bold"
                  >+</button>
                  <span className="text-off-white/40 text-sm w-6">kg</span>
                </div>
              </div>
            ))}
            <button
              onClick={() => saveAndClose({ machineIncrements: editIncrements })}
              className="w-full bg-red-elec text-off-white font-bold py-3.5 rounded-xl mt-2"
            >
              {saved ? '✓ Saved' : 'Save'}
            </button>
          </Modal>
        )}

        {/* PIN change */}
        {modal === 'pin' && (
          <Modal title="Change PIN" onClose={() => setModal(null)}>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-off-white/40 text-xs uppercase tracking-wider block mb-1">New PIN (4–8 digits)</label>
                <input
                  type="password" inputMode="numeric" maxLength={8}
                  value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-blue-dark/40 border border-blue-dark/60 rounded-xl px-4 py-3
                    text-off-white text-xl tracking-widest focus:outline-none focus:border-red-elec"
                  placeholder="••••"
                />
              </div>
              <div>
                <label className="text-off-white/40 text-xs uppercase tracking-wider block mb-1">Confirm PIN</label>
                <input
                  type="password" inputMode="numeric" maxLength={8}
                  value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-blue-dark/40 border border-blue-dark/60 rounded-xl px-4 py-3
                    text-off-white text-xl tracking-widest focus:outline-none focus:border-red-elec"
                  placeholder="••••"
                />
              </div>
              {pinErr && <p className="text-red-elec text-xs">{pinErr}</p>}
            </div>
            <button
              onClick={async () => {
                if (newPin.length < 4) { setPinErr('PIN must be at least 4 digits'); return }
                if (newPin !== pinConfirm) { setPinErr("PINs don't match"); return }
                const pinHash = await hashPIN(newPin)
                saveAndClose({ pinHash })
              }}
              className="w-full bg-red-elec text-off-white font-bold py-3.5 rounded-xl"
            >
              {saved ? '✓ Saved' : 'Update PIN'}
            </button>
          </Modal>
        )}

        {/* Clear data */}
        {modal === 'clear' && (
          <Modal title="Clear All Data" onClose={() => setModal(null)}>
            <div className="flex flex-col items-center text-center mb-6">
              <AlertTriangle size={44} className="text-red-elec mb-3" />
              <p className="text-off-white/80 text-sm leading-relaxed">
                This will delete <strong>all your sessions, PRs, streaks, Bruno's XP and accessories</strong>. Your profile settings will also be reset.
              </p>
              <p className="text-off-white/40 text-xs mt-2">This cannot be undone.</p>
            </div>
            {!clearConfirm ? (
              <button
                onClick={() => setClearConfirm(true)}
                className="w-full border border-red-elec/60 text-red-elec font-bold py-3.5 rounded-xl"
              >
                I understand — continue
              </button>
            ) : (
              <button
                onClick={() => {
                  clearAllLocalData()
                  window.location.href = '/'
                }}
                className="w-full bg-red-elec text-off-white font-bold py-3.5 rounded-xl"
              >
                Delete Everything
              </button>
            )}
          </Modal>
        )}

      </AnimatePresence>
    </div>
  )
}
