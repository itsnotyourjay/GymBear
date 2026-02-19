/**
 * PIN utilities — PRD Section 5.1
 * PIN is hashed with SHA-256 before storage. Never stored raw.
 */

export async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + 'gymbear_salt_v1')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPIN(pin: string, storedHash: string): Promise<boolean> {
  const hash = await hashPIN(pin)
  return hash === storedHash
}

export function isValidPIN(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}
