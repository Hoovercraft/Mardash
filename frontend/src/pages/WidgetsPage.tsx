import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IconPicker } from '../components/IconPicker'
import { useConfirm } from '../components/ConfirmDialog'
import { useWidgetStore } from '../store/useWidgetStore'
import { useDashboardStore } from '../store/useDashboardStore'
import { useStore } from '../store/useStore'
import { Trash2, Pencil, X, Check, Plus, Minus, LayoutDashboard, Cloud } from 'lucide-react'
import type { Widget, ServerStatusConfig, ServerStats, WeatherWidgetConfig, WeatherStats } from '../types'
import { getIconUrl } from '../api'

function WidgetIcon({ widget, size = 32 }: { widget: Pick<Widget, 'type' | 'config' | 'icon_url' | 'icon_id'>; size?: number }) {
  const iconUrl = getIconUrl(widget)
  if (!iconUrl) return null
  return <img src={iconUrl} alt="" style={{ width: size, height: size, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
}

function DiskRow({
  disk,
  onChange,
  onRemove,
}: {
  disk: { path: string; name: string }
  onChange: (d: { path: string; name: string }) => void
  onRemove: () => void
}) {
  const { t } = useTranslation('widgets')
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <input
        className="form-input"
        placeholder={t('form.disk_name_placeholder')}
        value={disk.name}
        onChange={e => onChange({ ...disk, name: e.target.value })}
        style={{ flex: 1, minWidth: 0, fontSize: 13, padding: '5px 8px' }}
      />
      <input
        className="form-input"
        placeholder={t('form.disk_path_placeholder')}
        value={disk.path}
        onChange={e => onChange({ ...disk, path: e.target.value })}
        style={{ flex: 2, minWidth: 0, fontSize: 13, padding: '5px 8px' }}
      />
      <button
        type="button"
        className="btn btn-ghost btn-icon btn-sm"
        onClick={onRemove}
        style={{ flexShrink: 0, padding: '4px', width: 28, height: 28 }}
      >
        <Minus size={12} />
      </button>
    </div>
  )
}

export function StatBar({ label, value, unit, extra }: { label: string; value: number | null; unit: string; extra?: string }) {
  const pct = value ?? 0
  const color = pct >= 90 ? 'var(--status-offline)' : pct >= 70 ? '#f59e0b' : 'var(--accent)'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          {value === null ? '—' : `${value}${unit}`}
          {extra && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{extra}</span>}
        </span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: 'var(--glass-border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

const WEATHER_ICONS: Record<number, string> = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌦️',
  61: '🌧️', 63: '🌧️', 65: '🌧️',
  71: '🌨️', 73: '🌨️', 75: '🌨️', 77: '🌨️',
  80: '🌦️', 81: '🌦️', 82: '🌧️',
  85: '🌨️', 86: '🌨️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

export function WeatherWidgetView({ stats, config }: { stats: WeatherStats; config: WeatherWidgetConfig }) {
  const { t } = useTranslation('widgets')
  if ((stats as any).error) {
    return <div style={{ fontSize: 12, color: 'var(--status-offline)' }}>{(stats as any).error}</div>
  }
  const desc = t(`weather.codes.${stats.weather_code}`, `Code ${stats.weather_code}`)
  const icon = WEATHER_ICONS[stats.weather_code] ?? '🌡️'
  const locationLabel = config.location_name || null
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {locationLabel && (
        <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Cloud size={11} />
          {locationLabel}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 40, lineHeight: 1, flexShrink: 0 }}>{icon}</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)', lineHeight: 1 }}>
            {stats.temperature}{stats.unit}
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{desc}</span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t('weather.feels_like')}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{stats.apparent_temperature}{stats.unit}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t('weather.humidity')}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{stats.humidity}%</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t('weather.wind')}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{stats.wind_speed} km/h</span>
        </div>
        {stats.precipitation > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>{t('weather.precipitation')}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{stats.precipitation} mm</span>
          </div>
        )}
      </div>
    </div>
  )
}

function PollenWidgetView({ stats }: { stats: any }) {
  if (!stats || stats.error) {
    return <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>Noch nicht angebunden</div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ fontSize: 12, fontWeight: 600 }}>{stats.label ?? 'Pollen'}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--text-muted)' }}>Level</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{stats.level ?? '—'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--text-muted)' }}>Region</span>
        <span>{stats.source_region ?? '—'}</span>
      </div>
    </div>
  )
}

function WidgetForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Widget
  onSave: (data: { name: string; type: string; config: object; display_location: 'topbar' | 'sidebar' | 'none'; iconId?: string | null; iconChanged?: boolean }) => Promise<void>
  onCancel: () => void
}) {
  const { t } = useTranslation('widgets')
  const isEdit = !!initial
  type WidgetFormType = 'unraid_status' | 'appdata_backup' | 'weather' | 'pollen'

  const [type, setType] = useState<WidgetFormType>((initial?.type as WidgetFormType) ?? 'unraid_status')
  const [name, setName] = useState(initial?.name ?? '')
  const [displayLocation, setDisplayLocation] = useState<'topbar' | 'sidebar' | 'none'>((initial?.display_location ?? 'none') as 'topbar' | 'sidebar' | 'none')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const [disks, setDisks] = useState<{ path: string; name: string }[]>(
    initial?.type === 'unraid_status' ? (initial.config as ServerStatusConfig).disks ?? [] : []
  )

  const existingWeather = initial?.type === 'weather' ? (initial.config as WeatherWidgetConfig) : null
  const [weatherInputMode, setWeatherInputMode] = useState<'city' | 'coords'>('coords')
  const [weatherCity, setWeatherCity] = useState('')
  const [weatherLat, setWeatherLat] = useState(existingWeather ? String(existingWeather.lat) : '')
  const [weatherLon, setWeatherLon] = useState(existingWeather ? String(existingWeather.lon) : '')
  const [weatherLocationName, setWeatherLocationName] = useState(existingWeather?.location_name ?? '')
  const [weatherGeoError, setWeatherGeoError] = useState('')
  const [weatherGeocoding, setWeatherGeocoding] = useState(false)

  const [iconId, setIconId] = useState<string | null>(initial?.icon_id ?? null)
  const [iconChanged, setIconChanged] = useState(false)

  const getDefaultNameForType = (v: WidgetFormType): string => {
    if (v === 'appdata_backup') return 'Appdata-Backup'
    if (v === 'weather') return 'Weather'
    if (v === 'pollen') return 'Pollen'
    return 'Unraid Status'
  }

  const handleTypeChange = (v: WidgetFormType) => {
    setType(v)
    if (!isEdit && !name) setName(getDefaultNameForType(v))
  }

  const handleSave = async () => {
    setError('')
    if (!name.trim()) return setError(t('form.errors.name_required'))

    let config: object
    if (type === 'unraid_status') {
      config = { disks }
    } else if (type === 'appdata_backup' || type === 'pollen') {
      config = {}
    } else {
      if (weatherInputMode === 'city') {
        if (!weatherCity.trim()) return setError(t('form.errors.city_required'))
        setWeatherGeoError('')
        setWeatherGeocoding(true)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(weatherCity.trim())}&format=json&limit=1`)
          const geoData = await res.json() as Array<{ lat: string; lon: string; display_name: string }>
          if (!geoData.length) {
            setWeatherGeoError(t('form.weather_city_not_found'))
            setWeatherGeocoding(false)
            return
          }
          const locationName = weatherLocationName.trim() || geoData[0].display_name.split(',')[0].trim()
          config = { lat: parseFloat(geoData[0].lat), lon: parseFloat(geoData[0].lon), location_name: locationName, city_name: weatherCity.trim() }
        } catch {
          setWeatherGeoError(t('form.weather_geocoding_failed'))
          setWeatherGeocoding(false)
          return
        }
        setWeatherGeocoding(false)
      } else {
        const latNum = parseFloat(weatherLat)
        const lonNum = parseFloat(weatherLon)
        if (isNaN(latNum) || isNaN(lonNum)) return setError(t('form.errors.coords_required'))
        config = { lat: latNum, lon: lonNum, ...(weatherLocationName.trim() ? { location_name: weatherLocationName.trim() } : {}) }
      }
    }

    setSaving(true)
    try {
      await onSave({ name: name.trim(), type, config, display_location: displayLocation, iconId, iconChanged })
    } catch (e: unknown) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const addDisk = () => setDisks(d => [...d, { name: '', path: '' }])
  const updateDisk = (i: number, disk: { name: string; path: string }) => setDisks(d => d.map((x, idx) => idx === i ? disk : x))
  const removeDisk = (i: number) => setDisks(d => d.filter((_, idx) => idx !== i))

  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
        {isEdit ? t('form.title_edit') : t('form.title_new')}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {!isEdit && (
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>{t('form.type_label')}</label>
            <select className="form-input" value={type} onChange={e => handleTypeChange(e.target.value as WidgetFormType)}>
              <option value="unraid_status">{t('type_names.server_status', 'Unraid Status')}</option>
              <option value="appdata_backup">Appdata-Backup</option>
              <option value="weather">{t('type_names.weather')}</option>
              <option value="pollen">Pollen</option>
            </select>
          </div>
        )}

        <div>
          <label className="form-label" style={{ fontSize: 11 }}>{t('form.name_label')}</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={type === 'appdata_backup' ? 'Appdata-Backup' : type === 'weather' ? 'Weather' : type === 'pollen' ? 'Pollen' : 'Unraid Status'}
          />
        </div>

        {type !== 'weather' && type !== 'appdata_backup' && type !== 'pollen' && (
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>{t('form.icon_label')}</label>
            <IconPicker
              iconId={iconId}
              iconUrl={(!iconChanged && isEdit && initial) ? getIconUrl(initial) : null}
              onChange={id => { setIconId(id); setIconChanged(true) }}
            />
          </div>
        )}

        <div>
          <label className="form-label" style={{ fontSize: 11 }}>{t('form.display_location_label')}</label>
          <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: '6px 8px', display: 'flex', gap: 2 }}>
            {(['topbar', 'sidebar', 'none'] as const).map(loc => (
              <button
                key={loc}
                type="button"
                onClick={() => setDisplayLocation(loc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 13,
                  fontWeight: displayLocation === loc ? 600 : 400,
                  background: displayLocation === loc ? 'rgba(var(--accent-rgb), 0.12)' : 'transparent',
                  color: displayLocation === loc ? 'var(--accent)' : 'var(--text-secondary)',
                  border: displayLocation === loc ? '1px solid rgba(var(--accent-rgb), 0.25)' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 150ms ease',
                  textTransform: 'capitalize',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                {loc === 'topbar' && '📊'}
                {loc === 'sidebar' && '📌'}
                {loc === 'none' && '✕'} {loc}
              </button>
            ))}
          </div>
        </div>

        {type === 'unraid_status' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" style={{ fontSize: 11, margin: 0 }}>{t('form.disks_label')}</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={addDisk} style={{ gap: 4, fontSize: 11, padding: '3px 8px' }}>
                <Plus size={11} /> {t('form.add_disk')}
              </button>
            </div>
            {disks.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('form.disk_no_disks')}</span>
            )}
            {disks.map((d, i) => (
              <DiskRow key={i} disk={d} onChange={disk => updateDisk(i, disk)} onRemove={() => removeDisk(i)} />
            ))}
          </div>
        )}

        {type === 'weather' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => { setWeatherInputMode('city'); setWeatherGeoError('') }}
                style={{ flex: 1, padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, border: weatherInputMode === 'city' ? '2px solid var(--accent)' : '2px solid var(--glass-border)', background: weatherInputMode === 'city' ? 'var(--accent-subtle)' : 'var(--glass-bg)', cursor: 'pointer' }}
              >
                {t('form.weather_input_city')}
              </button>
              <button
                type="button"
                onClick={() => { setWeatherInputMode('coords'); setWeatherGeoError('') }}
                style={{ flex: 1, padding: '6px 10px', borderRadius: 'var(--radius-sm)', fontSize: 12, border: weatherInputMode === 'coords' ? '2px solid var(--accent)' : '2px solid var(--glass-border)', background: weatherInputMode === 'coords' ? 'var(--accent-subtle)' : 'var(--glass-bg)', cursor: 'pointer' }}
              >
                {t('form.weather_input_coords')}
              </button>
            </div>
            {weatherInputMode === 'city' ? (
              <div>
                <label className="form-label" style={{ fontSize: 11 }}>{t('form.weather_city_label')}</label>
                <input className="form-input" value={weatherCity} onChange={e => { setWeatherCity(e.target.value); setWeatherGeoError('') }} placeholder={t('form.weather_city_placeholder')} style={{ fontSize: 13 }} />
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>{t('form.weather_lat')}</label>
                  <input className="form-input" value={weatherLat} onChange={e => setWeatherLat(e.target.value)} placeholder="51.5074" style={{ fontSize: 13 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: 11 }}>{t('form.weather_lon')}</label>
                  <input className="form-input" value={weatherLon} onChange={e => setWeatherLon(e.target.value)} placeholder="-0.1278" style={{ fontSize: 13 }} />
                </div>
              </div>
            )}
            {weatherGeoError && <div style={{ fontSize: 11, color: 'var(--status-offline)' }}>{weatherGeoError}</div>}
            {weatherGeocoding && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('form.weather_geocoding')}</div>}
            <div>
              <label className="form-label" style={{ fontSize: 11 }}>{t('form.weather_location_name')}</label>
              <input className="form-input" value={weatherLocationName} onChange={e => setWeatherLocationName(e.target.value)} placeholder={t('form.weather_location_placeholder')} style={{ fontSize: 13 }} />
            </div>
          </div>
        )}

        {type === 'appdata_backup' && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Appdata-Backup wird über den Unraid-Zugriff angebunden. Hier ist aktuell keine zusätzliche Konfiguration nötig.
          </div>
        )}

        {type === 'pollen' && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Pollen wird zentral eingerichtet. Aktuell ist keine zusätzliche Widget-Konfiguration nötig.
          </div>
        )}
      </div>

      {error && <div style={{ fontSize: 12, color: 'var(--status-offline)' }}>{error}</div>}

      <div style={{ display: 'flex', gap: 6 }}>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving} style={{ gap: 4 }}>
          <Check size={12} /> {saving ? t('form.saving') : t('form.save')}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel} style={{ gap: 4 }}>
          <X size={12} /> {t('form.cancel')}
        </button>
      </div>
    </div>
  )
}

function WidgetCard({
  widget,
  onEdit,
  onDelete,
  onToggleDashboard,
  isOnDashboard,
}: {
  widget: Widget
  onEdit: () => void
  onDelete: () => void
  onToggleDashboard: () => void
  isOnDashboard: boolean
}) {
  const { t } = useTranslation('widgets')
  const { isAdmin } = useStore()
  const { stats } = useWidgetStore()
  const s = stats[widget.id]

  return (
    <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14, position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <WidgetIcon widget={widget} size={32} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{widget.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8 }}>
              <span>{widget.type === 'appdata_backup' ? 'Appdata-Backup' : widget.type === 'pollen' ? 'Pollen' : t(`type_names.${widget.type}`, 'Unraid Status')}</span>
              {widget.display_location === 'topbar' && <span style={{ color: 'var(--accent)' }}>{t('location_display.topbar')}</span>}
              {widget.display_location === 'sidebar' && <span style={{ color: 'var(--accent)' }}>{t('location_display.sidebar')}</span>}
            </div>
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={onEdit} data-tooltip="Edit" style={{ padding: '4px', width: 28, height: 28 }}>
              <Pencil size={12} />
            </button>
            <button className="btn btn-danger btn-icon btn-sm" onClick={onDelete} data-tooltip="Delete" style={{ padding: '4px', width: 28, height: 28 }}>
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {widget.type === 'unraid_status' ? (
        s ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(() => {
              const ss = s as ServerStats
              return (
                <>
                  <StatBar label={t('server_status.cpu')} value={ss.cpu.load >= 0 ? ss.cpu.load : null} unit="%" />
                  <StatBar label={t('server_status.ram')} value={ss.ram.total > 0 ? Math.round((ss.ram.used / ss.ram.total) * 100) : null} unit="%" extra={ss.ram.total > 0 ? `${(ss.ram.used / 1024).toFixed(1)} / ${(ss.ram.total / 1024).toFixed(1)} GB` : undefined} />
                  {ss.disks.map(d => (
                    d.error === 'not_mounted'
                      ? <div key={d.path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.name}</span>
                          <span className="badge-error" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>{t('server_status.not_mounted')}</span>
                        </div>
                      : d.duplicate
                        ? <div key={d.path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.name}</span>
                            <span className="badge-warning" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>{t('server_status.duplicate_of', { name: d.duplicateOf })}</span>
                          </div>
                        : <StatBar key={d.path} label={d.name} value={d.total > 0 ? Math.round((d.used / d.total) * 100) : null} unit="%" extra={d.total > 0 ? `${(d.used / 1024).toFixed(0)} / ${(d.total / 1024).toFixed(0)} GB` : undefined} />
                  ))}
                </>
              )
            })()}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>{t('loading.stats')}</div>
        )
      ) : widget.type === 'weather' ? (
        s ? (
          <WeatherWidgetView stats={s as WeatherStats} config={widget.config as WeatherWidgetConfig} />
        ) : (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>{t('loading.weather')}</div>
        )
      ) : widget.type === 'appdata_backup' ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Appdata-Backup</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nur Ampelstatus</div>
          </div>
          <span
            title="Noch nicht angebunden"
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: '#f59e0b',
              boxShadow: '0 0 8px rgba(245,158,11,0.45)',
              flexShrink: 0,
            }}
          />
        </div>
      ) : (
        <PollenWidgetView stats={s as any} />
      )}

      {isAdmin && (
        <button
          className={isOnDashboard ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          onClick={onToggleDashboard}
          style={{ gap: 4, fontSize: 12, alignSelf: 'flex-start' }}
        >
          <LayoutDashboard size={12} />
          {isOnDashboard ? t('dashboard_toggle.on') : t('dashboard_toggle.add')}
        </button>
      )}
    </div>
  )
}

interface Props {
  showAddForm: boolean
  onFormClose: () => void
}

export function WidgetsPage({ showAddForm, onFormClose }: Props) {
  const { t } = useTranslation('widgets')
  const { isAdmin } = useStore()
  const { widgets, loadWidgets, loadStats, createWidget, updateWidget, deleteWidget, startPollingAll, stopPollingAll } = useWidgetStore()
  const { isOnDashboard, addWidget, removeByRef } = useDashboardStore()
  const { confirm: confirmDlg } = useConfirm()
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    loadWidgets().catch(() => {})
  }, [])

  const widgetIds = widgets.map(w => w.id).join(',')

  useEffect(() => {
    if (widgets.length === 0) return
    Promise.all(widgets.map(w => loadStats(w.id))).catch(() => {})
    startPollingAll(widgets.map(w => ({ id: w.id, type: w.type })))
    return () => stopPollingAll()
  }, [widgetIds])

  const handleCreate = async (data: { name: string; type: string; config: object; display_location: 'topbar' | 'sidebar' | 'none'; iconId?: string | null; iconChanged?: boolean }) => {
    const { iconId, iconChanged, ...widgetData } = data
    const id = await createWidget({ ...widgetData, show_in_topbar: widgetData.display_location === 'topbar' })
    if (iconChanged) await updateWidget(id, { icon_id: iconId ?? null })
    onFormClose()
  }

  const handleUpdate = async (id: string, data: { name: string; type: string; config: object; display_location: 'topbar' | 'sidebar' | 'none'; iconId?: string | null; iconChanged?: boolean }) => {
    const { iconId, iconChanged, ...widgetData } = data
    await updateWidget(id, { ...widgetData, show_in_topbar: widgetData.display_location === 'topbar' })
    if (iconChanged) await updateWidget(id, { icon_id: iconId ?? null })
    setEditingId(null)
  }

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirmDlg({ title: t('delete_confirm_title', { name }), danger: true, confirmLabel: t('delete_confirm_btn') })
    if (!ok) return
    await deleteWidget(id)
  }

  const handleToggleDashboard = async (widget: Widget) => {
    if (isOnDashboard('widget', widget.id)) {
      await removeByRef('widget', widget.id)
    } else {
      await addWidget(widget.id)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {showAddForm && isAdmin && (
        <WidgetForm onSave={handleCreate} onCancel={onFormClose} />
      )}

      {widgets.length === 0 && !showAddForm && (
        <div className="empty-state">
          <div className="empty-state-icon">◈</div>
          <div className="empty-state-text">
            {isAdmin ? t('empty.admin') : t('empty.guest')}
          </div>
        </div>
      )}

      <div className="card-grid" style={{ gap: 16 }}>
        {widgets.map(widget => (
          editingId === widget.id ? (
            <WidgetForm
              key={widget.id}
              initial={widget}
              onSave={(data) => handleUpdate(widget.id, data)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <WidgetCard
              key={widget.id}
              widget={widget}
              onEdit={() => setEditingId(widget.id)}
              onDelete={() => handleDelete(widget.id, widget.name)}
              onToggleDashboard={() => handleToggleDashboard(widget)}
              isOnDashboard={isOnDashboard('widget', widget.id)}
            />
          )
        ))}
      </div>
    </div>
  )
}
