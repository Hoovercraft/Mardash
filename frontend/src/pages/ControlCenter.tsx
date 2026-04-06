import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useBookmarkStore } from '../store/useBookmarkStore'
import { useDashboardStore } from '../store/useDashboardStore'
import { useInstanceStore } from '../store/useInstanceStore'
import { useWidgetStore } from '../store/useWidgetStore'
import { useConfirm } from '../components/ConfirmDialog'
import type { InstanceType, Group, Service, Instance } from '../types'
import type { WidgetType, Bookmark } from '../types'
import { Plus, AppWindow, Bookmark as BookmarkIcon, Boxes, PlugZap, LayoutGrid, Pencil, Trash2, ExternalLink, Download, Upload, CheckCircle2, XCircle } from 'lucide-react'
import { getIconUrl } from '../api'

type TabId = 'apps' | 'integrationen' | 'widgets' | 'dashboard' | 'design'

const TAB_LIST: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'apps', label: 'Apps', icon: <AppWindow size={14} /> },
  { id: 'dashboard', label: 'Dashboard', icon: <Boxes size={14} /> },
  { id: 'integrationen', label: 'Integrationen', icon: <PlugZap size={14} /> },
  { id: 'widgets', label: 'Widgets', icon: <LayoutGrid size={14} /> },
  { id: 'design', label: 'Design', icon: <LayoutGrid size={14} /> },
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

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      <button className="btn btn-ghost btn-sm" onClick={onEdit} style={{ gap: 6 }}>
        <Pencil size={14} /> Bearbeiten
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onDelete} style={{ gap: 6 }}>
        <Trash2 size={14} /> Löschen
      </button>
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
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'design' && <DesignTab />}
    </div>
  )
}

function AppsTab() {
  const { groups, services, loadAll, createService, updateService, deleteService } = useStore()
  const { bookmarks, loadBookmarks, createBookmark, updateBookmark, deleteBookmark, toggleDashboard } = useBookmarkStore()
  const { createGroup, loadDashboard } = useDashboardStore()
  const { confirm } = useConfirm()

  const [serviceName, setServiceName] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')
  const [serviceGroup, setServiceGroup] = useState('')
  const [serviceIcon, setServiceIcon] = useState('🚀')
  const [serviceBusy, setServiceBusy] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [serviceExporting, setServiceExporting] = useState(false)
  const [serviceImporting, setServiceImporting] = useState(false)
  const serviceImportRef = useRef<HTMLInputElement | null>(null)

  const [bookmarkName, setBookmarkName] = useState('')
  const [bookmarkUrl, setBookmarkUrl] = useState('')
  const [bookmarkDescription, setBookmarkDescription] = useState('')
  const [bookmarkBusy, setBookmarkBusy] = useState(false)
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null)
  const [bookmarkExporting, setBookmarkExporting] = useState(false)
  const [bookmarkImporting, setBookmarkImporting] = useState(false)
  const bookmarkImportRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    loadAll().catch(() => {})
    loadBookmarks().catch(() => {})
  }, [])

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
    [groups]
  )

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.name.localeCompare(b.name)),
    [services]
  )

  const sortedBookmarks = useMemo(
    () => [...bookmarks].sort((a, b) => a.name.localeCompare(b.name)),
    [bookmarks]
  )

  const submitService = async () => {
    setServiceBusy(true)
    try {
      const payload: Partial<Service> = {
        name: serviceName.trim(),
        url: serviceUrl.trim(),
        icon: serviceIcon.trim() || '🚀',
        group_id: serviceGroup || null,
        check_enabled: true,
      }

      if (editingServiceId) {
        await updateService(editingServiceId, payload)
      } else {
        await createService(payload)
      }

      setServiceName('')
      setServiceUrl('')
      setServiceGroup('')
      setServiceIcon('🚀')
      setEditingServiceId(null)
      await loadAll()
    } finally {
      setServiceBusy(false)
    }
  }

  const submitBookmark = async () => {
    setBookmarkBusy(true)
    try {
      if (editingBookmarkId) {
        await updateBookmark(editingBookmarkId, {
          name: bookmarkName.trim(),
          url: bookmarkUrl.trim(),
          description: bookmarkDescription.trim() || undefined,
        })
      } else {
        await createBookmark(bookmarkName.trim(), bookmarkUrl.trim(), bookmarkDescription.trim() || undefined)
      }

      setBookmarkName('')
      setBookmarkUrl('')
      setBookmarkDescription('')
      setEditingBookmarkId(null)
      await loadBookmarks()
    } finally {
      setBookmarkBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, alignItems: 'start' }}>
      <SectionCard title="App anlegen / bearbeiten" subtitle="Services zentral verwalten.">
        <input className="form-input" placeholder="Name" value={serviceName} onChange={e => setServiceName(e.target.value)} />
        <input className="form-input" placeholder="URL" value={serviceUrl} onChange={e => setServiceUrl(e.target.value)} />
        <input className="form-input" placeholder="Icon oder Emoji" value={serviceIcon} onChange={e => setServiceIcon(e.target.value)} />
        <select className="form-input" value={serviceGroup} onChange={e => setServiceGroup(e.target.value)}>
          <option value="">Keine Gruppe</option>
          {sortedGroups.map((g: Group) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input
          ref={serviceImportRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={async e => {
            const file = e.target.files?.[0]
            if (!file) return
            setServiceImporting(true)
            try {
              const text = await file.text()
              const data = JSON.parse(text) as { services?: Array<Record<string, unknown>> }
              if (Array.isArray(data.services)) {
                await (await import('../api')).api.services.import(data.services)
                await loadAll()
              }
            } finally {
              setServiceImporting(false)
              if (serviceImportRef.current) serviceImportRef.current.value = ''
            }
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            disabled={serviceBusy || !serviceName.trim() || !serviceUrl.trim()}
            onClick={submitService}
            style={{ gap: 8 }}
          >
            <Plus size={14} /> {editingServiceId ? 'App speichern' : 'App hinzufügen'}
          </button>
          {editingServiceId && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditingServiceId(null)
                setServiceName('')
                setServiceUrl('')
                setServiceGroup('')
                setServiceIcon('🚀')
              }}
            >
              Abbrechen
            </button>
          )}
          <button
            className="btn btn-ghost"
            disabled={serviceExporting}
            onClick={async () => {
              setServiceExporting(true)
              try {
                const blob = await (await import('../api')).api.services.export()
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `mardash-services-${new Date().toISOString().split('T')[0]}.json`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
              } finally {
                setServiceExporting(false)
              }
            }}
            style={{ gap: 8 }}
          >
            <Download size={14} /> Export
          </button>
          <button
            className="btn btn-ghost"
            disabled={serviceImporting}
            onClick={() => serviceImportRef.current?.click()}
            style={{ gap: 8 }}
          >
            <Upload size={14} /> Import
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxHeight: 420, overflow: 'auto' }}>
          {sortedServices.slice(0, 8).map(s => (
            <div key={s.id} className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.url}</div>
              </div>
              <RowActions
                onEdit={() => {
                  setEditingServiceId(s.id)
                  setServiceName(s.name)
                  setServiceUrl(s.url)
                  setServiceGroup(s.group_id ?? '')
                  setServiceIcon((s.icon as string) || '🚀')
                }}
                onDelete={async () => {
                  const ok = await confirm({ title: `"${s.name}" löschen?`, danger: true, confirmLabel: 'Löschen' })
                  if (!ok) return
                  await deleteService(s.id)
                  await loadAll()
                }}
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Bookmark anlegen / bearbeiten" subtitle="Schnellzugriffe zentral verwalten.">
        <input className="form-input" placeholder="Name" value={bookmarkName} onChange={e => setBookmarkName(e.target.value)} />
        <input className="form-input" placeholder="URL" value={bookmarkUrl} onChange={e => setBookmarkUrl(e.target.value)} />
        <input className="form-input" placeholder="Beschreibung" value={bookmarkDescription} onChange={e => setBookmarkDescription(e.target.value)} />
        <input
          ref={bookmarkImportRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={async e => {
            const file = e.target.files?.[0]
            if (!file) return
            setBookmarkImporting(true)
            try {
              const text = await file.text()
              const data = JSON.parse(text) as { bookmarks?: Array<{ name: string; url: string; description?: string }> }
              if (Array.isArray(data.bookmarks)) {
                await (await import('../store/useBookmarkStore')).useBookmarkStore.getState().importBookmarks(file)
                await loadBookmarks()
              }
            } finally {
              setBookmarkImporting(false)
              if (bookmarkImportRef.current) bookmarkImportRef.current.value = ''
            }
          }}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            disabled={bookmarkBusy || !bookmarkName.trim() || !bookmarkUrl.trim()}
            onClick={submitBookmark}
            style={{ gap: 8 }}
          >
            <BookmarkIcon size={14} /> {editingBookmarkId ? 'Bookmark speichern' : 'Bookmark hinzufügen'}
          </button>
          {editingBookmarkId && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditingBookmarkId(null)
                setBookmarkName('')
                setBookmarkUrl('')
                setBookmarkDescription('')
              }}
            >
              Abbrechen
            </button>
          )}
          <button
            className="btn btn-ghost"
            disabled={bookmarkExporting}
            onClick={async () => {
              setBookmarkExporting(true)
              try {
                await (await import('../store/useBookmarkStore')).useBookmarkStore.getState().exportBookmarks()
              } finally {
                setBookmarkExporting(false)
              }
            }}
            style={{ gap: 8 }}
          >
            <Download size={14} /> Export
          </button>
          <button
            className="btn btn-ghost"
            disabled={bookmarkImporting}
            onClick={() => bookmarkImportRef.current?.click()}
            style={{ gap: 8 }}
          >
            <Upload size={14} /> Import
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxHeight: 420, overflow: 'auto' }}>
          {sortedBookmarks.slice(0, 8).map((b: Bookmark) => (
            <div key={b.id} className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                  {getIconUrl(b)
                    ? <img src={getIconUrl(b)!} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    : <ExternalLink size={14} />
                  }
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{b.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.url}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    await toggleDashboard(b.id, b.show_on_dashboard === 0)
                    await loadBookmarks()
                  }}
                >
                  {b.show_on_dashboard === 0 ? 'Auf Dashboard' : 'Vom Dashboard'}
                </button>
                <RowActions
                  onEdit={() => {
                    setEditingBookmarkId(b.id)
                    setBookmarkName(b.name)
                    setBookmarkUrl(b.url)
                    setBookmarkDescription(b.description ?? '')
                  }}
                  onDelete={async () => {
                    const ok = await confirm({ title: `"${b.name}" löschen?`, danger: true, confirmLabel: 'Löschen' })
                    if (!ok) return
                    await deleteBookmark(b.id)
                    await loadBookmarks()
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

    </div>
  )
}

function DesignTab() {
  const { backgrounds, loadBackgrounds, uploadBackground, deleteBackground } = useStore()
  const { confirm } = useConfirm()
  const [uploadName, setUploadName] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadBackgrounds().catch(() => {})
  }, [])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 720px)', gap: 16 }}>
      <SectionCard title="Design" subtitle="Hintergrundbilder für dein lokales Dashboard.">
        <input className="form-input" placeholder="Name" value={uploadName} onChange={e => setUploadName(e.target.value)} />
        <input className="form-input" type="file" accept="image/*" onChange={e => setUploadFile(e.target.files?.[0] ?? null)} />
        <button
          className="btn btn-primary"
          disabled={busy || !uploadName.trim() || !uploadFile}
          onClick={async () => {
            if (!uploadFile) return
            setBusy(true)
            try {
              await uploadBackground(uploadName.trim(), uploadFile)
              setUploadName('')
              setUploadFile(null)
              await loadBackgrounds()
            } finally {
              setBusy(false)
            }
          }}
          style={{ gap: 8 }}
        >
          <Upload size={14} /> Hintergrund hochladen
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxHeight: 420, overflow: 'auto' }}>
          {backgrounds.length === 0 && (
            <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
              Noch keine Hintergrundbilder vorhanden.
            </div>
          )}

          {backgrounds.map(bg => (
            <div key={bg.id} className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{bg.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{bg.id}</div>
              </div>
              <button
                className="btn btn-ghost btn-sm"
                onClick={async () => {
                  const ok = await confirm({ title: `"${bg.name}" löschen?`, danger: true, confirmLabel: 'Löschen' })
                  if (!ok) return
                  await deleteBackground(bg.id)
                  await loadBackgrounds()
                }}
                style={{ gap: 6 }}
              >
                <Trash2 size={14} /> Löschen
              </button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function DashboardTab() {
  const { settings, updateSettings, loadSettings } = useStore()
  const { createGroup, loadDashboard } = useDashboardStore()
  const [dashboardTitle, setDashboardTitle] = useState('')
  const [titleBusy, setTitleBusy] = useState(false)
  const [dashboardGroupName, setDashboardGroupName] = useState('')
  const [groupBusy, setGroupBusy] = useState(false)

  useEffect(() => {
    loadSettings().catch(() => {})
  }, [])

  useEffect(() => {
    setDashboardTitle(settings?.dashboard_title ?? 'Mardash')
  }, [settings?.dashboard_title])

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 560px))', gap: 16 }}>
      <SectionCard title="Dashboard" subtitle="Lokale Dashboard-Grundeinstellungen.">
        <input className="form-input" placeholder="Dashboard-Titel" value={dashboardTitle} onChange={e => setDashboardTitle(e.target.value)} />
        <button
          className="btn btn-primary"
          disabled={titleBusy || !dashboardTitle.trim()}
          onClick={async () => {
            setTitleBusy(true)
            try {
              await updateSettings({ dashboard_title: dashboardTitle.trim() })
              await loadSettings()
            } finally {
              setTitleBusy(false)
            }
          }}
          style={{ gap: 8 }}
        >
          <Boxes size={14} /> Titel speichern
        </button>
      </SectionCard>

      <SectionCard title="Dashboard-Gruppe anlegen" subtitle="Zentrale Gruppenanlage für das Dashboard.">
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
  const { instances, createInstance, loadInstances, testInstance } = useInstanceStore()

  const [type, setType] = useState<InstanceType>('generic')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [testState, setTestState] = useState<Record<string, { ok: boolean; error?: string } | null>>({})

  useEffect(() => {
    loadInstances().catch(() => {})
  }, [])

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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxHeight: 420, overflow: 'auto' }}>
          {instances.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 10).map((inst: Instance) => {
            const result = testState[inst.id]
            return (
              <div key={inst.id} className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{inst.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{inst.type} · {inst.url}</div>
                  {result && (
                    <div style={{ fontSize: 12, color: result.ok ? 'var(--status-online)' : 'var(--status-offline)', marginTop: 4 }}>
                      {result.ok ? 'Test erfolgreich' : (result.error || 'Test fehlgeschlagen')}
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    const res = await testInstance(inst.id)
                    setTestState(prev => ({ ...prev, [inst.id]: res }))
                  }}
                  style={{ gap: 6 }}
                >
                  {result?.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  Testen
                </button>
              </div>
            )
          })}
        </div>
      </SectionCard>
    </div>
  )
}

function WidgetsTab() {
  const { widgets, createWidget, updateWidget, deleteWidget, loadWidgets } = useWidgetStore()
  const { confirm } = useConfirm()

  const [name, setName] = useState('')
  const [type, setType] = useState<WidgetType>('server_status')
  const [displayLocation, setDisplayLocation] = useState('content')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadWidgets().catch(() => {})
  }, [])

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
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary"
            disabled={busy || !name.trim()}
            onClick={async () => {
              setBusy(true)
              try {
                const payload = {
                  type,
                  name: name.trim(),
                  config: {},
                  display_location: displayLocation,
                  show_in_topbar: displayLocation === 'topbar',
                }
                if (editingId) {
                  await updateWidget(editingId, payload)
                } else {
                  await createWidget(payload)
                }
                setName('')
                setType('server_status')
                setDisplayLocation('content')
                setEditingId(null)
                await loadWidgets()
              } finally {
                setBusy(false)
              }
            }}
            style={{ gap: 8 }}
          >
            <LayoutGrid size={14} /> {editingId ? 'Widget speichern' : 'Widget anlegen'}
          </button>
          {editingId && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditingId(null)
                setName('')
                setType('server_status')
                setDisplayLocation('content')
              }}
            >
              Abbrechen
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxHeight: 420, overflow: 'auto' }}>
          {widgets.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 10).map(w => (
            <div key={w.id} className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{w.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{w.type} · {w.display_location ?? 'content'}</div>
              </div>
              <RowActions
                onEdit={() => {
                  setEditingId(w.id)
                  setName(w.name)
                  setType(w.type as WidgetType)
                  setDisplayLocation((w.display_location as string) || 'content')
                }}
                onDelete={async () => {
                  const ok = await confirm({ title: `"${w.name}" löschen?`, danger: true, confirmLabel: 'Löschen' })
                  if (!ok) return
                  await deleteWidget(w.id)
                  await loadWidgets()
                }}
              />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
