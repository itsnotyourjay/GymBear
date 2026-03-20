/**
 * ChallengeCard — Enhancement §8.3
 * Weekly community challenge card with progress bar and opt-in toggle.
 */
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Clock } from 'lucide-react'
import { useSocialStore } from '../store/useSocialStore'

function daysRemaining(endsAt: string): number {
  const diff = new Date(endsAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export default function ChallengeCard() {
  const { communityChallenge, fetchCommunityChallenge } = useSocialStore()

  useEffect(() => {
    fetchCommunityChallenge()
  }, [fetchCommunityChallenge])

  if (!communityChallenge) return null

  const { title, description, target, userProgress, participantCount, endsAt, joined } = communityChallenge

  const progressPct = Math.min(100, Math.round((userProgress / target) * 100))
  const daysLeft    = daysRemaining(endsAt)

  return (
    <div className="glass overflow-hidden">
      {/* Plasma gradient top border */}
      <div className="h-0.5 bg-gradient-to-r from-plasma to-neon" />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="text-[10px] text-plasma font-semibold uppercase tracking-widest mb-0.5">
              Weekly Challenge
            </p>
            <h3 className="text-bear-bright font-display text-xl leading-tight">{title}</h3>
            <p className="text-bear-muted text-xs mt-0.5 leading-relaxed">{description}</p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            <span className="flex items-center gap-1 text-bear-muted text-[10px]">
              <Clock size={10} /> {daysLeft}d left
            </span>
            <span className="flex items-center gap-1 text-bear-muted text-[10px]">
              <Users size={10} /> {participantCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-bear-text">{userProgress} / {target}</span>
            <span className="text-plasma">{progressPct}%</span>
          </div>
          <div className="h-2 rounded-full bg-bear-surface overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-plasma to-neon"
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>

        {/* Join toggle */}
        <button
          className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all active:scale-95
            ${joined
              ? 'bg-plasma/20 text-plasma border border-plasma/30'
              : 'bg-gradient-to-r from-plasma to-neon/80 text-bear-void'
            }`}
        >
          {joined ? 'Joined ✓' : 'Join Challenge'}
        </button>
      </div>
    </div>
  )
}
