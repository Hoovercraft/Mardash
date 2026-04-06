import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Palette, Settings as SettingsIcon, Upload, ImageIcon, Trash2, AlertTriangle } from 'lucide-react'
import { useStore } from '../store/useStore'
import type { Background } from '../types'

type SettingsTab = 'general' | 'design'

function TabBar({ active, onChange }: { active: SettingsTab; onChange: (t: SettingsTab) => void }) {
  const { t } = useTranslation('settings')
  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: t('tabs.general'), icon: <SettingsIcon size={13} /> },
    { id: 'design', label: t('tabs.design'), icon: <Palette size={13} /> },
  ]

  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '6px 8px', display: 'flex', gap: 2, alignSelf: 'center' }}>
      {tabs.map(tab => (
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

function BackgroundCard({
  item,
  onDelete,
}: {
  item: Background
  onDelete: (id: string) => Promise<void>
}) {
  const [busy, setBusy] = useState(false)

  return (
    <div
      className="glass"
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
      }}
    >
      <div
        style={{
          aspectRatio: '16 / 9',
          backgroundImage: `url(${item.url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: 'rgba(255,255,255,0.03)',
        }}
      />
      <div style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name}
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          disabled={busy}
          onClick={async () => {
            setBusy(true)
            try {
              await onDelete(item.id)
            } finally {
              setBusy(false)
            }
          }}
          style={{ gap: 6 }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export function SettingsPage() {
  const { t } = useTranslation('settings')
  const {
    settings,
    loadSettings,
    updateSettings,
    backgrounds,
    loadBackgrounds,
    uploadBackground,
    deleteBackground,
  } = useStore()

  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const [uploadName, setUploadName] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSettings().catch(() => {})
    loadBackgrounds().catch(() => {})
  }, [loadSettings, loadBackgrounds])

  if (!settings) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
        <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <TabBar active={activeTab} onChange={setActiveTab} />

      {activeTab === 'general' && (
        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{t('tabs.general')}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Lokale Grundeinstellungen für Mardash.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="form-label">Dashboard-Titel</label>
              <input
                className="form-input"
                value={settings.dashboard_title ?? 'Mardash'}
                onChange={e => updateSettings({ dashboard_title: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="form-label">Sprache</label>
              <input className="form-input" value="Deutsch" disabled />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              padding: 12,
              borderRadius: 'var(--radius-lg)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              background: 'rgba(245, 158, 11, 0.08)',
            }}
          >
            <AlertTriangle size={16} style={{ marginTop: 2, color: '#f59e0b', flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Benutzer-, Gruppen- und Login-Verwaltung wurden für den lokalen Einzelbetrieb ausgeblendet.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'design' && (
        <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 18, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{t('tabs.design')}</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              Hintergrundbilder für dein lokales Dashboard.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="form-label">Name</label>
              <input
                className="form-input"
                value={uploadName}
                onChange={e => setUploadName(e.target.value)}
                placeholder="z. B. Dunkler Verlauf"
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="form-label">Datei</label>
              <input
                className="form-input"
                type="file"
                accept="image/*"
                onChange={e => setUploadFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              disabled={uploading || !uploadName.trim() || !uploadFile}
              onClick={async () => {
                setError('')
                if (!uploadFile || !uploadName.trim()) return
                setUploading(true)
                try {
                  await uploadBackground(uploadName.trim(), uploadFile)
                  setUploadName('')
                  setUploadFile(null)
                  await loadBackgrounds()
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Upload fehlgeschlagen')
                } finally {
                  setUploading(false)
                }
              }}
              style={{ gap: 8 }}
            >
              <Upload size={15} />
              {uploading ? 'Lädt hoch ...' : 'Hintergrund hochladen'}
            </button>
          </div>

          {error && <div style={{ color: 'var(--status-offline)', fontSize: 13 }}>{error}</div>}

          {backgrounds.length === 0 ? (
            <div
              style={{
                padding: 18,
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--glass-border)',
                color: 'var(--text-muted)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <ImageIcon size={15} />
              Noch keine Hintergrundbilder vorhanden.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
              {backgrounds.map(bg => (
                <BackgroundCard key={bg.id} item={bg} onDelete={deleteBackground} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
