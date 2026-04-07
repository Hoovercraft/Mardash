import React, { useEffect, useLayoutEffect, useState } from 'react'
import {
  LayoutDashboard, Home,
  ChevronLeft, ChevronRight, Network, Server, SlidersHorizontal,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { useWidgetStore } from '../store/useWidgetStore'
import type { Widget, ServerStats } from '../types'
import { LS_SIDEBAR_COLLAPSED } from '../constants'

interface Props {
  page: string
  onNavigate: (page: string) => void
}

export function Sidebar({ page, onNavigate }: Props) {
  const { t } = useTranslation('common')
  const { settings, services } = useStore()
  const { widgets, loadStats, startPolling, stopPolling } = useWidgetStore()

  const title = settings?.dashboard_title ?? 'MARDASH'
  const onlineCount = services.filter(s => s.last_status === 'online').length
  const offlineCount = services.filter(s => s.last_status === 'offline').length

  const sidebarWidgets = widgets.filter(w => w.display_location === 'sidebar')
  const sidebarStatsKey = sidebarWidgets.map(w => w.id).join(',')

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
    sidebarWidgets.forEach(w => { loadStats(w.id).catch(() => {}); startPolling(w.id, w.type) })
    return () => sidebarWidgets.forEach(w => stopPolling(w.id))
  }, [sidebarStatsKey])

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
        justifyContent: collapsed ? 'center' : undefined,
      }}
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
    { icon: <Home size={20} />, label: t('nav.home_assistant'), target: 'home_assistant' },
  ]

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
  const { i18n } = useTranslation('common')
  const { stats } = useWidgetStore()
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

  if (!s) {
    if (widget.type === 'appdata_backup') {
      body = row('Status', 'Pruefen', '#f59e0b')
    } else {
      return null
    }
  } else if (widget.type === 'unraid_status' && 'cpu' in (s as object)) {
    const ss = s as ServerStats
    const disk = (ss as any).disk
    body = <>
      {row('CPU', `${Math.round(ss.cpu.load * 10) / 10}%`, pctColor(ss.cpu.load))}
      {ss.ram.total > 0 && row('RAM', `${Math.round((ss.ram.used / ss.ram.total) * 100)}%`, pctColor(Math.round(ss.ram.used / ss.ram.total * 100)))}
      {disk && disk.total > 0 && row('Disk', `${Math.round((disk.used / disk.total) * 100)}%`, pctColor(Math.round(disk.used / disk.total * 100)))}
    </>
  } else if (widget.type === 'weather' && 'temperature' in (s as object)) {
    const ws = s as any
    body = <>
      {row('Temp', `${ws.temperature}${ws.unit ?? '°C'}`)}
      {row('Wind', `${ws.wind_speed ?? '—'} km/h`)}
    </>
  } else if (widget.type === 'pollen') {
    body = <>
      {row('Level', String((s as any).level ?? '—'))}
      {row('Region', String((s as any).source_region ?? '—'))}
    </>
  } else if (widget.type === 'appdata_backup') {
    body = row('Status', (s as any).status === 'ok' ? 'OK' : 'Pruefen', (s as any).status === 'ok' ? 'var(--status-online)' : '#f59e0b')
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
