import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { useBookmarkStore } from '../store/useBookmarkStore'
import { useDashboardStore } from '../store/useDashboardStore'
import { useInstanceStore } from '../store/useInstanceStore'
import { useWidgetStore } from '../store/useWidgetStore'
import type { InstanceType, Group } from '../types'
import type { WidgetType } from '../types'
import { Plus, AppWindow, Bookmark, Boxes, PlugZap, LayoutGrid } from 'lucide-react'

type TabId = 'apps' | 'integrationen' | 'widgets'

const TAB_LIST: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'apps', label: 'Apps', icon: <AppWindow size={14} /> },
  { id: 'integrationen', label: 'Integrationen', icon: <PlugZap size={14} /> },
  { id: 'widgets', label: 'Widgets', icon: <LayoutGrid size={14} /> },
]

const INSTANCE_TYPES: InstanceType[] = [
  'home_assistant',
  'unraid',
  'generic',
]

const WIDGET_TYPES: WidgetType[] = [
  'server_status',
  'docker_overview',
  'calendar',
  'weather',
  'home_assistant',
  'adguard_home',
  'pihole',
  'nginx_pm',
  'custom_button',
]

function TabBar({ active, onChange }: { active: TabId; onChange: (t: TabId) => void }) {
  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '6px 8px', display: 'flex', gap: 2, alignSelf: 'center' }}>
      {TAB_LIST.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            fontWeight: active === tab.id ? 600 : 400,
            background: active === tab.id ? 'rgba(var(--accent-rgb), 0.12)' : 'transparent',
            color: active === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
            border: active === tab.id ? '1px solid rgba(var(--accent-rgb), 0.25)' : '1px solid transparent',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}

export function ControlCenterPage() {
  const [tab, setTab] = useState<TabId>('apps')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <TabBar active={tab} onChange={setTab} />

      {tab === 'apps' && <AppsTab />}
      {tab === 'integrationen' && <IntegrationenTab />}
      {tab === 'widgets' && <WidgetsTab />}
    </div>
  )
}

function AppsTab() {
  const { groups, createService, loadAll } = useStore()
  const { createBookmark, loadBookmarks } = useBookmarkStore()
  const { createGroup, loadDashboard } = useDashboardStore()

  const [serviceName, setServiceName] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')
  const [serviceGroup, setServiceGroup] = useState('')
  const [serviceIcon, setServiceIcon] = useState('🚀')
  const [serviceBusy, setServiceBusy] = useState(false)

  const [bookmarkName, setBookmarkName] = useState('')
  const [bookmarkUrl, setBookmarkUrl] = useState('')
  const [bookmarkDescription, setBookmarkDescription] = useState('')
  const [bookmarkBusy, setBookmarkBusy] = useState(false)

  const [dashboardGroupName, setDashboardGroupName] = useState('')
  const [groupBusy, setGroupBusy] = useState(false)

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
    [groups]
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
      <SectionCard title="App anlegen" subtitle="Neuen Service/App direkt hinzufügen.">
        <input className="form-input" placeholder="Name" value={serviceName} onChange={e => setServiceName(e.target.value)} />
        <input className="form-input" placeholder="URL" value={serviceUrl} onChange={e => setServiceUrl(e.target.value)} />
        <input className="form-input" placeholder="Icon oder Emoji" value={serviceIcon} onChange={e => setServiceIcon(e.target.value)} />
        <select className="form-input" value={serviceGroup} onChange={e => setServiceGroup(e.target.value)}>
          <option value="">Keine Gruppe</option>
          {sortedGroups.map((g: Group) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <button
          className="btn btn-primary"
          disabled={serviceBusy || !serviceName.trim() || !serviceUrl.trim()}
          onClick={async () => {
            setServiceBusy(true)
            try {
              await createService({
                name: serviceName.trim(),
                url: serviceUrl.trim(),
                icon: serviceIcon.trim() || '🚀',
                group_id: serviceGroup || null,
                check_enabled: true,
              })
              setServiceName('')
              setServiceUrl('')
              setServiceGroup('')
              setServiceIcon('🚀')
              await loadAll()
            } finally {
              setServiceBusy(false)
            }
          }}
          style={{ gap: 8 }}
        >
          <Plus size={14} /> App hinzufügen
        </button>
      </SectionCard>

      <SectionCard title="Bookmark anlegen" subtitle="Schnellzugriff ohne Kachel-Datenmodell.">
        <input className="form-input" placeholder="Name" value={bookmarkName} onChange={e => setBookmarkName(e.target.value)} />
        <input className="form-input" placeholder="URL" value={bookmarkUrl} onChange={e => setBookmarkUrl(e.target.value)} />
        <input className="form-input" placeholder="Beschreibung" value={bookmarkDescription} onChange={e => setBookmarkDescription(e.target.value)} />
        <button
          className="btn btn-primary"
          disabled={bookmarkBusy || !bookmarkName.trim() || !bookmarkUrl.trim()}
          onClick={async () => {
            setBookmarkBusy(true)
            try {
              await createBookmark(bookmarkName.trim(), bookmarkUrl.trim(), bookmarkDescription.trim() || undefined)
              setBookmarkName('')
              setBookmarkUrl('')
              setBookmarkDescription('')
              await loadBookmarks()
            } finally {
              setBookmarkBusy(false)
            }
          }}
          style={{ gap: 8 }}
        >
          <Bookmark size={14} /> Bookmark hinzufügen
        </button>
      </SectionCard>

      <SectionCard title="Dashboard-Gruppe anlegen" subtitle="Zentrale Gruppenanlage statt verstecktem Button im Dashboard.">
        <input className="form-input" placeholder="Gruppenname" value={dashboardGroupName} onChange={e => setDashboardGroupName(e.target.value)} />
        <button
          className="btn btn-primary"
          disabled={groupBusy || !dashboardGroupName.trim()}
          onClick={async () => {
            setGroupBusy(true)
            try {
              await createGroup(dashboardGroupName.trim())
              setDashboardGroupName('')
              await loadDashboard()
            } finally {
              setGroupBusy(false)
            }
          }}
          style={{ gap: 8 }}
        >
          <Boxes size={14} /> Gruppe anlegen
        </button>
      </SectionCard>
    </div>
  )
}

function IntegrationenTab() {
  const { createInstance, loadInstances } = useInstanceStore()

  const [type, setType] = useState<InstanceType>('generic')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 560px)', gap: 16 }}>
      <SectionCard title="Instanz anlegen" subtitle="Zentrale Anlage für Integrationen und externe Dienste.">
        <select className="form-input" value={type} onChange={e => setType(e.target.value as InstanceType)}>
          {INSTANCE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <input className="form-input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="form-input" placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} />
        <input
          className="form-input"
          placeholder={type === 'home_assistant' ? 'Token' : 'API-Key / Token'}
          value={type === 'home_assistant' ? token : apiKey}
          onChange={e => type === 'home_assistant' ? setToken(e.target.value) : setApiKey(e.target.value)}
        />
        <button
          className="btn btn-primary"
          disabled={busy || !name.trim() || !url.trim()}
          onClick={async () => {
            setBusy(true)
            try {
              await createInstance({
                type,
                name: name.trim(),
                url: url.trim(),
                token: token.trim() || undefined,
                api_key: apiKey.trim() || undefined,
                enabled: true,
              })
              setName('')
              setUrl('')
              setToken('')
              setApiKey('')
              setType('generic')
              await loadInstances()
            } finally {
              setBusy(false)
            }
          }}
          style={{ gap: 8 }}
        >
          <PlugZap size={14} /> Instanz anlegen
        </button>
      </SectionCard>
    </div>
  )
}

function WidgetsTab() {
  const { createWidget, loadWidgets } = useWidgetStore()

  const [name, setName] = useState('')
  const [type, setType] = useState<WidgetType>('server_status')
  const [displayLocation, setDisplayLocation] = useState('content')
  const [busy, setBusy] = useState(false)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 560px)', gap: 16 }}>
      <SectionCard title="Widget anlegen" subtitle="Zentrale Widget-Anlage für Dashboard, Topbar oder Sidebar.">
        <input className="form-input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <select className="form-input" value={type} onChange={e => setType(e.target.value as WidgetType)}>
          {WIDGET_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <select className="form-input" value={displayLocation} onChange={e => setDisplayLocation(e.target.value)}>
          <option value="content">Dashboard</option>
          <option value="topbar">Topbar</option>
          <option value="sidebar">Sidebar</option>
        </select>
        <button
          className="btn btn-primary"
          disabled={busy || !name.trim()}
          onClick={async () => {
            setBusy(true)
            try {
              await createWidget({
                type,
                name: name.trim(),
                config: {},
                display_location: displayLocation,
                show_in_topbar: displayLocation === 'topbar',
              })
              setName('')
              setType('server_status')
              setDisplayLocation('content')
              await loadWidgets()
            } finally {
              setBusy(false)
            }
          }}
          style={{ gap: 8 }}
        >
          <LayoutGrid size={14} /> Widget anlegen
        </button>
      </SectionCard>
    </div>
  )
}
