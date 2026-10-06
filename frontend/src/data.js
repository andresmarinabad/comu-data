import { createClient } from '@supabase/supabase-js'
import { schema, tableNames, primaryKeys } from './schema.js'

const apiUrl = import.meta.env.VITE_API_URL
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

async function request(path, options, token) {
  if (!apiUrl) {
    throw new Error('Falta configurar VITE_API_URL. En local, usa http://localhost:8000/api en frontend/.env.')
  }
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options?.headers || {}) },
  })
  const contentType = response.headers.get('content-type') || ''
  if (!response.ok) {
    const body = await response.text()
    if (contentType.includes('application/json')) {
      let error
      try { error = JSON.parse(body) } catch { error = {} }
      throw new Error(error.detail || 'No se pudo completar la operación')
    }
    throw new Error(`La API respondió ${response.status} con HTML. Comprueba que VITE_API_URL apunte al backend (http://localhost:8000/api) y reinicia Vite.`)
  }
  if (response.status === 204) return null
  if (!contentType.includes('application/json')) {
    throw new Error('El servidor devolvió HTML en vez de JSON. Comprueba VITE_API_URL y reinicia Vite.')
  }
  return response.json()
}

async function supabaseAdminRequest(table, token, method = 'GET', body) {
  const response = await fetch(`/api/admin/tables?table=${encodeURIComponent(table)}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
  const result = response.status === 204 ? null : await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result?.detail || 'No se pudo completar la operación')
  return result
}

export const isSupabase = Boolean(supabase)

export async function loginAdmin(password) {
  const url = supabase ? '/api/admin/session' : `${apiUrl}/admin/session`
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.detail || 'No se pudo validar la contraseña')
  return result.token
}

export async function getDirectory() {
  if (!supabase) return request('/directory')
  const [personResult, serviceResult, relationResult] = await Promise.all([getRows('persons'), getRows('services'), getRows('person_services')])
  const serviceNames = new Map(serviceResult.rows.map(service => [service.id, service.name]))
  const serviceByPerson = new Map()
  relationResult.rows.forEach(relation => {
    const list = serviceByPerson.get(relation.person_id) || []
    const name = serviceNames.get(relation.service_id)
    if (name) list.push(name)
    serviceByPerson.set(relation.person_id, list)
  })
  return {
    rows: personResult.rows.map(person => ({
      ...person,
      services: (serviceByPerson.get(person.id) || []).sort((a, b) => a.localeCompare(b, 'es')),
    })),
    total: personResult.total,
  }
}

export async function getTables(token) {
  if (supabase) {
    return tableNames.map(name => ({ name, columns: schema[name].map(([column, type]) => ({ name: column, type, nullable: true, default: ['id','created_at','updated_at'].includes(column) ? 'database default' : null })), primaryKey: primaryKeys[name] || ['id'] }))
  }
  return request('/tables', {}, token)
}

export async function getRows(table, token) {
  if (supabase) {
    if (token) return supabaseAdminRequest(table, token)
    let query = supabase.from(table).select('*')
    if (table === 'words') query = query.order('created_at', { ascending: true })
    const { data, error } = await query.limit(500)
    if (error) throw error
    return { rows: data || [], total: data?.length || 0 }
  }
  if (!token) return request(`/public/${encodeURIComponent(table)}`)
  return request(`/tables/${encodeURIComponent(table)}`, {}, token)
}

export async function insertRow(table, values, token) {
  if (supabase) {
    if (token) return supabaseAdminRequest(table, token, 'POST', values)
    const { data, error } = await supabase.from(table).insert(values).select().single()
    if (error) throw error
    return data
  }
  return request(`/tables/${encodeURIComponent(table)}`, { method: 'POST', body: JSON.stringify(values) }, token)
}

export async function updateRow(table, key, values, token) {
  if (supabase) {
    if (token) return supabaseAdminRequest(table, token, 'PATCH', { key, values })
    let query = supabase.from(table).update(values)
    for (const [field, value] of Object.entries(key)) query = query.eq(field, value)
    const { data, error } = await query.select().single()
    if (error) throw error
    return data
  }
  return request(`/tables/${encodeURIComponent(table)}`, { method: 'PATCH', body: JSON.stringify({ ...values, _key: key }) }, token)
}

export async function deleteRow(table, key, token) {
  if (supabase) {
    if (token) return supabaseAdminRequest(table, token, 'DELETE', key)
    let query = supabase.from(table).delete()
    for (const [field, value] of Object.entries(key)) query = query.eq(field, value)
    const { error } = await query
    if (error) throw error
    return
  }
  return request(`/tables/${encodeURIComponent(table)}`, { method: 'DELETE', body: JSON.stringify(key) }, token)
}
