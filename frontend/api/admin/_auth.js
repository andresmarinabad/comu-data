import { createHmac, timingSafeEqual } from 'node:crypto'

function signature(expires) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || ''
  return createHmac('sha256', secret).update(String(expires)).digest('hex')
}

export function issueSession() {
  const expires = Math.floor(Date.now() / 1000) + 8 * 60 * 60
  return `${expires}.${signature(expires)}`
}

export function authorized(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return false
  const [expiresText, tokenSignature] = header.slice(7).split('.')
  const expires = Number(expiresText)
  if (!Number.isInteger(expires) || expires < Date.now() / 1000 || !tokenSignature) return false
  const expected = signature(expires)
  const actualBuffer = Buffer.from(tokenSignature)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export function safePasswordEqual(provided, expected) {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
