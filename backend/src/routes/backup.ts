import { FastifyInstance } from 'fastify'
import { nanoid } from 'nanoid'
import { promises as fsp } from 'fs'
import fs from 'fs'
import path from 'path'
import { getDb, safeJson } from '../db/database'
import { Agent, request as undiciRequest } from 'undici'

interface BackupSourceRow {
  id: string
  name: string
  type: string
  config: string
  enabled: number
  last_checked_at: string | null
  last_status: string | null
  created_at: string
}

interface CreateBackupSourceBody {
  name: string
  type: string
  config?: Record<string, unknown>
  enabled?: boolean
}

interface PatchBackupSourceBody {
  name?: string
  type?: string
  config?: Record<string, unknown>
  enabled?: boolean
}

function sanitizeSource(row: BackupSourceRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    config: safeJson<Record<string, unknown>>(row.config, {} as Record<string, unknown>),
    enabled: row.enabled === 1,
    last_checked_at: row.last_checked_at,
    last_status: row.last_status,
    created_at: row.created_at,
  }
}

const httpAgent = new Agent({
  headersTimeout: 5_000,
  bodyTimeout: 5_000,
  connect: { rejectUnauthorized: false },
})

async function readUnraidLog(url: string, apiKey: string, logPath: string): Promise<string | null> {
  const baseUrl = `${url.replace(/\/$/, '')}/graphql`

  const gql = async (query: string, variables?: Record<string, unknown>) => {
    const res = await undiciRequest(baseUrl, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
      dispatcher: httpAgent,
    })

    const body = await res.body.json() as {
      data?: Record<string, unknown>
      errors?: Array<{ message?: string }>
    }

    if (Array.isArray(body.errors) && body.errors.length > 0) return null
    return body.data ?? null
  }

  const readPath = async (candidatePath: string): Promise<string | null> => {
    const data = await gql(
      `query($path: String!, $lines: Int) {
        logFile(path: $path, lines: $lines) { path content totalLines startLine }
      }`,
      { path: candidatePath, lines: 400 }
    ) as { logFile?: { content?: string | null } } | null

    const content = data?.logFile?.content
    return typeof content === 'string' && content.trim() ? content : null
  }

  const direct = await readPath(logPath)
  if (direct) return direct

  const filesData = await gql(
    `query {
      logFiles { name path size modifiedAt }
    }`
  ) as { logFiles?: Array<{ name?: string | null; path?: string | null; modifiedAt?: string | null }> } | null

  const files = Array.isArray(filesData?.logFiles) ? filesData!.logFiles! : []
  if (files.length === 0) return null

  const requestedBase = path.posix.basename(logPath).toLowerCase()
  const requestedFull = logPath.toLowerCase()

  const score = (name: string, p: string): number => {
    const n = name.toLowerCase()
    const lp = p.toLowerCase()

    if (lp === requestedFull) return 1000
    if (n === requestedBase) return 900

    let s = 0
    if (n.includes('ca_backup')) s += 400
    if (n == 'backup.log') s += 350
    if (n.includes('backup')) s += 250
    if (n.includes('appdata')) s += 200
    if (lp.includes('backup')) s += 120
    if (lp.includes('appdata')) s += 80
    if (n.endsWith('.log')) s += 20
    return s
  }

  const candidates = files
    .filter(f => typeof f.path === 'string' && f.path.trim())
    .map(f => ({
      name: typeof f.name === 'string' ? f.name : '',
      path: f.path as string,
      modifiedAt: typeof f.modifiedAt === 'string' ? f.modifiedAt : '',
      score: score(typeof f.name === 'string' ? f.name : '', f.path as string),
    }))
    .filter(f => f.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return String(b.modifiedAt).localeCompare(String(a.modifiedAt))
    })

  for (const candidate of candidates) {
    const content = await readPath(candidate.path)
    if (content) return content
  }

  return null
}

export async function checkCaBackup(config: Record<string, unknown>): Promise<{
  lastRun: string | null; success: boolean | null; size: string | null; error: string | null; details?: unknown
}> {
  const configuredPath = (config.logPath as string | undefined) || '/mnt/user/logs/status'

  const statusDirs = Array.from(new Set([
    configuredPath.endsWith('.log') ? path.posix.join(path.posix.dirname(configuredPath), 'status') : configuredPath,
    '/mnt/user/logs/status',
  ].filter(Boolean)))

  const markerRegex = /^(\d{8})_(gut|warnung|fehler)\.log$/i

  for (const dir of statusDirs) {
    try {
      const entries = await fsp.readdir(dir, { withFileTypes: true })
      const markers = entries
        .filter(e => e.isFile() && markerRegex.test(e.name))
        .map(e => {
          const m = e.name.match(markerRegex)!
          return {
            name: e.name,
            date: m[1],
            status: m[2].toLowerCase(),
            fullPath: path.posix.join(dir, e.name),
          }
        })
        .sort((a, b) => b.date.localeCompare(a.date) || b.name.localeCompare(a.name))

      if (markers.length > 0) {
        const latest = markers[0]
        const yyyy = latest.date.slice(0, 4)
        const mm = latest.date.slice(4, 6)
        const dd = latest.date.slice(6, 8)

        return {
          lastRun: `${dd}.${mm}.${yyyy}`,
          success: latest.status === 'gut',
          size: null,
          error: latest.status === 'fehler' ? 'Status-Marker meldet Fehler' : null,
          details: {
            path: latest.fullPath,
            source: 'status_marker',
            marker: latest.name,
          },
        }
      }
    } catch {
      // next dir
    }
  }

  return {
    lastRun: null,
    success: null,
    size: null,
    error: `Kein Status-Marker gefunden — geprüft: ${statusDirs.join(', ')}`,
  }
}

async function checkDuplicati(config: Record<string, unknown>): Promise<{
  lastRun: string | null; success: boolean | null; size: string | null; error: string | null; details?: unknown
}> {
  const url = (config.url as string | undefined) || ''
  const apiKey = (config.apiKey as string | undefined) || ''
  if (!url) return { lastRun: null, success: null, size: null, error: 'URL nicht konfiguriert' }
  try {
    const res = await undiciRequest(`${url.replace(/\/$/, '')}/api/v1/backups`, {
      method: 'GET',
      headers: { 'X-Api-Key': apiKey },
      dispatcher: httpAgent,
    })
    const body = await res.body.json() as unknown[]
    const backups = Array.isArray(body) ? body : []
    let lastRun: string | null = null
    let success: boolean | null = null
    for (const b of backups as Array<Record<string, unknown>>) {
      const lastResult = b.Backup as Record<string, unknown> | undefined
      if (lastResult?.LastBackupDate) lastRun = String(lastResult.LastBackupDate)
      if (lastResult?.LastBackupStarted) success = true
    }
    return { lastRun, success, size: null, error: null, details: backups }
  } catch {
    return { lastRun: null, success: null, size: null, error: 'Nicht erreichbar' }
  }
}

async function checkKopia(config: Record<string, unknown>): Promise<{
  lastRun: string | null; success: boolean | null; size: string | null; error: string | null; details?: unknown
}> {
  const url = (config.url as string | undefined) || ''
  const user = (config.user as string | undefined) || 'kopia'
  const pass = (config.pass as string | undefined) || ''
  if (!url) return { lastRun: null, success: null, size: null, error: 'URL nicht konfiguriert' }
  try {
    const auth = Buffer.from(`${user}:${pass}`).toString('base64')
    const res = await undiciRequest(`${url.replace(/\/$/, '')}/api/v1/snapshots`, {
      method: 'GET',
      headers: { 'Authorization': `Basic ${auth}` },
      dispatcher: httpAgent,
    })
    const body = await res.body.json() as Record<string, unknown>
    const snapshots = (body.snapshots ?? []) as Array<Record<string, unknown>>
    const last = snapshots[0]
    const lastRun = last?.startTime ? String(last.startTime) : null
    const statsObj = last?.stats as Record<string, unknown> | undefined
    const size = statsObj ? String(statsObj.totalSize ?? '') : null
    return { lastRun, success: snapshots.length > 0, size, error: null, details: snapshots.slice(0, 3) }
  } catch {
    return { lastRun: null, success: null, size: null, error: 'Nicht erreichbar' }
  }
}

export async function backupRoutes(app: FastifyInstance) {
  // GET /api/backup/sources
  app.get('/api/backup/sources', { onRequest: [app.authenticate] }, async () => {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM backup_sources ORDER BY created_at').all() as BackupSourceRow[]
    return rows.map(sanitizeSource)
  })

  // POST /api/backup/sources
  app.post<{ Body: CreateBackupSourceBody }>(
    '/api/backup/sources',
    { onRequest: [app.requireAdmin] },
    async (req, reply) => {
      const { name, type, config = {}, enabled = true } = req.body
      if (!name || !type) return reply.status(400).send({ error: 'name and type required' })
      const db = getDb()
      const id = nanoid()
      db.prepare(
        'INSERT INTO backup_sources (id, name, type, config, enabled) VALUES (?, ?, ?, ?, ?)'
      ).run(id, name, type, JSON.stringify(config), enabled ? 1 : 0)
      const row = db.prepare('SELECT * FROM backup_sources WHERE id = ?').get(id) as BackupSourceRow
      return sanitizeSource(row)
    }
  )

  // PATCH /api/backup/sources/:id
  app.patch<{ Params: { id: string }; Body: PatchBackupSourceBody }>(
    '/api/backup/sources/:id',
    { onRequest: [app.requireAdmin] },
    async (req, reply) => {
      const db = getDb()
      const row = db.prepare('SELECT * FROM backup_sources WHERE id = ?').get(req.params.id) as BackupSourceRow | undefined
      if (!row) return reply.status(404).send({ error: 'Not found' })
      const b = req.body
      const newConfig = b.config !== undefined ? JSON.stringify(b.config) : row.config
      db.prepare(`
        UPDATE backup_sources SET name = ?, type = ?, config = ?, enabled = ? WHERE id = ?
      `).run(
        b.name ?? row.name,
        b.type ?? row.type,
        newConfig,
        b.enabled !== undefined ? (b.enabled ? 1 : 0) : row.enabled,
        req.params.id
      )
      const updated = db.prepare('SELECT * FROM backup_sources WHERE id = ?').get(req.params.id) as BackupSourceRow
      return sanitizeSource(updated)
    }
  )

  // DELETE /api/backup/sources/:id
  app.delete<{ Params: { id: string } }>(
    '/api/backup/sources/:id',
    { onRequest: [app.requireAdmin] },
    async (req, reply) => {
      const db = getDb()
      if (!db.prepare('SELECT id FROM backup_sources WHERE id = ?').get(req.params.id)) {
        return reply.status(404).send({ error: 'Not found' })
      }
      db.prepare('DELETE FROM backup_sources WHERE id = ?').run(req.params.id)
      return reply.status(204).send()
    }
  )

  // GET /api/backup/status
  app.get('/api/backup/status', { onRequest: [app.authenticate] }, async () => {
    const db = getDb()
    const sources = db.prepare(
      'SELECT * FROM backup_sources WHERE enabled = 1 ORDER BY created_at'
    ).all() as BackupSourceRow[]

    const results = await Promise.all(sources.map(async source => {
      const config = safeJson<Record<string, unknown>>(source.config, {} as Record<string, unknown>)
      let result: { lastRun: string | null; success: boolean | null; size: string | null; error: string | null; details?: unknown }

      if (source.type === 'ca_backup') {
        const unraid = db.prepare(
          "SELECT url, api_key FROM unraid_instances WHERE enabled = 1 ORDER BY position, created_at LIMIT 1"
        ).get() as { url: string; api_key: string } | undefined
        const effectiveConfig = unraid
          ? { ...config, url: unraid.url, api_key: unraid.api_key }
          : config
        result = await checkCaBackup(effectiveConfig)
      } else if (source.type === 'duplicati') {
        result = await checkDuplicati(config)
      } else if (source.type === 'kopia') {
        result = await checkKopia(config)
      } else if (source.type === 'docker') {
        result = { lastRun: null, success: true, size: null, error: null, details: { note: 'Docker via Socket verfügbar' } }
      } else if (source.type === 'vm') {
        const backupPath = (config.backupPath as string | undefined) || ''
        if (!backupPath) {
          result = { lastRun: null, success: null, size: null, error: 'Kein Backup-Pfad konfiguriert' }
        } else {
          try {
            const files = await fsp.readdir(backupPath)
            const relevant = files.filter(f => f.endsWith('.xml') || f.endsWith('.img'))
            if (relevant.length === 0) {
              result = { lastRun: null, success: null, size: null, error: 'Keine VM-Backups gefunden', details: { path: backupPath } }
            } else {
              const stats = await Promise.all(relevant.map(async f => {
                const stat = await fsp.stat(path.join(backupPath, f))
                return { file: f, mtime: stat.mtime.toISOString() }
              }))
              stats.sort((a, b) => b.mtime.localeCompare(a.mtime))
              result = { lastRun: stats[0]?.mtime ?? null, success: true, size: null, error: null, details: stats.slice(0, 10) }
            }
          } catch {
            result = { lastRun: null, success: null, size: null, error: `Pfad nicht gefunden: ${backupPath}` }
          }
        }
      } else {
        result = { lastRun: null, success: null, size: null, error: 'Unbekannter Backup-Typ' }
      }

      const newStatus = result.error ? 'error' : result.success === false ? 'warning' : result.success === true ? 'ok' : null
      db.prepare("UPDATE backup_sources SET last_checked_at = datetime('now'), last_status = ? WHERE id = ?")
        .run(newStatus, source.id)

      return {
        id: source.id,
        name: source.name,
        type: source.type,
        ...result,
      }
    }))

    return { sources: results }
  })

  // POST /api/backup/docker/export
  app.post(
    '/api/backup/docker/export',
    { onRequest: [app.authenticate] },
    async (_req, reply) => {
      const DOCKER_SOCKET = '/var/run/docker.sock'
      if (!fs.existsSync(DOCKER_SOCKET)) {
        return reply.status(503).send({ error: 'Docker socket nicht verfügbar' })
      }
      const { Pool } = await import('undici')
      const dockerPool = new Pool('http://localhost', {
        socketPath: DOCKER_SOCKET,
        connections: 2,
      })
      try {
        const listRes = await dockerPool.request({ method: 'GET', path: '/v1.41/containers/json?all=true' })
        const containers = await listRes.body.json() as Array<Record<string, unknown>>
        const inspects = await Promise.all(containers.map(async c => {
          const id = c.Id as string
          const inspectRes = await dockerPool.request({ method: 'GET', path: `/v1.41/containers/${id}/json` })
          return inspectRes.body.json() as Promise<Record<string, unknown>>
        }))
        const exportData = {
          exported_at: new Date().toISOString(),
          container_count: inspects.length,
          containers: inspects,
        }
        const now = new Date().toISOString().split('T')[0]
        reply.header('Content-Type', 'application/json')
        reply.header('Content-Disposition', `attachment; filename="mardash-docker-export-${now}.json"`)
        return exportData
      } finally {
        await dockerPool.destroy()
      }
    }
  )
}

export async function checkAllBackupSources(): Promise<void> {
  const db = getDb()
  const sources = db.prepare('SELECT * FROM backup_sources WHERE enabled = 1').all() as BackupSourceRow[]
  for (const source of sources) {
    try {
      const config = safeJson<Record<string, unknown>>(source.config, {} as Record<string, unknown>)
      let status: string | null = null
      if (source.type === 'ca_backup') {
        const unraid = db.prepare(
          "SELECT url, api_key FROM unraid_instances WHERE enabled = 1 ORDER BY position, created_at LIMIT 1"
        ).get() as { url: string; api_key: string } | undefined
        const effectiveConfig = unraid
          ? { ...config, url: unraid.url, api_key: unraid.api_key }
          : config
        const r = await checkCaBackup(effectiveConfig)
        status = r.error ? 'error' : r.success === false ? 'warning' : r.success === true ? 'ok' : null
      } else if (source.type === 'duplicati') {
        const r = await checkDuplicati(config)
        status = r.error ? 'error' : r.success === true ? 'ok' : 'warning'
      } else if (source.type === 'kopia') {
        const r = await checkKopia(config)
        status = r.error ? 'error' : r.success === true ? 'ok' : 'warning'
      }
      if (status) {
        db.prepare("UPDATE backup_sources SET last_checked_at = datetime('now'), last_status = ? WHERE id = ?")
          .run(status, source.id)
      }
    } catch { /* ignore per-source errors */ }
  }
}
