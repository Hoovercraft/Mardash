import React, { useEffect, useState } from 'react'
import { Sun, Moon, RefreshCw, Plus, Pencil, LayoutGrid, LayoutList, Minus, MoreVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '../store/useLanguageStore'
import { useStore } from '../store/useStore'
import { useDashboardStore } from '../store/useDashboardStore'
import { useWidgetStore } from '../store/useWidgetStore'
import { useDockerStore } from '../store/useDockerStore'
import { api } from '../api'
import type { ThemeAccent, ServerStats, AdGuardStats, HaEntityState, NpmStats, CalendarEntry, WeatherStats } from '../types'
import { containerCounts } from '../utils'

interface Props {
  page: string
  onAddService: () => void
  onAddInstance: () => void
  onAddWidget: () => void
  onCheckAll: () => void
  checking: boolean
}

const ACCENTS: { value: ThemeAccent; label: string; color: string }[] = [
  { value: 'cyan', label: 'Cyan', color: '#22d3ee' },
  { value: 'orange', label: 'Orange', color: '#fb923c' },
  { value: 'magenta', label: 'Magenta', color: '#e879f9' },
]

export function Topbar({ page, onAddService, onAddInstance, onAddWidget, onCheckAll, checking }: Props) {
  const { t } = useTranslation('common')
  const { language } = useLanguageStore()
  const dateLocale = language === 'de' ? 'de-DE' : 'en-US'
  const { settings, setThemeMode, setThemeAccent } = useStore()
  const { editMode, setEditMode, addPlaceholder } = useDashboardStore()
  const { widgets, stats, loadWidgets, loadStats, startPolling, stopPolling } = useWidgetStore()
  const { containers, loadContainers } = useDockerStore()
  const mode = settings?.theme_mode ?? 'dark'
  const accent = settings?.theme_accent ?? 'cyan'
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  const canEditDashboard = true

  const topbarWidgets = widgets.filter(w => w.display_location === 'topbar')
  const hasDockerTopbar = topbarWidgets.some(w => w.type === 'docker_overview')
  const statsWidgetKey = topbarWidgets.filter(w => w.type !== 'docker_overview').map(w => w.id).join(',')

  const [serverOffset, setServerOffset] = useState(0)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    api.serverTime().then(({ iso }) => {
      setServerOffset(new Date(iso).getTime() - Date.now())
    }).catch(() => {})
    const tick = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(tick)
  }, [])

  const serverNow = new Date(now.getTime() + serverOffset)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  useEffect(() => {
    loadWidgets().catch(() => {})
  }, [loadWidgets])

  useEffect(() => {
    if (!statsWidgetKey) return
    const pollable = topbarWidgets.filter(w => w.type !== 'docker_overview' && w.type !== 'custom_button')
    pollable.forEach(w => { loadStats(w.id).catch(() => {}); startPolling(w.id, w.type) })
    return () => pollable.forEach(w => stopPolling(w.id))
  }, [statsWidgetKey, topbarWidgets, loadStats, startPolling, stopPolling])

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
        {topbarWidgets.map(w => {
          const pillStyle: React.CSSProperties = {
            display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
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
            const { running, stopped, restarting } = containerCounts(containers)
            return (
              <div key={w.id} style={pillStyle}>
                {label('Docker:')}
                {val(String(containers.length))} {muted('total')}
                {sep}
                {val(String(running), 'var(--status-online)')} {muted('running')}
                {stopped > 0 && <>{sep}{val(String(stopped), 'var(--text-muted)')} {muted('stopped')}</>}
                {restarting > 0 && <>{sep}{val(String(restarting), '#f59e0b')} {muted('restarting')}</>}
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

      <div className="topbar-actions">
        {page === 'dashboard' && canEditDashboard && (
          <>
            <button className={`btn ${editMode ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setEditMode(!editMode)} style={{ gap: 6 }}>
              <Pencil size={15} />
              {editMode ? t('topbar.done') : t('topbar.edit')}
            </button>

            {editMode && (
              <>
                <button className="btn btn-ghost" onClick={() => addPlaceholder('small')} title="Kleine Kachel">
                  <Minus size={15} />
                </button>
                <button className="btn btn-ghost" onClick={() => addPlaceholder('medium')} title="Mittlere Kachel">
                  <LayoutGrid size={15} />
                </button>
                <button className="btn btn-ghost" onClick={() => addPlaceholder('large')} title="Große Kachel">
                  <LayoutList size={15} />
                </button>
              </>
            )}
          </>
        )}

        {page === 'services' && (
          <>
            <button className="btn btn-ghost" onClick={onCheckAll} disabled={checking} style={{ gap: 6 }}>
              <RefreshCw size={15} className={checking ? 'spin' : ''} />
              Prüfen
            </button>
            <button className="btn btn-primary" onClick={onAddService} style={{ gap: 6 }}>
              <Plus size={15} />
              Hinzufügen
            </button>
          </>
        )}

        {page === 'media' && (
          <button className="btn btn-primary" onClick={onAddInstance} style={{ gap: 6 }}>
            <Plus size={15} />
            Instanz
          </button>
        )}

        {page === 'widgets' && (
          <button className="btn btn-primary" onClick={onAddWidget} style={{ gap: 6 }}>
            <Plus size={15} />
            Widget
          </button>
        )}

        <div style={{ position: 'relative' }} ref={dropdownRef}>
          <button className="btn btn-ghost" onClick={() => setDropdownOpen(v => !v)} title="Darstellung" style={{ gap: 6 }}>
            <MoreVertical size={16} />
          </button>

          {dropdownOpen && (
            <div className="glass" style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              minWidth: 220,
              padding: 10,
              borderRadius: 'var(--radius-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              zIndex: 50,
            }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>Darstellung</div>

              <button
                className="btn btn-ghost"
                onClick={() => {
                  setThemeMode(mode === 'dark' ? 'light' : 'dark')
                  setDropdownOpen(false)
                }}
                style={{ justifyContent: 'flex-start', gap: 8 }}
              >
                {mode === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                {mode === 'dark' ? 'Helles Design' : 'Dunkles Design'}
              </button>

              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                {ACCENTS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => {
                      setThemeAccent(a.value)
                      setDropdownOpen(false)
                    }}
                    title={a.label}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: accent === a.value ? '2px solid white' : '1px solid var(--glass-border)',
                      background: a.color,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
