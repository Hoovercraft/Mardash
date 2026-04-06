import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '../store/useLanguageStore'
import { useStore } from '../store/useStore'
import { useWidgetStore } from '../store/useWidgetStore'
import { useDockerStore } from '../store/useDockerStore'
import { useUnraidStore } from '../store/useUnraidStore'
import { api } from '../api'
import type { ServerStats, AdGuardStats, HaEntityState, NpmStats, CalendarEntry, WeatherStats, WeatherWidgetConfig, PollenTopbarStats } from '../types'
import { containerCounts } from '../utils'

const WEATHER_ICONS: Record<number, string> = {
  0: '☀️',
  1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️',
  56: '🌧️', 57: '🌧️',
  61: '🌦️', 63: '🌧️', 65: '🌧️',
  66: '🌧️', 67: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌧️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

interface Props {
  page: string
  onNavigate?: (page: string) => void
  onAddService?: () => void
  onAddWidget?: () => void
  onCheckAll?: () => void
  checking?: boolean
}

export function Topbar({ page: _page, onNavigate }: Props) {
  const { t } = useTranslation('common')
  const { language } = useLanguageStore()
  const dateLocale = language === 'de' ? 'de-DE' : 'en-US'
  const { settings } = useStore()
  const { widgets, stats, loadWidgets, loadStats, startPolling, stopPolling } = useWidgetStore()
  const { containers, loadContainers } = useDockerStore()
  const { instances: unraidInstances, online: unraidOnline, loadInstances: loadUnraidInstances, pingAll: pingAllUnraid } = useUnraidStore()

  const [serverOffset, setServerOffset] = React.useState(0)
  const [now, setNow] = React.useState(() => new Date())

  void settings
  void _page

  const topbarWidgets = widgets.filter(w => w.display_location === 'topbar')
  const hasDockerTopbar = topbarWidgets.some(w => w.type === 'docker_overview')
  const statsWidgetKey = topbarWidgets
    .filter(w => w.type !== 'docker_overview')
    .map(w => w.id)
    .join(',')

  useEffect(() => {
    api.serverTime().then(({ iso }) => {
      setServerOffset(new Date(iso).getTime() - Date.now())
    }).catch(() => {})
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const serverNow = new Date(now.getTime() + serverOffset)

  useEffect(() => {
    loadWidgets().catch(() => {})
  }, [loadWidgets])

  useEffect(() => {
    if (!statsWidgetKey) return
    const pollable = topbarWidgets.filter(w => w.type !== 'docker_overview' && w.type !== 'custom_button')
    pollable.forEach(w => {
      loadStats(w.id).catch(() => {})
      startPolling(w.id, w.type)
    })
    return () => {
      pollable.forEach(w => stopPolling(w.id))
    }
  }, [statsWidgetKey, topbarWidgets, loadStats, startPolling, stopPolling])

  useEffect(() => {
    loadUnraidInstances().catch(() => {})
  }, [loadUnraidInstances])

  useEffect(() => {
    if (unraidInstances.length === 0) return
    pingAllUnraid().catch(() => {})
    const interval = setInterval(() => pingAllUnraid().catch(() => {}), 30000)
    return () => clearInterval(interval)
  }, [unraidInstances, pingAllUnraid])

  const openControlCenterTab = (tab: 'apps' | 'dashboard' | 'integrationen' | 'widgets' | 'topbar' | 'appdata_backup' | 'design') => {
    localStorage.setItem('mardash.controlcenter.tab', tab)
    onNavigate?.('control_center')
  }

  const [appdataBackup, setAppdataBackup] = React.useState<null | { status: 'ok' | 'warning' | 'error'; label: string }>(null)
  const [pollen, setPollen] = React.useState<PollenTopbarStats | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.appdataBackup.status()
        setAppdataBackup({ status: res.status, label: res.label })
      } catch {
        setAppdataBackup({ status: 'warning', label: 'Unklar' })
      }
    }
    load().catch(() => {})
    const interval = setInterval(() => { load().catch(() => {}) }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.pollen.status()
        setPollen(res)
      } catch (e) {
        setPollen({
          hasel: null,
          birke: null,
          graeser: null,
          level: 'unknown',
          label: 'Unklar',
          source_region: null,
          updated_at: null,
          error: e instanceof Error ? e.message : 'Fehler',
        })
      }
    }
    load().catch(() => {})
    const interval = setInterval(() => { load().catch(() => {}) }, 3600000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!hasDockerTopbar) return
    loadContainers().catch(() => {})
    const interval = setInterval(() => loadContainers().catch(() => {}), 30000)
    return () => clearInterval(interval)
  }, [hasDockerTopbar, loadContainers])

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span>{serverNow.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        <span style={{ marginLeft: 10, fontVariantNumeric: 'tabular-nums' }}>
          {serverNow.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>

      <div className="topbar-center">
        {(() => {
          const enabledUnraid = unraidInstances.filter(i => i.enabled)
          const anyConfigured = enabledUnraid.length > 0
          const anyOnline = enabledUnraid.some(i => unraidOnline[i.id] === true)
          const anyKnown = enabledUnraid.some(i => i.id in unraidOnline)

          const tone = !anyConfigured
            ? { color: '#f59e0b', label: 'Unraid: Nicht eingerichtet' }
            : anyOnline
              ? { color: 'var(--status-online)', label: 'Unraid: Online' }
              : anyKnown
                ? { color: 'var(--status-offline)', label: 'Unraid: Offline' }
                : { color: '#f59e0b', label: 'Unraid: Unklar' }

          return (
            <button
              className="btn btn-ghost"
              onClick={() => onNavigate?.('unraid')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 12px',
                background: 'var(--glass-bg)',
                flexShrink: 0,
              }}
              title="Zur Unraid-Seite"
            >
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>Unraid</span>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: tone.color,
                  boxShadow: `0 0 8px ${tone.color}`,
                  display: 'inline-block',
                }}
              />
            </button>
          )
        })()}

        {(() => {
          const tone = !appdataBackup
            ? { color: '#f59e0b', label: 'Backup: Unklar' }
            : appdataBackup.status === 'ok'
              ? { color: 'var(--status-online)', label: 'Backup: OK' }
              : appdataBackup.status === 'error'
                ? { color: 'var(--status-offline)', label: 'Backup: Fehler' }
                : { color: '#f59e0b', label: 'Backup: Unklar' }

          return (
            <button
              className="btn btn-ghost"
              onClick={() => openControlCenterTab('appdata_backup')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 12px',
                background: 'var(--glass-bg)',
                flexShrink: 0,
              }}
              title="Zum Appdata-Backup im Control Center"
            >
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>Backup</span>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: tone.color,
                  boxShadow: `0 0 8px ${tone.color}`,
                  display: 'inline-block',
                }}
              />
            </button>
          )
        })()}

        {(() => {
          const tone = !pollen
            ? { color: '#f59e0b', label: 'Pollen: Unklar' }
            : pollen.level === 'high'
              ? { color: 'var(--status-offline)', label: pollen.label }
              : pollen.level === 'medium'
                ? { color: '#f59e0b', label: pollen.label }
                : pollen.level === 'low'
                  ? { color: 'var(--status-online)', label: pollen.label }
                  : { color: '#f59e0b', label: pollen.label }

          return (
            <button
              className="btn btn-ghost"
              onClick={() => window.open('https://www.wetteronline.de/pollen/gelsenkirchen', '_blank', 'noopener,noreferrer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 12px',
                background: 'var(--glass-bg)',
                flexShrink: 0,
              }}
              title="Zum Pollenflug"
            >
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>Pollen</span>
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: tone.color,
                  boxShadow: `0 0 8px ${tone.color}`,
                  display: 'inline-block',
                }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {pollen?.label ?? 'Unklar'}
              </span>
            </button>
          )
        })()}

        {(() => {
          const weatherWidget = topbarWidgets.find(w => w.type === 'weather')
          if (!weatherWidget) return null

          const weather = stats[weatherWidget.id] as WeatherStats | undefined
          const config = weatherWidget.config as WeatherWidgetConfig
          const location = config.city_name || config.location_name || weatherWidget.name || 'Wetter'

          const hasWeather =
            !!weather &&
            !weather.error &&
            typeof weather.temperature === 'number' &&
            typeof weather.humidity === 'number' &&
            typeof weather.weather_code === 'number' &&
            typeof weather.unit === 'string' &&
            weather.unit.length > 0

          const icon = hasWeather ? (WEATHER_ICONS[weather.weather_code] ?? '🌡️') : '🌡️'

          return (
            <button
              className="btn btn-ghost"
              onClick={() => window.open('https://www.dwd.de/DE/leistungen/radarbild_film/radarbild_film.html', '_blank', 'noopener,noreferrer')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '4px 12px',
                background: 'var(--glass-bg)',
                flexShrink: 0,
              }}
              title="Zum Regenradar"
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 700 }}>{location}</span>
                  {hasWeather && (
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
                      {weather.temperature}{weather.unit}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                  {hasWeather
                    ? `${weather.humidity}% · ${weather.rain_text ?? 'Kein Regen in Sicht'}`
                    : (weather?.error || 'Lade Wetter…')}
                </div>
              </div>
            </button>
          )
        })()}

        {topbarWidgets.filter(w => w.type !== 'weather').map(w => {
          const pillStyle: React.CSSProperties = {
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius-md)',
            padding: '4px 12px',
            background: 'rgba(var(--accent-rgb), 0.06)',
            boxShadow: '0 0 8px rgba(var(--accent-rgb), 0.25)',
            fontSize: 12,
            flexShrink: 0,
          }

          const label = (text: string) => (
            <span style={{ color: 'var(--accent)', fontWeight: 700, letterSpacing: '0.3px', marginRight: 2 }}>{text}</span>
          )
          const sep = <span style={{ color: 'var(--glass-border)', userSelect: 'none' }}>·</span>
          const val = (text: string, color?: string) => (
            <span style={{ color: color ?? 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontWeight: 600, whiteSpace: 'nowrap' }}>{text}</span>
          )
          const muted = (text: string) => (
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{text}</span>
          )
          const pctColor = (pct: number) =>
            pct >= 90 ? 'var(--status-offline)' : pct >= 70 ? '#f59e0b' : 'var(--status-online)'

          if (w.type === 'docker_overview') {
            const counts = containerCounts(containers)
            return (
              <div key={w.id} style={pillStyle}>
                {label('Docker:')}
                {val(String(containers.length))} {muted('total')}
                {sep}
                {val(String(counts.running), 'var(--status-online)')} {muted('running')}
                {counts.stopped > 0 && <>{sep}{val(String(counts.stopped), 'var(--text-muted)')} {muted('stopped')}</>}
                {counts.restarting > 0 && <>{sep}{val(String(counts.restarting), '#f59e0b')} {muted('restarting')}</>}
              </div>
            )
          }

          if (w.type === 'adguard_home') {
            const s = stats[w.id] as AdGuardStats | undefined
            if (!s) return null
            return (
              <div key={w.id} style={pillStyle}>
                {label('AdGuard:')}
                {val(String(s.total_queries))} {muted(t('docker_widget.req'))}
                {sep}
                {val(String(s.blocked_queries), 'var(--status-offline)')} {muted(`${t('docker_widget.blocked')} (${s.blocked_percent}%)`)}
              </div>
            )
          }

          if (w.type === 'home_assistant') {
            const entities = Array.isArray(stats[w.id]) ? stats[w.id] as unknown as HaEntityState[] : []
            if (entities.length === 0) return null
            return (
              <div key={w.id} style={pillStyle}>
                {label(`${w.name}:`)}
                {entities.slice(0, 3).map((e, i) => (
                  <React.Fragment key={e.entity_id}>
                    {i > 0 && sep}
                    {muted(e.label || e.friendly_name || e.entity_id)} {val(e.state + (e.unit ? ` ${e.unit}` : ''))}
                  </React.Fragment>
                ))}
              </div>
            )
          }

          if (w.type === 'nginx_pm') {
            const npm = stats[w.id] as unknown as NpmStats & { error?: string }
            if (!npm || npm.error) return null
            return (
              <div key={w.id} style={pillStyle}>
                {label('NPM:')}
                {val(String(npm.proxy_hosts))} {muted(t('docker_widget.proxies'))}
                {sep}
                {val(String(npm.streams))} {muted(t('docker_widget.streams'))}
                {sep}
                {val(String(npm.certificates))} {muted(t('docker_widget.certs'))}
              </div>
            )
          }

          if (w.type === 'calendar') {
            const entries = Array.isArray(stats[w.id]) ? stats[w.id] as unknown as CalendarEntry[] : []
            const upcoming = entries.slice(0, 3)
            if (upcoming.length === 0) return null
            return (
              <div key={w.id} style={pillStyle}>
                {label('Kal:')}
                {upcoming.map((e, i) => (
                  <React.Fragment key={e.id}>
                    {i > 0 && sep}
                    {muted(new Date(`${e.date}T00:00:00`).toLocaleDateString(dateLocale, { day: '2-digit', month: '2-digit' }))} {val(e.title)}
                  </React.Fragment>
                ))}
              </div>
            )
          }

          if (w.type === 'weather') {
            const weather = stats[w.id] as WeatherStats | undefined
            if (!weather || weather.error) return null
            return (
              <div key={w.id} style={pillStyle}>
                {label('Wetter:')}
                {val(`${weather.temperature}°C`)}
                {sep}
                {muted('Wind')} {val(`${weather.windspeed} km/h`)}
              </div>
            )
          }

          if (w.type === 'server_status') {
            const ss = stats[w.id] as ServerStats | undefined
            if (!ss) return null
            return (
              <div key={w.id} style={pillStyle}>
                {label(`${w.name}:`)}
                {muted('CPU')} {val(`${Math.round(ss.cpu.load)}%`, pctColor(ss.cpu.load))}
                {sep}
                {muted('RAM')} {val(`${Math.round((ss.ram.used / Math.max(ss.ram.total, 1)) * 100)}%`)}
              </div>
            )
          }

          return null
        })}
      </div>

      <div className="topbar-actions" />
    </header>
  )
}
