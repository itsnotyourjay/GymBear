/**
 * GymBear Cloudflare Worker
 * PRD Section 6.4 — Backend Logic
 *
 * Handles:
 *   POST /api/plan     — AI workout plan generation (Phase 4)
 *   GET  /api/quote    — Bruno daily motivational quote (Phase 4)
 *   GET  /api/health   — Health check
 *
 * Phase 1: stub endpoints only — fleshed out in Phase 4
 */

export interface Env {
  // Cloudflare KV namespace — PRD Section 6.5
  GYMBEAR_KV: KVNamespace
  // Cloudflare Workers AI binding — PRD Section 6.2
  AI: Ai
  // Groq fallback API key — PRD Section 6.3
  GROQ_API_KEY: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url

    // CORS headers for PWA → Worker requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders })
    }

    // Health check
    if (pathname === '/api/health') {
      return Response.json(
        { status: 'ok', service: 'GymBear Worker', version: '0.1.0' },
        { headers: corsHeaders }
      )
    }

    // AI plan generation — Phase 4
    if (pathname === '/api/plan' && request.method === 'POST') {
      return Response.json(
        { message: 'AI plan endpoint — implemented in Phase 4' },
        { status: 501, headers: corsHeaders }
      )
    }

    // Bruno daily quote — Phase 4
    if (pathname === '/api/quote' && request.method === 'GET') {
      return Response.json(
        { message: 'Quote endpoint — implemented in Phase 4' },
        { status: 501, headers: corsHeaders }
      )
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders })
  },
}
