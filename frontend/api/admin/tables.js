import { createClient } from '@supabase/supabase-js'
import { authorized } from './_auth.js'
import { schema, tableNames, primaryKeys } from '../../src/schema.js'

const allowedFields = table => new Set(schema[table].map(([name]) => name))

export default async function handler(req, res) {
  if (!authorized(req)) return res.status(401).json({ detail: 'Sesión caducada; vuelve a introducir la contraseña' })
  const url = new URL(req.url, 'http://localhost')
  const table = url.searchParams.get('table')
  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return res.status(503).json({ detail: 'Configura SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en Vercel' })
  const db = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })

  if (!table && req.method === 'GET') {
    return res.status(200).json(tableNames.map(name => ({ name, primaryKey: primaryKeys[name] || ['id'], columns: schema[name].map(([column, type]) => ({ name: column, type, nullable: true, default: ['id', 'created_at', 'updated_at'].includes(column) ? 'database default' : null })) })))
  }
  if (!table || !tableNames.includes(table)) return res.status(404).json({ detail: 'Tabla no encontrada' })
  const fields = allowedFields(table)

  if (req.method === 'GET') {
    const { data, error, count } = await db.from(table).select('*', { count: 'exact' }).limit(500)
    if (error) return res.status(400).json({ detail: error.message })
    return res.status(200).json({ rows: data || [], total: count || 0 })
  }
  if (req.method === 'POST') {
    if (!req.body || Object.keys(req.body).some(field => !fields.has(field))) return res.status(400).json({ detail: 'Campos no válidos' })
    const { data, error } = await db.from(table).insert(req.body).select().single()
    if (error) return res.status(400).json({ detail: error.message })
    return res.status(201).json(data)
  }
  if (req.method === 'PATCH') {
    const { key, values } = req.body || {}
    if (!key || !values || Object.keys(key).some(field => !fields.has(field)) || Object.keys(values).some(field => !fields.has(field))) return res.status(400).json({ detail: 'Clave o campos no válidos' })
    let query = db.from(table).update(values)
    for (const [field, value] of Object.entries(key)) query = query.eq(field, value)
    const { data, error } = await query.select().single()
    if (error) return res.status(400).json({ detail: error.message })
    return res.status(200).json(data)
  }
  if (req.method === 'DELETE') {
    const key = req.body || {}
    if (!Object.keys(key).length || Object.keys(key).some(field => !fields.has(field))) return res.status(400).json({ detail: 'Clave no válida' })
    let query = db.from(table).delete()
    for (const [field, value] of Object.entries(key)) query = query.eq(field, value)
    const { error } = await query
    if (error) return res.status(400).json({ detail: error.message })
    return res.status(204).end()
  }
  return res.status(405).json({ detail: 'Método no permitido' })
}
