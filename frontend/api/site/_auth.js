import { createHmac, timingSafeEqual } from 'node:crypto'

function signature(expires) {
  const secret = process.env.SITE_SESSION_SECRET || ''
  return createHmac('sha256', secret).update(String(expires)).digest('hex')
}

export function issueSiteSession() {
  const expires = Math.floor(Date.now() / 1000) + 8 * 60 * 60
  return `${expires}.${signature(expires)}`
}

export function authorizedSiteRequest(req) {
  const secret = process.env.SITE_SESSION_SECRET || ''
  const header = req.headers.authorization || ''
  if (!secret || !header.startsWith('Bearer ')) return false
  const [expiresText, tokenSignature] = header.slice(7).split('.')
  const expires = Number(expiresText)
  if (!Number.isInteger(expires) || expires < Date.now() / 1000 || !tokenSignature) return false
  const expected = signature(expires)
  const actualBuffer = Buffer.from(tokenSignature)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export function safeSitePasswordEqual(provided, expected) {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}
