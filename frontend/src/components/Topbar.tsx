import React, { memo, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '../store/useLanguageStore'
import { useStore } from '../store/useStore'
import { useWidgetStore } from '../store/useWidgetStore'
import { useDockerStore } from '../store/useDockerStore'
import { useUnraidStore } from '../store/useUnraidStore'
import { api } from '../api'
import type { ServerStats, HaEntityState, NpmStats, CalendarEntry, WeatherStats } from '../types'
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


function pollenTone(level?: number | null) {
  if (level == null) return 'var(--text-muted)'
  if (level >= 3) return 'var(--status-offline)'
  if (level >= 2) return '#f59e0b'
  if (level >= 1) return '#facc15'
  return 'var(--text-muted)'
}

function PollenDot({ label, level }: { label: string; level?: number | null }) {
  const color = pollenTone(level)
  return (
    <span
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</span>
      <span
        style={{
          width: 9,
          height: 9,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 6px ${color}`,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
    </span>
  )
}

const TopbarClock = memo(function TopbarClock({ dateLocale, serverOffset }: { dateLocale: string; serverOffset: number }) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const serverNow = new Date(now.getTime() + serverOffset)

  return (
    <div className="topbar-title">
      <span>{serverNow.toLocaleDateString(dateLocale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
      <span style={{ marginLeft: 10, fontVariantNumeric: 'tabular-nums' }}>
        {serverNow.toLocaleTimeString(dateLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  )
})

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

  const [serverOffset, setServerOffset] = useState(0)

  void settings
  void _page

  const topbarWidgets = useMemo(() => {
    const priority: Record<string, number> = {
      weather: 0,
      pollen: 1,
      unraid_status: 2,
      server_status: 2,
      appdata_backup: 3,
    }
    return widgets
      .filter(w => w.display_location === 'topbar')
      .slice()
      .sort((a, b) => (priority[a.type] ?? 10) - (priority[b.type] ?? 10))
  }, [widgets])

  const hasDockerTopbar = useMemo(
    () => topbarWidgets.some(w => w.type === 'docker_overview'),
    [topbarWidgets]
  )

  const pollableTopbarWidgets = useMemo(
    () => topbarWidgets.filter(w => w.type !== 'docker_overview' && w.type !== 'custom_button'),
    [topbarWidgets]
  )

  const statsWidgetKey = useMemo(
    () => pollableTopbarWidgets.map(w => `${w.id}:${w.type}`).join(','),
    [pollableTopbarWidgets]
  )

  useEffect(() => {
    api.serverTime().then(({ iso }) => {
      setServerOffset(new Date(iso).getTime() - Date.now())
    }).catch(() => {})
  }, [])

  useEffect(() => {
    loadWidgets().catch(() => {})
  }, [loadWidgets])

  useEffect(() => {
    if (!statsWidgetKey) return
    pollableTopbarWidgets.forEach(w => {
      loadStats(w.id).catch(() => {})
      startPolling(w.id, w.type)
    })
    return () => {
      pollableTopbarWidgets.forEach(w => stopPolling(w.id))
    }
  }, [statsWidgetKey, pollableTopbarWidgets, loadStats, startPolling, stopPolling])

  useEffect(() => {
    loadUnraidInstances().catch(() => {})
  }, [loadUnraidInstances])

  useEffect(() => {
    if (unraidInstances.length === 0) return
    pingAllUnraid().catch(() => {})
    const interval = setInterval(() => pingAllUnraid().catch(() => {}), 30000)
    return () => clearInterval(interval)
  }, [unraidInstances, pingAllUnraid])

  const openControlCenterTab = (tab: 'apps' | 'integrationen' | 'widgets' | 'topbar' | 'appdata_backup' | 'design') => {
    localStorage.setItem('mardash.controlcenter.tab', tab)
    onNavigate?.('control_center')
  }

  const [appdataBackup, setAppdataBackup] = React.useState<null | { status: 'ok' | 'warning' | 'error'; label: string }>(null)

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
    if (!hasDockerTopbar) return
    loadContainers().catch(() => {})
    const interval = setInterval(() => loadContainers().catch(() => {}), 30000)
    return () => clearInterval(interval)
  }, [hasDockerTopbar, loadContainers])

  return (
    <header className="topbar">
      <TopbarClock dateLocale={dateLocale} serverOffset={serverOffset} />

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

        {topbarWidgets.map(w => {
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
            if (!weather || (weather as any).error) return null
            const weatherIcon = WEATHER_ICONS[weather.weather_code] ?? '🌡️'
            const rainText = (weather as any).rain_text as string | undefined

            return (
              <button
                key={w.id}
                type="button"
                onClick={() => window.open('https://www.rainviewer.com/de/radars/germany.html', '_blank', 'noopener,noreferrer')}
                title="Regenradar öffnen"
                style={{
                  ...pillStyle,
                  gap: 8,
                  cursor: 'pointer',
                  border: '1px solid rgba(var(--accent-rgb), 0.45)',
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{weatherIcon}</span>
                {label('Wetter:')}
                {val(`${weather.temperature}${weather.unit ?? '°C'}`)}
                {rainText && <>{sep}{muted(rainText)}</>}
              </button>
            )
          }

          if (w.type === 'pollen') {
            const pollen = stats[w.id] as any
            if (!pollen || pollen.error) return null
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => window.open('https://www.wetteronline.de/pollen/gelsenkirchen', '_blank', 'noopener,noreferrer')}
                title="Detaillierte Pollenanzeige öffnen"
                style={{
                  ...pillStyle,
                  gap: 8,
                  maxWidth: 'fit-content',
                  cursor: 'pointer',
                  border: '1px solid rgba(var(--accent-rgb), 0.45)',
                }}
              >
                {label('Pollen:')}
                <PollenDot label="H" level={pollen.hasel} />
                <PollenDot label="B" level={pollen.birke} />
                <PollenDot label="G" level={pollen.graeser} />
                {(pollen.pappel_text || pollen.pappel != null) && <PollenDot label="P" level={pollen.pappel} />}
              </button>
            )
          }

          if (w.type === 'unraid_status' || w.type === 'server_status') {
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
