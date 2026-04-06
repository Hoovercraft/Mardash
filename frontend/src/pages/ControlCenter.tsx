import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useDashboardStore } from '../store/useDashboardStore'
import { useInstanceStore } from '../store/useInstanceStore'
import { useWidgetStore } from '../store/useWidgetStore'
import { useConfirm } from '../components/ConfirmDialog'
import type { InstanceType, Group, Service, Instance, BackupSource, BackupStatusResult } from '../types'
import type { WidgetType } from '../types'
import { Plus, AppWindow, Boxes, PlugZap, LayoutGrid, Pencil, Trash2, ExternalLink, Download, Upload, CheckCircle2, XCircle, HardDrive, RefreshCw } from 'lucide-react'
import { api, getIconUrl } from '../api'

type TabId = 'apps' | 'integrationen' | 'widgets' | 'dashboard' | 'design' | 'appdata_backup' | 'topbar'

const TAB_LIST: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'apps', label: 'Einträge', icon: <AppWindow size={14} /> },
  { id: 'dashboard', label: 'Dashboard', icon: <Boxes size={14} /> },
  { id: 'integrationen', label: 'Integrationen', icon: <PlugZap size={14} /> },
  { id: 'widgets', label: 'Widgets', icon: <LayoutGrid size={14} /> },
  { id: 'topbar', label: 'Topbar', icon: <LayoutGrid size={14} /> },
  { id: 'appdata_backup', label: 'Appdata-Backup', icon: <HardDrive size={14} /> },
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
    'weather',
  'home_assistant',
          'appdata_backup',
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

const DASHBOARDICONS_CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png'

function extractDashboardIconName(value: string) {
  const raw = value.trim()
  if (!raw) return ''
  const m = raw.match(/dashboard-icons\/png\/([^/?#]+?)(?:\.png)?(?:[?#].*)?$/i)
  if (m) return m[1]
  return raw.replace(/\.png$/i, '').trim()
}

function buildDashboardIconUrl(name: string) {
  const normalized = extractDashboardIconName(name)
  return normalized ? `${DASHBOARDICONS_CDN}/${normalized}.png` : ''
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      const base64 = result.includes(',') ? result.split(',', 2)[1] : result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Datei konnte nicht gelesen werden'))
    reader.readAsDataURL(file)
  })
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
  const [tab, setTab] = useState<TabId>(() => {
    const v = localStorage.getItem('mardash.controlcenter.tab')
    return (v as TabId) || 'apps'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <TabBar active={tab} onChange={setTab} />
      {tab === 'apps' && <EntriesTab />}
      {tab === 'integrationen' && <IntegrationenTab />}
      {tab === 'widgets' && <WidgetsTab />}
      {tab === 'dashboard' && <DashboardTab />}
      {tab === 'topbar' && <TopbarTab />}
      {tab === 'appdata_backup' && <AppdataBackupTab />}
      {tab === 'design' && <DesignTab />}
    </div>
  )
}

function EntriesTab() {
  const { groups, services, loadAll, createService, updateService, deleteService } = useStore()
  const { createGroup, loadDashboard } = useDashboardStore()
  const { confirm } = useConfirm()

  const [serviceName, setServiceName] = useState('')
  const [serviceUrl, setServiceUrl] = useState('')
  const [serviceGroup, setServiceGroup] = useState('')
  const [serviceIcon, setServiceIcon] = useState('')
  const [serviceIconMode, setServiceIconMode] = useState<'dashboardicons' | 'url' | 'upload'>('dashboardicons')
  const [serviceIconUploadBusy, setServiceIconUploadBusy] = useState(false)
  const serviceIconUploadRef = useRef<HTMLInputElement | null>(null)
  const [serviceBusy, setServiceBusy] = useState(false)
  const [serviceCheckEnabled, setServiceCheckEnabled] = useState(true)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [dashboardServiceIds, setDashboardServiceIds] = useState<string[]>([])
  const [serviceExporting, setServiceExporting] = useState(false)
  const [serviceImporting, setServiceImporting] = useState(false)
  const serviceImportRef = useRef<HTMLInputElement | null>(null)

  const refreshDashboardServices = async () => {
    const data = await api.dashboard.list()
    const ids = new Set<string>()

    for (const item of data.items ?? []) {
      if (item.type === 'service' && item.ref_id) ids.add(item.ref_id)
    }

    for (const group of data.groups ?? []) {
      for (const item of group.items ?? []) {
        if (item.type === 'service' && item.ref_id) ids.add(item.ref_id)
      }
    }

    setDashboardServiceIds(Array.from(ids))
  }

  useEffect(() => {
    loadAll().catch(() => {})
    refreshDashboardServices().catch(() => {})
  }, [])

  const sortedGroups = useMemo(
    () => [...groups].sort((a, b) => a.name.localeCompare(b.name)),
    [groups]
  )

  const sortedServices = useMemo(
    () => [...services].sort((a, b) => a.name.localeCompare(b.name)),
    [services]
  )

  const getGroupLabel = (groupId: string | null | undefined) => {
    if (!groupId) return 'Ohne Gruppe'
    return groups.find(g => g.id === groupId)?.name ?? 'Ohne Gruppe'
  }

  const getServiceIconKind = (service: Partial<Service>) => {
    if (service.icon_id) return 'dashboardicons lokal'
    if (service.icon_url) return 'Upload lokal'
    if (typeof service.icon === 'string' && service.icon.startsWith('http')) return 'externe URL'
    return 'kein Icon'
  }

  const submitService = async () => {
    setServiceBusy(true)
    try {
      const rawIcon = serviceIcon.trim()
      const payload: Partial<Service> = {
        name: serviceName.trim(),
        url: serviceUrl.trim(),
        icon: null,
        icon_id: null,
        group_id: serviceGroup || null,
        check_enabled: serviceCheckEnabled,
      }

      if (serviceIconMode === 'dashboardicons' && rawIcon) {
        const normalizedDashboardIconUrl = buildDashboardIconUrl(rawIcon)
        try {
          const downloaded = await api.icons.download(extractDashboardIconName(rawIcon), 'png')
          payload.icon_id = downloaded.id
          payload.icon = normalizedDashboardIconUrl || null
        } catch {
          payload.icon = normalizedDashboardIconUrl || null
          payload.icon_id = null
        }
      } else if (serviceIconMode === 'url' && rawIcon) {
        payload.icon = rawIcon
        payload.icon_id = null
      }

      if (editingServiceId) {
        await updateService(editingServiceId, payload)
      } else {
        await createService(payload)
      }

      setServiceName('')
      setServiceUrl('')
      setServiceGroup('')
      setServiceIcon('')
      setServiceIconMode('dashboardicons')
      setServiceCheckEnabled(true)
      setEditingServiceId(null)
      await loadAll()
      await refreshDashboardServices()
    } finally {
      setServiceBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16, alignItems: 'start' }}>
      <SectionCard title="Eintrag anlegen / bearbeiten" subtitle="Alle Kacheln zentral verwalten.">
        <input className="form-input" placeholder="Name" value={serviceName} onChange={e => setServiceName(e.target.value)} />
        <input className="form-input" placeholder="URL" value={serviceUrl} onChange={e => setServiceUrl(e.target.value)} />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setServiceIconMode('dashboardicons')}
            style={{
              gap: 6,
              background: serviceIconMode === 'dashboardicons' ? 'rgba(var(--accent-rgb), 0.12)' : undefined,
              border: serviceIconMode === 'dashboardicons' ? '1px solid rgba(var(--accent-rgb), 0.25)' : undefined,
              color: serviceIconMode === 'dashboardicons' ? 'var(--accent)' : undefined,
            }}
          >
            dashboardicons
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setServiceIconMode('url')}
            style={{
              gap: 6,
              background: serviceIconMode === 'url' ? 'rgba(var(--accent-rgb), 0.12)' : undefined,
              border: serviceIconMode === 'url' ? '1px solid rgba(var(--accent-rgb), 0.25)' : undefined,
              color: serviceIconMode === 'url' ? 'var(--accent)' : undefined,
            }}
          >
            Bild-URL
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setServiceIconMode('upload')}
            style={{
              gap: 6,
              background: serviceIconMode === 'upload' ? 'rgba(var(--accent-rgb), 0.12)' : undefined,
              border: serviceIconMode === 'upload' ? '1px solid rgba(var(--accent-rgb), 0.25)' : undefined,
              color: serviceIconMode === 'upload' ? 'var(--accent)' : undefined,
            }}
          >
            Upload
          </button>
        </div>

        {serviceIconMode === 'dashboardicons' && (
          <input
            className="form-input"
            placeholder="z. B. baikal, home-assistant, unraid"
            value={serviceIcon}
            onChange={e => setServiceIcon(extractDashboardIconName(e.target.value))}
          />
        )}

        {serviceIconMode === 'url' && (
          <input
            className="form-input"
            placeholder="https://…/icon.png"
            value={serviceIcon}
            onChange={e => setServiceIcon(e.target.value)}
          />
        )}

        {serviceIconMode === 'upload' && (
          <>
            <input
              ref={serviceIconUploadRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async e => {
                const file = e.target.files?.[0]
                if (!file || !editingServiceId) return
                setServiceIconUploadBusy(true)
                try {
                  await (await import('../api')).api.services.uploadIcon(editingServiceId, await fileToBase64(file), file.type)
                  await loadAll()
                  const updated = (await import('../api')).api
                  const current = (await updated).services.list
                  const freshServices = await current()
                  const fresh = freshServices.find(x => x.id === editingServiceId)
                  setServiceIcon(fresh?.icon_url || '')
                } finally {
                  setServiceIconUploadBusy(false)
                  if (serviceIconUploadRef.current) serviceIconUploadRef.current.value = ''
                }
              }}
            />
            <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', fontSize: 12, color: 'var(--text-muted)' }}>
              Upload setzt ein lokales Bild für bestehende Einträge. Für neue Einträge erst speichern, dann hochladen.
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={!editingServiceId || serviceIconUploadBusy}
              onClick={() => serviceIconUploadRef.current?.click()}
              style={{ gap: 8 }}
            >
              <Upload size={14} /> {serviceIconUploadBusy ? 'Lädt…' : 'Bild von Platte wählen'}
            </button>
          </>
        )}

        <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, background: 'var(--bg-elevated)', overflow: 'hidden', flexShrink: 0 }}>
            {serviceIconMode === 'dashboardicons' && serviceIcon.trim() ? (
              <img
                src={buildDashboardIconUrl(serviceIcon)}
                alt=""
                style={{ width: 24, height: 24, objectFit: 'contain' }}
              />
            ) : serviceIconMode === 'url' && serviceIcon.trim() ? (
              <img
                src={serviceIcon.trim()}
                alt=""
                style={{ width: 24, height: 24, objectFit: 'contain' }}
              />
            ) : serviceIconMode === 'upload' && serviceIcon.trim() ? (
              <img
                src={serviceIcon.trim()}
                alt=""
                style={{ width: 24, height: 24, objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
            )}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Icon-Vorschau</div>
              <span
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'rgba(var(--accent-rgb), 0.10)',
                  border: '1px solid rgba(var(--accent-rgb), 0.20)',
                  color: 'var(--accent)',
                  whiteSpace: 'nowrap',
                }}
              >
                {serviceIconMode === 'dashboardicons'
                  ? 'dashboardicons'
                  : serviceIconMode === 'url'
                    ? 'externe URL'
                    : 'Upload lokal'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 4 }}>
              {serviceIconMode === 'dashboardicons'
                ? (serviceIcon.trim() ? extractDashboardIconName(serviceIcon) : 'Noch kein Name')
                : serviceIconMode === 'url'
                  ? (serviceIcon.trim() ? 'Externe Bild-URL gesetzt' : 'Noch keine Bild-URL')
                  : (editingServiceId ? (serviceIcon.trim() ? 'Lokales Upload-Icon gesetzt' : 'Noch kein Upload gesetzt') : 'Upload nach erstem Speichern möglich')}
            </div>
          </div>
        </div>
        <select className="form-input" value={serviceGroup} onChange={e => setServiceGroup(e.target.value)}>
          <option value="">Ohne Gruppe</option>
          {sortedGroups.map((g: Group) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={serviceCheckEnabled} onChange={e => setServiceCheckEnabled(e.target.checked)} />
          Statuscheck aktivieren
        </label>
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
            <Plus size={14} /> {editingServiceId ? 'Eintrag speichern' : 'Eintrag hinzufügen'}
          </button>
          {editingServiceId && (
            <button
              className="btn btn-ghost"
              onClick={() => {
                setEditingServiceId(null)
                setServiceName('')
                setServiceUrl('')
                setServiceGroup('')
                setServiceIcon('')
                setServiceIconMode('dashboardicons')
                setServiceCheckEnabled(true)
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
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Jeder Eintrag nutzt dieselbe Logik: Name, URL, Gruppe, Statuscheck und Icon.
          </div>
          {sortedServices.length === 0 ? (
            <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
              Noch keine Einträge vorhanden.
            </div>
          ) : sortedServices.map(s => {
            const onDashboard = dashboardServiceIds.includes(s.id)
            return (
            <div key={s.id} className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.url}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span>Gruppe: {getGroupLabel(s.group_id)}</span>
                  <span>{s.check_enabled ? 'Statuscheck: an' : 'Statuscheck: aus'}</span>
                  <span>Icon-Typ: {getServiceIconKind(s)}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={async () => {
                    if (onDashboard) {
                      await api.dashboard.removeByRef('service', s.id)
                    } else {
                      await api.dashboard.addItem('service', s.id)
                    }
                    await refreshDashboardServices()
                    await loadDashboard()
                  }}
                >
                  {onDashboard ? 'Vom Dashboard entfernen' : 'Auf Dashboard anzeigen'}
                </button>
                <RowActions
                  onEdit={() => {
                    setEditingServiceId(s.id)
                    setServiceName(s.name)
                    setServiceUrl(s.url)
                    setServiceGroup(s.group_id ?? '')
                    const iconValue = typeof s.icon === 'string' ? s.icon : ''
                    if (s.icon_id && iconValue.includes('dashboard-icons/')) {
                      setServiceIcon(extractDashboardIconName(iconValue))
                      setServiceIconMode('dashboardicons')
                    } else if (s.icon_id && !iconValue) {
                      setServiceIcon('')
                      setServiceIconMode('dashboardicons')
                    } else if (iconValue.includes('dashboard-icons/')) {
                      setServiceIcon(extractDashboardIconName(iconValue))
                      setServiceIconMode('dashboardicons')
                    } else if (iconValue.startsWith('http')) {
                      setServiceIcon(iconValue)
                      setServiceIconMode('url')
                    } else {
                      setServiceIcon('')
                      setServiceIconMode('dashboardicons')
                    }
                    setServiceCheckEnabled(Boolean(s.check_enabled))
                  }}
                  onDelete={async () => {
                    const ok = await confirm({ title: `"${s.name}" löschen?`, danger: true, confirmLabel: 'Löschen' })
                    if (!ok) return
                    await deleteService(s.id)
                    await refreshDashboardServices()
                    await loadAll()
                  }}
                />
              </div>
            </div>
          )})}
        </div>
      </SectionCard>

    </div>
  )
}

function TopbarTab() {
  const items = [
    { key: 'time', label: 'Datum / Uhrzeit', note: 'bereits aktiv' },
    { key: 'unraid', label: 'Unraid', note: 'Ampel + interner Link zur Unraid-Seite' },
    { key: 'backup', label: 'Appdata-Backup', note: 'Ampelstatus, Detailprüfung bei Rot' },
    { key: 'weather', label: 'Wetter', note: 'kompakt + externer Wetter/Radar-Link' },
    { key: 'pollen', label: 'Pollenflug', note: 'kompakt + externer Pollen-Link' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 760px)', gap: 16 }}>
      <SectionCard title="Topbar" subtitle="Feste Zielreihenfolge statt Live-Bearbeitung in der Topbar.">
        <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: 13 }}>
          Die Topbar bleibt reine Anzeige. Konfiguration erfolgt zentral hier im Control Center.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((item, idx) => (
            <div
              key={item.key}
              className="glass"
              style={{
                padding: 12,
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>{idx + 1}. {item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.note}</div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'rgba(var(--accent-rgb), 0.10)',
                  border: '1px solid rgba(var(--accent-rgb), 0.20)',
                  color: 'var(--accent)',
                  whiteSpace: 'nowrap',
                }}
              >
                geplant
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

function AppdataBackupTab() {
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [name, setName] = useState('Appdata-Backup')
  const [logPath, setLogPath] = useState('/boot/logs/CA_backup.log')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<BackupStatusResult | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const sources = await (await import('../api')).api.backup.sources.list()
        const ca = sources.find((s: BackupSource) => s.type === 'ca_backup')
        if (ca) {
          setSourceId(ca.id)
          setName(ca.name)
          setEnabled(ca.enabled)
          setLogPath((ca.config?.logPath as string) || '/boot/logs/CA_backup.log')
        }
        const data = await (await import('../api')).api.backup.status()
        const found = data.sources.find((s: BackupStatusResult) => s.type === 'ca_backup') ?? null
        setStatus(found)
      } finally {
        setLoading(false)
      }
    }
    load().catch(() => {})
  }, [])

  const refreshStatus = async () => {
    const data = await (await import('../api')).api.backup.status()
    const found = data.sources.find((s: BackupStatusResult) => s.type === 'ca_backup') ?? null
    setStatus(found)
  }

  const save = async () => {
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        type: 'ca_backup',
        enabled,
        config: { logPath: logPath.trim() },
      }
      if (sourceId) {
        await (await import('../api')).api.backup.sources.update(sourceId, payload)
      } else {
        const created = await (await import('../api')).api.backup.sources.create(payload)
        setSourceId(created.id)
      }
      await refreshStatus()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 720px)', gap: 16 }}>
      <SectionCard title="Appdata-Backup-Monitor" subtitle="Überwacht das Unraid CA Backup Log für Appdata-Backups.">
        <input className="form-input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="form-input" placeholder="/boot/logs/CA_backup.log" value={logPath} onChange={e => setLogPath(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
          Aktiv
        </label>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={saving || !name.trim() || !logPath.trim()} onClick={save} style={{ gap: 8 }}>
            <HardDrive size={14} /> Speichern
          </button>
          <button className="btn btn-ghost" disabled={loading} onClick={refreshStatus} style={{ gap: 8 }}>
            <RefreshCw size={14} /> Status laden
          </button>
        </div>

        <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', marginTop: 8 }}>
          {!status ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Noch kein Status geladen.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              <div><strong>Status:</strong> {status.error ? 'Fehler' : status.success === true ? 'OK' : status.success === false ? 'Warnung' : 'Unbekannt'}</div>
              <div><strong>Letzter Lauf:</strong> {status.lastRun ?? '—'}</div>
              <div><strong>Größe:</strong> {status.size ?? '—'}</div>
              {status.error && <div style={{ color: 'var(--status-offline)' }}><strong>Fehler:</strong> {status.error}</div>}
            </div>
          )}
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
  const { settings, updateSettings, loadSettings, loadAll, groups } = useStore()
  const { createGroup, loadDashboard } = useDashboardStore()
  const [dashboardTitle, setDashboardTitle] = useState('')
  const [titleBusy, setTitleBusy] = useState(false)
  const [dashboardGroupName, setDashboardGroupName] = useState('')
  const [groupBusy, setGroupBusy] = useState(false)

  useEffect(() => {
    loadSettings().catch(() => {})
    loadAll().catch(() => {})
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

      <SectionCard title="Dashboard-Gruppen" subtitle="Gruppen anlegen und vorhandene Gruppen sehen.">
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
              await loadAll()
              await loadSettings()
            } finally {
              setGroupBusy(false)
            }
          }}
          style={{ gap: 8 }}
        >
          <Boxes size={14} /> Gruppe anlegen
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxHeight: 320, overflow: 'auto' }}>
          {groups.length === 0 ? (
            <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
              Noch keine Gruppen vorhanden.
            </div>
          ) : (
            [...groups].sort((a, b) => a.name.localeCompare(b.name)).map(g => (
              <div key={g.id} className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)' }}>
                <div style={{ fontWeight: 600 }}>{g.name}</div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  )
}

function IntegrationenTab() {
  const { instances, createInstance, updateInstance, deleteInstance, loadInstances, testInstance } = useInstanceStore()

  const [type, setType] = useState<InstanceType>('generic')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [testState, setTestState] = useState<Record<string, { ok: boolean; error?: string } | null>>({})

  useEffect(() => {
    loadInstances().catch(() => {})
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setType('generic')
    setName('')
    setUrl('')
    setToken('')
    setApiKey('')
  }

  const submitInstance = async () => {
    setBusy(true)
    try {
      const payload = {
        type,
        name: name.trim(),
        url: url.trim(),
        token: token.trim() || undefined,
        api_key: apiKey.trim() || undefined,
        enabled: true,
      }

      if (editingId) {
        await updateInstance(editingId, payload)
      } else {
        await createInstance(payload)
      }

      resetForm()
      await loadInstances()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 560px)', gap: 16 }}>
      <SectionCard title="Instanz anlegen / bearbeiten" subtitle="Zentrale Anlage für Integrationen und externe Dienste.">
        <select className="form-input" value={type} onChange={e => setType(e.target.value as InstanceType)}>
          {INSTANCE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <input className="form-input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <input className="form-input" placeholder="URL" value={url} onChange={e => setUrl(e.target.value)} />
        <input
          className="form-input"
          placeholder={type === 'home_assistant' ? 'Token (nur neu setzen, wenn ändern)' : 'API-Key / Token (nur neu setzen, wenn ändern)'}
          value={type === 'home_assistant' ? token : apiKey}
          onChange={e => type === 'home_assistant' ? setToken(e.target.value) : setApiKey(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            disabled={busy || !name.trim() || !url.trim()}
            onClick={submitInstance}
            style={{ gap: 8 }}
          >
            <PlugZap size={14} /> {editingId ? 'Instanz speichern' : 'Instanz anlegen'}
          </button>
          {editingId && (
            <button className="btn btn-ghost" onClick={resetForm}>
              Abbrechen
            </button>
          )}
        </div>

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
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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

                  <RowActions
                    onEdit={() => {
                      setEditingId(inst.id)
                      setType(inst.type as InstanceType)
                      setName(inst.name)
                      setUrl(inst.url)
                      setToken('')
                      setApiKey('')
                    }}
                    onDelete={async () => {
                      const ok = window.confirm(`"${inst.name}" löschen?`)
                      if (!ok) return
                      await deleteInstance(inst.id)
                      await loadInstances()
                      if (editingId === inst.id) resetForm()
                    }}
                  />
                </div>
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
  const [displayLocation, setDisplayLocation] = useState('none')
  const [weatherInputMode, setWeatherInputMode] = useState<'city' | 'coords'>('city')
  const [weatherCity, setWeatherCity] = useState('')
  const [weatherLat, setWeatherLat] = useState('')
  const [weatherLon, setWeatherLon] = useState('')
  const [weatherLocationName, setWeatherLocationName] = useState('')
  const [weatherGeoError, setWeatherGeoError] = useState('')
  const [weatherGeocoding, setWeatherGeocoding] = useState(false)
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
          <option value="none">Dashboard</option>
          <option value="topbar">Topbar</option>
          <option value="sidebar">Sidebar</option>
        </select>

        {type === 'weather' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setWeatherInputMode('city'); setWeatherGeoError('') }}
                style={{ flex: 1 }}
              >
                Stadt
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => { setWeatherInputMode('coords'); setWeatherGeoError('') }}
                style={{ flex: 1 }}
              >
                Koordinaten
              </button>
            </div>

            {weatherInputMode === 'city' ? (
              <input
                className="form-input"
                placeholder="z. B. Gelsenkirchen-Buer"
                value={weatherCity}
                onChange={e => { setWeatherCity(e.target.value); setWeatherGeoError('') }}
              />
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" placeholder="Breitengrad" value={weatherLat} onChange={e => setWeatherLat(e.target.value)} />
                <input className="form-input" placeholder="Längengrad" value={weatherLon} onChange={e => setWeatherLon(e.target.value)} />
              </div>
            )}

            <input
              className="form-input"
              placeholder="Anzeigename, z. B. Buer"
              value={weatherLocationName}
              onChange={e => setWeatherLocationName(e.target.value)}
            />

            {weatherGeoError && <div style={{ fontSize: 12, color: 'var(--status-offline)' }}>{weatherGeoError}</div>}
            {weatherGeocoding && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Stadt wird gesucht…</div>}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary"
            disabled={busy || !name.trim()}
            onClick={async () => {
              setBusy(true)
              try {
                let config: object = {}

                if (type === 'weather') {
                  if (weatherInputMode === 'city') {
                    if (!weatherCity.trim()) throw new Error('Stadt fehlt')
                    setWeatherGeoError('')
                    setWeatherGeocoding(true)
                    try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(weatherCity.trim())}&format=json&limit=1`)
                      const geoData = await res.json() as Array<{ lat: string; lon: string; display_name: string }>
                      if (!geoData.length) {
                        setWeatherGeoError('Stadt nicht gefunden')
                        setWeatherGeocoding(false)
                        return
                      }
                      const locationName = weatherLocationName.trim() || geoData[0].display_name.split(',')[0].trim()
                      config = {
                        lat: parseFloat(geoData[0].lat),
                        lon: parseFloat(geoData[0].lon),
                        location_name: locationName,
                        city_name: weatherCity.trim(),
                      } satisfies WeatherWidgetConfig
                    } catch {
                      setWeatherGeoError('Geocodierung fehlgeschlagen')
                      setWeatherGeocoding(false)
                      return
                    }
                    setWeatherGeocoding(false)
                  } else {
                    const latNum = parseFloat(weatherLat)
                    const lonNum = parseFloat(weatherLon)
                    if (Number.isNaN(latNum) || Number.isNaN(lonNum)) throw new Error('Koordinaten fehlen')
                    config = {
                      lat: latNum,
                      lon: lonNum,
                      ...(weatherLocationName.trim() ? { location_name: weatherLocationName.trim() } : {}),
                    } satisfies WeatherWidgetConfig
                  }
                }

                const payload = {
                  type,
                  name: name.trim(),
                  config,
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
                setDisplayLocation('none')
                setEditingId(null)
                setWeatherCity('')
                setWeatherLat('')
                setWeatherLon('')
                setWeatherLocationName('')
                setWeatherGeoError('')
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
                setDisplayLocation('none')
                setWeatherCity('')
                setWeatherLat('')
                setWeatherLon('')
                setWeatherLocationName('')
                setWeatherGeoError('')
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
                  setDisplayLocation((w.display_location as string) || 'none')
                  if (w.type === 'weather') {
                    const cfg = w.config as WeatherWidgetConfig
                    if (cfg.city_name) {
                      setWeatherInputMode('city')
                      setWeatherCity(cfg.city_name)
                    } else {
                      setWeatherInputMode('coords')
                      setWeatherCity('')
                    }
                    setWeatherLat(String(cfg.lat ?? ''))
                    setWeatherLon(String(cfg.lon ?? ''))
                    setWeatherLocationName(cfg.location_name ?? '')
                    setWeatherGeoError('')
                  }
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
