import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { useDashboardStore } from '../store/useDashboardStore'
import { useWidgetStore } from '../store/useWidgetStore'
import { ServiceCard } from '../components/ServiceCard'
import { WeatherWidgetView } from './WidgetsPage'
import type { Service, DashboardItem, DashboardServiceItem, DashboardPlaceholderItem, DashboardWidgetItem, DashboardGroup, ServerStats, WeatherStats, WeatherWidgetConfig, AppdataBackupWidgetStats } from '../types'
import { api, getIconUrl } from '../api'

const FIXED_SERVICE_GROUP_ORDER = ['Externe Server', 'Interne Dienste', 'Internet']

function DashboardWidgetIcon({ widget }: { widget: DashboardWidgetItem['widget'] }) {
  const iconUrl = getIconUrl(widget)
  if (iconUrl) return <img src={iconUrl} alt="" style={{ width: 32, height: 32, objectFit: 'contain', borderRadius: 6, flexShrink: 0 }} />
  return null
}
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, X, Eye, EyeOff } from 'lucide-react'

// ── Shared edit-mode overlay (drag handle + remove button + group selector) ────
function EditOverlay({
  dragProps,
  showHandle,
  isDragging,
  onRemove,
  groups,
  itemGroupId,
  onMoveToGroup,
}: {
  dragProps: object
  showHandle: boolean
  isDragging: boolean
  onRemove: () => void
  groups?: { id: string; name: string }[]
  itemGroupId?: string | null
  onMoveToGroup?: (groupId: string | null) => void
}) {
  const { t } = useTranslation('dashboard')
  return (
    <>
      <div
        {...dragProps}
        style={{
          position: 'absolute', left: 6, top: 6,
          opacity: showHandle && !isDragging ? 0.8 : 0,
          transition: 'opacity 150ms ease',
          cursor: isDragging ? 'grabbing' : 'grab',
          color: 'var(--text-muted)',
          zIndex: 10,
          width: 20, height: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 4,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <GripVertical size={12} />
      </div>

      {/* Move to group dropdown */}
      {groups && groups.length > 0 && onMoveToGroup && (
        <select
          value={itemGroupId ?? ''}
          onChange={(e) => onMoveToGroup(e.target.value || null)}
          onClick={(e) => e.stopPropagation()}
          title={t('edit.move_to_group')}
          style={{
            position: 'absolute', right: 28, bottom: 6,
            opacity: showHandle ? 1 : 0,
            transition: 'opacity 150ms ease',
            cursor: 'pointer',
            zIndex: 10,
            fontSize: 11,
            padding: '2px 6px',
            height: 22,
            borderRadius: 4,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--glass-border)',
            color: 'var(--text-primary)',
            colorScheme: 'dark',
          } as React.CSSProperties}
        >
          <option value="">{t('edit.ungrouped')}</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      )}

      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove() }}
        title={t('edit.remove_from_dashboard')}
        style={{
          position: 'absolute', right: 6, top: 6,
          opacity: showHandle ? 0.8 : 0,
          transition: 'opacity 150ms ease',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          zIndex: 10,
          width: 20, height: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 4,
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(8px)',
          border: 'none',
          padding: 0,
        }}
      >
        <X size={11} />
      </button>
    </>
  )
}

// ── Service card ──────────────────────────────────────────────────────────────
function DashboardServiceCard({ item, onEdit, editMode, groups, hiddenServiceIds }: {
  item: DashboardServiceItem
  onEdit: (s: Service) => void
  editMode: boolean
  groups?: DashboardGroup[]
  hiddenServiceIds?: string[]
}) {
  const { t } = useTranslation('dashboard')
  const { removeItem, moveItemToGroup, showVisibilityOverlay } = useDashboardStore()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id, disabled: !editMode,
  })
  const [showHandle, setShowHandle] = useState(false)
  const isHidden = hiddenServiceIds ? hiddenServiceIds.includes(item.service.id) : false

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1, position: 'relative', gridColumn: 'span 1', aspectRatio: '1' }}
      onMouseEnter={() => setShowHandle(true)}
      onMouseLeave={() => setShowHandle(false)}
    >
      <ServiceCard service={item.service} onEdit={onEdit} hideAdminActions={true} />
      {showVisibilityOverlay && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'var(--radius-lg)',
          border: `2px solid ${isHidden ? 'var(--text-muted)' : 'var(--success, #22c55e)'}`,
          background: isHidden ? 'rgba(0,0,0,0.35)' : 'rgba(34,197,94,0.08)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
          padding: 6, pointerEvents: 'none', zIndex: 5,
        }}>
          <span className={isHidden ? 'badge-neutral' : 'badge-success'} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
            {isHidden ? t('hidden') : t('visible')}
          </span>
        </div>
      )}
      {editMode && (
        <EditOverlay
          dragProps={{ ...attributes, ...listeners }}
          showHandle={showHandle}
          isDragging={isDragging}
          onRemove={() => removeItem(item.id)}
          groups={groups?.map(g => ({ id: g.id, name: g.name }))}
          itemGroupId={item.group_id ?? undefined}
          onMoveToGroup={(groupId) => moveItemToGroup(item.id, groupId)}
        />
      )}
    </div>
  )
}

// ── Arr instance card (full media-style) ──────────────────────────────────────
function DashboardArrCard({ item, editMode, groups, hiddenArrIds }: {
  item: DashboardArrItem
  editMode: boolean
  groups?: DashboardGroup[]
  hiddenArrIds?: string[]
}) {
  const { t } = useTranslation('dashboard')
  const { removeItem, moveItemToGroup } = useDashboardStore()
  const { showVisibilityOverlay } = useDashboardStore()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id, disabled: !editMode,
  })
  const [showHandle, setShowHandle] = useState(false)
  const isArrHidden = hiddenArrIds ? hiddenArrIds.includes(item.instance.id) : false

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        gridColumn: 'span 2',
      }}
      onMouseEnter={() => setShowHandle(true)}
      onMouseLeave={() => setShowHandle(false)}
    >
      {showVisibilityOverlay && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'var(--radius-xl)',
          border: `2px solid ${isArrHidden ? 'var(--text-muted)' : 'var(--success, #22c55e)'}`,
          background: isArrHidden ? 'rgba(0,0,0,0.35)' : 'rgba(34,197,94,0.08)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
          padding: 6, pointerEvents: 'none', zIndex: 5,
        }}>
          <span className={isArrHidden ? 'badge-neutral' : 'badge-success'} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
            {isArrHidden ? t('hidden') : t('visible')}
          </span>
        </div>
      )}
      {editMode && (
        <EditOverlay
          dragProps={{ ...attributes, ...listeners }}
          showHandle={showHandle}
          isDragging={isDragging}
          onRemove={() => removeItem(item.id)}
          groups={groups?.map(g => ({ id: g.id, name: g.name }))}
          itemGroupId={item.group_id ?? undefined}
          onMoveToGroup={(groupId) => moveItemToGroup(item.id, groupId)}
        />
      )}
    </div>
  )
}

// ── Widget card ───────────────────────────────────────────────────────────────
function DashboardWidgetCard({ item, editMode, groups, colSpan = 2, hiddenWidgetIds }: {
  item: DashboardWidgetItem
  editMode: boolean
  groups?: DashboardGroup[]
  colSpan?: 1 | 2
  hiddenWidgetIds?: string[]
}) {
  const { t } = useTranslation('dashboard')
  const { removeItem, moveItemToGroup, showVisibilityOverlay } = useDashboardStore()
  const { stats } = useWidgetStore()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id, disabled: !editMode,
  })
  const [showHandle, setShowHandle] = useState(false)
  const s = stats[item.widget.id]
  const isWidgetHidden = hiddenWidgetIds ? hiddenWidgetIds.includes(item.widget.id) : false


  return (
    <div
      className="dashboard-widget-card"
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
        gridColumn: `span ${colSpan}`,
        gridRow: colSpan === 2 ? 'span 2' : undefined,
      }}
      onMouseEnter={() => setShowHandle(true)}
      onMouseLeave={() => setShowHandle(false)}
    >
      <div className="glass" style={{ borderRadius: 'var(--radius-xl)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DashboardWidgetIcon widget={item.widget} />
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.widget.name}</div>
        </div>

        {item.widget.type === 'unraid_status' ? (
          s ? (() => {
            const ss = s as ServerStats
            const pct = (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : null
            const bar = (label: string, value: number | null, extra?: string) => {
              const p = value ?? 0
              const color = p >= 90 ? 'var(--status-offline)' : p >= 70 ? '#f59e0b' : 'var(--accent)'
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                      {value === null ? '—' : `${value}%`}
                      {extra && <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{extra}</span>}
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'var(--glass-border)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(p, 100)}%`, background: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              )
            }
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {bar('CPU', ss.cpu.load >= 0 ? ss.cpu.load : null)}
                {bar('RAM', pct(ss.ram.used, ss.ram.total), ss.ram.total > 0 ? `${(ss.ram.used / 1024).toFixed(1)} / ${(ss.ram.total / 1024).toFixed(1)} GB` : undefined)}
                {ss.disks.map(d => (
                  d.error === 'not_mounted'
                    ? <div key={d.path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.name}</span>
                        <span className="badge-error" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>{t('disk.not_mounted')}</span>
                      </div>
                    : d.duplicate
                      ? <div key={d.path} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{d.name}</span>
                          <span className="badge-warning" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>{t('disk.duplicate')}</span>
                        </div>
                      : bar(d.name, pct(d.used, d.total), d.total > 0 ? `${(d.used / 1024).toFixed(0)} / ${(d.total / 1024).toFixed(0)} GB` : undefined)
                ))}
              </div>
            )
          })() : <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>{t('loading.stats')}</div>
        ) : item.widget.type === 'weather' ? (
          s ? <WeatherWidgetView stats={s as WeatherStats} config={item.widget.config as WeatherWidgetConfig} />
            : <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0' }}>{t('loading.weather')}</div>
        ) : item.widget.type === 'appdata_backup' ? (
          <AppdataBackupWidgetView stats={s ? (s as AppdataBackupWidgetStats) : null} />
        ) : null}
      </div>
      {showVisibilityOverlay && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 'var(--radius-xl)',
          border: `2px solid ${isWidgetHidden ? 'var(--text-muted)' : 'var(--success, #22c55e)'}`,
          background: isWidgetHidden ? 'rgba(0,0,0,0.35)' : 'rgba(34,197,94,0.08)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end',
          padding: 6, pointerEvents: 'none', zIndex: 5,
        }}>
          <span className={isWidgetHidden ? 'badge-neutral' : 'badge-success'} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
            {isWidgetHidden ? t('hidden') : t('visible')}
          </span>
        </div>
      )}
      {editMode && (
        <EditOverlay
          dragProps={{ ...attributes, ...listeners }}
          showHandle={showHandle}
          isDragging={isDragging}
          onRemove={() => removeItem(item.id)}
          groups={groups?.map(g => ({ id: g.id, name: g.name }))}
          itemGroupId={item.group_id ?? undefined}
          onMoveToGroup={(groupId) => moveItemToGroup(item.id, groupId)}
        />
      )}
    </div>
  )
}


function AppdataBackupWidgetView({ stats }: { stats: AppdataBackupWidgetStats | null }) {
  const isOk = !!stats && !('error' in stats) && (((stats as any).status === 'ok') || ((stats as any).healthy === true))
  const isWarn = !!stats && !isOk
  const color = isOk ? '#22c55e' : isWarn ? '#f59e0b' : '#f59e0b'
  const label = isOk ? 'OK' : isWarn ? 'Pruefen' : 'Noch nicht angebunden'
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>Appdata-Backup</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{label}</div>
      </div>
      <span
        title={label}
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}66`,
          flexShrink: 0,
        }}
      />
    </div>
  )
}

// ── Placeholder card ──────────────────────────────────────────────────────────
function DashboardPlaceholderCard({ item, editMode }: { item: DashboardPlaceholderItem; editMode: boolean }) {
  const { removeItem } = useDashboardStore()
  const { t } = useTranslation('dashboard')
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id, disabled: !editMode,
  })
  const [showHandle, setShowHandle] = useState(false)

  const isWidget = item.type === 'placeholder_widget'
  const isRow = item.type === 'placeholder_row'
  const gridColumn = isRow ? '1 / -1' : isWidget ? 'span 2' : 'span 1'
  const minHeight = isRow ? 28 : isWidget ? 100 : 80

  // Outside edit mode: invisible spacer that still occupies grid space to preserve layout
  if (!editMode) {
    return (
      <div
        ref={setNodeRef}
        style={{ gridColumn, minHeight, visibility: 'hidden', pointerEvents: 'none' }}
      />
    )
  }

  const label = isRow ? t('placeholder.row') : isWidget ? t('placeholder.widget') : t('placeholder.app')

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        position: 'relative',
        gridColumn,
      }}
      onMouseEnter={() => setShowHandle(true)}
      onMouseLeave={() => setShowHandle(false)}
    >
      <div
        style={{
          border: '1.5px dashed var(--accent)',
          borderRadius: isRow ? 'var(--radius-sm)' : isWidget ? 'var(--radius-xl)' : 'var(--radius-lg)',
          background: 'var(--accent-subtle)',
          minHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 1, color: 'var(--accent)', textTransform: 'uppercase', opacity: 0.7 }}>
          {label}
        </span>
      </div>
      <EditOverlay
        dragProps={{ ...attributes, ...listeners }}
        showHandle={showHandle}
        isDragging={isDragging}
        onRemove={() => removeItem(item.id)}
      />
    </div>
  )
}

// ── Helper to render dashboard items ──────────────────────────────────────────
function renderDashboardItem(
  item: DashboardItem,
  editMode: boolean,
  onEdit: (s: Service) => void,
  groups?: DashboardGroup[],
  widgetColSpan?: 1 | 2,
  hiddenServiceIds?: string[],
  hiddenWidgetIds?: string[],
  hiddenArrIds?: string[]
) {
  if (item.type === 'service') {
    return (
      <DashboardServiceCard
        key={item.id}
        item={item as DashboardServiceItem}
        onEdit={onEdit}
        editMode={editMode}
        groups={groups}
        hiddenServiceIds={hiddenServiceIds}
      />
    )
  }
  if (item.type === 'widget') {
    return (
      <DashboardWidgetCard
        key={item.id}
        item={item as DashboardWidgetItem}
        editMode={editMode}
        groups={groups}
        colSpan={widgetColSpan}
        hiddenWidgetIds={hiddenWidgetIds}
      />
    )
  }
  if (item.type === 'placeholder' || item.type === 'placeholder_app' || item.type === 'placeholder_widget' || item.type === 'placeholder_row') {
    return <DashboardPlaceholderCard key={item.id} item={item as DashboardPlaceholderItem} editMode={editMode} />
  }
  return null
}

// ── Sortable Group ─────────────────────────────────────────────────────────────
function SortableGroup({ group, editMode, onEdit, hiddenServiceIds, hiddenWidgetIds, hiddenArrIds }: {
  group: DashboardGroup
  editMode: boolean
  onEdit: (s: Service) => void
  hiddenServiceIds?: string[]
  hiddenWidgetIds?: string[]
  hiddenArrIds?: string[]
}) {
  const { updateGroup, deleteGroup, reorderGroupItems, groups: allGroups } = useDashboardStore()
  const { t } = useTranslation('dashboard')
  const innerCols = Math.max(1, Math.round(8 * group.col_span / 12))
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id, disabled: !editMode,
  })
  const [editingName, setEditingName] = useState(false)
  const [nameVal, setNameVal] = useState(group.name)
  const [showHandle, setShowHandle] = useState(false)
  const collapsed = false

  const groupSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const handleInnerDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = group.items.map(i => i.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    reorderGroupItems(group.id, arrayMove(ids, oldIndex, newIndex))
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        flex: `0 0 calc(${(group.col_span / 12 * 100).toFixed(4)}% - ${((12 - group.col_span) * 20 / 12).toFixed(4)}px)`,
        minWidth: 0,
        position: 'relative',
      }}
      onMouseEnter={() => setShowHandle(true)}
      onMouseLeave={() => setShowHandle(false)}
    >
      <div className="glass dashboard-group">
        {/* Header */}
        <div className="dashboard-group-header">
          {editMode && (
            <div
              {...attributes}
              {...listeners}
              style={{
                cursor: 'grab',
                color: showHandle ? 'var(--accent)' : 'var(--text-muted)',
                opacity: showHandle ? 1 : 0.5,
                transition: 'opacity 150ms ease, color 150ms ease',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <GripVertical size={14} />
            </div>
          )}
          {editingName ? (
            <input
              className="form-input"
              value={nameVal}
              onChange={e => setNameVal(e.target.value)}
              onBlur={() => { updateGroup(group.id, { name: nameVal }); setEditingName(false) }}
              onKeyDown={e => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              autoFocus
              style={{ fontSize: 12, padding: '2px 6px', height: 22, flex: 1 }}
            />
          ) : (
            <span
              onDoubleClick={() => editMode && setEditingName(true)}
              title={editMode ? t('edit.rename_hint') : undefined}
              style={{ cursor: editMode ? 'text' : 'default', flex: 1 }}
            >
              {group.name}
            </span>
          )}
          {editMode && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
              <select
                className="form-input"
                value={group.col_span}
                onChange={e => updateGroup(group.id, { col_span: +e.target.value })}
                style={{ fontSize: 11, padding: '2px 6px', height: 22 }}
              >
                <option value={3}>25%</option>
                <option value={4}>33%</option>
                <option value={6}>50%</option>
                <option value={8}>66%</option>
                <option value={12}>100%</option>
              </select>
              <button
                onClick={() => deleteGroup(group.id)}
                className="btn btn-ghost"
                style={{ width: 22, height: 22, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title={t('edit.delete_group')}
              >
                <X size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Items inside group */}
        <div className="group-content">
        {group.items.length > 0 || editMode ? (
          <DndContext sensors={groupSensors} collisionDetection={closestCenter} onDragEnd={handleInnerDragEnd}>
            <SortableContext items={group.items.map(i => i.id)} strategy={rectSortingStrategy}>
              <div className="services-grid" style={{ gridAutoFlow: 'dense', gridTemplateColumns: `repeat(${innerCols}, minmax(0, 1fr))`, justifyContent: 'start' } as React.CSSProperties}>
                {group.items.map(item => {
                  // For items inside groups, don't show the group selector (already in a group)
                  if (item.type === 'service') {
                    return (
                      <DashboardServiceCard
                        key={item.id}
                        item={item as DashboardServiceItem}
                        onEdit={onEdit}
                        editMode={editMode}
                        groups={allGroups}
                        hiddenServiceIds={hiddenServiceIds}
                      />
                    )
                  }
                  if (item.type === 'widget') {
                    return (
                      <DashboardWidgetCard
                        key={item.id}
                        item={item as DashboardWidgetItem}
                        editMode={editMode}
                        groups={allGroups}
                        hiddenWidgetIds={hiddenWidgetIds}
                      />
                    )
                  }
                  if (item.type === 'placeholder' || item.type === 'placeholder_app' || item.type === 'placeholder_widget' || item.type === 'placeholder_row') {
                    return <DashboardPlaceholderCard key={item.id} item={item as DashboardPlaceholderItem} editMode={editMode} />
                  }
                  return null
                })}
              </div>
            </SortableContext>
          </DndContext>
        ) : null}

        {group.items.length === 0 && !editMode && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
            {t('edit.empty_group')}
          </div>
        )}
        </div>{/* end group-content */}
      </div>
    </div>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
interface Props {
  onEdit: (service: Service) => void
}

export function Dashboard({ onEdit }: Props) {
  const { t } = useTranslation('dashboard')
  const { isAdmin, services, groups: serviceGroups } = useStore()
  const { items, groups, editMode, loading, reorder, reorderGroups, showVisibilityOverlay, setShowVisibilityOverlay } = useDashboardStore()

  const { loadStats, startPollingAll, stopPollingAll } = useWidgetStore()
  const [guestVisibility, setGuestVisibility] = useState<{ services: string[]; arr: string[]; widgets: string[] }>({ services: [], arr: [], widgets: [] })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  // Centralized widget polling
  const widgetItemIds = [...items, ...groups.flatMap(g => g.items)]
    .filter(i => i.type === 'widget')
    .map(i => (i as DashboardWidgetItem).widget.id)
    .join(',')

  useEffect(() => {
    const widgetItems = [...items, ...groups.flatMap(g => g.items)]
      .filter(i => i.type === 'widget') as DashboardWidgetItem[]
    const statsPollable = widgetItems
    if (statsPollable.length === 0) return
    Promise.all(statsPollable.map(i => loadStats(i.widget.id))).catch(() => {})
    startPollingAll(statsPollable.map(i => ({ id: i.widget.id, type: i.widget.type })))
    return () => stopPollingAll()
  }, [widgetItemIds])

  // Load guest visibility data when overlay toggled
  useEffect(() => {
    if (showVisibilityOverlay && isAdmin) {
      api.admin.guestVisibility().then(v => setGuestVisibility(v)).catch(() => {})
    }
  }, [showVisibilityOverlay, isAdmin])

  const isPlaceholder = (type: string) =>
    type === 'placeholder' || type === 'placeholder_app' || type === 'placeholder_widget' || type === 'placeholder_row'

  const allDashboardItems = [...items, ...groups.flatMap(g => g.items)]
  const dashboardServiceIds = new Set(
    allDashboardItems
      .filter(i => i.type === 'service')
      .map(i => (i as DashboardServiceItem).service.id)
  )

  const serviceSortRank = (groupId: string | null | undefined) => {
    if (!groupId) return FIXED_SERVICE_GROUP_ORDER.length
    const name = serviceGroups.find(g => g.id === groupId)?.name ?? ''
    const idx = FIXED_SERVICE_GROUP_ORDER.indexOf(name)
    return idx >= 0 ? idx : FIXED_SERVICE_GROUP_ORDER.length + 1
  }

  const sortedDashboardServices = [...services]
    .filter(s => dashboardServiceIds.has(s.id))
    .sort((a, b) => {
      const rankA = serviceSortRank(a.group_id)
      const rankB = serviceSortRank(b.group_id)
      if (rankA !== rankB) return rankA - rankB

      const posA = typeof a.position_x === 'number' ? a.position_x : Number.MAX_SAFE_INTEGER
      const posB = typeof b.position_x === 'number' ? b.position_x : Number.MAX_SAFE_INTEGER
      if (posA !== posB) return posA - posB

      return a.name.localeCompare(b.name)
    })

  const fixedServiceSections = [
    ...FIXED_SERVICE_GROUP_ORDER.map(name => {
      const group = serviceGroups.find(g => g.name === name)
      return {
        label: name,
        items: sortedDashboardServices.filter(s => group && s.group_id === group.id),
      }
    }),
    {
      label: 'Ohne Gruppe',
      items: sortedDashboardServices.filter(s => !s.group_id),
    },
  ].filter(section => section.items.length > 0)

  const dashboardOtherItems = allDashboardItems.filter(i => i.type !== 'service' && !isPlaceholder(i.type))

  // Real items (non-placeholders) in both groups and ungrouped
  const realGroupItems = groups.filter(g => g.items.some(i => !isPlaceholder(i.type))).length > 0
  const realUngroupedItems = items.filter(i => !isPlaceholder(i.type)).length

  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = groups.map(g => g.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    reorderGroups(arrayMove(ids, oldIndex, newIndex))
  }

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = items.map(i => i.id)
    const oldIndex = ids.indexOf(active.id as string)
    const newIndex = ids.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return
    reorder(arrayMove(ids, oldIndex, newIndex))
  }

  if (loading && items.length === 0 && groups.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
      </div>
    )
  }

  if (!loading && !realGroupItems && !realUngroupedItems) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⬡</div>
        <div className="empty-state-text">
          {t('empty.regular_empty')}
        </div>
      </div>
    )
  }

  // Ungrouped items section — shared between "with groups" and "standalone" layouts
  const ungroupedSection = (realUngroupedItems || editMode) && (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
      <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
        {/* All ungrouped items (apps, arr, widgets, placeholders) in one unified grid.
            No grid-auto-flow: dense — array order determines visual position.
            Widgets use gridColumn: span 2 + gridRow: span 2 (set in DashboardWidgetCard). */}
        <div className="services-grid">
          {items.map(item => renderDashboardItem(item, editMode, onEdit, groups, undefined, guestVisibility.services, guestVisibility.widgets, guestVisibility.arr))}
        </div>
      </SortableContext>
    </DndContext>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {false && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            className={`btn ${showVisibilityOverlay ? 'btn-primary' : 'btn-ghost'} topbar-mobile-hide`}
            onClick={() => setShowVisibilityOverlay(!showVisibilityOverlay)}
            style={{ gap: 6, fontSize: 12 }}
          >
            {showVisibilityOverlay ? <EyeOff size={14} /> : <Eye size={14} />}
            {t('show_visibility')}
          </button>
        </div>
      )}

      {editMode ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {}}
            >
              {t('edit.add_group')}
            </button>
          </div>

          {(realGroupItems || editMode) ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
              <SortableContext items={groups.map(g => g.id)} strategy={rectSortingStrategy}>
                <div className="dashboard-groups">
                  {groups.map(group => (
                    <SortableGroup key={group.id} group={group} editMode={editMode} onEdit={onEdit} hiddenServiceIds={guestVisibility.services} hiddenWidgetIds={guestVisibility.widgets} hiddenArrIds={guestVisibility.arr} />
                  ))}
                  {ungroupedSection && (
                    <div style={{ flex: '1 1 0', minWidth: 'min(100%, 220px)' }}>
                      {ungroupedSection}
                    </div>
                  )}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            ungroupedSection
          )}
        </>
      ) : (
        <>
          {fixedServiceSections.map(section => (
            <div key={section.label} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  paddingBottom: 4,
                  borderBottom: '1px solid var(--glass-border)',
                }}
              >
                {section.label}
              </div>
              <div className="services-grid">
                {section.items.map(service => (
                  <DashboardServiceCard
                    key={service.id}
                    item={{
                      id: `service-${service.id}`,
                      type: 'service',
                      service,
                      group_id: service.group_id ?? null,
                      position_x: service.position_x ?? 0,
                      position_y: 0,
                    } as DashboardServiceItem}
                    onEdit={onEdit}
                    editMode={false}
                    hiddenServiceIds={guestVisibility.services}
                  />
                ))}
              </div>
            </div>
          ))}

          {dashboardOtherItems.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  paddingBottom: 4,
                  borderBottom: '1px solid var(--glass-border)',
                }}
              >
                Weitere Elemente
              </div>
              <div className="services-grid">
                {dashboardOtherItems.map(item =>
                  renderDashboardItem(item, false, onEdit, groups, undefined, guestVisibility.services, guestVisibility.widgets, guestVisibility.arr)
                )}
              </div>
            </div>
          )}
        </>
      )}

    </div>
  )
}