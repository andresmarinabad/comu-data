import { issueSiteSession, safeSitePasswordEqual } from './_auth.js'

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Método no permitido' })
  const expected = process.env.SITE_PASSWORD || ''
  const adminPassword = process.env.ADMIN_PASSWORD || ''
  if (!expected || !process.env.SITE_SESSION_SECRET) return res.status(503).json({ detail: 'Configura SITE_PASSWORD y SITE_SESSION_SECRET en Vercel' })
  if (expected === adminPassword) return res.status(503).json({ detail: 'SITE_PASSWORD debe ser distinta de ADMIN_PASSWORD' })
  if (!safeSitePasswordEqual(req.body?.password || '', expected)) return res.status(401).json({ detail: 'Contraseña incorrecta' })
  return res.status(200).json({ token: issueSiteSession() })
}
