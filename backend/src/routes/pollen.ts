import type { FastifyInstance } from 'fastify'

type Level = 'low' | 'medium' | 'high' | 'unknown'

type PollenResponse = {
  hasel: number | null
  birke: number | null
  graeser: number | null
  level: Level
  label: string
  source_region: string | null
  updated_at: string | null
  error?: string
}

const POLLEN_URL = 'https://www.wetteronline.de/pollen/gelsenkirchen'
const CACHE_MS = 6 * 60 * 60 * 1000

let cache: { ts: number; data: PollenResponse } | null = null

function mapWordToValue(word: string | null): number | null {
  if (!word) return null
  const w = word.trim().toLowerCase()

  if (w in {'keine': 0, 'nicht': 0}) return 0
  if (w in {'schwach': 1, 'gering': 1, 'niedrig': 1}) return 1
  if (w in {'mäßig': 2, 'maessig': 2, 'mittel': 2}) return 2
  if (w in {'stark': 3, 'hoch': 3}) return 3
  if (w in {'sehr stark': 4, 'sehrhoch': 4, 'extrem': 4}) return 4

  return null
}

function levelFromValue(v: number | null): Level {
  if (v === null) return 'unknown'
  if (v >= 3) return 'high'
  if (v >= 1.5) return 'medium'
  return 'low'
}

function labelFromValues(hasel: number | null, birke: number | null, graeser: number | null): { level: Level; label: string } {
  const entries = [
    { key: 'Hasel', value: hasel },
    { key: 'Birke', value: birke },
    { key: 'Gräser', value: graeser },
  ]
  const ranked = entries
    .filter(e => e.value !== null)
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1))

  if (ranked.length === 0) return { level: 'unknown', label: 'Unklar' }

  const top = ranked[0]
  const second = ranked[1] ?? null
  const level = levelFromValue(top.value)

  if (level === 'high') {
    return second && second.value !== null && second.value >= 1.5
      ? { level, label: `${top.key} hoch, ${second.key} mittel` }
      : { level, label: `${top.key} hoch` }
  }

  if (level === 'medium') {
    return second && second.value !== null && second.value >= 1.5
      ? { level, label: `${top.key} mittel, ${second.key} mittel` }
      : { level, label: `${top.key} mittel` }
  }

  return { level, label: 'keine starke Belastung' }
}

function extractLevel(html: string, pollenName: string): number | null {
  const name = pollenName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const patterns = [
    new RegExp(name + '[\\s\\S]{0,220}?(keine|nicht|schwach|gering|niedrig|mäßig|maessig|mittel|stark|hoch|sehr stark|extrem)', 'i'),
    new RegExp('(keine|nicht|schwach|gering|niedrig|mäßig|maessig|mittel|stark|hoch|sehr stark|extrem)[\\s\\S]{0,120}?' + name, 'i'),
  ]

  for (const pattern of patterns) {
    const m = html.match(pattern)
    if (m) {
      const val = mapWordToValue(m[1] ?? null)
      if (val !== null) return val
    }
  }

  return null
}

async function loadPollen(): Promise<PollenResponse> {
  if (cache && (Date.now() - cache.ts) < CACHE_MS) return cache.data

  const res = await fetch(POLLEN_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari/537.36',
      'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
    },
  })

  if (!res.ok) {
    throw new Error(`WetterOnline error ${res.status}`)
  }

  const html = await res.text()

  const hasel = extractLevel(html, 'Hasel')
  const birke = extractLevel(html, 'Birke')
  const graeser = extractLevel(html, 'Gräser') ?? extractLevel(html, 'Graeser')

  const meta = labelFromValues(hasel, birke, graeser)

  const data: PollenResponse = {
    hasel,
    birke,
    graeser,
    level: meta.level,
    label: meta.label,
    source_region: 'Gelsenkirchen',
    updated_at: new Date().toISOString(),
  }

  cache = { ts: Date.now(), data }
  return data
}

export async function pollenRoutes(app: FastifyInstance) {
  app.get('/api/pollen/topbar', async (_req, reply) => {
    try {
      return await loadPollen()
    } catch (err) {
      return reply.status(500).send({
        hasel: null,
        birke: null,
        graeser: null,
        level: 'unknown',
        label: 'Unklar',
        source_region: 'Gelsenkirchen',
        updated_at: null,
        error: (err as Error).message,
      })
    }
  })
}
