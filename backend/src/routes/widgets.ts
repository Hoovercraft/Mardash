import { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { promises as fsp } from 'fs'
import fs from 'fs'
import path from 'path'
import { getDb, safeJson } from '../db/database'
import { callerGroupId } from './_helpers'

const DATA_DIR = process.env.DATA_DIR ?? '/data'

// ── DB row types ──────────────────────────────────────────────────────────────
interface WidgetRow {
  id: string
  type: string
  name: string
  config: string
  position: number
  show_in_topbar: number
  display_location: string
  icon_url: string | null
  icon_id: string | null
  created_at: string
  updated_at: string
}

// ── Request body types ────────────────────────────────────────────────────────
interface CreateWidgetBody {
  type: string
  name: string
  config?: Record<string, unknown>
  show_in_topbar?: boolean
  display_location?: string
}

interface PatchWidgetBody {
  name?: string
  config?: Record<string, unknown>
  show_in_topbar?: boolean
  display_location?: string
  position?: number
  icon_id?: string | null
}

interface AdGuardProtectionBody {
  enabled: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitize(r: WidgetRow) {
  const rawConfig = safeJson(r.config, {} as Record<string, unknown>)
  // Strip credentials from configs — they never leave the backend
  let config: Record<string, unknown>
  if (r.type === 'adguard_home') {
    const { password: _p, ...safe } = rawConfig as Record<string, unknown>
    config = safe
  } else if (r.type === 'home_assistant') {
    const { token: _t, ...safe } = rawConfig as Record<string, unknown>
    config = safe
  } else if (r.type === 'pihole') {
    const { password: _p, ...safe } = rawConfig as Record<string, unknown>
    config = safe
  } else if (r.type === 'nginx_pm') {
    const { password: _p, ...safe } = rawConfig as Record<string, unknown>
    config = safe
  } else {
    config = rawConfig as Record<string, unknown>
  }
  return {
    id: r.id,
    type: r.type,
    name: r.name,
    config,
    position: r.position,
    show_in_topbar: r.show_in_topbar === 1,
    display_location: (r.display_location ?? 'none') as 'topbar' | 'sidebar' | 'none',
    icon_url: r.icon_id ? `/api/icons/${r.icon_id}` : (r.icon_url ?? null),
    created_at: r.created_at,
    updated_at: r.updated_at,
  }
}

// ── Server Status helpers (Linux /proc + fs.statfs) ───────────────────────────

function parseProcStat(raw: string): { total: number; idle: number } {
  const line = raw.split('\n')[0]
  const parts = line.trim().split(/\s+/).slice(1).map(Number)
  const idle = parts[3] + (parts[4] ?? 0)
  const total = parts.reduce((a, b) => a + b, 0)
  return { total, idle }
}

async function getCpuLoad(): Promise<number> {
  try {
    const raw1 = await fsp.readFile('/proc/stat', 'utf8')
    const s1 = parseProcStat(raw1)
    await new Promise(r => setTimeout(r, 200))
    const raw2 = await fsp.readFile('/proc/stat', 'utf8')
    const s2 = parseProcStat(raw2)
    const dTotal = s2.total - s1.total
    const dIdle = s2.idle - s1.idle
    if (dTotal === 0) return 0
    return Math.round(((dTotal - dIdle) / dTotal) * 1000) / 10
  } catch {
    return -1
  }
}

async function getRam(): Promise<{ total: number; used: number; free: number }> {
  try {
    const raw = await fsp.readFile('/proc/meminfo', 'utf8')
    const getValue = (key: string): number => {
      const match = raw.match(new RegExp(`^${key}:\\s+(\\d+)`, 'm'))
      return match ? parseInt(match[1], 10) : 0
    }
    const totalKb = getValue('MemTotal')
    const availKb = getValue('MemAvailable')
    const total = Math.round(totalKb / 1024)
    const free = Math.round(availKb / 1024)
    const used = total - free
    return { total, used, free }
  } catch {
    return { total: 0, used: 0, free: 0 }
  }
}

interface DiskConfig { path: string; name: string }
interface DiskStats extends DiskConfig {
  total: number
  used: number
  free: number
  error?: 'not_mounted'
  duplicate?: boolean
  duplicateOf?: string
}

async function getDeviceForPath(mountPath: string): Promise<string | null> {
  try {
    const mounts = await fsp.readFile('/proc/mounts', 'utf8')
    let bestMatch = ''
    let bestDevice = ''
    for (const line of mounts.split('\n')) {
      const parts = line.split(' ')
      if (parts.length < 2) continue
      const device = parts[0]!
      const mp = parts[1]!
      if (mountPath.startsWith(mp) && mp.length > bestMatch.length) {
        bestMatch = mp
        bestDevice = device
      }
    }
    return bestDevice || null
  } catch {
    return null
  }
}

async function getDiskStats(disks: DiskConfig[]): Promise<DiskStats[]> {
  // First pass: get stats and devices
  const results = await Promise.all(disks.map(async disk => {
    try {
      const stat = await fsp.statfs(disk.path)
      const blockSize = stat.bsize
      const total = Math.round((stat.blocks * blockSize) / (1024 * 1024))
      const free = Math.round((stat.bavail * blockSize) / (1024 * 1024))
      const used = total - free
      const device = await getDeviceForPath(disk.path)
      return { path: disk.path, name: disk.name, total, used, free, device, error: undefined as 'not_mounted' | undefined }
    } catch {
      return { path: disk.path, name: disk.name, total: 0, used: 0, free: 0, device: null, error: 'not_mounted' as const }
    }
  }))

  // Second pass: detect duplicates
  const deviceMap = new Map<string, string>() // device -> first disk name
  for (const r of results) {
    if (r.device && !r.error) {
      if (!deviceMap.has(r.device)) {
        deviceMap.set(r.device, r.name)
      }
    }
  }

  return results.map(r => {
    const base: DiskStats = { path: r.path, name: r.name, total: r.total, used: r.used, free: r.free }
    if (r.error) base.error = r.error
    if (r.device && !r.error) {
      const firstOwner = deviceMap.get(r.device)
      if (firstOwner && firstOwner !== r.name) {
        base.duplicate = true
        base.duplicateOf = firstOwner
      }
    }
    return base
  })
}

// ── AdGuard Home helpers ───────────────────────────────────────────────────────

interface AdGuardStatsResult {
  total_queries: number
  blocked_queries: number
  blocked_percent: number
  protection_enabled: boolean
}

async function getAdGuardStats(url: string, username: string, password: string): Promise<AdGuardStatsResult> {
  const errResult: AdGuardStatsResult = {
    total_queries: -1, blocked_queries: -1, blocked_percent: -1, protection_enabled: false,
  }
  if (!url) return errResult

  const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
  const headers = { Authorization: auth }
  const base = url.replace(/\/$/, '')

  try {
    const [statsRes, statusRes] = await Promise.all([
      fetch(`${base}/control/stats`, { headers }),
      fetch(`${base}/control/status`, { headers }),
    ])
    if (!statsRes.ok || !statusRes.ok) return errResult

    const statsData = await statsRes.json() as Record<string, unknown>
    const statusData = await statusRes.json() as Record<string, unknown>

    const total = typeof statsData.num_dns_queries === 'number' ? statsData.num_dns_queries : 0
    const blocked = typeof statsData.num_blocked_filtering === 'number' ? statsData.num_blocked_filtering : 0
    const blocked_percent = total > 0 ? Math.round((blocked / total) * 1000) / 10 : 0

    return {
      total_queries: total,
      blocked_queries: blocked,
      blocked_percent,
      protection_enabled: statusData.protection_enabled === true,
    }
  } catch {
    return errResult
  }
}

async function setAdGuardProtection(url: string, username: string, password: string, enabled: boolean): Promise<boolean> {
  if (!url) return false
  const auth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
  const base = url.replace(/\/$/, '')
  try {
    const res = await fetch(`${base}/control/protection`, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Pi-hole helpers ──────────────────────────────────────────────────────────

const piholeSessionCache = new Map<string, { sid: string; expiresAt: number }>()

async function getPiholeSession(url: string, password: string, widgetId: string): Promise<string | null> {
  const cached = piholeSessionCache.get(widgetId)
  if (cached && cached.expiresAt > Date.now()) return cached.sid
  const base = url.replace(/\/$/, '')
  try {
    const res = await fetch(`${base}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (!res.ok) return null
    const data = await res.json() as { session?: { sid: string; validity: number } }
    const sid = data.session?.sid
    const validity = data.session?.validity ?? 1800
    if (!sid) return null
    piholeSessionCache.set(widgetId, { sid, expiresAt: Date.now() + (validity - 60) * 1000 })
    return sid
  } catch {
    return null
  }
}

interface PiholeStatsResult {
  total_queries: number
  blocked_queries: number
  blocked_percent: number
  protection_enabled: boolean
}

async function getPiholeStats(url: string, password: string, widgetId: string): Promise<PiholeStatsResult> {
  const err: PiholeStatsResult = { total_queries: -1, blocked_queries: -1, blocked_percent: -1, protection_enabled: false }
  if (!url) return err
  const sid = await getPiholeSession(url, password, widgetId)
  if (!sid) return err
  const base = url.replace(/\/$/, '')
  const headers = { 'X-FTL-SID': sid }
  try {
    const [summaryRes, blockRes] = await Promise.all([
      fetch(`${base}/api/stats/summary`, { headers }),
      fetch(`${base}/api/dns/blocking`, { headers }),
    ])
    if (!summaryRes.ok) { piholeSessionCache.delete(widgetId); return err }
    const summary = await summaryRes.json() as Record<string, unknown>
    const blocking = blockRes.ok ? await blockRes.json() as Record<string, unknown> : null
    const queries = summary.queries as Record<string, unknown> | undefined
    const total = typeof queries?.total === 'number' ? queries.total : 0
    const blocked = typeof queries?.blocked === 'number' ? queries.blocked : 0
    return {
      total_queries: total,
      blocked_queries: blocked,
      blocked_percent: total > 0 ? Math.round((blocked / total) * 1000) / 10 : 0,
      protection_enabled: blocking?.blocking === true,
    }
  } catch {
    return err
  }
}

async function togglePiholeProtection(url: string, password: string, widgetId: string, enabled: boolean): Promise<boolean> {
  const sid = await getPiholeSession(url, password, widgetId)
  if (!sid) return false
  const base = url.replace(/\/$/, '')
  try {
    const res = await fetch(`${base}/api/dns/blocking`, {
      method: 'POST',
      headers: { 'X-FTL-SID': sid, 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocking: enabled, timer: null }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Home Assistant helpers ────────────────────────────────────────────────────

interface HaEntity {
  entity_id: string
  label: string
  state: string
  unit: string | null
  device_class: string | null
  friendly_name: string | null
}

async function getHaStates(url: string, token: string, entities: { entity_id: string; label: string }[]): Promise<HaEntity[]> {
  if (!url || !token || entities.length === 0) return []
  const base = url.replace(/\/$/, '')
  const headers = { Authorization: `Bearer ${token}` }
  try {
    return await Promise.all(entities.map(async e => {
      const res = await fetch(`${base}/api/states/${e.entity_id}`, { headers })
      if (!res.ok) return { entity_id: e.entity_id, label: e.label, state: 'unavailable', unit: null, device_class: null, friendly_name: null }
      const data = await res.json() as { state: string; attributes: Record<string, unknown> }
      return {
        entity_id: e.entity_id,
        label: e.label,
        state: data.state,
        unit: (data.attributes.unit_of_measurement as string | undefined) ?? null,
        device_class: (data.attributes.device_class as string | undefined) ?? null,
        friendly_name: (data.attributes.friendly_name as string | undefined) ?? null,
      }
    }))
  } catch {
    return []
  }
}

async function toggleHaEntity(url: string, token: string, entityId: string, currentState: string): Promise<boolean> {
  const base = url.replace(/\/$/, '')
  const domain = entityId.split('.')[0]
  const service = currentState === 'on' ? 'turn_off' : 'turn_on'
  try {
    const res = await fetch(`${base}/api/services/${domain}/${service}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: entityId }),
    })
    return res.ok
  } catch {
    return false
  }
}


const POLLEN_SOURCE_URL = 'https://www.wetteronline.de/pollen/gelsenkirchen'

type PollenBurden = 'noburden' | 'weakburden' | 'moderateburden' | 'strongburden'

interface ParsedPollenValue {
  level: number | null
  text: string | null
}

const POLLEN_SPECIES = {
  hasel: 'haz',
  birke: 'bir',
  graeser: 'gra',
  pappel: 'pop',
} as const

function pollenBurdenToLevel(value: string | null): number | null {
  switch ((value ?? '').trim().toLowerCase()) {
    case 'noburden':
      return 0
    case 'weakburden':
      return 1
    case 'moderateburden':
      return 2
    case 'strongburden':
      return 3
    default:
      return null
  }
}

function pollenBurdenToText(value: string | null): string | null {
  switch ((value ?? '').trim().toLowerCase()) {
    case 'noburden':
      return 'kein'
    case 'weakburden':
      return 'schwach'
    case 'moderateburden':
      return 'mäßig'
    case 'strongburden':
      return 'stark'
    default:
      return null
  }
}

function extractWeatherOnlinePollenValue(html: string, code: string): ParsedPollenValue {
  const rowPattern = new RegExp(
    String.raw`id="${code}_text"[^>]*>[\s\S]*?<\/div>\s*<div class="[^"]*?polle_burden[^"]*?"[^>]*?data-day0="([^"]+)"`,
    'i',
  )
  const match = html.match(rowPattern)
  const burden = (match?.[1] ?? null) as PollenBurden | null
  return {
    level: pollenBurdenToLevel(burden),
    text: pollenBurdenToText(burden),
  }
}

async function getPollenStats(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch(POLLEN_SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Mardash/1.0)',
        'Accept-Language': 'de-DE,de;q=0.9',
      },
    })
    if (!res.ok) return { error: `Pollenquelle antwortet mit HTTP ${res.status}` }

    const html = await res.text()

    const haselRow = extractWeatherOnlinePollenValue(html, POLLEN_SPECIES.hasel)
    const birkeRow = extractWeatherOnlinePollenValue(html, POLLEN_SPECIES.birke)
    const graeserRow = extractWeatherOnlinePollenValue(html, POLLEN_SPECIES.graeser)
    const pappelRow = extractWeatherOnlinePollenValue(html, POLLEN_SPECIES.pappel)

    const levels = [haselRow.level, birkeRow.level, graeserRow.level, pappelRow.level].filter((v): v is number => typeof v === 'number')
    const maxLevel = levels.length > 0 ? Math.max(...levels) : null

    return {
      level: maxLevel,
      label: maxLevel === null ? 'Keine Daten' : 'Gelsenkirchen',
      source_region: 'Gelsenkirchen',
      updated_at: new Date().toISOString(),
      hasel: haselRow.level,
      hasel_text: haselRow.text,
      birke: birkeRow.level,
      birke_text: birkeRow.text,
      graeser: graeserRow.level,
      graeser_text: graeserRow.text,
      pappel: pappelRow.level,
      pappel_text: pappelRow.text,
      source_url: POLLEN_SOURCE_URL,
    }
  } catch (err) {
    return { error: (err as Error).message }
  }
}


// ── Routes ────────────────────────────────────────────────────────────────────
export async function widgetsRoutes(app: FastifyInstance) {
  const db = getDb()

  // GET /api/widgets — filtered by group visibility
  app.get('/api/widgets', async (req) => {
    const groupId = await callerGroupId(req)
    const all = db.prepare('SELECT * FROM widgets ORDER BY position, created_at').all() as WidgetRow[]
    if (groupId === null) return all.map(sanitize)
    const hidden = new Set(
      (db.prepare('SELECT widget_id FROM group_widget_visibility WHERE group_id = ?').all(groupId) as { widget_id: string }[])
        .map(r => r.widget_id)
    )
    // docker_overview widgets are only visible to groups with docker_widget_access
    const groupRow = db.prepare('SELECT docker_widget_access FROM user_groups WHERE id = ?').get(groupId) as { docker_widget_access: number } | undefined
    const canSeeDockerWidget = groupRow?.docker_widget_access === 1
    return all.filter(r => {
      if (hidden.has(r.id)) return false
      if (r.type === 'docker_overview' && !canSeeDockerWidget) return false
      return true
    }).map(sanitize)
  })

  // POST /api/widgets — create (admin only)
  app.post('/api/widgets', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { type, name, config = {}, show_in_topbar = false, display_location = 'none' } = req.body as CreateWidgetBody
    if (!['unraid_status', 'appdata_backup', 'weather', 'pollen', 'server_status'].includes(type)) {
      return reply.status(400).send({ error: 'Invalid widget type' })
    }
    if (!name?.trim()) return reply.status(400).send({ error: 'name is required' })
    const validLocations = ['topbar', 'sidebar', 'none']
    const resolvedLocation = validLocations.includes(display_location) ? display_location : (show_in_topbar ? 'topbar' : 'none')
    const maxRow = db.prepare('SELECT MAX(position) as m FROM widgets').get() as { m: number | null }
    const position = (maxRow.m ?? -1) + 1
    const id = nanoid()
    db.prepare(`
      INSERT INTO widgets (id, type, name, config, position, show_in_topbar, display_location)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, name.trim(), JSON.stringify(config), position, resolvedLocation === 'topbar' ? 1 : 0, resolvedLocation)
    const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as WidgetRow
    return reply.status(201).send(sanitize(row))
  })

  // PATCH /api/widgets/:id — update (admin only)
  app.patch('/api/widgets/:id', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as WidgetRow | undefined
    if (!row) return reply.status(404).send({ error: 'Not found' })
    const { name, config, show_in_topbar, display_location, position, icon_id } = req.body as PatchWidgetBody
    const validLocations = ['topbar', 'sidebar', 'none']
    const resolvedLocation = display_location !== undefined
      ? (validLocations.includes(display_location) ? display_location : 'none')
      : (show_in_topbar !== undefined ? (show_in_topbar ? 'topbar' : 'none') : undefined)

    // For adguard_home: if password is empty in the patch, merge with existing config to preserve it
    let configToStore: string | null = null
    if (config !== undefined) {
      if (row.type === 'adguard_home') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = safeJson(row.config, {} as any)
        const merged = { ...existing, ...config }
        if (!merged.password) merged.password = existing.password ?? ''
        configToStore = JSON.stringify(merged)
      } else if (row.type === 'home_assistant') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = safeJson(row.config, {} as any)
        const merged = { ...existing, ...config }
        if (!merged.token) merged.token = existing.token ?? ''
        configToStore = JSON.stringify(merged)
      } else if (row.type === 'pihole') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = safeJson(row.config, {} as any)
        const merged = { ...existing, ...config }
        if (!merged.password) merged.password = existing.password ?? ''
        configToStore = JSON.stringify(merged)
        piholeSessionCache.delete(id)
      } else if (row.type === 'nginx_pm') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = safeJson(row.config, {} as any)
        const merged = { ...existing, ...config }
        if (!merged.password) merged.password = existing.password ?? ''
        configToStore = JSON.stringify(merged)
      } else {
        configToStore = JSON.stringify(config)
      }
    }

    db.prepare(`
      UPDATE widgets SET
        name             = COALESCE(?, name),
        config           = COALESCE(?, config),
        show_in_topbar   = COALESCE(?, show_in_topbar),
        display_location = COALESCE(?, display_location),
        position         = COALESCE(?, position),
        updated_at       = datetime('now')
      WHERE id = ?
    `).run(
      name?.trim() ?? null,
      configToStore,
      resolvedLocation !== undefined ? (resolvedLocation === 'topbar' ? 1 : 0) : null,
      resolvedLocation ?? null,
      position ?? null,
      id
    )
    if (icon_id !== undefined) {
      db.prepare("UPDATE widgets SET icon_id = ?, icon_url = NULL, updated_at = datetime('now') WHERE id = ?")
        .run(icon_id ?? null, id)
    }
    const updated = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as WidgetRow
    return sanitize(updated)
  })

  // DELETE /api/widgets/:id — delete + cascade (admin only)
  app.delete('/api/widgets/:id', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as WidgetRow | undefined
    if (!row) return reply.status(404).send({ error: 'Not found' })
    // Delete icon file if present
    if (row.icon_url) {
      const filename = path.basename(row.icon_url)
      const filePath = path.join(DATA_DIR, 'icons', filename)
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    }
    db.prepare('DELETE FROM dashboard_items WHERE type = ? AND ref_id = ?').run('widget', id)
    db.prepare('DELETE FROM group_widget_visibility WHERE widget_id = ?').run(id)
    db.prepare('DELETE FROM widgets WHERE id = ?').run(id)
    return reply.status(204).send()
  })

  // GET /api/widgets/:id/stats — live stats, branched by widget type
  app.get('/api/widgets/:id/stats', async (req, reply) => {
    const { id } = req.params as { id: string }
    const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as WidgetRow | undefined
    if (!row) return reply.status(404).send({ error: 'Not found' })

    // Visibility check — return 404 to avoid leaking existence info
    const groupId = await callerGroupId(req)
    if (groupId !== null) {
      if (row.type === 'docker_overview') {
        const grp = db.prepare('SELECT docker_widget_access FROM user_groups WHERE id = ?').get(groupId) as { docker_widget_access: number } | undefined
        if (!grp || grp.docker_widget_access !== 1) return reply.status(404).send({ error: 'Not found' })
      } else {
        const hidden = db.prepare(
          'SELECT 1 FROM group_widget_visibility WHERE group_id = ? AND widget_id = ?'
        ).get(groupId, id)
        if (hidden) return reply.status(404).send({ error: 'Not found' })
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = safeJson(row.config, {} as any)

    if (row.type === 'adguard_home') {
      return getAdGuardStats(config.url ?? '', config.username ?? '', config.password ?? '')
    }

    if (row.type === 'docker_overview') {
      return {}
    }

    if (row.type === 'custom_button') {
      return {}
    }

    if (row.type === 'pihole') {
      return getPiholeStats(config.url ?? '', config.password ?? '', id)
    }

    if (row.type === 'home_assistant') {
      const entities: { entity_id: string; label: string }[] = Array.isArray(config.entities) ? config.entities : []
      return getHaStates(config.url ?? '', config.token ?? '', entities)
    }

    if (row.type === 'nginx_pm') {
      const { NginxPMClient } = await import('../clients/nginx-pm-client')
      const client = new NginxPMClient(config.url ?? '', config.username ?? '', config.password ?? '')
      try {
        return await client.getStats()
      } catch (err) {
        return { error: (err as Error).message }
      }
    }

    if (row.type === 'home_assistant_energy') {
      const instanceId = typeof config.instance_id === 'string' ? config.instance_id : ''
      const period = ['day', 'week', 'month'].includes(config.period as string) ? (config.period as string) : 'day'
      if (!instanceId) return { configured: false, error: 'No HA instance configured' }
      interface HaRow { id: string; url: string; token: string; enabled: number }
      const haRow = db.prepare('SELECT id, url, token, enabled FROM ha_instances WHERE id = ?').get(instanceId) as HaRow | undefined
      if (!haRow || !haRow.enabled) return { configured: false, error: 'HA instance not found or disabled' }
      const { getHaWsClient } = await import('../clients/ha-ws-manager')
      const { fetchEnergyData } = await import('./ha')
      const client = getHaWsClient(haRow.id, haRow.url, haRow.token)
      try {
        const data = await fetchEnergyData(client, period)
        const periodLabel = period === 'day' ? 'Today' : period === 'week' ? 'This week' : 'This month'
        return { ...data, period_label: periodLabel }
      } catch (err) {
        return { configured: false, error: (err as Error).message }
      }
    }

    if (row.type === 'calendar') {
      const instanceIds: string[] = Array.isArray(config.instance_ids) ? config.instance_ids : []
      const daysAhead: number = typeof config.days_ahead === 'number' ? config.days_ahead : 14
      if (instanceIds.length === 0) return []
      const callerGroup = await callerGroupId(req)
      const { fetchCombinedCalendar } = await import('./arr')
      return await fetchCombinedCalendar(instanceIds, callerGroup, daysAhead)
    }

    if (row.type === 'appdata_backup') {
      const source = db.prepare(
        "SELECT * FROM backup_sources WHERE enabled = 1 AND type = 'ca_backup' ORDER BY created_at LIMIT 1"
      ).get() as { config: string } | undefined

      if (!source) {
        return {
          status: 'error',
          label: 'Nicht eingerichtet',
          sourceFound: false,
          lastRun: null,
          error: 'Keine CA-Backup-Quelle konfiguriert',
        }
      }

      const unraid = db.prepare(
        "SELECT url, api_key FROM unraid_instances WHERE enabled = 1 ORDER BY position, created_at LIMIT 1"
      ).get() as { url: string; api_key: string } | undefined

      const { checkCaBackup } = await import('./backup')
      const baseConfig = safeJson(source.config, {} as Record<string, unknown>)
      const backupConfig = unraid
        ? { ...baseConfig, url: unraid.url, api_key: unraid.api_key }
        : baseConfig
      const result = await checkCaBackup(backupConfig)

      return {
        status: result.error ? 'error' : result.success === false ? 'warning' : result.success === true ? 'ok' : 'warning',
        label: result.error ? 'Fehler' : result.success === true ? 'OK' : result.success === false ? 'Warnung' : 'Pruefen',
        sourceFound: true,
        lastRun: result.lastRun,
        error: result.error,
      }
    }

    if (row.type === 'pollen') {
      return await getPollenStats()
    }

    if (row.type === 'weather') {
      const lat = typeof config.lat === 'number' ? config.lat : parseFloat(String(config.lat ?? ''))
      const lon = typeof config.lon === 'number' ? config.lon : parseFloat(String(config.lon ?? ''))
      if (isNaN(lat) || isNaN(lon)) return { error: 'Invalid coordinates configured' }
      try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&minutely_15=precipitation&forecast_minutely_15=8&timezone=auto`
        const res = await fetch(weatherUrl)
        if (!res.ok) return { error: `Weather API error ${res.status}` }
        const data = await res.json() as {
          current: {
            temperature_2m: number
            apparent_temperature: number
            relative_humidity_2m: number
            precipitation: number
            weather_code: number
            wind_speed_10m: number
            time: string
          }
          current_units: { temperature_2m: string }
          minutely_15?: {
            time: string[]
            precipitation: number[]
          }
        }

        let rain_text = 'Kein Regen in Sicht'
        const upcoming = data.minutely_15?.precipitation ?? []
        const idx = upcoming.findIndex(v => typeof v === 'number' && v > 0.1)
        if (idx >= 0) {
          const minutes = idx * 15
          rain_text = minutes <= 0 ? 'Regen jetzt' : `Regen in ${minutes} Min`
        }

        return {
          temperature: data.current.temperature_2m,
          apparent_temperature: data.current.apparent_temperature,
          humidity: data.current.relative_humidity_2m,
          precipitation: data.current.precipitation,
          weather_code: data.current.weather_code,
          wind_speed: data.current.wind_speed_10m,
          unit: data.current_units.temperature_2m,
          timestamp: data.current.time,
          rain_text,
        }
      } catch (err) {
        return { error: (err as Error).message }
      }
    }

    if (row.type === 'unraid_status' || row.type === 'server_status') {
      const disks: DiskConfig[] = Array.isArray(config.disks) ? config.disks : []
      const [cpu, ram, diskStats] = await Promise.all([
        getCpuLoad(),
        getRam(),
        getDiskStats(disks),
      ])
      return { cpu: { load: cpu }, ram, disks: diskStats }
    }

    return {}
  })

  // POST /api/widgets/:id/icon — upload icon image (base64 JSON, admin only)
  app.post('/api/widgets/:id/icon', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as WidgetRow | undefined
    if (!row) return reply.status(404).send({ error: 'Not found' })

    const { data, content_type } = req.body as { data: string; content_type: string }
    if (!data || !content_type) return reply.status(400).send({ error: 'data and content_type are required' })

    const extMap: Record<string, string> = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg' }
    const ext = extMap[content_type]
    if (!ext) return reply.status(415).send({ error: 'Unsupported image type (PNG, JPG, SVG only)' })

    const buffer = Buffer.from(data, 'base64')
    if (buffer.length > 512 * 1024) return reply.status(413).send({ error: 'Image too large (max 512 KB)' })

    const iconsDir = path.join(DATA_DIR, 'icons')
    fs.mkdirSync(iconsDir, { recursive: true })

    // Delete old icon if present
    if (row.icon_url) {
      const oldPath = path.join(iconsDir, path.basename(row.icon_url))
      if (fs.existsSync(oldPath)) { try { fs.unlinkSync(oldPath) } catch { /* ignore */ } }
    }

    const filename = `widget_${id}.${ext}`
    fs.writeFileSync(path.join(iconsDir, filename), buffer)
    const icon_url = `/icons/${filename}`
    db.prepare("UPDATE widgets SET icon_url = ?, updated_at = datetime('now') WHERE id = ?").run(icon_url, id)
    return { icon_url }
  })

  // POST /api/widgets/:id/adguard/protection — toggle AdGuard protection (admin only)
  app.post('/api/widgets/:id/adguard/protection', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as WidgetRow | undefined
    if (!row) return reply.status(404).send({ error: 'Not found' })
    if (row.type !== 'adguard_home') return reply.status(400).send({ error: 'Not an AdGuard Home widget' })

    const { enabled } = req.body as AdGuardProtectionBody
    if (typeof enabled !== 'boolean') return reply.status(400).send({ error: 'enabled must be boolean' })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = safeJson(row.config, {} as any)
    const ok = await setAdGuardProtection(config.url ?? '', config.username ?? '', config.password ?? '', enabled)
    if (!ok) return reply.status(502).send({ error: 'Failed to reach AdGuard Home' })
    return { ok: true }
  })

  // POST /api/widgets/:id/trigger — fire a custom button webhook (authenticated)
  app.post('/api/widgets/:id/trigger', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { button_id } = req.body as { button_id: string }
    const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as WidgetRow | undefined
    if (!row || row.type !== 'custom_button') return reply.status(404).send({ error: 'Not found' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = safeJson(row.config, {} as any)
    const buttons: { id: string; label: string; url: string; method?: string }[] = Array.isArray(config.buttons) ? config.buttons : []
    const button = buttons.find(b => b.id === button_id)
    if (!button) return reply.status(404).send({ error: 'Button not found' })
    try {
      const res = await fetch(button.url, { method: button.method ?? 'GET' })
      return { ok: true, status: res.status }
    } catch (e: unknown) {
      const detail = e instanceof Error ? e.message : 'Unknown error'
      app.log.error({ detail, url: req.url, method: req.method }, 'Upstream error')
      return reply.status(502).send({ error: 'Upstream error', detail })
    }
  })

  // POST /api/widgets/:id/ha/toggle — toggle a HA entity (authenticated)
  interface HaToggleBody { entity_id: string; current_state: string }
  app.post('/api/widgets/:id/ha/toggle', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { entity_id, current_state } = req.body as HaToggleBody
    const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as WidgetRow | undefined
    if (!row || row.type !== 'home_assistant') return reply.status(404).send({ error: 'Not found' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = safeJson(row.config, {} as any)
    const ok = await toggleHaEntity(config.url ?? '', config.token ?? '', entity_id, current_state)
    if (!ok) return reply.status(502).send({ error: 'Failed to reach Home Assistant' })
    return { ok: true }
  })

  // POST /api/widgets/:id/pihole/protection — toggle Pi-hole protection (admin only)
  interface PiholeProtectionBody { enabled: boolean }
  app.post('/api/widgets/:id/pihole/protection', { preHandler: [app.requireAdmin] }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const { enabled } = req.body as PiholeProtectionBody
    if (typeof enabled !== 'boolean') return reply.status(400).send({ error: 'enabled must be boolean' })
    const row = db.prepare('SELECT * FROM widgets WHERE id = ?').get(id) as WidgetRow | undefined
    if (!row || row.type !== 'pihole') return reply.status(404).send({ error: 'Not found' })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = safeJson(row.config, {} as any)
    const ok = await togglePiholeProtection(config.url ?? '', config.password ?? '', id, enabled)
    if (!ok) return reply.status(502).send({ error: 'Failed to reach Pi-hole' })
    return { ok: true }
  })
}
