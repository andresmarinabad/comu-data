import { createClient } from '@supabase/supabase-js'
import { authorizedSiteRequest } from './_auth.js'

const publicTables = new Set([
  'persons', 'services', 'person_services', 'events', 'groups', 'traditio',
  'group_members', 'words', 'current_psalm', 'agapes', 'agape_food_types', 'agape_assignments',
])

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store')
  if (req.method !== 'GET') return res.status(405).json({ detail: 'Método no permitido' })
  if (!authorizedSiteRequest(req)) return res.status(401).json({ detail: 'La sesión de página ha caducado; vuelve a introducir la contraseña' })
  const url = new URL(req.url, 'http://localhost')
  const table = url.searchParams.get('table')
  if (!publicTables.has(table)) return res.status(404).json({ detail: 'Tabla pública no encontrada' })
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return res.status(503).json({ detail: 'Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel' })
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  let query = db.from(table).select('*')
  if (table === 'words') query = query.order('created_at', { ascending: true })
  const { data, error, count } = await query.limit(500)
  if (error) return res.status(400).json({ detail: error.message })
  return res.status(200).json({ rows: data || [], total: count || data?.length || 0 })
}
