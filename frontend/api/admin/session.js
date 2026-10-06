import { issueSession, safePasswordEqual } from './_auth.js'

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ detail: 'Método no permitido' })
  const expected = process.env.ADMIN_PASSWORD || ''
  if (!expected) return res.status(503).json({ detail: 'Configura ADMIN_PASSWORD en el entorno de Vercel' })
  if (!safePasswordEqual(req.body?.password || '', expected)) return res.status(401).json({ detail: 'Contraseña incorrecta' })
  return res.status(200).json({ token: issueSession() })
}
