/**
 * Bruno — Animated SVG Bear Mascot
 * PRD Section 7.2, 7.3
 * 9 animation states driven by Framer Motion useAnimation controllers
 * Self-contained: no external images, no assets
 */
import { useEffect } from 'react'
import { motion, useAnimation } from 'framer-motion'
import type { BrunoState } from '../store/useGymBearStore'

interface Props {
  state: BrunoState['animationState']
  accessory: string | null
  level?: number
  size?: number
}

const BROWN = '#8B5E3C'
const LIGHT = '#C49A6C'
const DARK  = '#2D1810'

export default function Bruno({ state, accessory, size = 120 }: Props) {
  const bodyCtrl = useAnimation()
  const lArmCtrl = useAnimation()
  const rArmCtrl = useAnimation()

  const isRestDay = state === 'rest-day'
  const isExcited = state === 'pr-achieved' || state === 'session-complete' || state === 'level-up' || state === 'champion'
  const isSetDone = state === 'set-complete' || state === 'pumped'

  useEffect(() => {
    bodyCtrl.stop()
    lArmCtrl.stop()
    rArmCtrl.stop()

    const goIdle = () => {
      bodyCtrl.start({ y: [0, -3, 0],   rotate: 0, scale: 1, transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } })
      lArmCtrl.start({ rotate: [0, 4, 0],  transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } })
      rArmCtrl.start({ rotate: [0, -4, 0], transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' } })
    }

    switch (state) {
      case 'idle':
        goIdle()
        break

      case 'pre-workout':
        bodyCtrl.start({ y: [0, -8, 0], transition: { repeat: Infinity, duration: 0.55, ease: 'easeInOut' } })
        lArmCtrl.start({ rotate: [0, -55, 0], transition: { repeat: Infinity, duration: 0.8, delay: 0.4 } })
        rArmCtrl.start({ rotate: [0, 55, 0],  transition: { repeat: Infinity, duration: 0.8 } })
        break

      case 'set-complete':
        bodyCtrl.start({ scale: [1, 1.08, 1], transition: { duration: 0.3 } }).then(goIdle)
        rArmCtrl.start({ rotate: -125, transition: { duration: 0.25 } })
          .then(() => new Promise<void>(r => setTimeout(r, 900)))
          .then(() => rArmCtrl.start({ rotate: 0, transition: { duration: 0.3 } }))
        lArmCtrl.start({ rotate: [0, 4, 0], transition: { repeat: Infinity, duration: 2.5 } })
        break

      case 'rest-timer':
        bodyCtrl.start({ rotate: [0, 4, 0, -4, 0], transition: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' } })
        lArmCtrl.start({ rotate: [0, 15, 0],  transition: { repeat: Infinity, duration: 3.5 } })
        rArmCtrl.start({ rotate: [0, -15, 0], transition: { repeat: Infinity, duration: 3.5 } })
        break

      case 'pr-achieved':
        bodyCtrl.start({ scale: [1, 1.15, 0.95, 1.1, 1], transition: { duration: 0.8 } })
          .then(() => new Promise<void>(r => setTimeout(r, 1600)))
          .then(goIdle)
        lArmCtrl.start({ rotate: -130, transition: { duration: 0.3 } })
        rArmCtrl.start({ rotate: 130,  transition: { duration: 0.3 } })
        setTimeout(() => {
          lArmCtrl.start({ rotate: 0, transition: { duration: 0.4 } })
          rArmCtrl.start({ rotate: 0, transition: { duration: 0.4 } })
        }, 2600)
        break

      case 'session-complete':
        bodyCtrl.start({
          rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1],
          transition: { duration: 1.0, repeat: 2 },
        }).then(goIdle)
        lArmCtrl.start({ rotate: [-130, -110, -130], transition: { repeat: 5, duration: 0.45 } })
          .then(() => lArmCtrl.start({ rotate: 0 }))
        rArmCtrl.start({ rotate: [130, 110, 130],   transition: { repeat: 5, duration: 0.45 } })
          .then(() => rArmCtrl.start({ rotate: 0 }))
        break

      case 'rest-day':
        bodyCtrl.start({ rotate: 18, y: 6, transition: { duration: 0.9, ease: 'easeOut' } })
        lArmCtrl.start({ rotate: 22,  transition: { duration: 0.9 } })
        rArmCtrl.start({ rotate: -22, transition: { duration: 0.9 } })
        break

      case 'loading':
        bodyCtrl.start({ y: [0, -9, 0], scaleX: [1, 0.94, 1], transition: { repeat: Infinity, duration: 0.5 } })
        lArmCtrl.start({ rotate: [0, 45, 0],  transition: { repeat: Infinity, duration: 0.5 } })
        rArmCtrl.start({ rotate: [0, -45, 0], transition: { repeat: Infinity, duration: 0.5 } })
        break

      case 'level-up':
        bodyCtrl.start({ scale: [1, 1.2, 0.9, 1.12, 1], transition: { duration: 0.9 } }).then(goIdle)
        lArmCtrl.start({ rotate: -130, transition: { duration: 0.3 } })
        rArmCtrl.start({ rotate: 130,  transition: { duration: 0.3 } })
        setTimeout(() => {
          lArmCtrl.start({ rotate: 0 })
          rArmCtrl.start({ rotate: 0 })
        }, 1900)
        break

      case 'ghost_race':
        bodyCtrl.start({ x: [0, 6, -6, 6, 0], y: [0, -5, 0], transition: { repeat: Infinity, duration: 0.55 } })
        lArmCtrl.start({ rotate: [0, -70, 0], transition: { repeat: Infinity, duration: 0.55, delay: 0.27 } })
        rArmCtrl.start({ rotate: [0, 70, 0],  transition: { repeat: Infinity, duration: 0.55 } })
        break

      case 'champion':
        bodyCtrl.start({ scale: [1, 1.18, 1], transition: { duration: 0.5 } }).then(goIdle)
        lArmCtrl.start({ rotate: -130, transition: { duration: 0.25 } })
        rArmCtrl.start({ rotate: 130,  transition: { duration: 0.25 } })
        break

      case 'thinking':
        bodyCtrl.start({ rotate: [0, 3, -3, 0], transition: { repeat: Infinity, duration: 3, ease: 'easeInOut' } })
        lArmCtrl.start({ rotate: 0, transition: { duration: 0.4 } })
        rArmCtrl.start({ rotate: -40, transition: { duration: 0.5 } })
        break

      case 'camera':
        bodyCtrl.start({ y: [0, -3, 0], transition: { repeat: Infinity, duration: 2, ease: 'easeInOut' } })
        lArmCtrl.start({ rotate: -20, transition: { duration: 0.4 } })
        rArmCtrl.start({ rotate: -65, transition: { duration: 0.4 } })
        break

      case 'tired':
        bodyCtrl.start({ rotate: 12, y: 8, transition: { duration: 1.2, ease: 'easeOut' } })
        lArmCtrl.start({ rotate: 30, transition: { duration: 1.2 } })
        rArmCtrl.start({ rotate: -30, transition: { duration: 1.2 } })
        break

      case 'pumped':
        bodyCtrl.start({ scale: [1, 1.10, 1], transition: { repeat: Infinity, duration: 0.6 } })
        lArmCtrl.start({ rotate: [-110, -90, -110], transition: { repeat: Infinity, duration: 0.6 } })
        rArmCtrl.start({ rotate: [110, 90, 110],    transition: { repeat: Infinity, duration: 0.6 } })
        break
    }
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.svg
      width={size}
      height={Math.round(size * 150 / 120)}
      viewBox="0 0 120 150"
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Drop shadow */}
      <ellipse cx="60" cy="147" rx="30" ry="5" fill="#000" opacity="0.18" />

      {/* ── Left arm (behind body — rendered first) ── */}
      <motion.g style={{ transformOrigin: '23px 99px' }} animate={lArmCtrl}>
        <rect x="16" y="99" width="14" height="26" rx="7" fill={BROWN} />
        <circle cx="23" cy="128" r="9" fill={BROWN} />
        {/* chalk effect */}
        {accessory === 'chalk' && <circle cx="23" cy="128" r="9" fill="white" opacity="0.55" />}
      </motion.g>

      {/* ── Right arm (behind body — rendered first) ── */}
      <motion.g style={{ transformOrigin: '97px 99px' }} animate={rArmCtrl}>
        <rect x="90" y="99" width="14" height="26" rx="7" fill={BROWN} />
        <circle cx="97" cy="128" r="9" fill={BROWN} />
        {/* chalk effect */}
        {accessory === 'chalk' && <circle cx="97" cy="128" r="9" fill="white" opacity="0.55" />}
        {/* protein shaker in right fist */}
        {accessory === 'protein_shaker' && (
          <g>
            <rect x="91" y="108" width="15" height="24" rx="5" fill="#00FF87" />
            <rect x="93" y="104" width="11" height="6"  rx="2" fill="#00CC6A" />
            <line x1="93" y1="117" x2="104" y2="117" stroke="white" strokeWidth="1" opacity="0.5" />
          </g>
        )}
      </motion.g>

      {/* ── Main body group (bounce / scale / rotate) ── */}
      <motion.g style={{ transformOrigin: '60px 100px' }} animate={bodyCtrl}>

        {/* Ears — behind head */}
        <circle cx="37" cy="22" r="14" fill={BROWN} />
        <circle cx="37" cy="22" r="8"  fill={LIGHT} />
        <circle cx="83" cy="22" r="14" fill={BROWN} />
        <circle cx="83" cy="22" r="8"  fill={LIGHT} />

        {/* backwards cap dome — behind head */}
        {accessory === 'backwards_cap' && (
          <g>
            <ellipse cx="60" cy="22" rx="34" ry="12" fill="#E94560" />
            <rect    x="26"  y="13" width="68" height="13" rx="6" fill="#E94560" />
            {/* bill pointing backward (right side) */}
            <rect x="86" y="18" width="18" height="7" rx="3"  fill="#C0303E" />
            {/* front strap line */}
            <line x1="36" y1="20" x2="84" y2="20" stroke="#C0303E" strokeWidth="1.5" opacity="0.5" />
          </g>
        )}

        {/* Body */}
        <ellipse cx="60" cy="116" rx="40" ry="34" fill={BROWN} />
        {/* Belly */}
        <ellipse cx="60" cy="119" rx="24" ry="22" fill={LIGHT} />

        {/* Head */}
        <circle cx="60" cy="50" r="36" fill={BROWN} />

        {/* Muzzle */}
        <ellipse cx="60" cy="63" rx="16" ry="13" fill={LIGHT} />

        {/* Eyes */}
        {isRestDay ? (
          <>
            <path d="M44 46 Q49 52 54 46" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M66 46 Q71 52 76 46" stroke={DARK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="49" cy="46" r={isExcited || isSetDone ? 6 : 5} fill={DARK} />
            <circle cx="71" cy="46" r={isExcited || isSetDone ? 6 : 5} fill={DARK} />
            {/* eye shine */}
            <circle cx="51" cy="44" r="1.8" fill="white" opacity="0.7" />
            <circle cx="73" cy="44" r="1.8" fill="white" opacity="0.7" />
          </>
        )}

        {/* Nose */}
        <ellipse cx="60" cy="57" rx="5" ry="3.5" fill={DARK} />

        {/* Mouth */}
        {isExcited ? (
          <path d="M51 64 Q60 73 69 64" stroke={DARK} strokeWidth="2"   fill="none" strokeLinecap="round" />
        ) : isRestDay ? (
          <path d="M54 65 Q60 68 66 65" stroke={DARK} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M53 64 Q60 70 67 64" stroke={DARK} strokeWidth="2"   fill="none" strokeLinecap="round" />
        )}

        {/* ── Accessories overlaid on body/head ── */}
        {accessory === 'headband' && (
          <rect x="26" y="18" width="68" height="9" rx="4.5" fill="#E94560" />
        )}
        {accessory === 'sunglasses' && (
          <g>
            <rect x="33" y="41" width="20" height="14" rx="7" fill="#1A1A2E" opacity="0.88" />
            <rect x="67" y="41" width="20" height="14" rx="7" fill="#1A1A2E" opacity="0.88" />
            <rect x="33" y="41" width="20" height="14" rx="7" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" />
            <rect x="67" y="41" width="20" height="14" rx="7" fill="none" stroke="white" strokeWidth="1.5" opacity="0.35" />
            <line x1="53" y1="48" x2="67" y2="48" stroke="white" strokeWidth="1.5" opacity="0.45" />
            <line x1="33" y1="48" x2="25" y2="50" stroke="white" strokeWidth="1.5" opacity="0.45" />
            <line x1="87" y1="48" x2="95" y2="50" stroke="white" strokeWidth="1.5" opacity="0.45" />
          </g>
        )}
        {accessory === 'gold_chain' && (
          <g>
            <path d="M30 88 Q60 99 90 88" stroke="#FFD700" strokeWidth="4"   fill="none" strokeLinecap="round" />
            <circle cx="60" cy="99" r="5" fill="#FFD700" />
            <circle cx="52" cy="96" r="2" fill="#FFD700" opacity="0.7" />
            <circle cx="68" cy="96" r="2" fill="#FFD700" opacity="0.7" />
          </g>
        )}
        {accessory === 'gym_bag' && (
          <g>
            <rect x="2" y="108" width="20" height="15" rx="4" fill="#0F3460" />
            <path d="M7 108 Q12 102 17 108" stroke="#0F3460" strokeWidth="3" fill="none" />
            <line x1="4"  y1="116" x2="20" y2="116" stroke="#1A5090" strokeWidth="1.5" />
          </g>
        )}

        {/* New accessories — Enhancement §11 */}
        {accessory === 'ghost_trail' && (
          <g opacity="0.6">
            {[0.8, 0.5, 0.25].map((op, i) => (
              <motion.ellipse
                key={i}
                cx={60 + (i + 1) * 14}
                cy={70}
                rx={14 - i * 3}
                ry={20 - i * 4}
                fill="#7B5EFF"
                opacity={op}
                animate={{ opacity: [op, 0, op] }}
                transition={{ repeat: Infinity, duration: 1.0, delay: i * 0.2 }}
              />
            ))}
          </g>
        )}
        {accessory === 'trophy_belt' && (
          <g>
            <rect x="24" y="110" width="72" height="12" rx="4" fill="#FFD700" />
            <rect x="48" y="107" width="24" height="18" rx="4" fill="#FFD700" />
            <circle cx="60" cy="116" r="6" fill="#DAA520" />
            <text x="57" y="120" fill="white" fontSize="7" fontWeight="bold">★</text>
          </g>
        )}
        {accessory === 'form_coach_glasses' && (
          <g>
            <rect x="33" y="41" width="20" height="14" rx="7" fill="none" stroke="#00FFC2" strokeWidth="2" />
            <rect x="67" y="41" width="20" height="14" rx="7" fill="none" stroke="#00FFC2" strokeWidth="2" />
            <line x1="53" y1="48" x2="67" y2="48" stroke="#00FFC2" strokeWidth="1.5" />
            <circle cx="43" cy="48" r="3" fill="#00FFC2" opacity="0.4" />
            <circle cx="77" cy="48" r="3" fill="#00FFC2" opacity="0.4" />
          </g>
        )}
        {accessory === 'challenge_crown' && (
          <g>
            <path d="M30 20 L38 2 L52 14 L60 0 L68 14 L82 2 L90 20 Z" fill="#FFD700" />
            <circle cx="60" cy="6"  r="3" fill="#FF3D5A" />
            <circle cx="38" cy="7"  r="2" fill="#7B5EFF" />
            <circle cx="82" cy="7"  r="2" fill="#7B5EFF" />
          </g>
        )}
        {accessory === 'grind_headphones' && (
          <g>
            <path d="M28 38 Q32 15 60 15 Q88 15 92 38" stroke="#1A1A2E" strokeWidth="5" fill="none" strokeLinecap="round" />
            <rect x="22" y="34" width="12" height="18" rx="6" fill="#1A1A2E" />
            <rect x="86" y="34" width="12" height="18" rx="6" fill="#1A1A2E" />
            <rect x="24" y="36" width="8" height="14" rx="4" fill="#FF3D5A" opacity="0.8" />
            <rect x="88" y="36" width="8" height="14" rx="4" fill="#FF3D5A" opacity="0.8" />
          </g>
        )}

        {/* ZZZ for rest-day */}
        {isRestDay && (
          <motion.text
            x="88" y="32"
            fill="white" fontSize="11" fontWeight="bold"
            animate={{ opacity: [0.2, 0.85, 0.2], y: [32, 24, 32] }}
            transition={{ repeat: Infinity, duration: 2.2 }}
          >
            Zzz
          </motion.text>
        )}
      </motion.g>

      {/* ── Special effects (rendered on top of everything) ── */}
      {state === 'pr-achieved' && (
        <motion.circle
          cx="60" cy="70" r="52" fill="none" stroke="#FFD700" strokeWidth="4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.85, 0], scale: [0.8, 1.2] }}
          transition={{ duration: 0.9, repeat: 2 }}
        />
      )}
      {state === 'level-up' && (
        <motion.circle
          cx="60" cy="70" r="52" fill="none" stroke="#FFD700" strokeWidth="5"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.2, repeat: 1 }}
        />
      )}
    </motion.svg>
  )
}
