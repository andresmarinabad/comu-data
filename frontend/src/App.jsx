import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { deleteRow, getDirectory, getRows, getTables, insertRow, isSupabase, loginAdmin, loginSite, updateRow } from './data.js'

function Layout({ children }) {
  return <div className="shell"><header className="topbar"><Link to="/" className="brand"><span className="brand-mark">C</span><span>Comunidad<span className="brand-sub"> X Santas</span></span></Link><nav><NavLink end to="/">Inicio</NavLink><NavLink to="/lista">Lista</NavLink><NavLink to="/eventos">Eventos</NavLink><NavLink to="/grupos">Grupos</NavLink><NavLink to="/admin">Admin</NavLink></nav></header>{children}<footer>Comunidad X</footer></div>
}

function Directory() {
  const [people, setPeople] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [search, setSearch] = useState('')
  useEffect(() => {
    getDirectory().then(({ rows }) => setPeople(rows))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const groups = useMemo(() => {
    const validPeople = people.filter(person => person && person.id)
    const byId = new Map(validPeople.map(person => [person.id, person]))
    const adults = validPeople.filter(person => !person.parent_id)
    const children = validPeople.filter(person => person.parent_id)
    const consumed = new Set()
    const households = []
    const compareName = (a, b) => `${a.last_name || ''} ${a.first_name}`.localeCompare(`${b.last_name || ''} ${b.first_name}`, 'es')
    const sexOrder = person => person.sex === 'M' ? 0 : person.sex === 'F' ? 1 : 2
    adults.forEach(person => {
      if (consumed.has(person.id)) return
      const spouse = byId.get(person.spouse_id)
      const partners = (spouse && !spouse.parent_id ? [person, spouse] : [person]).sort((a, b) => sexOrder(a) - sexOrder(b) || compareName(a, b))
      partners.forEach(partner => consumed.add(partner.id))
      const parentIds = new Set(partners.map(partner => partner.id))
      const householdChildren = children.filter(child => parentIds.has(child.parent_id)).sort((a, b) => {
        const byBirthday = (a.birth_date || '').localeCompare(b.birth_date || '')
        return byBirthday || compareName(a, b)
      })
      households.push({ partners, children: householdChildren, sortName: partners.find(partner => partner.sex === 'M') || [...partners].sort(compareName)[0] })
    })
    return households.sort((a, b) => compareName(a.sortName, b.sortName))
  }, [people])

  const matchesSearch = person => Boolean(person) && `${person.first_name || ''} ${person.last_name || ''}`.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es'))
  const visibleGroups = groups.map(group => ({ ...group, allPartners: group.partners, partners: group.partners.filter(matchesSearch), children: group.children.filter(matchesSearch) })).filter(group => group.partners.length || group.children.length)
  const birthday = value => value ? new Date(`${value}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''
  const address = person => person ? [person.address, [person.postal_code, person.city].filter(Boolean).join(' '), person.country].filter(Boolean).join(' ') : ''
  const mapsLink = value => value ? <a className="map-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`} target="_blank" rel="noreferrer" aria-label={`Abrir ${value} en Google Maps`}>{value}</a> : ''
  const row = (person, type = 'person') => <tr className={`directory-${type}`} key={person.id}><td data-label="Nombre">{`${person.first_name || ''} ${person.last_name || ''}`.trim()}</td></tr>

  const sharedCell = (partners, key, format = value => value || '') => {
    const values = partners.map(person => format(person?.[key], person) || '')
    const present = values.filter(Boolean)
    const oneSharedValue = present.length <= 1 || present.every(value => value === present[0])
    return oneSharedValue ? { merged: true, value: present[0] || '' } : { merged: false }
  }
  return <main className="content"><section className="hero"><h1>Lista de la comunidad</h1></section><section className="directory"><div className="section-head"><div><p>{people.length} personas</p></div><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar persona" aria-label="Buscar persona" /></label></div>{loading ? <p className="state">Cargando personas…</p> : error ? <p className="error">{error}</p> : visibleGroups.length ? <div className="directory-table-wrap"><table className="directory-table"><thead><tr><th>Nombre y apellidos</th></tr></thead>{visibleGroups.map((group, index) => {
    const hasPair = group.allPartners.length === 2
    const displayingPair = group.partners.length === 2
    const addressCell = hasPair ? sharedCell(group.allPartners, 'address', (_value, person) => address(person)) : null
    const emailCell = hasPair ? sharedCell(group.allPartners, 'email', value => value) : null
    return <tbody className="family-unit" key={`${group.sortName.id}-${index}`}>{group.partners.map((person, partnerIndex) => {
      const isSecond = partnerIndex === 1
      const common = hasPair && isSecond && displayingPair ? { omitAddress: addressCell.merged, omitEmail: emailCell.merged } : {
        addressSpan: hasPair && displayingPair && addressCell.merged, addressValue: hasPair && addressCell.merged ? addressCell.value : undefined,
        emailSpan: hasPair && displayingPair && emailCell.merged, emailValue: hasPair && emailCell.merged ? emailCell.value : undefined,
      }
      return row(person, isSecond ? 'spouse' : 'person', common)
    })}{group.children.map(person => row(person, 'child'))}</tbody>
  })}</table></div> : <p className="state">No hay resultados para “{search}”.</p>}</section></main>
}

function Home() {
  const [events, setEvents] = useState([]), [psalm, setPsalm] = useState(null), [birthday, setBirthday] = useState(null), [words, setWords] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState('')
  useEffect(() => {
    Promise.all([getRows('events'), getRows('current_psalm'), getDirectory(), getRows('words')]).then(([eventData, psalmData, directory, wordData]) => {
      const now = new Date(), today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const cutoff = new Date(today.getFullYear(), today.getMonth() + 2, 1)
      setEvents(eventData.rows.filter(e => e.starts_at && new Date(e.starts_at) >= now && new Date(e.starts_at) < cutoff).sort((a,b) => new Date(a.starts_at)-new Date(b.starts_at)))
      setPsalm(psalmData.rows[0]?.psalm_number)
      const next = directory.rows.filter(p => p.birth_date).map(person => {
        const [, month, day] = person.birth_date.slice(0,10).split('-').map(Number)
        let date = new Date(today.getFullYear(), month-1, day)
        if (date < today) date = new Date(today.getFullYear()+1, month-1, day)
        return { person, date }
      }).sort((a,b) => a.date-b.date)[0]
      setBirthday(next || null)
      setWords(wordData.rows.map(row => row.word).filter(Boolean))
    }).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])
  const dateLabel = value => new Date(value).toLocaleDateString('es-ES',{weekday:'short',day:'numeric',month:'long'})
  return <main className="content dashboard"><section className="hero"><p className="eyebrow">COMUNIDAD X SANTAS</p><h1>Inicio</h1><p className="intro">Información relevante de la comunidad.</p></section>{error && <p className="error">{error}</p>}{loading ? <p className="state">Cargando información…</p> : <><div className="dashboard-cards"><article className="info-card"><p className="eyebrow">SALMO ACTUAL</p><strong>{psalm ? `Salmo ${psalm}` : 'Sin definir'}</strong></article><article className="info-card"><p className="eyebrow">PRÓXIMO CUMPLEAÑOS</p><strong>{birthday ? `${birthday.person.first_name} ${birthday.person.last_name || ''}`.trim() : 'Sin cumpleaños registrados'}</strong>{birthday && <span>{dateLabel(birthday.date)}</span>}</article></div><section className="upcoming"><div className="section-head"><div><h2>Próximos eventos</h2><p>Este mes y el próximo</p></div><Link className="text-link" to="/eventos">Ver todos →</Link></div>{events.length ? <div className="event-list">{events.map(event => <article className="event-card" key={event.id}><time>{dateLabel(event.starts_at)}</time><h3>{event.name}</h3>{event.location && <p>{event.location}</p>}</article>)}</div> : <p className="state">No hay próximos eventos.</p>}</section>{words.length > 0 && <section className="community-words" aria-label="Palabras"><h2>Palabras</h2><div>{words.map((word,index)=><span key={`${word}-${index}`}>{word}</span>)}</div></section>}</>}</main>
}

function Events() {
  const [events,setEvents]=useState([]),[agapeEventIds,setAgapeEventIds]=useState([]),[agapeDetails,setAgapeDetails]=useState({}),[loading,setLoading]=useState(true),[error,setError]=useState('')
  useEffect(()=>{Promise.all([getRows('events'),getRows('agapes'),getRows('agape_assignments'),getRows('agape_food_types'),getDirectory()]).then(([eventData,agapeData,assignmentData,foodData,directory])=>{const upcoming=eventData.rows.filter(e=>e.starts_at&&new Date(e.starts_at)>=new Date()).sort((a,b)=>new Date(a.starts_at)-new Date(b.starts_at));const peopleById=new Map(directory.rows.map(person=>[person.id,person]));const foodById=new Map(foodData.rows.map(food=>[food.id,food.name]));const details={};agapeData.rows.forEach(agape=>{const byFood=new Map();assignmentData.rows.filter(item=>item.agape_id===agape.id).forEach(item=>{const person=peopleById.get(item.person_id);if(!person)return;const list=byFood.get(item.food_type_id)||[];const name=`${person.first_name||''} ${person.last_name||''}`.trim();if(!list.includes(name))list.push(name);byFood.set(item.food_type_id,list)});details[agape.event_id]=[...byFood.entries()].map(([foodId,names])=>({food:foodById.get(foodId)||'Comida',names}))});setEvents(upcoming);setAgapeEventIds(agapeData.rows.map(item=>item.event_id));setAgapeDetails(details)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[])
  return <main className="content"><section className="hero"><h1>Eventos</h1><p className="intro">Todos los eventos próximos.</p></section>{error&&<p className="error">{error}</p>}{loading?<p className="state">Cargando eventos…</p>:events.length?<div className="event-list">{events.map(event=><article className="event-card" key={event.id}><time>{new Date(event.starts_at).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}</time><h3>{event.name}</h3>{event.description&&<p>{event.description}</p>}{event.location&&<p>{event.location}</p>}{agapeEventIds.includes(event.id)&&<details className="event-agape"><summary>Consultar ágape</summary>{agapeDetails[event.id]?.length?<ul>{agapeDetails[event.id].map(item=><li key={item.food}><strong>{item.food}</strong><span>{item.names.join(', ')}</span></li>)}</ul>:<p>El ágape todavía no tiene asignaciones.</p>}</details>}</article>)}</div>:<p className="state">No hay próximos eventos.</p>}</main>
}

function Groups() {
  const [groups,setGroups]=useState([]),[traditios,setTraditios]=useState([]),[peopleById,setPeopleById]=useState({}),[loading,setLoading]=useState(true),[error,setError]=useState('')
  useEffect(()=>{Promise.all([getRows('groups'),getRows('traditio'),getDirectory()]).then(([groupData,traditioData,directory])=>{setGroups(groupData.rows.sort((a,b)=>a.name.localeCompare(b.name,'es')));setTraditios(traditioData.rows);setPeopleById(Object.fromEntries(directory.rows.map(person=>[person.id,person]))) }).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[])
  const fullName = id => { const person=peopleById[id]; return person ? `${person.first_name||''} ${person.last_name||''}`.trim() : '' }
  return <main className="content"><section className="hero"><h1>Grupos</h1><p className="intro">Grupos de la comunidad.</p></section>{error&&<p className="error">{error}</p>}{loading?<p className="state">Cargando grupos…</p>:<><section className="group-list">{groups.length?groups.map(group=><article className="info-card" key={group.id}><strong>{group.name}</strong></article>):<p className="state">No hay grupos definidos.</p>}</section><section className="couples-section"><div className="section-head"><div><h2>Parejas</h2></div></div>{traditios.length?<div className="traditio-table-wrap"><table className="traditio-table"><thead><tr><th>Hermanos</th><th>Calles</th></tr></thead><tbody>{traditios.map(row=><tr key={row.id}><td data-label="Hermanos">{[row.person_1_id,row.person_2_id,row.person_3_id].filter(Boolean).map(fullName).filter(Boolean).join(' · ') || '—'}</td><td data-label="Calles">{row.text || '—'}</td></tr>)}</tbody></table></div>:<p className="state">No hay parejas definidas.</p>}</section></>}</main>
}

function formInputType(field) {
  const type = (field.type || '').toLowerCase()
  if (type.includes('timestamp')) return 'datetime-local'
  if (type === 'date' || type.includes(' date')) return 'date'
  if (type.includes('integer') || type.includes('numeric')) return 'number'
  return 'text'
}

function formInputValue(field, value) {
  if (value == null || value === '') return ''
  const type = formInputType(field)
  if (type === 'date') return String(value).slice(0, 10)
  if (type === 'datetime-local') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  }
  return value
}

function AgapeEditor({ enabled, onEnabledChange, assignments, onAssignmentsChange, people, foodTypes, loading }) {
  const updateRow = (index, key, value) => onAssignmentsChange(assignments.map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  const personLabel = person => {
    const spouse = people.find(item => item.id === person.spouse_id)
    const name = `${person.first_name || ''} ${person.last_name || ''}`.trim()
    return spouse ? `${name} (y ${`${spouse.first_name || ''} ${spouse.last_name || ''}`.trim()})` : name
  }
  return <section className="agape-editor"><label className="agape-toggle"><input type="checkbox" checked={enabled} onChange={event => onEnabledChange(event.target.checked)} /><span>Este evento tiene ágape</span></label>{enabled && <div className="agape-editor-content">{loading ? <p className="state">Cargando opciones del ágape…</p> : <>{assignments.map((assignment,index)=><div className="agape-assignment-row" key={index}><label>Persona<select value={assignment.person_id} onChange={event => updateRow(index,'person_id',event.target.value)}><option value="">Selecciona una persona</option>{people.map(person=><option key={person.id} value={person.id}>{personLabel(person)}</option>)}</select></label><label>Tipo de comida<select value={assignment.food_type_id} onChange={event => updateRow(index,'food_type_id',event.target.value)}><option value="">Selecciona comida</option>{foodTypes.map(food=><option key={food.id} value={food.id}>{food.name}</option>)}</select></label><button type="button" className="row-remove" aria-label="Quitar asignación" onClick={()=>onAssignmentsChange(assignments.filter((_,rowIndex)=>rowIndex!==index))}>×</button></div>)}<button type="button" className="button" onClick={()=>onAssignmentsChange([...assignments,{person_id:'',food_type_id:''}])}>＋ Añadir asignación</button><p className="field-help">Si la persona tiene cónyuge registrado, ambos quedarán asignados a la misma comida.</p></>}</div>}</section>
}

function SitePassword({ onAuthenticated }) {
  const [password,setPassword]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false)
  const submit=async event=>{event.preventDefault();setBusy(true);setError('');try{const token=await loginSite(password);sessionStorage.setItem('comu-site-token',token);onAuthenticated(token)}catch(e){setError(e.message)}finally{setBusy(false)}}
  return <main className="content site-gate"><form className="site-gate-card" onSubmit={submit}><span className="brand-mark">C</span><p className="eyebrow">COMUNIDAD X SANTAS</p><h1>Acceso a la comunidad</h1><p>Introduce la contraseña para continuar.</p><label>Contraseña<input autoFocus type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} /></label>{error&&<p className="error">{error}</p>}<button className="button primary" disabled={busy||!password}>{busy?'Comprobando…':'Entrar'}</button></form></main>
}

function AdminContent({ token, onLogout }) {
  const [tables, setTables] = useState([]), [table, setTable] = useState('persons'), [rows, setRows] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [editing, setEditing] = useState(null), [saving, setSaving] = useState(false), [serviceOptions, setServiceOptions] = useState([]), [selectedServiceId, setSelectedServiceId] = useState(''), [personServiceLinks, setPersonServiceLinks] = useState([]), [personServicesById, setPersonServicesById] = useState({}), [serviceLoading, setServiceLoading] = useState(false), [agapeEnabled, setAgapeEnabled] = useState(false), [agapeId, setAgapeId] = useState(null), [agapeAssignments, setAgapeAssignments] = useState([]), [savedAgapeAssignments, setSavedAgapeAssignments] = useState([]), [agapePeople, setAgapePeople] = useState([]), [agapeFoodTypes, setAgapeFoodTypes] = useState([]), [agapeLoading, setAgapeLoading] = useState(false)
  const current = tables.find(t => t.name === table)
  const needsServices = ['persons', 'person_services'].includes(table) && Boolean(editing)
  const serviceEditorKey = needsServices ? `${table}:${editing.key?.id || 'new'}` : ''
  const agapeEditorKey = table === 'events' && editing ? `events:${editing.key?.id || 'new'}` : ''
  const load = async (selected = table) => {
    setLoading(true); setError('')
    try {
      const [metadata, result] = await Promise.all([tables.length ? Promise.resolve(tables) : getTables(token), getRows(selected, token)])
      if (!tables.length) setTables(metadata.filter(item => !['agapes', 'agape_assignments'].includes(item.name)))
      setRows(result.rows)
      if (selected === 'persons') {
        const [{ rows: services }, { rows: relations }] = await Promise.all([getRows('services', token), getRows('person_services', token)])
        const names = new Map(services.map(service => [service.id, service.name]))
        const byPerson = {}
        relations.forEach(relation => {
          const name = names.get(relation.service_id)
          if (name) (byPerson[relation.person_id] ||= []).push(name)
        })
        Object.values(byPerson).forEach(list => list.sort((a, b) => a.localeCompare(b, 'es')))
        setPersonServicesById(byPerson)
      }
    } catch (e) { if (e.message.includes('Sesión')) onLogout(); setError(e.message) } finally { setLoading(false) }
  }
  useEffect(() => { load(table) }, [table])
  useEffect(() => {
    if (!needsServices) return
    let active = true
    setServiceLoading(true)
    Promise.all([
      getRows('services', token),
      table === 'persons' && editing.key ? getRows('person_services', token) : Promise.resolve({ rows: [] }),
    ]).then(([{ rows: options }, { rows: links }]) => {
      if (!active) return
      setServiceOptions(options)
      const forPerson = table === 'persons' && editing.key ? links.filter(link => link.person_id === editing.key.id) : []
      setPersonServiceLinks(forPerson)
      setSelectedServiceId(forPerson[0]?.service_id || '')
    }).catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setServiceLoading(false) })
    return () => { active = false }
  }, [serviceEditorKey, token])
  useEffect(() => {
    if (!agapeEditorKey) return
    let active = true
    setAgapeLoading(true)
    Promise.all([getRows('persons', token), getRows('agape_food_types', token), getRows('agapes', token)]).then(async ([{ rows: people }, { rows: foodTypes }, { rows: agapes }]) => {
      const eventId = editing?.key?.id
      const agape = eventId ? agapes.find(item => item.event_id === eventId) : null
      const assignments = agape ? (await getRows('agape_assignments', token)).rows.filter(item => item.agape_id === agape.id) : []
      if (!active) return
      setAgapePeople(people)
      setAgapeFoodTypes(foodTypes.sort((a,b) => a.name.localeCompare(b.name, 'es')))
      setAgapeId(agape?.id || null)
      setAgapeEnabled(Boolean(agape))
      setSavedAgapeAssignments(assignments)
      const personById = new Map(people.map(person => [person.id, person]))
      const normalized = new Map()
      assignments.forEach(assignment => {
        const person = personById.get(assignment.person_id)
        const spouse = person?.spouse_id
        const householdId = spouse ? [person.id, spouse].sort()[0] : person?.id || assignment.person_id
        const key = `${householdId}:${assignment.food_type_id}`
        if (!normalized.has(key)) normalized.set(key, { person_id: assignment.person_id, food_type_id: assignment.food_type_id })
      })
      setAgapeAssignments([...normalized.values()])
    }).catch(e => { if (active) setError(e.message) }).finally(() => { if (active) setAgapeLoading(false) })
    return () => { active = false }
  }, [agapeEditorKey, token])
  const fields = current?.columns || []
  const visibleFields = fields.filter(field => !['id', 'created_at', 'updated_at'].includes(field.name))
  const keyFor = row => Object.fromEntries((current?.primaryKey || ['id']).map(key => [key, row[key]]))
  const personLabel = id => {
    const person = rows.find(item => item.id === id)
    return person ? `${person.first_name || ''} ${person.last_name || ''}`.trim() : ''
  }
  const startNew = () => { setSelectedServiceId(''); setPersonServiceLinks([]); if (table === 'events') { setAgapeEnabled(false); setAgapeId(null); setAgapeAssignments([]); setSavedAgapeAssignments([]) } if (['persons', 'person_services'].includes(table)) setServiceLoading(true); setEditing({ key: null, values: Object.fromEntries(fields.filter(f => !['id', 'created_at', 'updated_at'].includes(f.name) && !f.default && !(current.primaryKey.length === 1 && current.primaryKey[0] === f.name)).map(f => [f.name, ''])) }) }
  const startEdit = row => { setSelectedServiceId(''); setPersonServiceLinks([]); if (table === 'events') { setAgapeEnabled(false); setAgapeId(null); setAgapeAssignments([]); setSavedAgapeAssignments([]) } if (['persons', 'person_services'].includes(table)) setServiceLoading(true); setEditing({ key: keyFor(row), values: Object.fromEntries(fields.map(f => [f.name, row[f.name] ?? ''])) }) }
  const saveEventAgape = async eventId => {
    if (!agapeEnabled) {
      if (agapeId) await deleteRow('agapes', { id: agapeId }, token)
      return
    }
    const agape = agapeId ? { id: agapeId } : await insertRow('agapes', { event_id: eventId }, token)
    const peopleById = new Map(agapePeople.map(person => [person.id, person]))
    const desired = new Map()
    agapeAssignments.filter(item => item.person_id && item.food_type_id).forEach(item => {
      const person = peopleById.get(item.person_id)
      ;[person?.id, person?.spouse_id].filter(Boolean).forEach(personId => desired.set(`${personId}:${item.food_type_id}`, { agape_id: agape.id, person_id: personId, food_type_id: item.food_type_id }))
    })
    const existing = savedAgapeAssignments
    const existingByKey = new Map(existing.map(item => [`${item.person_id}:${item.food_type_id}`, item]))
    await Promise.all(existing.filter(item => !desired.has(`${item.person_id}:${item.food_type_id}`)).map(item => deleteRow('agape_assignments', { id: item.id }, token)))
    await Promise.all([...desired.entries()].filter(([key]) => !existingByKey.has(key)).map(([, values]) => insertRow('agape_assignments', values, token)))
  }
  const save = async event => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      const values = Object.fromEntries(Object.entries(editing.values).filter(([key]) => !['id', 'created_at', 'updated_at'].includes(key) && (!editing.key || !editing.key.hasOwnProperty(key) || (table === 'person_services' && key === 'service_id'))))
      for (const [key, value] of Object.entries(values)) if (value === '') values[key] = null
      let savedRow
      if (editing.key) savedRow = await updateRow(table, editing.key, values, token)
      else savedRow = await insertRow(table, values, token)
      if (table === 'persons') {
        const personId = savedRow.id
        for (const relation of personServiceLinks) {
          if (relation.service_id !== selectedServiceId) await deleteRow('person_services', { person_id: personId, service_id: relation.service_id }, token)
        }
        if (selectedServiceId && !personServiceLinks.some(relation => relation.service_id === selectedServiceId)) await insertRow('person_services', { person_id: personId, service_id: selectedServiceId }, token)
      }
      if (table === 'events') await saveEventAgape(savedRow.id)
      setEditing(null); await load()
    } catch (e) { setError(e.message) } finally { setSaving(false) }
  }
  const remove = async row => { if (!window.confirm('¿Eliminar este registro?')) return; try { await deleteRow(table, keyFor(row), token); await load() } catch (e) { setError(e.message) } }
  return <main className="content admin"><section className="hero admin-hero"><p className="eyebrow">BACKOFFICE</p><h1>Administración</h1><p className="intro">Consulta y gestiona los datos de la comunidad.</p></section><section className="admin-panel"><div className="admin-toolbar"><label>Tabla<select value={table} onChange={e => setTable(e.target.value)}>{tables.map(t => <option key={t.name} value={t.name}>{t.name}</option>)}</select></label><div className="admin-actions"><button className="button" onClick={onLogout}>Cerrar sesión</button><button className="button primary" onClick={startNew} disabled={!current}>＋ Nuevo registro</button></div></div>{error && <p className="error">{error}</p>}{loading ? <p className="state">Cargando…</p> : <div className="admin-table-wrap"><table className={`admin-table ${table === 'persons' ? 'persons-table' : ''}`}><thead><tr>{visibleFields.map(f => <th key={f.name}>{f.name}</th>)}{table === 'persons' && <th>Servicio</th>}<th>Acciones</th></tr></thead><tbody>{rows.map((row, i) => <tr key={JSON.stringify(keyFor(row)) || i}>{visibleFields.map(f => <td key={f.name}>{f.name === 'spouse_id' && table === 'persons' ? personLabel(row[f.name]) || '—' : String(row[f.name] ?? '—')}</td>)}{table === 'persons' && <td>{(personServicesById[row.id] || []).join(', ') || '—'}</td>}<td><div className="row-actions"><button onClick={() => startEdit(row)}>Editar</button><button className="danger" onClick={() => remove(row)}>Eliminar</button></div></td></tr>)}</tbody></table>{!rows.length && <p className="state">No hay registros en esta tabla.</p>}</div>}</section>{editing && <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && setEditing(null)}><form className="modal" onSubmit={save}><div className="modal-head"><div><p className="eyebrow">{editing.key ? 'EDITAR' : 'NUEVO'}</p><h2>{table}</h2></div><button type="button" className="close" onClick={() => setEditing(null)}>×</button></div><div className="form-grid">{fields.filter(f => !['id', 'created_at', 'updated_at'].includes(f.name) && (!editing.key || !editing.key.hasOwnProperty(f.name) || (table === 'person_services' && f.name === 'service_id'))).map(f => <label key={f.name}>{f.name}{f.name === 'spouse_id' && table === 'persons' ? <select value={editing.values[f.name] ?? ''} onChange={e => setEditing(prev => ({ ...prev, values: { ...prev.values, [f.name]: e.target.value || null } }))}><option value="">Sin pareja</option>{rows.filter(person => person.id !== editing.values.id).map(person => <option key={person.id} value={person.id}>{`${person.first_name || ''} ${person.last_name || ''}`.trim()}</option>)}</select> : f.name === 'service_id' && table === 'person_services' ? <select value={editing.values[f.name] ?? ''} onChange={e => setEditing(prev => ({ ...prev, values: { ...prev.values, [f.name]: e.target.value || null } }))}><option value="">Selecciona un servicio</option>{serviceOptions.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}</select> : f.name === 'sex' ? <select value={formInputValue(f, editing.values[f.name])} onChange={e => { const value = e.target.value; setEditing(prev => ({ ...prev, values: { ...prev.values, [f.name]: formInputType(f) === 'datetime-local' && value ? new Date(value).toISOString() : value } })) }}><option value="">Sin indicar</option><option value="M">M</option><option value="F">F</option></select> : <input type={formInputType(f)} onClick={e => { if (['date','datetime-local'].includes(formInputType(f))) e.currentTarget.showPicker?.() }} value={formInputValue(f, editing.values[f.name])} onChange={e => { const value = e.target.value; setEditing(prev => ({ ...prev, values: { ...prev.values, [f.name]: formInputType(f) === 'datetime-local' && value ? new Date(value).toISOString() : value } })) }} placeholder={f.nullable ? 'Opcional' : 'Obligatorio'} />}</label>)}{table === 'persons' && <label>Servicio<select value={selectedServiceId} disabled={serviceLoading} onChange={e => setSelectedServiceId(e.target.value)}><option value="">Sin servicio</option>{serviceOptions.map(service => <option key={service.id} value={service.id}>{service.name}</option>)}</select></label>}{table === "events" && <AgapeEditor enabled={agapeEnabled} onEnabledChange={setAgapeEnabled} assignments={agapeAssignments} onAssignmentsChange={setAgapeAssignments} people={agapePeople} foodTypes={agapeFoodTypes} loading={agapeLoading} />}</div><div className="modal-actions"><button type="button" className="button" onClick={() => setEditing(null)}>Cancelar</button><button className="button primary" disabled={saving || (needsServices && serviceLoading) || (table === 'events' && agapeLoading)}>{saving ? 'Guardando…' : 'Guardar'}</button></div></form></div>}</main>
}

function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem('comu-admin-token'))
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const logout = () => { sessionStorage.removeItem('comu-admin-token'); setToken(null) }
  const submit = async event => {
    event.preventDefault(); setBusy(true); setError('')
    try { const session = await loginAdmin(password); sessionStorage.setItem('comu-admin-token', session); setToken(session); setPassword('') }
    catch (e) { setError(e.message) }
    finally { setBusy(false) }
  }
  if (token) return <AdminContent token={token} onLogout={logout} />
  return <main className="content"><div className="modal-backdrop"><form className="modal login-modal" onSubmit={submit}><div className="modal-head"><div><p className="eyebrow">ADMINISTRACIÓN</p><h2>Introduce la contraseña</h2></div></div><label className="login-field">Contraseña<input autoFocus type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>{error && <p className="error">{error}</p>}<div className="modal-actions"><Link to="/" className="button">Volver al inicio</Link><button className="button primary" disabled={busy || !password}>{busy ? 'Comprobando…' : 'Entrar'}</button></div></form></div></main>
}

export default function App() {
  const location=useLocation()
  const [siteToken,setSiteToken]=useState(()=>{const token=sessionStorage.getItem('comu-site-token');return token&&Number(token.split('.')[0])*1000>Date.now()?token:''})
  useEffect(()=>{const expire=()=>{sessionStorage.removeItem('comu-site-token');setSiteToken('')};window.addEventListener('comu-site-session-expired',expire);return()=>window.removeEventListener('comu-site-session-expired',expire)},[])
  const isAdmin=location.pathname.replace(/\/+$/,'')==='/admin'
  return <Layout>{!isAdmin&&!siteToken?<SitePassword onAuthenticated={setSiteToken}/>:<><Routes><Route path="/" element={<Home />} /><Route path="/lista" element={<Directory />} /><Route path="/eventos" element={<Events />} /><Route path="/grupos" element={<Groups />} /><Route path="/admin" element={<Admin />} /><Route path="*" element={<Home />} /></Routes>{isSupabase && <div className="config-note">Conectado a Supabase · Las operaciones de administración están protegidas por contraseña.</div>}</>}</Layout>
}
