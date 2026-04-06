import React, { useEffect, useLayoutEffect, useState } from 'react'
import {
  LayoutDashboard, Settings, AppWindow, BarChart2, Container, Home,
  ChevronLeft, ChevronRight, ScrollText, Network, HardDrive, Server, Bookmark, Link2, SlidersHorizontal} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { useWidgetStore } from '../store/useWidgetStore'
import { useDockerStore } from '../store/useDockerStore'
import type { Widget, ServerStats, AdGuardStats, HaEntityState, NpmStats, CalendarEntry, WeatherStats } from '../types'
import { containerCounts } from '../utils'
import { LS_SIDEBAR_COLLAPSED } from '../constants'

interface Props {
  page: string
  onNavigate: (page: string) => void
}

export function Sidebar({ page, onNavigate }: Props) {
  const { t } = useTranslation('common')
  const { settings, services } = useStore()
  const { widgets, loadStats, startPolling, stopPolling } = useWidgetStore()
  const { loadContainers } = useDockerStore()

  const title = settings?.dashboard_title ?? 'MARDASH'
  const onlineCount = services.filter(s => s.last_status === 'online').length
  const offlineCount = services.filter(s => s.last_status === 'offline').length

  const sidebarWidgets = widgets.filter(w => w.display_location === 'sidebar')
  const hasSidebarDocker = sidebarWidgets.some(w => w.type === 'docker_overview')
  const sidebarStatsKey = sidebarWidgets
    .filter(w => w.type !== 'docker_overview' && w.type !== 'custom_button')
    .map(w => w.id)
    .join(',')

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(LS_SIDEBAR_COLLAPSED) === 'true' } catch { return false }
  })

  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '64px' : '240px')
  }, [collapsed])

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      try { localStorage.setItem(LS_SIDEBAR_COLLAPSED, String(next)) } catch {}
      return next
    })
  }

  useEffect(() => {
    if (!sidebarStatsKey) return
    const pollable = sidebarWidgets.filter(w => w.type !== 'docker_overview' && w.type !== 'custom_button')
    pollable.forEach(w => { loadStats(w.id).catch(() => {}); startPolling(w.id, w.type) })
    return () => pollable.forEach(w => stopPolling(w.id))
  }, [sidebarStatsKey, sidebarWidgets, loadStats, startPolling, stopPolling])

  useEffect(() => {
    if (!hasSidebarDocker) return
    loadContainers().catch(() => {})
    const interval = setInterval(() => loadContainers().catch(() => {}), 30000)
    return () => clearInterval(interval)
  }, [hasSidebarDocker, loadContainers])

  return (
    <>
      <aside className={`sidebar${collapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="sidebar-logo">
          <img src="/favicon.png" alt="" className="sidebar-logo-icon" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          {!collapsed && <span className="sidebar-logo-text">{title}</span>}
        </div>

        {services.length > 0 && (
          <div className="sidebar-status">
            <div className="sidebar-status-pill online">
              <span className="sidebar-status-dot" />
              {!collapsed && <span>{onlineCount} Online</span>}
            </div>
            {!collapsed && (
              <div className="sidebar-status-pill offline">
                <span className="sidebar-status-dot" />
                <span>{offlineCount} Offline</span>
              </div>
            )}
          </div>
        )}

        <NavItem icon={<LayoutDashboard size={16} />} label={t('nav.dashboard')} active={page === 'dashboard'} onClick={() => onNavigate('dashboard')} collapsed={collapsed} />
        <NavItem icon={<SlidersHorizontal size={16} />} label="Control Center" active={page === 'control_center'} onClick={() => onNavigate('control_center')} collapsed={collapsed} />
        <NavItem icon={<Container size={16} />} label={t('nav.docker')} active={page === 'docker'} onClick={() => onNavigate('docker')} collapsed={collapsed} />
        <NavItem icon={<Home size={16} />} label={t('nav.home_assistant')} active={page === 'home_assistant'} onClick={() => onNavigate('home_assistant')} collapsed={collapsed} />
        <NavItem icon={<Server size={16} />} label={t('nav.unraid')} active={page === 'unraid'} onClick={() => onNavigate('unraid')} collapsed={collapsed} />
        <NavItem icon={<Network size={16} />} label={t('nav.network')} active={page === 'network'} onClick={() => onNavigate('network')} collapsed={collapsed} />

        {!collapsed && sidebarWidgets.length > 0 && (
          <div className="sidebar-widgets-section">
            <span className="nav-section-label" style={{ marginTop: 16 }}>{t('sidebar.widgets')}</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
              {sidebarWidgets.map(widget => (
                <SidebarWidget key={widget.id} widget={widget} />
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
          <button
            className="nav-item sidebar-collapse-btn"
            onClick={toggleCollapse}
            title={collapsed ? t('sidebar.expand_sidebar') : t('sidebar.collapse_sidebar')}
            style={{ width: '100%', background: 'none', justifyContent: collapsed ? 'center' : 'flex-end', paddingRight: collapsed ? undefined : 14 }}
          >
            {collapsed ? <ChevronRight size={16} /> : <><span style={{ fontSize: 12, marginRight: 4 }}>{t('sidebar.collapse')}</span><ChevronLeft size={16} /></>}
          </button>
        </div>
      </aside>

      <BottomNavBar page={page} onNavigate={onNavigate} />
    </>
  )
}

function NavItem({ icon, label, active, onClick, collapsed }: {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
  collapsed?: boolean
}) {
  return (
    <button
      className={`nav-item ${active ? 'active' : ''}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'none',
        fontFamily: 'var(--font-sans)',
        justifyContent: collapsed ? 'center' : undefined}}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  )
}

function BottomNavBar({ page, onNavigate }: { page: string; onNavigate: (p: string) => void }) {
  const { t } = useTranslation('common')

  const items: { icon: React.ReactNode; label: string; target: string }[] = [
    { icon: <LayoutDashboard size={20} />, label: t('nav.dashboard'), target: 'dashboard' },
    { icon: <SlidersHorizontal size={20} />, label: 'Control', target: 'control_center' },
    { icon: <Container size={20} />, label: t('nav.docker'), target: 'docker' },
    { icon: <Home size={20} />, label: t('nav.home_assistant'), target: 'home_assistant' }]

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {items.map(item => (
        <button
          key={item.target}
          className={`bottom-nav-item${page === item.target ? ' active' : ''}`}
          onClick={() => onNavigate(item.target)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

function SidebarWidget({ widget }: { widget: Widget }) {
  const { t, i18n } = useTranslation('common')
  const { stats } = useWidgetStore()
  const { containers } = useDockerStore()
  const s = stats[widget.id]

  const row = (label: string, value: string, color?: string) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: color ?? 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{value}</span>
    </div>
  )

  const pctColor = (pct: number) =>
    pct >= 90 ? 'var(--status-offline)' : pct >= 70 ? '#f59e0b' : 'var(--status-online)'

  let body: React.ReactNode = null

  if (widget.type === 'docker_overview') {
    const { running, stopped, restarting } = containerCounts(containers)
    body = <>
      {row('Total', String(containers.length))}
      {row('Running', String(running), 'var(--status-online)')}
      {stopped > 0 && row('Stopped', String(stopped), 'var(--text-muted)')}
      {restarting > 0 && row('Restarting', String(restarting), '#f59e0b')}
    </>
  } else if (!s) {
    return null
  } else if (widget.type === 'server_status' && 'cpu' in (s as object)) {
    const ss = s as ServerStats
    body = <>
      {row('CPU', `${Math.round(ss.cpu.load * 10) / 10}%`, pctColor(ss.cpu.load))}
      {ss.ram.total > 0 && row('RAM', `${Math.round((ss.ram.used / ss.ram.total) * 100)}%`, pctColor(Math.round(ss.ram.used / ss.ram.total * 100)))}
      {ss.disk.total > 0 && row('Disk', `${Math.round((ss.disk.used / ss.disk.total) * 100)}%`, pctColor(Math.round(ss.disk.used / ss.disk.total * 100)))}
    </>
  } else if (widget.type === 'adguard_home' && 'total_queries' in (s as object)) {
    const adg = s as AdGuardStats
    body = <>
      {row('Anfragen', String(adg.total_queries))}
      {row('Blockiert', `${adg.blocked_queries} (${adg.blocked_percent}%)`, 'var(--status-offline)')}
      {row('Schutz', adg.protection_enabled ? 'Aktiv' : 'Pausiert', adg.protection_enabled ? 'var(--status-online)' : '#f59e0b')}
    </>
  } else if (widget.type === 'home_assistant' && Array.isArray(s)) {
    const entities = s as HaEntityState[]
    body = entities.slice(0, 4).map(e => row(e.label || e.friendly_name || e.entity_id, `${e.state}${e.unit ? ` ${e.unit}` : ''}`))
  } else if (widget.type === 'nginx_pm' && 'proxy_hosts' in (s as object)) {
    const npm = s as NpmStats
    body = <>
      {row('Proxy Hosts', String(npm.proxy_hosts))}
      {row('Streams', String(npm.streams))}
      {row('Zertifikate', String(npm.certificates))}
    </>
  } else if (widget.type === 'calendar' && Array.isArray(s)) {
    const entries = s as CalendarEntry[]
    body = entries.slice(0, 3).map(e => row(
      new Date(`${e.date}T00:00:00`).toLocaleDateString(i18n.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit' }),
      e.title
    ))
  } else if (widget.type === 'weather' && 'temperature' in (s as object)) {
    const weather = s as WeatherStats
    body = <>
      {row('Temperatur', `${weather.temperature}°C`)}
      {row('Wind', `${weather.windspeed} km/h`)}
    </>
  }

  if (!body) return null

  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-lg)', padding: '10px 12px', fontSize: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8, color: 'var(--accent)' }}>{widget.name}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {body}
      </div>
    </div>
  )
}
