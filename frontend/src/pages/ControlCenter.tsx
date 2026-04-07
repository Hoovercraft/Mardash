import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { useDashboardStore } from '../store/useDashboardStore'
import { useInstanceStore } from '../store/useInstanceStore'
import { useHaStore } from '../store/useHaStore'
import { useWidgetStore } from '../store/useWidgetStore'
import { useConfirm } from '../components/ConfirmDialog'
import type { Group, Service, Instance, BackupSource, BackupStatusResult } from '../types'
import { Plus, AppWindow, PlugZap, LayoutGrid, Pencil, Trash2, Download, Upload, CheckCircle2, XCircle, HardDrive, RefreshCw } from 'lucide-react'
import { api } from '../api'

type TabId = 'apps' | 'integrationen' | 'widgets'
type ControlCenterInstanceType = 'home_assistant' | 'unraid' | 'generic'
type ControlCenterWidgetType = 'unraid_status' | 'appdata_backup'


const TAB_LIST: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'apps', label: 'Einträge', icon: <AppWindow size={14} /> },
  { id: 'integrationen', label: 'Integrationen', icon: <PlugZap size={14} /> },
  { id: 'widgets', label: 'Widgets', icon: <LayoutGrid size={14} /> },
]

const INSTANCE_TYPES: ControlCenterInstanceType[] = [
  'unraid',
  'home_assistant',
]

const WIDGET_TYPES: ControlCenterWidgetType[] = [
  'unraid_status',
  'appdata_backup',
]

const FIXED_SERVICE_GROUPS = [
  'Externe Server',
  'Interne Dienste',
  'Internet',
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
    if (v === 'dashboard' || v === 'topbar' || v === 'design') {
      localStorage.setItem('mardash.controlcenter.tab', 'apps')
      return 'apps'
    }
    if (v === 'appdata_backup') {
      localStorage.setItem('mardash.controlcenter.tab', 'integrationen')
      return 'integrationen'
    }
    return (v as TabId) || 'apps'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <TabBar active={tab} onChange={setTab} />
      {tab === 'apps' && <EntriesTab />}
      {tab === 'integrationen' && <IntegrationenTab />}
      {tab === 'widgets' && <WidgetsTab />}
    </div>
  )
}

function EntriesTab() {
  const { groups, services, loadAll, createService, updateService, deleteService, reorderServices } = useStore()
  const { loadDashboard } = useDashboardStore()
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

  const ensureFixedGroups = async () => {
    const currentGroups = await api.groups.list()
    const existing = new Set(currentGroups.map(g => g.name))
    const missing = FIXED_SERVICE_GROUPS.filter(name => !existing.has(name))
    if (missing.length === 0) return

    for (const name of missing) {
      await api.groups.create({ name })
    }
    await loadAll()
  }

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

  useEffect(() => {
    if (groups.length > 0) return
    ;(async () => {
      await ensureFixedGroups()
    })().catch(() => {})
  }, [groups.length])

  useEffect(() => {
    if (groups.length === 0) return
    const hasAllFixedGroups = FIXED_SERVICE_GROUPS.every(name => groups.some(g => g.name === name))
    if (hasAllFixedGroups) return
    ensureFixedGroups().catch(() => {})
  }, [groups])

  const sortedGroups = useMemo(
    () => FIXED_SERVICE_GROUPS
      .map(name => groups.find(g => g.name === name))
      .filter((g): g is Group => Boolean(g)),
    [groups]
  )

  const sortedServices = useMemo(() => {
    const groupRank = (groupId: string | null | undefined) => {
      if (!groupId) return FIXED_SERVICE_GROUPS.length
      const name = groups.find(g => g.id === groupId)?.name ?? ''
      const idx = FIXED_SERVICE_GROUPS.indexOf(name)
      return idx >= 0 ? idx : FIXED_SERVICE_GROUPS.length + 1
    }

    return [...services].sort((a, b) => {
      const rankA = groupRank(a.group_id)
      const rankB = groupRank(b.group_id)
      if (rankA !== rankB) return rankA - rankB

      const posA = typeof a.position_x === 'number' ? a.position_x : Number.MAX_SAFE_INTEGER
      const posB = typeof b.position_x === 'number' ? b.position_x : Number.MAX_SAFE_INTEGER
      if (posA !== posB) return posA - posB

      return a.name.localeCompare(b.name)
    })
  }, [services, groups])

  const serviceSections = useMemo(() => {
    const sections = FIXED_SERVICE_GROUPS.map(name => {
      const group = groups.find(g => g.name === name)
      return {
        label: name,
        services: group ? sortedServices.filter(s => s.group_id === group.id) : [],
      }
    })

    const ungrouped = sortedServices.filter(s => !s.group_id)

    return [
      ...sections.filter(section => section.services.length > 0),
      ...(ungrouped.length > 0 ? [{ label: 'Ohne Gruppe', services: ungrouped }] : []),
    ]
  }, [groups, sortedServices])

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

  const moveServiceWithinGroup = async (serviceId: string, direction: -1 | 1) => {
    const currentService = services.find(s => s.id === serviceId)
    if (!currentService) return

    const currentGroupId = currentService.group_id ?? null
    const sameGroup = sortedServices.filter(s => (s.group_id ?? null) === currentGroupId)
    const ids = sameGroup.map(s => s.id)
    const index = ids.indexOf(serviceId)
    const target = index + direction

    if (index < 0 || target < 0 || target >= ids.length) return

    const next = [...ids]
    const [moved] = next.splice(index, 1)
    next.splice(target, 0, moved)

    await reorderServices(currentGroupId, next)
    await loadAll()
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Jeder Eintrag nutzt dieselbe Logik: Name, URL, Gruppe, Statuscheck und Icon.
          </div>
          {serviceSections.length === 0 ? (
            <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
              Noch keine Einträge vorhanden.
            </div>
          ) : serviceSections.map(section => (
            <div key={section.label} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  paddingBottom: 4,
                  borderBottom: '1px solid var(--glass-border)',
                  marginTop: 4,
                }}
              >
                {section.label}
              </div>
              {section.services.map(s => {
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {(() => {
                  const ids = section.services.map(x => x.id)
                  const idx = ids.indexOf(s.id)
                  return (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={async () => { await moveServiceWithinGroup(s.id, -1) }}
                        disabled={idx <= 0}
                        title="Nach oben"
                        style={{ minWidth: 34, padding: '6px 8px' }}
                      >
                        ↑
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={async () => { await moveServiceWithinGroup(s.id, 1) }}
                        disabled={idx === -1 || idx >= ids.length - 1}
                        title="Nach unten"
                        style={{ minWidth: 34, padding: '6px 8px' }}
                      >
                        ↓
                      </button>
                    </div>
                  )
                })()}
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
          ))}
        </div>
      </SectionCard>

    </div>
  )
}


function AppdataBackupTab({ unraidReady }: { unraidReady: boolean }) {
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [name, setName] = useState('Appdata-Backup')
  const [logPath, setLogPath] = useState('/boot/logs/CA_backup.log')
  const [enabled, setEnabled] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<BackupStatusResult | null>(null)

  useEffect(() => {
    if (!unraidReady) return

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
    if (!unraidReady) return
    const data = await (await import('../api')).api.backup.status()
    const found = data.sources.find((s: BackupStatusResult) => s.type === 'ca_backup') ?? null
    setStatus(found)
  }

  const save = async () => {
    if (!unraidReady) return
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
    <SectionCard title="Appdata-Backup" subtitle="Überwacht das Unraid CA Backup Log für Appdata-Backups.">
        {!unraidReady && (
          <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: 13 }}>
            Erst Unraid einrichten. Danach kann Appdata-Backup aktiviert und geprüft werden.
          </div>
        )}

        <input className="form-input" placeholder="Name" value={name} onChange={e => setName(e.target.value)} disabled={!unraidReady} />
        <input className="form-input" placeholder="/boot/logs/CA_backup.log" value={logPath} onChange={e => setLogPath(e.target.value)} disabled={!unraidReady} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} disabled={!unraidReady} />
          Aktiv
        </label>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-primary" disabled={!unraidReady || saving || !name.trim() || !logPath.trim()} onClick={save} style={{ gap: 8 }}>
            <HardDrive size={14} /> Speichern
          </button>
          <button className="btn btn-ghost" disabled={!unraidReady || loading} onClick={refreshStatus} style={{ gap: 8 }}>
            <RefreshCw size={14} /> Status laden
          </button>
        </div>

        <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', marginTop: 8 }}>
          {!unraidReady ? (
            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Unraid ist noch nicht eingerichtet.</div>
          ) : !status ? (
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
  )
}



function IntegrationenTab() {
  const { instances, createInstance, updateInstance, deleteInstance, loadInstances, testInstance } = useInstanceStore()
  const { instances: haInstances, loadInstances: loadHaInstances, createInstance: createHaInstance, updateInstance: updateHaInstance, deleteInstance: deleteHaInstance } = useHaStore()
  const { widgets, createWidget, updateWidget, loadWidgets } = useWidgetStore()

  const [unraidName, setUnraidName] = useState('Unraid')
  const [unraidUrl, setUnraidUrl] = useState('')
  const [unraidToken, setUnraidToken] = useState('')
  const [haName, setHaName] = useState('Home Assistant')
  const [haUrl, setHaUrl] = useState('')
  const [haToken, setHaToken] = useState('')
  const [weatherInputMode, setWeatherInputMode] = useState<'city' | 'coords'>('city')
  const [weatherCity, setWeatherCity] = useState('')
  const [weatherLat, setWeatherLat] = useState('')
  const [weatherLon, setWeatherLon] = useState('')
  const [weatherLocationName, setWeatherLocationName] = useState('')
  const [weatherGeoError, setWeatherGeoError] = useState('')
  const [weatherGeocoding, setWeatherGeocoding] = useState(false)
  const [busy, setBusy] = useState<'unraid' | 'home_assistant' | 'weather' | null>(null)
  const [testState, setTestState] = useState<Record<string, { ok: boolean; error?: string } | null>>({})

  useEffect(() => {
    loadInstances().catch(() => {})
    loadHaInstances().catch(() => {})
    loadWidgets().catch(() => {})
  }, [])

  const unraidInstance = instances.find(i => i.type === 'unraid') ?? null
  const haInstance = haInstances[0] ?? null

  useEffect(() => {
    if (unraidInstance) {
      setUnraidName(unraidInstance.name || 'Unraid')
      setUnraidUrl(unraidInstance.url || '')
      setUnraidToken('')
    }
  }, [unraidInstance?.id, unraidInstance?.name, unraidInstance?.url])

  useEffect(() => {
    if (haInstance) {
      setHaName(haInstance.name || 'Home Assistant')
      setHaUrl(haInstance.url || '')
      setHaToken('')
    }
  }, [haInstance?.id, haInstance?.name, haInstance?.url])

  useEffect(() => {
    const weatherWidget = widgets.find(w => w.type === 'weather')
    if (!weatherWidget) return
    const cfg = weatherWidget.config as any
    if (cfg?.city_name) {
      setWeatherInputMode('city')
      setWeatherCity(cfg.city_name)
    } else {
      setWeatherInputMode('coords')
      setWeatherCity('')
    }
    setWeatherLat(String(cfg?.lat ?? ''))
    setWeatherLon(String(cfg?.lon ?? ''))
    setWeatherLocationName(cfg?.location_name ?? '')
    setWeatherGeoError('')
  }, [widgets])

  const saveIntegration = async (kind: 'unraid' | 'home_assistant') => {
    setBusy(kind)
    try {
      if (kind === 'unraid') {
        const payload = {
          type: 'unraid' as const,
          name: unraidName.trim() || 'Unraid',
          url: unraidUrl.trim(),
          api_key: unraidToken.trim() || undefined,
          enabled: true,
        }
        if (unraidInstance) {
          await updateInstance(unraidInstance.id, payload)
        } else {
          await createInstance(payload)
        }
      } else {
        const payload = {
          name: haName.trim() || 'Home Assistant',
          url: haUrl.trim(),
          token: haToken.trim() || undefined,
          enabled: true,
        }
        if (haInstance) {
          await updateHaInstance(haInstance.id, payload)
        } else {
          await createHaInstance(payload)
        }
      }

      await loadInstances()
      await loadHaInstances()
    } finally {
      setBusy(null)
    }
  }

  const removeIntegration = async (kind: 'unraid' | 'home_assistant') => {
    const instance = kind === 'unraid' ? unraidInstance : haInstance
    if (!instance) return
    const ok = window.confirm(`"${instance.name}" löschen?`)
    if (!ok) return
    if (kind === 'unraid') {
      await deleteInstance(instance.id)
      await loadInstances()
    } else {
      await deleteHaInstance(instance.id)
      await loadHaInstances()
    }
  }

  const testIntegration = async (kind: 'unraid' | 'home_assistant') => {
    const instance = kind === 'unraid' ? unraidInstance : haInstance
    if (!instance) return
    const res = kind === 'unraid'
      ? await testInstance(instance.id)
      : await api.ha.instances.test(instance.id)
    setTestState(prev => ({ ...prev, [instance.id]: res }))
  }

  const weatherWidget = widgets.find(w => w.type === 'weather') ?? null

  const saveWeatherIntegration = async () => {
    setBusy('weather')
    try {
      let config: Record<string, unknown> = {}

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
          }
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
        }
      }

      const payload = {
        type: 'weather',
        name: 'Wetter',
        config,
        display_location: 'none',
        show_in_topbar: false,
      }

      if (weatherWidget) {
        await updateWidget(weatherWidget.id, payload)
      } else {
        await createWidget(payload)
      }

      await loadWidgets()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 560px))', gap: 16 }}>
        <SectionCard title="Unraid" subtitle="Feste Integration für Status, Links und Appdata-Backup.">
          <input className="form-input" placeholder="Name" value={unraidName} onChange={e => setUnraidName(e.target.value)} />
          <input className="form-input" placeholder="URL" value={unraidUrl} onChange={e => setUnraidUrl(e.target.value)} />
          <input
            className="form-input"
            placeholder="Unraid API-Key / Token (nur neu setzen, wenn ändern)"
            value={unraidToken}
            onChange={e => setUnraidToken(e.target.value)}
          />

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              disabled={busy === 'unraid' || !unraidUrl.trim()}
              onClick={() => { void saveIntegration('unraid') }}
              style={{ gap: 8 }}
            >
              <PlugZap size={14} /> {unraidInstance ? 'Speichern' : 'Einrichten'}
            </button>
            <button
              className="btn btn-ghost"
              disabled={!unraidInstance}
              onClick={() => { void testIntegration('unraid') }}
              style={{ gap: 8 }}
            >
              {testState[unraidInstance?.id || '']?.ok ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              Testen
            </button>
            <button
              className="btn btn-ghost"
              disabled={!unraidInstance}
              onClick={() => { void removeIntegration('unraid') }}
              style={{ gap: 8 }}
            >
              <Trash2 size={14} /> Entfernen
            </button>
          </div>

          <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', fontSize: 13, color: 'var(--text-muted)' }}>
            {unraidInstance
              ? (testState[unraidInstance.id]
                  ? (testState[unraidInstance.id]?.ok ? 'Test erfolgreich.' : (testState[unraidInstance.id]?.error || 'Test fehlgeschlagen.'))
                  : 'Integration eingerichtet.')
              : 'Noch nicht eingerichtet.'}
          </div>
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 560px))', gap: 16 }}>
        <SectionCard title="Wetter" subtitle="Feste Integration für Wetterdaten und spätere Wetter-Widgets.">
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

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              disabled={busy === 'weather'}
              onClick={() => { void saveWeatherIntegration() }}
              style={{ gap: 8 }}
            >
              <PlugZap size={14} /> {weatherWidget ? 'Speichern' : 'Einrichten'}
            </button>
          </div>

          <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', fontSize: 13, color: 'var(--text-muted)' }}>
            {weatherWidget ? 'Integration eingerichtet.' : 'Noch nicht eingerichtet.'}
          </div>
        </SectionCard>

        <SectionCard title="Pollen" subtitle="Feste Integration für spätere Pollen-Daten und Widgets.">
          <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: 13 }}>
            Dieser Block ist vorbereitet. Die eigentliche Pollen-Datenquelle kommt im nächsten Schritt.
          </div>
          <button className="btn btn-ghost" disabled style={{ gap: 8 }}>
            <PlugZap size={14} /> Bald verfügbar
          </button>
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 720px)', gap: 16 }}>
        <AppdataBackupTab unraidReady={Boolean(unraidInstance)} />
      </div>
    </div>
  )
}

function WidgetsTab() {
  const { widgets, createWidget, updateWidget, deleteWidget, loadWidgets } = useWidgetStore()
  const { instances } = useInstanceStore()
  const { confirm } = useConfirm()

  const [busy, setBusy] = useState<ControlCenterWidgetType | null>(null)

  useEffect(() => {
    loadWidgets().catch(() => {})
  }, [])

  const unraidReady = instances.some(i => i.type === 'unraid')

  const widgetByType = (type: ControlCenterWidgetType) => widgets.find(w => w.type === type) ?? null

  const saveWidget = async (type: ControlCenterWidgetType, name: string, displayLocation: 'none' | 'topbar' | 'sidebar' = 'none') => {
    setBusy(type)
    try {
      const payload = {
        type,
        name,
        config: {},
        display_location: displayLocation,
        show_in_topbar: displayLocation === 'topbar',
      }

      const existing = widgetByType(type)
      if (existing) {
        await updateWidget(existing.id, payload)
      } else {
        await createWidget(payload)
      }

      await loadWidgets()
    } finally {
      setBusy(null)
    }
  }

  const removeWidget = async (type: ControlCenterWidgetType) => {
    const existing = widgetByType(type)
    if (!existing) return
    const ok = await confirm({ title: `"${existing.name}" löschen?`, danger: true, confirmLabel: 'Löschen' })
    if (!ok) return
    await deleteWidget(existing.id)
    await loadWidgets()
  }

  const renderStatus = (type: ControlCenterWidgetType, missingDependencyText: string | null = null) => {
    const existing = widgetByType(type)
    if (missingDependencyText) return missingDependencyText
    if (!existing) return 'Noch nicht eingerichtet.'
    return `Eingerichtet · ${existing.display_location ?? 'content'}`
  }

  const unraidStatusWidget = widgetByType('unraid_status')
  const appdataBackupWidget = widgetByType('appdata_backup')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 560px))', gap: 16 }}>
        <SectionCard title="Unraid Status" subtitle="Status-Widget für den Unraid-Server.">
          <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', fontSize: 13, color: 'var(--text-muted)' }}>
            {renderStatus('unraid_status', unraidReady ? null : 'Erst Unraid einrichten.')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              disabled={!unraidReady || busy === 'unraid_status'}
              onClick={() => { void saveWidget('unraid_status', 'Unraid Status', 'none') }}
              style={{ gap: 8 }}
            >
              <LayoutGrid size={14} /> {unraidStatusWidget ? 'Speichern' : 'Einrichten'}
            </button>
            <button
              className="btn btn-ghost"
              disabled={!unraidStatusWidget}
              onClick={() => { void removeWidget('unraid_status') }}
              style={{ gap: 8 }}
            >
              <Trash2 size={14} /> Entfernen
            </button>
          </div>
        </SectionCard>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 560px))', gap: 16 }}>

        <SectionCard title="Appdata-Backup" subtitle="Widget für den Appdata-Backup-Status.">
          <div className="glass" style={{ padding: 12, borderRadius: 'var(--radius-lg)', fontSize: 13, color: 'var(--text-muted)' }}>
            {renderStatus('appdata_backup', unraidReady ? null : 'Erst Unraid einrichten.')}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              disabled={!unraidReady || busy === 'appdata_backup'}
              onClick={() => { void saveWidget('appdata_backup', 'Appdata-Backup', 'none') }}
              style={{ gap: 8 }}
            >
              <LayoutGrid size={14} /> {appdataBackupWidget ? 'Speichern' : 'Einrichten'}
            </button>
            <button
              className="btn btn-ghost"
              disabled={!appdataBackupWidget}
              onClick={() => { void removeWidget('appdata_backup') }}
              style={{ gap: 8 }}
            >
              <Trash2 size={14} /> Entfernen
            </button>
          </div>
        </SectionCard>
      </div>
    </div>
  )
}
