/**
 * formChecks.ts — Enhancement §7.2
 * Maps exercise IDs to pose-analysis functions.
 * Each function receives MediaPipe NormalizedLandmark[] and returns a score (0–100)
 * plus optional issue/tip strings.
 */

export interface PoseLandmark {
  x: number
  y: number
  z: number
  visibility?: number
}

export interface FormResult {
  score: number
  issue: string | null
  tip: string | null
}

// ── Angle helper ──────────────────────────────────────────────────────────────
function angle(a: PoseLandmark, b: PoseLandmark, c: PoseLandmark): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let deg = Math.abs(radians * (180 / Math.PI))
  if (deg > 180) deg = 360 - deg
  return deg
}

// ── Per-exercise check functions ─────────────────────────────────────────────

function checkSquat(lm: PoseLandmark[]): FormResult {
  // Landmarks: 23=L-hip, 25=L-knee, 27=L-ankle, 11=L-shoulder
  const hip   = lm[23]; const knee  = lm[25]; const ankle = lm[27]
  const shoulder = lm[11]
  if (!hip || !knee || !ankle || !shoulder) return { score: 50, issue: null, tip: 'Stand fully in frame' }

  const kneeAngle = angle(hip, knee, ankle)
  const backAngle = angle(shoulder, hip, knee)

  let score = 100
  let issue: string | null = null
  let tip: string | null = null

  if (kneeAngle > 100) { score -= 30; issue = 'Go deeper — aim for 90° knee bend'; tip = 'Push your hips back and down' }
  else if (kneeAngle < 60) { score -= 10; issue = 'You may be going too deep'; tip = 'Stop when thighs are parallel to floor' }

  if (backAngle < 150) { score -= 25; issue = issue ?? 'Keep your back straight'; tip = 'Chest up, core braced' }

  return { score: Math.max(0, score), issue, tip }
}

function checkBenchPress(lm: PoseLandmark[]): FormResult {
  // Landmarks: 11=L-shoulder, 13=L-elbow, 15=L-wrist
  const shoulder = lm[11]; const elbow = lm[13]; const wrist = lm[15]
  if (!shoulder || !elbow || !wrist) return { score: 50, issue: null, tip: 'Ensure your upper body is visible' }

  const elbowAngle = angle(shoulder, elbow, wrist)
  let score = 100
  let issue: string | null = null
  let tip: string | null = null

  if (elbowAngle < 70) { score -= 20; issue = 'Elbows flaring too wide'; tip = 'Tuck elbows ~45° to your torso' }
  if (elbowAngle > 120) { score -= 15; issue = 'Not enough range of motion'; tip = 'Lower the bar closer to your chest' }

  return { score: Math.max(0, score), issue, tip }
}

export function checkDeadlift(lm: PoseLandmark[]): FormResult {
  // Landmarks: 11=L-shoulder, 23=L-hip, 25=L-knee
  const shoulder = lm[11]; const hip = lm[23]; const knee = lm[25]
  if (!shoulder || !hip || !knee) return { score: 50, issue: null, tip: 'Full body must be visible' }

  const hipAngle = angle(shoulder, hip, knee)
  let score = 100
  let issue: string | null = null
  let tip: string | null = null

  if (hipAngle < 130) { score -= 30; issue = 'Back is rounding'; tip = 'Flatten your back by hinging at the hips, not the spine' }
  if (hipAngle > 175) { score -= 15; issue = 'Over-extending at lockout'; tip = 'Stand tall, do not hyperextend the lower back' }

  return { score: Math.max(0, score), issue, tip }
}

function checkShoulderPress(lm: PoseLandmark[]): FormResult {
  const shoulder = lm[11]; const elbow = lm[13]; const wrist = lm[15]
  if (!shoulder || !elbow || !wrist) return { score: 50, issue: null, tip: 'Ensure your upper body is in frame' }

  const elbowAngle = angle(shoulder, elbow, wrist)
  let score = 100
  let issue: string | null = null
  let tip: string | null = null

  if (elbowAngle < 160) { score -= 20; issue = 'Arms not fully extended at top'; tip = 'Press until arms are fully extended overhead' }
  if (wrist.x < elbow.x - 0.05) { score -= 15; issue = 'Wrists drifting behind elbows'; tip = 'Keep wrists stacked over elbows throughout the press' }

  return { score: Math.max(0, score), issue, tip }
}

// ── Exercise-ID map ───────────────────────────────────────────────────────────
const FORM_CHECK_MAP: Record<string, (lm: PoseLandmark[]) => FormResult> = {
  // Squats / legs
  leg_extension:              (lm) => checkSquat(lm),
  leg_curl:                   (lm) => checkSquat(lm),
  // Chest (bench-style)
  flat_machine_press:         (lm) => checkBenchPress(lm),
  incline_machine_press:      (lm) => checkBenchPress(lm),
  db_chest_press_flat:        (lm) => checkBenchPress(lm),
  db_chest_press_incline:     (lm) => checkBenchPress(lm),
  // Shoulder press
  machine_shoulder_press:     (lm) => checkShoulderPress(lm),
  neutral_db_shoulder_press:  (lm) => checkShoulderPress(lm),
}

export function checkForm(exerciseId: string, landmarks: PoseLandmark[]): FormResult {
  const fn = FORM_CHECK_MAP[exerciseId]
  if (!fn) return { score: 75, issue: null, tip: 'Keep good posture throughout the movement' }
  return fn(landmarks)
}
