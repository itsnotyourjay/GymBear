/**
 * Wardrobe — Bruno's cosmetics screen
 * PRD Section 7.3 — accessories, level, XP progress
 */
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Lock } from 'lucide-react'
import { useGymBearStore } from '../store/useGymBearStore'
import Bruno from '../components/Bruno'
import BottomNav from '../components/BottomNav'

const ACCESSORIES = [
  { id: 'gym_bag',        name: 'Gym Bag',     unlockLevel: 2, emoji: '💼' },
  { id: 'sunglasses',     name: 'Sunglasses',  unlockLevel: 3, emoji: '🕶️' },
  { id: 'headband',       name: 'Headband',    unlockLevel: 4, emoji: '🎽' },
  { id: 'chalk',          name: 'Chalk Hands', unlockLevel: 5, emoji: '🤍' },
  { id: 'gold_chain',     name: 'Gold Chain',  unlockLevel: 6, emoji: '📿' },
  { id: 'backwards_cap',  name: 'Swag Cap',    unlockLevel: 7, emoji: '🧢' },
  { id: 'protein_shaker', name: 'Shaker',      unlockLevel: 8, emoji: '🥤' },
] as const

const XP_PER_LEVEL = 500

export default function Wardrobe() {
  const navigate           = useNavigate()
  const bruno              = useGymBearStore((s) => s.bruno)
  const setActiveAccessory = useGymBearStore((s) => s.setActiveAccessory)

  const xpInLevel  = bruno.xp % XP_PER_LEVEL
  const xpProgress = Math.round((xpInLevel / XP_PER_LEVEL) * 100)

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
        <h1 className="font-heading text-3xl text-off-white tracking-wide">WARDROBE</h1>
      </div>

      {/* Bruno preview card */}
      <div className="mx-4 mb-5 bg-blue-dark/30 rounded-2xl p-5 flex flex-col items-center border border-blue-dark/60">
        <Bruno
          state="idle"
          accessory={bruno.activeAccessory}
          level={bruno.level}
          size={130}
        />

        <div className="mt-3 text-center">
          <div className="font-heading text-2xl text-off-white">LEVEL {bruno.level}</div>
          <div className="text-off-white/40 text-xs mt-0.5">{bruno.xp.toLocaleString()} XP total</div>
        </div>

        {/* XP progress bar */}
        <div className="w-52 mt-4">
          <div className="flex justify-between text-xs text-off-white/40 mb-1">
            <span>{xpInLevel} XP</span>
            <span>{XP_PER_LEVEL} XP</span>
          </div>
          <div className="h-2.5 bg-blue-dark rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-red-elec to-gold"
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 0.9, ease: 'easeOut' }}
            />
          </div>
          <p className="text-xs text-off-white/30 text-center mt-1">
            {XP_PER_LEVEL - xpInLevel} XP to Level {bruno.level + 1}
          </p>
        </div>
      </div>

      {/* Accessories */}
      <div className="px-4">
        <h2 className="text-off-white/50 text-xs font-bold uppercase tracking-wider mb-3">
          Select Accessory
        </h2>

        {/* None option */}
        <button
          onClick={() => setActiveAccessory(null)}
          className={`w-full mb-3 p-4 rounded-2xl border text-left transition-all ${
            bruno.activeAccessory === null
              ? 'border-red-elec bg-red-elec/10 text-off-white'
              : 'border-blue-dark/50 bg-blue-dark/20 text-off-white/60'
          }`}
        >
          <span className="text-sm font-medium">No Accessory</span>
          {bruno.activeAccessory === null && (
            <span className="ml-2 text-xs text-red-elec">● Active</span>
          )}
        </button>

        {/* Accessory grid */}
        <div className="grid grid-cols-2 gap-3">
          {ACCESSORIES.map((acc) => {
            const unlocked = bruno.level >= acc.unlockLevel
              || bruno.unlockedAccessories.includes(acc.id)
            const active = bruno.activeAccessory === acc.id

            return (
              <motion.button
                key={acc.id}
                whileTap={unlocked ? { scale: 0.95 } : {}}
                onClick={() => unlocked && setActiveAccessory(active ? null : acc.id)}
                disabled={!unlocked}
                className={`p-4 rounded-2xl border text-left relative transition-all ${
                  active
                    ? 'border-red-elec bg-red-elec/10'
                    : unlocked
                    ? 'border-blue-dark/50 bg-blue-dark/20'
                    : 'border-blue-dark/30 bg-blue-dark/10 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="text-2xl mb-2">{acc.emoji}</div>
                <div className="text-off-white text-sm font-medium">{acc.name}</div>
                {!unlocked && (
                  <div className="flex items-center gap-1 mt-1 text-off-white/40 text-xs">
                    <Lock size={10} />
                    Level {acc.unlockLevel}
                  </div>
                )}
                {active && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-red-elec flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
