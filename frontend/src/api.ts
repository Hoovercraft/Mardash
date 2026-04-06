import type { Service, Group, Settings, AuthUser, UserRecord, UserGroup, DashboardGroup, DashboardResponse, Widget, WidgetStats, DockerContainer, ContainerStats, Background, HaInstance, HaPanel, HaEntityFull, HaArea, EnergyData, CalendarEntry, HaFloorplan, HaFloorplanEntity, HaAlert, HaHistoryEntry, NetworkDevice, NetworkDeviceHistory, ScanResult, BackupSource, BackupStatusResult, ResourceSnapshot, ChangelogRelease, Instance, InstanceType, HelbackupWidgetStatus, HelbackupJob, HelbackupBackup, HelbackupHistoryEntry, HelbackupLogEvent } from './types'
import type { UnraidInstance, UnraidInfo, UnraidArray, UnraidParityHistory, UnraidContainer, UnraidVm, UnraidShare, UnraidUser, UnraidNotifications, UnraidConfig, UnraidPhysicalDisk, UnraidService, UnraidFlash, UnraidServer, UnraidOwner, UnraidMe, UnraidNetworkAccess, UnraidConnect, UnraidUpsDevice, UnraidUpsConfig, UnraidLogFile, UnraidPlugin, UnraidApiKey, UnraidDockerNetwork, UnraidMetricsDetailed } from './types/unraid'

const BASE = '/api'

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'include',
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.detail ?? err.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ─── Services ─────────────────────────────────────────────────────────────────
export const api = {
  services: {
    list: () => req<Service[]>('/services'),
    create: (data: Partial<Service>) => req<Service>('/services', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Service>) => req<Service>(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/services/${id}`, { method: 'DELETE' }),
    check: (id: string) => req<{ id: string; status: string; checked_at: string }>(`/services/${id}/check`, { method: 'POST', body: JSON.stringify({}) }),
    checkAll: () => req<{ id: string; status: string }[]>('/services/check-all', { method: 'POST', body: JSON.stringify({}) }),
    uploadIcon: (id: string, data: string, contentType: string) =>
      req<{ icon_url: string }>(`/services/${id}/icon`, { method: 'POST', body: JSON.stringify({ data, content_type: contentType }) }),
    export: () => fetch('/api/services/export', { credentials: 'include' }).then(r => r.blob()),
    import: (services: Record<string, unknown>[]) => req<{ imported: number; skipped: number; total: number; errors?: string[] }>('/services/import', { method: 'POST', body: JSON.stringify({ services }) }),
  },

  icons: {
    search: (q: string) => req<{ icons: Array<{ name: string; base: string; preview_url: string; categories: string[] }> }>(`/icons/search?q=${encodeURIComponent(q)}`),
    download: (name: string, format?: string) => req<{ id: string; name: string; mime_type: string }>('/icons/download', { method: 'POST', body: JSON.stringify({ name, format }) }),
    upload: (data: string, contentType: string, name?: string) => req<{ id: string; name: string; mime_type: string }>('/icons/upload', { method: 'POST', body: JSON.stringify({ data, content_type: contentType, name }) }),
  },

  groups: {
    list: () => req<Group[]>('/groups'),
    create: (data: Partial<Group>) => req<Group>('/groups', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Group>) => req<Group>(`/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/groups/${id}`, { method: 'DELETE' }),
  },

  settings: {
    get: () => req<Settings>('/settings'),
    update: (data: Partial<Settings>) => req<Settings>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
  },

  auth: {
    status: () => req<{ needsSetup: boolean; user: AuthUser | null }>('/auth/status'),
    setup: (data: { username: string; password: string; first_name: string; last_name: string; email?: string }) =>
      req<AuthUser>('/auth/setup', { method: 'POST', body: JSON.stringify(data) }),
    login: (username: string, password: string, rememberMe?: boolean) =>
      req<AuthUser>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password, remember_me: rememberMe }) }),
    logout: () => req<{ ok: boolean }>('/auth/logout', { method: 'POST', body: JSON.stringify({}) }),
    me: () => req<AuthUser>('/auth/me'),
  },





  widgets: {
    list: () => req<Widget[]>('/widgets'),
    create: (data: { type: string; name: string; config: object; show_in_topbar?: boolean }) =>
      req<Widget>('/widgets', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<{ name: string; config: object; show_in_topbar: boolean; position: number; icon_id: string | null }>) =>
      req<Widget>(`/widgets/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/widgets/${id}`, { method: 'DELETE' }),
    stats: (id: string) => req<WidgetStats>(`/widgets/${id}/stats`),
    setAdGuardProtection: (id: string, enabled: boolean) =>
      req<{ ok: boolean }>(`/widgets/${id}/adguard/protection`, {
        method: 'POST', body: JSON.stringify({ enabled }),
      }),
    triggerButton: (id: string, buttonId: string) =>
      req<{ ok: boolean; status: number }>(`/widgets/${id}/trigger`, { method: 'POST', body: JSON.stringify({ button_id: buttonId }) }),
    haToggle: (id: string, entityId: string, currentState: string) =>
      req<{ ok: boolean }>(`/widgets/${id}/ha/toggle`, { method: 'POST', body: JSON.stringify({ entity_id: entityId, current_state: currentState }) }),
    setPiholeProtection: (id: string, enabled: boolean) =>
      req<{ ok: boolean }>(`/widgets/${id}/pihole/protection`, { method: 'POST', body: JSON.stringify({ enabled }) }),
    uploadIcon: (id: string, data: string, contentType: string) =>
      req<{ icon_url: string }>(`/widgets/${id}/icon`, { method: 'POST', body: JSON.stringify({ data, content_type: contentType }) }),
  },

  dashboard: {
    list: () => req<DashboardResponse>('/dashboard'),
    createGroup: (name: string) =>
      req<DashboardGroup>('/dashboard/groups', { method: 'POST', body: JSON.stringify({ name }) }),
    updateGroup: (id: string, data: Partial<DashboardGroup>) =>
      req<{ ok: boolean }>(`/dashboard/groups/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteGroup: (id: string) =>
      req<void>(`/dashboard/groups/${id}`, { method: 'DELETE' }),
    reorderGroups: (ids: string[]) =>
      req<{ ok: boolean }>('/dashboard/groups/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) }),
    moveItemToGroup: (itemId: string, groupId: string | null) =>
      req<{ ok: boolean }>(`/dashboard/items/${itemId}/group`, { method: 'PATCH', body: JSON.stringify({ group_id: groupId }) }),
    reorderGroupItems: (groupId: string, ids: string[]) =>
      req<{ ok: boolean }>(`/dashboard/groups/${groupId}/reorder-items`, { method: 'PATCH', body: JSON.stringify({ ids }) }),
    addItem: (type: string, ref_id?: string) =>
      req<DashboardItem>('/dashboard/items', { method: 'POST', body: JSON.stringify({ type, ref_id }) }),
    removeItem: (id: string) =>
      req<void>(`/dashboard/items/${id}`, { method: 'DELETE' }),
    removeByRef: (type: string, ref_id: string) =>
      req<void>('/dashboard/items/by-ref', { method: 'DELETE', body: JSON.stringify({ type, ref_id }) }),
    reorder: (ids: string[]) =>
      req<{ ok: boolean }>('/dashboard/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) }),
  },

  docker: {
    containers: () => req<DockerContainer[]>('/docker/containers'),
    stats: (id: string) => req<ContainerStats>(`/docker/containers/${id}/stats`),
    allStats: () => req<Record<string, ContainerStats>>('/docker/stats'),
    control: (id: string, action: 'start' | 'stop' | 'restart') =>
      req<{ ok: boolean }>(`/docker/containers/${id}/${action}`, { method: 'POST', body: JSON.stringify({}) }),
  },

  backgrounds: {
    list: () => req<Background[]>('/backgrounds'),
    mine: () => req<{ id: string; name: string; url: string } | null>('/backgrounds/mine'),
    upload: (name: string, data: string, content_type: string) =>
      req<Background>('/backgrounds', { method: 'POST', body: JSON.stringify({ name, data, content_type }) }),
    delete: (id: string) => req<void>(`/backgrounds/${id}`, { method: 'DELETE' }),
    setGroupBackground: (groupId: string, background_id: string | null) =>
      req<{ ok: boolean }>(`/user-groups/${groupId}/background`, {
        method: 'PUT',
        body: JSON.stringify({ background_id }),
      }),
  },

  ha: {
    instances: {
      list: () => req<HaInstance[]>('/ha/instances'),
      create: (data: { name: string; url: string; token: string; enabled?: boolean }) =>
        req<HaInstance>('/ha/instances', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: { name?: string; url?: string; token?: string; enabled?: boolean }) =>
        req<HaInstance>(`/ha/instances/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => req<void>(`/ha/instances/${id}`, { method: 'DELETE' }),
      test: (id: string) => req<{ ok: boolean; error?: string }>(`/ha/instances/${id}/test`, { method: 'POST', body: JSON.stringify({}) }),
      states: (id: string) => req<HaEntityFull[]>(`/ha/instances/${id}/states`),
      persons: (id: string) => req<import('./types').HaPersonEnriched[]>(`/ha/instances/${id}/persons`),
      areas: (id: string) => req<HaArea[]>(`/ha/instances/${id}/areas`),
      entityArea: (id: string, entityId: string) => req<{ area_id: string | null }>(`/ha/instances/${id}/entity-area?entity_id=${encodeURIComponent(entityId)}`),
      call: (id: string, domain: string, service: string, entity_id: string, service_data?: Record<string, unknown>) =>
        req<{ ok: boolean }>(`/ha/instances/${id}/call`, { method: 'POST', body: JSON.stringify({ domain, service, entity_id, service_data }) }),
    },
    energy: (instanceId: string, period: string) =>
      req<EnergyData>(`/ha/instances/${instanceId}/energy?period=${period}`),
    panels: {
      list: () => req<HaPanel[]>('/ha/panels'),
      add: (data: { instance_id: string; entity_id: string; label?: string; panel_type?: string }) =>
        req<HaPanel>('/ha/panels', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: { label?: string; panel_type?: string; area_id?: string | null }) =>
        req<HaPanel>(`/ha/panels/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => req<void>(`/ha/panels/${id}`, { method: 'DELETE' }),
      reorder: (ids: string[]) => req<{ ok: boolean }>('/ha/panels/reorder', { method: 'PATCH', body: JSON.stringify({ ids }) }),
    },
    alerts: {
      list: () => req<HaAlert[]>('/ha/alerts'),
      create: (data: { instance_id: string; entity_id: string; condition_type: string; condition_value?: string | null; message: string }) =>
        req<HaAlert>('/ha/alerts', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: { condition_type?: string; condition_value?: string | null; message?: string; enabled?: boolean }) =>
        req<HaAlert>(`/ha/alerts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => req<void>(`/ha/alerts/${id}`, { method: 'DELETE' }),
    },
    history: (instanceId: string, entityId: string, hours: number) =>
      req<HaHistoryEntry[]>(`/ha/instances/${instanceId}/history?entity_id=${encodeURIComponent(entityId)}&hours=${hours}`),
    scenes: (instanceId: string) =>
      req<HaEntityFull[]>(`/ha/instances/${instanceId}/scenes`),
    automations: (instanceId: string) =>
      req<HaEntityFull[]>(`/ha/instances/${instanceId}/automations`),
    automationToggle: (instanceId: string, entityId: string) =>
      req<{ ok: boolean }>(`/ha/instances/${instanceId}/automations/${encodeURIComponent(entityId)}/toggle`, { method: 'POST', body: JSON.stringify({}) }),
    automationTrigger: (instanceId: string, entityId: string) =>
      req<{ ok: boolean }>(`/ha/instances/${instanceId}/automations/${encodeURIComponent(entityId)}/trigger`, { method: 'POST', body: JSON.stringify({}) }),
    floorplans: {
      list: () => req<HaFloorplan[]>('/ha/floorplans'),
      create: (data: { name: string; type?: string; level?: number; icon?: string; orientation?: string }) =>
        req<HaFloorplan>('/ha/floorplans', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: { name?: string; type?: string; level?: number; icon?: string; orientation?: string }) =>
        req<HaFloorplan>(`/ha/floorplans/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => req<void>(`/ha/floorplans/${id}`, { method: 'DELETE' }),
      uploadImage: (id: string, data: string, content_type: string) =>
        req<{ url: string }>(`/ha/floorplans/${id}/image`, { method: 'POST', body: JSON.stringify({ data, content_type }) }),
      deleteImage: (id: string) => req<{ ok: boolean }>(`/ha/floorplans/${id}/image`, { method: 'DELETE' }),
      export: () => req<{ floorplans: HaFloorplan[]; entities: Record<string, HaFloorplanEntity[]> }>('/ha/floorplans/export'),
      import: (data: { floorplans: HaFloorplan[]; entities: Record<string, HaFloorplanEntity[]> }) =>
        req<{ imported: number; skipped: number }>('/ha/floorplans/import', { method: 'POST', body: JSON.stringify(data) }),
      entities: {
        list: (id: string) => req<HaFloorplanEntity[]>(`/ha/floorplans/${id}/entities`),
        add: (id: string, data: { entity_id: string; pos_x: number; pos_y: number; display_size?: string; show_label?: boolean }) =>
          req<HaFloorplanEntity>(`/ha/floorplans/${id}/entities`, { method: 'POST', body: JSON.stringify(data) }),
        update: (id: string, entityId: string, data: { pos_x?: number; pos_y?: number; display_size?: string; show_label?: boolean }) =>
          req<HaFloorplanEntity>(`/ha/floorplans/${id}/entities/${entityId}`, { method: 'PATCH', body: JSON.stringify(data) }),
        remove: (id: string, entityId: string) =>
          req<void>(`/ha/floorplans/${id}/entities/${entityId}`, { method: 'DELETE' }),
      },
    },
  },


  activity: {
    list: (category?: string) => {
      const url = category && category !== 'all' ? `/activity?category=${encodeURIComponent(category)}` : '/activity'
      return req<{ entries: { id: string; created_at: string; category: string; message: string; severity: string; meta: string | null }[] }>(url)
    },
  },

  admin: {
  },

  services_extra: {
    healthHistory: (id: string) => req<{ history: { hour: string; uptime: number }[]; uptimePercent7d: number | null }>(`/services/${id}/health-history`),
  },

  logbuch: {
    healthScore: () => req<{
      score: number
      breakdown: {
        services: { online: number; total: number; points: number }
        docker: { running: number; total: number; points: number; available: boolean }
        ha: { reachable: number; total: number; points: number }
      }
    }>('/logbuch/health-score'),
    calendar: () => req<{ days: { date: string; count: number; maxSeverity: string }[] }>('/logbuch/calendar'),
    anomalies: () => req<{ anomalies: { serviceId: string; serviceName: string | null; offlineCount: number }[] }>('/logbuch/anomalies'),
  },

  network: {
    devices: {
      list: () => req<NetworkDevice[]>('/network/devices'),
      create: (data: Partial<NetworkDevice>) => req<NetworkDevice>('/network/devices', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Partial<NetworkDevice>) => req<NetworkDevice>(`/network/devices/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => req<void>(`/network/devices/${id}`, { method: 'DELETE' }),
    },
    wol: (id: string) => req<{ ok: boolean; error?: string }>(`/network/devices/${id}/wol`, { method: 'POST', body: JSON.stringify({}) }),
    scan: (subnet: string) => req<ScanResult[]>(`/network/scan?subnet=${encodeURIComponent(subnet)}`),
    history: (id: string) => req<NetworkDeviceHistory[]>(`/network/devices/${id}/history`),
  },

  backup: {
    sources: {
      list: () => req<BackupSource[]>('/backup/sources'),
      create: (data: { name: string; type: string; config?: Record<string, unknown>; enabled?: boolean }) =>
        req<BackupSource>('/backup/sources', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Partial<BackupSource>) =>
        req<BackupSource>(`/backup/sources/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => req<void>(`/backup/sources/${id}`, { method: 'DELETE' }),
    },
    status: () => req<{ sources: BackupStatusResult[] }>('/backup/status'),
    dockerExport: () => fetch('/api/backup/docker/export', { credentials: 'include' }).then(r => r.blob()),
  },

  resources: {
    history: (range?: '1h' | '24h' | '7d') => req<ResourceSnapshot[]>(`/resources/history${range ? `?range=${range}` : ''}`),
  },

  changelog: {
    list: () => req<ChangelogRelease[]>('/changelog'),
  },

  health: () => req<{ status: string; version: string; uptime: number }>('/health'),
  serverTime: () => req<{ iso: string }>('/time'),

  unraid: {
    instances: {
      list:    ()                                                   => req<UnraidInstance[]>('/unraid/instances'),
      create:  (b: { name: string; url: string; api_key: string }) => req<UnraidInstance>('/unraid/instances', { method: 'POST', body: JSON.stringify(b) }),
      update:  (id: string, b: object)                             => req<UnraidInstance>(`/unraid/instances/${id}`, { method: 'PATCH', body: JSON.stringify(b) }),
      delete:  (id: string)                                        => req<void>(`/unraid/instances/${id}`, { method: 'DELETE' }),
      reorder: (ids: string[])                                     => req<{ ok: boolean }>('/unraid/instances/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
      test:    (url: string, api_key: string)                      => req<{ ok: boolean }>('/unraid/test', { method: 'POST', body: JSON.stringify({ url, api_key }) }),
    },
    ping:                (id: string)                                                                   => req<{ online: boolean }>(`/unraid/${id}/ping`),
    info:                (id: string)                                                                   => req<UnraidInfo>(`/unraid/${id}/info`),
    array:               (id: string)                                                                   => req<UnraidArray>(`/unraid/${id}/array`),
    parity:              (id: string)                                                                   => req<{ parityHistory?: UnraidParityHistory[] }>(`/unraid/${id}/parityhistory`),
    arrayStart:          (id: string)                                                                   => req<unknown>(`/unraid/${id}/array/start`, { method: 'POST', body: JSON.stringify({}) }),
    arrayStop:           (id: string)                                                                   => req<unknown>(`/unraid/${id}/array/stop`, { method: 'POST', body: JSON.stringify({}) }),
    parityStart:         (id: string, correct: boolean)                                                 => req<unknown>(`/unraid/${id}/parity/start`, { method: 'POST', body: JSON.stringify({ correct }) }),
    parityPause:         (id: string)                                                                   => req<unknown>(`/unraid/${id}/parity/pause`, { method: 'POST', body: JSON.stringify({}) }),
    parityResume:        (id: string)                                                                   => req<unknown>(`/unraid/${id}/parity/resume`, { method: 'POST', body: JSON.stringify({}) }),
    parityCancel:        (id: string)                                                                   => req<unknown>(`/unraid/${id}/parity/cancel`, { method: 'POST', body: JSON.stringify({}) }),
    diskSpinUp:          (id: string, diskId: string)                                                   => req<unknown>(`/unraid/${id}/disks/${encodeURIComponent(diskId)}/spinup`, { method: 'POST', body: JSON.stringify({}) }),
    diskSpinDown:        (id: string, diskId: string)                                                   => req<unknown>(`/unraid/${id}/disks/${encodeURIComponent(diskId)}/spindown`, { method: 'POST', body: JSON.stringify({}) }),
    docker:              (id: string)                                                                   => req<UnraidContainer[]>(`/unraid/${id}/docker`),
    dockerControl:       (id: string, name: string, action: 'start' | 'stop' | 'restart' | 'unpause' | 'pause') => req<unknown>(`/unraid/${id}/docker/${encodeURIComponent(name)}/${action}`, { method: 'POST', body: JSON.stringify({}) }),
    dockerUpdate:        (id: string, name: string)                                                             => req<unknown>(`/unraid/${id}/docker/${encodeURIComponent(name)}/update`, { method: 'POST', body: JSON.stringify({}) }),
    dockerUpdateAll:     (id: string)                                                                           => req<unknown>(`/unraid/${id}/docker/update-all`, { method: 'POST', body: JSON.stringify({}) }),
    vms:                 (id: string)                                                                           => req<{ vms?: { domains?: UnraidVm[] } }>(`/unraid/${id}/vms`),
    vmControl:           (id: string, uuid: string, action: 'start' | 'stop' | 'pause' | 'resume' | 'forcestop' | 'reboot' | 'reset') => req<unknown>(`/unraid/${id}/vms/${encodeURIComponent(uuid)}/${action}`, { method: 'POST', body: JSON.stringify({}) }),
    shares:              (id: string)                                                                           => req<{ shares?: UnraidShare[] }>(`/unraid/${id}/shares`),
    users:               (id: string)                                                                           => req<{ users?: UnraidUser[] }>(`/unraid/${id}/users`),
    notifications:       (id: string)                                                                           => req<UnraidNotifications>(`/unraid/${id}/notifications`),
    notificationsArchive: (id: string)                                                                          => req<{ list?: import('./types/unraid').UnraidNotification[] }>(`/unraid/${id}/notifications/archive`),
    archiveNotification:     (id: string, nId: string) => req<unknown>(`/unraid/${id}/notifications/archive/${encodeURIComponent(nId)}`, { method: 'POST', body: JSON.stringify({}) }),
    archiveAllNotifications: (id: string)              => req<unknown>(`/unraid/${id}/notifications/archive-all`, { method: 'POST', body: JSON.stringify({}) }),
    config:              (id: string)                                                                           => req<UnraidConfig>(`/unraid/${id}/config`),
    physicalDisks:       (id: string)                                                                           => req<{ disks?: UnraidPhysicalDisk[] }>(`/unraid/${id}/physicaldisks`),
    diskMount:           (id: string, diskId: string)                                                           => req<unknown>(`/unraid/${id}/disks/${encodeURIComponent(diskId)}/mount`, { method: 'POST', body: JSON.stringify({}) }),
    diskUnmount:         (id: string, diskId: string)                                                           => req<unknown>(`/unraid/${id}/disks/${encodeURIComponent(diskId)}/unmount`, { method: 'POST', body: JSON.stringify({}) }),
    services:              (id: string)                                    => req<{ services?: UnraidService[] }>(`/unraid/${id}/services`),
    flash:                 (id: string)                                    => req<{ flash?: UnraidFlash }>(`/unraid/${id}/flash`),
    server:                (id: string)                                    => req<{ server?: UnraidServer; owner?: UnraidOwner; me?: UnraidMe }>(`/unraid/${id}/server`),
    network:               (id: string)                                    => req<{ network?: UnraidNetworkAccess }>(`/unraid/${id}/network`),
    connect:               (id: string)                                    => req<{ connect?: UnraidConnect; cloud?: unknown; remoteAccess?: unknown }>(`/unraid/${id}/connect`),
    upsDevices:            (id: string)                                    => req<{ upsDevices?: UnraidUpsDevice[] }>(`/unraid/${id}/ups/devices`),
    upsConfig:             (id: string)                                    => req<{ upsConfiguration?: UnraidUpsConfig }>(`/unraid/${id}/ups/configuration`),
    configureUps:          (id: string, config: object)                   => req<{ ok: boolean }>(`/unraid/${id}/ups/configure`, { method: 'POST', body: JSON.stringify(config) }),
    logs:                  (id: string)                                    => req<{ logFiles?: UnraidLogFile[] }>(`/unraid/${id}/logs`),
    logFile:               (id: string, path: string, lines?: number)     => req<{ logFile?: { path?: string; content?: string; totalLines?: number; startLine?: number } }>(`/unraid/${id}/logs/${encodeURIComponent(path)}${lines ? `?lines=${lines}` : ''}`),
    plugins:               (id: string)                                    => req<{ plugins?: UnraidPlugin[] }>(`/unraid/${id}/plugins`),
    removePlugin:          (id: string, names: string[])                  => req<unknown>(`/unraid/${id}/plugins`, { method: 'DELETE', body: JSON.stringify({ names }) }),
    apiKeys:               (id: string)                                    => req<{ apiKeys?: UnraidApiKey[]; apiKeyPossibleRoles?: string[] }>(`/unraid/${id}/apikeys`),
    createApiKey:          (id: string, data: object)                     => req<unknown>(`/unraid/${id}/apikeys`, { method: 'POST', body: JSON.stringify(data) }),
    deleteApiKey:          (id: string, keyId: string)                    => req<{ ok: boolean }>(`/unraid/${id}/apikeys/${encodeURIComponent(keyId)}`, { method: 'DELETE' }),
    dockerNetworks:        (id: string)                                    => req<{ networks?: UnraidDockerNetwork[] }>(`/unraid/${id}/docker/networks`),
    portConflicts:         (id: string)                                    => req<{ docker?: { portConflicts?: unknown } }>(`/unraid/${id}/docker/port-conflicts`),
    removeDockerContainer: (id: string, containerId: string, withImage?: boolean) => req<{ ok: boolean }>(`/unraid/${id}/docker/${encodeURIComponent(containerId)}${withImage ? '?withImage=true' : ''}`, { method: 'DELETE' }),
    createNotification:    (id: string, data: object)                     => req<unknown>(`/unraid/${id}/notifications`, { method: 'POST', body: JSON.stringify(data) }),
    deleteNotificationPerm:(id: string, notifId: string, type: string)    => req<{ ok: boolean }>(`/unraid/${id}/notifications/${encodeURIComponent(notifId)}?type=${type}`, { method: 'DELETE' }),
    metrics:               (id: string)                                    => req<{ metrics?: UnraidMetricsDetailed }>(`/unraid/${id}/metrics`),
  },

  bookmarks: {
    list: () => req<import('./types').Bookmark[]>('/bookmarks'),
    create: (name: string, url: string, description?: string) =>
      req<import('./types').Bookmark>('/bookmarks', { method: 'POST', body: JSON.stringify({ name, url, description }) }),
    update: (id: string, data: { name?: string; url?: string; description?: string; icon_id?: string | null }) =>
      req<import('./types').Bookmark>(`/bookmarks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/bookmarks/${id}`, { method: 'DELETE' }),
    uploadIcon: (id: string, data: string, content_type: string) =>
      req<{ icon_url: string }>(`/bookmarks/${id}/icon`, { method: 'POST', body: JSON.stringify({ data, content_type }) }),
    toggleDashboard: (id: string, show: boolean) =>
      req<{ success: boolean }>(`/bookmarks/${id}/dashboard`, { method: 'PATCH', body: JSON.stringify({ show }) }),
    export: async (): Promise<Blob> => {
      const res = await fetch(`${BASE}/bookmarks/export`, { credentials: 'include', cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return res.blob()
    },
    import: (bookmarks: Array<{ name: string; url: string; description?: string }>) =>
      req<{ imported: number; skipped: number; errors: string[] }>('/bookmarks/import', { method: 'POST', body: JSON.stringify({ bookmarks }) }),
  },

  instances: {
    list: () => req<Instance[]>('/instances'),
    create: (data: { type: InstanceType; name: string; url: string; token?: string; api_key?: string; enabled?: boolean; icon_id?: string | null }) =>
      req<Instance>('/instances', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name?: string; url?: string; token?: string; api_key?: string; enabled?: boolean; icon_id?: string | null }) =>
      req<Instance>(`/instances/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => req<void>(`/instances/${id}`, { method: 'DELETE' }),
    test: (id: string) => req<{ ok: boolean; error?: string }>(`/instances/${id}/test`, { method: 'POST', body: JSON.stringify({}) }),
    reorder: (ids: string[]) => req<{ ok: boolean }>('/instances/reorder', { method: 'POST', body: JSON.stringify({ ids }) }),
  },

  helbackup: {
    health: () => req<{ ok: boolean }>('/helbackup/health'),
    status: () => req<HelbackupWidgetStatus>('/helbackup/status'),
    jobs: () => req<HelbackupJob[]>('/helbackup/jobs'),
    backups: () => req<{ backups: HelbackupBackup[]; pagination: { total: number; limit: number; offset: number } }>('/helbackup/backups'),
    history: (params?: { jobId?: string; status?: string; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.jobId) q.set('jobId', params.jobId)
      if (params?.status) q.set('status', params.status)
      if (params?.limit) q.set('limit', String(params.limit))
      const qs = q.toString()
      return req<{ history: HelbackupHistoryEntry[]; pagination: { total: number; limit: number; offset: number } }>(`/helbackup/history${qs ? `?${qs}` : ''}`)
    },
    streamToken: (runId: string) => req<{ sseToken: string }>(`/helbackup/logs/${runId}/stream-token`, { method: 'POST', body: JSON.stringify({}) }),
    triggerJob: (jobId: string) => req<{ triggered: boolean; jobId: string; runId: string; message: string }>(`/helbackup/jobs/${jobId}/trigger`, { method: 'POST', body: JSON.stringify({}) }),
  },
}

export function getIconUrl(entity: {
  icon_id?: string | null
  icon_url?: string | null
}): string | null {
  if (entity.icon_id) {
    return `/api/icons/${entity.icon_id}`
  }
  if (entity.icon_url) {
    return entity.icon_url
  }
  return null
}
