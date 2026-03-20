/**
 * GymBear Cloudflare Worker — Phase 4
 * PRD Section 6.2, 6.3, 6.4, 8
 *
 * Routes:
 *   GET  /api/health        — health check
 *   POST /api/plan          — AI workout plan (Workers AI → Groq fallback, KV-cached)
 *   GET  /api/quote         — daily motivational quote (KV-cached)
 *   GET  /api/kv/:key       — KV read (storage sync)
 *   PUT  /api/kv/:key       — KV write (storage sync)
 */

export interface Env {
  GYMBEAR_KV: KVNamespace
  AI: Ai
  GROQ_API_KEY: string
  VAPID_PRIVATE_KEY?: string
}

// ── CORS ─────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const

const json = (data: unknown, status = 200) =>
  Response.json(data, { status, headers: CORS })
const err  = (msg: string, status = 500) =>
  Response.json({ error: msg }, { status, headers: CORS })

// ── Exercise catalog (PRD Section 4) — AI can ONLY use these IDs ─────────────
const EXERCISE_CATALOG = `
CHEST (compound):
  flat_machine_press      | Flat Seated Machine Press      | chest_press_machine_flat
  incline_machine_press   | Incline Seated Machine Press   | chest_press_machine_incline
  db_chest_press_flat     | Dumbbell Chest Press (Flat)    | dumbbells
  db_chest_press_incline  | Dumbbell Chest Press (Incline) | chest_press_machine_incline

SHOULDERS (compound: machine_shoulder_press, neutral_db_shoulder_press; isolation: lateral_raise_unilateral):
  machine_shoulder_press     | Seated Machine Shoulder Press   | chest_press_machine_upright
  neutral_db_shoulder_press  | Neutral Grip DB Shoulder Press  | dumbbells
  lateral_raise_unilateral   | Lateral Raise — Unilateral      | dumbbells

TRICEPS (isolation):
  db_skull_crushers  | Dumbbell Skull Crushers  | dumbbells
  tricep_pushdown    | Tricep Pushdown          | lat_pulldown_bar_shoulder

BICEPS (isolation):
  concentration_curl  | Concentration Curl         | dumbbells
  standing_db_curl    | Standing Dumbbell Curl     | dumbbells
  hammer_curl         | Hammer Curl                | dumbbells
  incline_db_curl     | Incline Dumbbell Curl      | chest_press_machine_incline

BACK (compound: pulldowns + rows; isolation: lat_pullover):
  wide_grip_pulldown       | Wide Grip Lat Pulldown      | lat_pulldown_bar_wide
  shoulder_width_pulldown  | Shoulder-Width Lat Pulldown | lat_pulldown_bar_shoulder
  vbar_pulldown            | V-Bar Lat Pulldown          | lat_pulldown_vbar
  underhand_pulldown       | Underhand Lat Pulldown      | lat_pulldown_underhand
  neutral_grip_pulldown    | Neutral Grip Lat Pulldown   | lat_pulldown_neutral
  lat_pullover             | Lat Pullover                | lat_pulldown_bar_wide
  wide_grip_cable_row      | Wide Grip Cable Row         | lat_pulldown_bar_wide
  vbar_cable_row           | V-Bar Cable Row             | lat_pulldown_vbar

LEGS (isolation):
  leg_extension  | Leg Extension  | leg_extension_machine
  leg_curl       | Leg Curl       | leg_curl_machine
`

// ── System prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(): string {
  return `You are GymBear's AI coach. You create personalised workout plans.

STRICT RULES:
1. Only use exercises from the catalog below. Use their exact IDs.
2. Output ONLY valid JSON — no markdown, no prose, no code fences.
3. Compound movements get restSeconds: 90. Isolation gets restSeconds: 60.
4. Strength goal: 4-6 reps, 4-5 sets. Hypertrophy: 8-12 reps, 3-4 sets. General fitness: 10-15 reps, 3 sets.
5. Progressive overload: if lastWeight is given, targetWeight = lastWeight + machineIncrement. If no history, targetWeight = null.
6. At least one compound movement per muscle group trained.
7. Never repeat the same exercise in one session.
8. Fit within the user's available duration.

Required JSON schema:
{
  "date": "YYYY-MM-DD",
  "muscleGroups": ["chest", "triceps"],
  "exercises": [
    {
      "exerciseId": "flat_machine_press",
      "sets": [{"targetReps": 10, "targetWeight": 60}],
      "restSeconds": 90
    }
  ],
  "estimatedMinutes": 45,
  "source": "ai"
}

EXERCISE CATALOG (ID | Name | Equipment):
${EXERCISE_CATALOG}`
}

// ── Plan request shape ────────────────────────────────────────────────────────
interface PlanRequest {
  date:              string
  goal:              'strength' | 'hypertrophy' | 'general_fitness'
  gymDays:           string[]
  duration:          30 | 45 | 60
  split:             'push' | 'pull' | 'legs' | 'upper' | 'full'
  muscleGroups:      string[]
  machineIncrements: { chest: number; lat: number; leg: number }
  recentSessions:    Array<{
    date:      string
    exercises: Array<{ id: string; lastWeight: number | null; lastReps: number | null }>
  }>
  // §6.6 coach mode
  mode?:             'plan' | 'coach'
  profile?:          object
  prs?:              object
  insights?:         object[]
}

function buildUserPrompt(req: PlanRequest): string {
  const historyText = req.recentSessions.length === 0
    ? "No previous sessions — first workout."
    : req.recentSessions.map((s) =>
        `${s.date}: ` + s.exercises.map((e) =>
          `${e.id}(${e.lastWeight ?? '?'}kg×${e.lastReps ?? '?'})`
        ).join(', ')
      ).join('\n')

  const incChest = req.machineIncrements.chest
  const incLat   = req.machineIncrements.lat
  const incLeg   = req.machineIncrements.leg

  return `Plan a ${req.split.toUpperCase()} day workout for ${req.date}.

User:
- Goal: ${req.goal}
- Duration: ${req.duration} minutes
- Muscles today: ${req.muscleGroups.join(', ')}
- Increments: chest/shoulders/triceps=${incChest}kg, back/biceps=${incLat}kg, legs=${incLeg}kg

Last 4 sessions:
${historyText}

Return ONLY the JSON plan.`
}

// ── Workers AI call ───────────────────────────────────────────────────────────
async function callWorkersAI(env: Env, system: string, user: string): Promise<string> {
  const res = await env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
    messages: [
      { role: 'system', content: system },
      { role: 'user',   content: user   },
    ],
    temperature: 0.3,
    max_tokens:  1200,
  }) as { response?: string }
  if (!res.response) throw new Error('Empty Workers AI response')
  return res.response
}

// ── Groq fallback ─────────────────────────────────────────────────────────────
async function callGroq(env: Env, system: string, user: string): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model:           'llama-3.3-70b-versatile',
      messages:        [{ role: 'system', content: system }, { role: 'user', content: user }],
      temperature:     0.3,
      max_tokens:      1200,
      response_format: { type: 'json_object' },
    }),
  })
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`)
  const data = await res.json() as { choices: Array<{ message: { content: string } }> }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty Groq response')
  return content
}

// ── AI with automatic fallback ────────────────────────────────────────────────
async function callAI(env: Env, system: string, user: string): Promise<string> {
  try {
    return await callWorkersAI(env, system, user)
  } catch (e) {
    console.warn('[GymBear] Workers AI failed, falling back to Groq:', e)
    if (!env.GROQ_API_KEY) throw new Error('Workers AI failed and GROQ_API_KEY not set')
    return await callGroq(env, system, user)
  }
}

// ── Parse + validate AI plan JSON ─────────────────────────────────────────────
function parsePlan(raw: string, date: string): object {
  const cleaned = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/, '')
    .trim()
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON object in AI response')
  const plan = JSON.parse(match[0])
  if (!Array.isArray(plan.exercises) || plan.exercises.length === 0) {
    throw new Error('Plan has no exercises')
  }
  plan.date   = plan.date   ?? date
  plan.source = plan.source ?? 'ai'
  return plan
}

// ── Daily quote ───────────────────────────────────────────────────────────────
async function generateQuote(env: Env): Promise<string> {
  const topics = ['progressive overload', 'consistency', 'showing up', 'pushing limits', 'strength']
  const topic  = topics[Math.floor(Math.random() * topics.length)]
  try {
    const raw = await callAI(
      env,
      'You are Bruno, a gym coach mascot bear. Give one ultra-short punchy motivational quote (max 10 words). Plain text only, no quotes.',
      `Quote about: ${topic}`
    )
    return raw.replace(/^["']|["']$/g, '').trim()
  } catch {
    return 'Show up. That\'s 80% of the job.'
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url      = new URL(request.url)
    const pathname = url.pathname

    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    // Health
    if (pathname === '/api/health') {
      return json({ status: 'ok', version: '4.0.0' })
    }

    // KV proxy — GET
    const kvMatch = pathname.match(/^\/api\/kv\/(.+)$/)
    if (kvMatch) {
      const key = decodeURIComponent(kvMatch[1])
      if (request.method === 'GET') {
        const value = await env.GYMBEAR_KV.get(key, 'json')
        return value === null ? json(null, 404) : json(value)
      }
      if (request.method === 'PUT') {
        const body = await request.json() as { value: unknown }
        await env.GYMBEAR_KV.put(key, JSON.stringify(body.value), {
          expirationTtl: 60 * 60 * 24 * 90,
        })
        return json({ ok: true })
      }
    }

    // Plan generation  
    if (pathname === '/api/plan' && request.method === 'POST') {
      const req = await request.json() as PlanRequest

      // ── Coach mode (§6.6) ─────────────────────────────────────────────────
      if (req.mode === 'coach') {
        try {
          const coachSystemPrompt = `You are GymBear's AI coach. Analyse the user's training data and return 1-3 concise coaching insights.
Output ONLY a JSON array of objects with: { type: "warning"|"suggestion"|"encouragement"|"milestone", message: string, exerciseId?: string }
Keep each message under 20 words. No markdown, no prose outside JSON.`
          const coachUserPrompt = `Profile: ${JSON.stringify(req.profile ?? {})}
Recent sessions: ${JSON.stringify(req.recentSessions ?? [])}
PRs: ${JSON.stringify(req.prs ?? {})}
Existing insights: ${JSON.stringify(req.insights ?? [])}

Return JSON array of 1-3 new insights.`

          const raw = await callAI(env, coachSystemPrompt, coachUserPrompt)
          const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
          const match = cleaned.match(/\[[\s\S]*\]/)
          if (!match) return json({ insights: [] })
          const insights = JSON.parse(match[0])
          return json({ insights })
        } catch (e) {
          console.error('[GymBear] Coach AI failed:', e)
          return json({ insights: [] })
        }
      }

      // Return cached plan if already generated today
      const cacheKey = `plan:${req.date}`
      const cached   = await env.GYMBEAR_KV.get(cacheKey, 'json')
      if (cached) return json({ ...(cached as object), cached: true })

      let plan: object
      try {
        const raw = await callAI(env, buildSystemPrompt(), buildUserPrompt(req))
        plan      = parsePlan(raw, req.date)
      } catch (e) {
        console.error('[GymBear] Plan generation failed:', e)
        return err(`AI error: ${(e as Error).message}`, 503)
      }

      await env.GYMBEAR_KV.put(cacheKey, JSON.stringify(plan), {
        expirationTtl: 60 * 60 * 24,
      })
      return json(plan)
    }

    // Daily quote
    if (pathname === '/api/quote' && request.method === 'GET') {
      const today    = new Date().toISOString().split('T')[0]
      const cacheKey = `quote:${today}`
      const cached   = await env.GYMBEAR_KV.get(cacheKey)
      if (cached) return json({ quote: cached, cached: true })

      const quote = await generateQuote(env)
      await env.GYMBEAR_KV.put(cacheKey, quote, { expirationTtl: 60 * 60 * 24 })
      return json({ quote })
    }

    // Community challenge (§8.3)
    if (pathname === '/api/challenge' && request.method === 'GET') {
      const today    = new Date().toISOString().split('T')[0]
      const cacheKey = `challenge:${today}`
      const cached   = await env.GYMBEAR_KV.get(cacheKey, 'json')
      if (cached) return json(cached)

      // Generate a simple weekly challenge via AI
      try {
        const raw = await callAI(
          env,
          'You are GymBear coach. Generate a fun weekly gym challenge. Output ONLY JSON.',
          `Generate a challenge JSON with: { id: string, title: string, description: string, targetCount: number, unit: string, endsAt: ISO-date-string (7 days from now), participantCount: number }`
        )
        const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim()
        const match = cleaned.match(/\{[\s\S]*\}/)
        if (!match) throw new Error('No JSON in response')
        const challenge = JSON.parse(match[0])
        challenge.endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        challenge.participantCount = challenge.participantCount ?? Math.floor(Math.random() * 200) + 50
        await env.GYMBEAR_KV.put(cacheKey, JSON.stringify(challenge), { expirationTtl: 60 * 60 * 24 })
        return json(challenge)
      } catch (e) {
        // Fallback static challenge
        const fallback = {
          id: `challenge_${today}`,
          title: '100 Reps Challenge',
          description: 'Complete 100 total reps across any exercises in your next session',
          targetCount: 100,
          unit: 'reps',
          endsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          participantCount: 127,
        }
        return json(fallback)
      }
    }

    // Push subscription (§13.3)
    if (pathname === '/api/push/subscribe' && request.method === 'POST') {
      try {
        const subscription = await request.json() as { endpoint: string; keys?: object }
        if (!subscription.endpoint) return err('Missing endpoint', 400)
        // Store subscription by endpoint hash (simplified)
        const key = `push:${btoa(subscription.endpoint).slice(0, 32)}`
        await env.GYMBEAR_KV.put(key, JSON.stringify(subscription), {
          expirationTtl: 60 * 60 * 24 * 365,
        })
        return json({ ok: true })
      } catch (e) {
        return err('Invalid subscription data', 400)
      }
    }

    return err('Not found', 404)
  },
}
