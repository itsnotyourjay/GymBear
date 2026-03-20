/**
 * useFormCoach.ts — Enhancement §7.2
 * Manages camera access + MediaPipe Pose inference loop for form checking.
 */

import { useRef, useState, useCallback, useEffect } from 'react'
import { checkForm, FormResult } from '../lib/formChecks'

export interface FormFeedback {
  score: number
  issue: string | null
  tip: string | null
  reps: number
}

declare global {
  interface Window {
    // MediaPipe Pose loaded from CDN
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Pose: any
  }
}

const MEDIAPIPE_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/pose.js'

export function useFormCoach(exerciseId: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const poseRef = useRef<unknown>(null)
  const rafRef = useRef<number>(0)
  const repCountRef = useRef(0)
  const prevAboveRef = useRef<boolean | null>(null)

  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<FormFeedback>({ score: 0, issue: null, tip: null, reps: 0 })
  const [error, setError] = useState<string | null>(null)

  // Load MediaPipe script lazily from CDN
  const loadMediaPipe = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.Pose) { resolve(); return }
      const script = document.createElement('script')
      script.src = MEDIAPIPE_CDN
      script.crossOrigin = 'anonymous'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load MediaPipe'))
      document.head.appendChild(script)
    })
  }, [])

  const start = useCallback(async () => {
    if (active || !exerciseId) return
    setLoading(true)
    setError(null)

    try {
      // Request camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      // Load MediaPipe
      await loadMediaPipe()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pose = new (window as any).Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`,
      })
      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pose.onResults((results: any) => {
        if (!results.poseLandmarks) return

        // Draw skeleton on canvas
        const canvas = canvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            drawSkeleton(ctx, results.poseLandmarks, canvas.width, canvas.height)
          }
        }

        // Run form check
        const result: FormResult = checkForm(exerciseId, results.poseLandmarks)
        
        // Simple rep counter: track hip landmark crossing threshold
        const hip = results.poseLandmarks[23]
        if (hip) {
          const isAbove = hip.y < 0.5
          if (prevAboveRef.current !== null && prevAboveRef.current !== isAbove) {
            if (!isAbove) repCountRef.current += 1
          }
          prevAboveRef.current = isAbove
        }

        setFeedback({
          score: result.score,
          issue: result.issue,
          tip: result.tip,
          reps: repCountRef.current,
        })
      })

      poseRef.current = pose

      // Inference loop
      const loop = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(loop)
          return
        }
        await pose.send({ image: videoRef.current })
        rafRef.current = requestAnimationFrame(loop)
      }
      loop()

      setActive(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Camera error')
    } finally {
      setLoading(false)
    }
  }, [active, exerciseId, loadMediaPipe])

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    poseRef.current = null
    repCountRef.current = 0
    prevAboveRef.current = null
    setActive(false)
    setFeedback({ score: 0, issue: null, tip: null, reps: 0 })
  }, [])

  // Auto-stop on unmount
  useEffect(() => () => stop(), [stop])

  return { videoRef, canvasRef, active, loading, feedback, error, start, stop }
}

// ── Skeleton drawing helper ───────────────────────────────────────────────────
const CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
]

function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: { x: number; y: number; visibility?: number }[],
  w: number,
  h: number,
) {
  ctx.strokeStyle = '#7B5EFF'
  ctx.lineWidth = 2

  for (const [a, b] of CONNECTIONS) {
    const lmA = landmarks[a]
    const lmB = landmarks[b]
    if (!lmA || !lmB) continue
    if ((lmA.visibility ?? 1) < 0.4 || (lmB.visibility ?? 1) < 0.4) continue
    ctx.beginPath()
    ctx.moveTo(lmA.x * w, lmA.y * h)
    ctx.lineTo(lmB.x * w, lmB.y * h)
    ctx.stroke()
  }

  ctx.fillStyle = '#FF3D5A'
  for (const lm of landmarks) {
    if ((lm.visibility ?? 1) < 0.4) continue
    ctx.beginPath()
    ctx.arc(lm.x * w, lm.y * h, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}
