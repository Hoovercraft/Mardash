import { create } from 'zustand'
import type { Service, Group, Settings, ThemeMode, ThemeAccent, AuthUser, Background } from '../types'
import { api } from '../api'
import { calcAutoTheme } from '../utils'

interface AppState {
  services: Service[]
  groups: Group[]
  settings: Settings | null
  loading: boolean
  error: string | null

  authUser: AuthUser | null
  isAuthenticated: boolean
  isAdmin: boolean
  needsSetup: boolean
  authReady: boolean

  backgrounds: Background[]
  myBackground: string | null

  loadAll: () => Promise<void>
  loadServices: () => Promise<void>
  createService: (data: Partial<Service>) => Promise<string>
  uploadServiceIcon: (id: string, file: File) => Promise<void>
  updateService: (id: string, data: Partial<Service>) => Promise<void>
  deleteService: (id: string) => Promise<void>
  checkService: (id: string) => Promise<void>
  checkAllServices: () => Promise<void>
  reorderGroups: (orderedIds: string[]) => Promise<void>
  reorderServices: (groupId: string | null, orderedIds: string[]) => Promise<void>

  loadGroups: () => Promise<void>
  createGroup: (data: Partial<Group>) => Promise<void>
  updateGroup: (id: string, data: Partial<Group>) => Promise<void>
  deleteGroup: (id: string) => Promise<void>

  loadSettings: () => Promise<void>
  updateSettings: (data: Partial<Settings>) => Promise<void>
  setThemeMode: (mode: ThemeMode) => Promise<void>
  setThemeAccent: (accent: ThemeAccent) => Promise<void>

  startHealthPolling: () => void
  stopHealthPolling: () => void

  checkAuth: () => Promise<void>
  logout: () => Promise<void>

  loadBackgrounds: () => Promise<void>
  loadMyBackground: () => Promise<void>
  uploadBackground: (name: string, file: File) => Promise<void>
  deleteBackground: (id: string) => Promise<void>
}

function parseService<T extends { tags: string | string[]; check_enabled: number | boolean }>(s: T): T {
  return {
    ...s,
    tags: typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags,
    check_enabled: Boolean(s.check_enabled),
  }
}

let healthCheckInterval: ReturnType<typeof setInterval> | null = null

export const useStore = create<AppState>((set, get) => ({
  services: [],
  groups: [],
  settings: null,
  loading: false,
  error: null,

  authUser: null,
  isAuthenticated: true,
  isAdmin: true,
  needsSetup: false,
  authReady: false,

  backgrounds: [],
  myBackground: null,

  loadAll: async () => {
    set({ loading: true, error: null })
    try {
      const [services, groups, rawSettings] = await Promise.all([
        api.services.list(),
        api.groups.list(),
        api.settings.get(),
      ])
      const parsedServices = services.map(parseService)
      const settings = { ...rawSettings }
      set({ services: parsedServices, groups, settings, loading: false })
      applyTheme(settings)
    } catch (e: unknown) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  loadServices: async () => {
    const services = await api.services.list()
    set({ services: services.map(parseService) })
  },

  createService: async (data) => {
    const parsed = parseService(await api.services.create(data))
    set(state => ({ services: [...state.services, parsed] }))
    if (parsed.check_enabled) {
      get().checkService(parsed.id).catch(() => {})
    }
    return parsed.id
  },

  uploadServiceIcon: async (id, file) => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const result = await api.services.uploadIcon(id, base64, file.type)
    set(state => ({
      services: state.services.map(s => s.id === id ? { ...s, icon_url: result.icon_url } : s),
    }))
  },

  updateService: async (id, data) => {
    const parsed = parseService(await api.services.update(id, data))
    set(state => ({ services: state.services.map(s => s.id === id ? parsed : s) }))
  },

  deleteService: async (id) => {
    await api.services.delete(id)
    set(state => ({ services: state.services.filter(s => s.id !== id) }))
  },

  checkService: async (id) => {
    const result = await api.services.check(id)
    set(state => ({
      services: state.services.map(s => s.id === id
        ? { ...s, last_status: result.status as Service['last_status'], last_checked: result.checked_at }
        : s
      ),
    }))
  },

  reorderGroups: async (orderedIds) => {
    set(state => ({
      groups: orderedIds.map((id, i) => {
        const g = state.groups.find(g => g.id === id)!
        return { ...g, position: i }
      }),
    }))
    await Promise.all(orderedIds.map((id, i) => api.groups.update(id, { position: i })))
  },

  reorderServices: async (_groupId, orderedIds) => {
    set(state => {
      const idxMap: Record<string, number> = Object.fromEntries(orderedIds.map((id, i) => [id, i]))
      return {
        services: state.services.map(s =>
          idxMap[s.id] !== undefined ? { ...s, position_x: idxMap[s.id] } : s
        ),
      }
    })
    await Promise.all(orderedIds.map((id, i) => api.services.update(id, { position_x: i })))
  },

  checkAllServices: async () => {
    const results = await api.services.checkAll()
    const map = Object.fromEntries(results.map(r => [r.id, r.status]))
    set(state => ({
      services: state.services.map(s => map[s.id]
        ? { ...s, last_status: map[s.id] as Service['last_status'], last_checked: new Date().toISOString() }
        : s
      ),
    }))
  },

  loadGroups: async () => {
    const groups = await api.groups.list()
    set({ groups })
  },

  createGroup: async (data) => {
    const group = await api.groups.create(data)
    set(state => ({ groups: [...state.groups, group] }))
  },

  updateGroup: async (id, data) => {
    const group = await api.groups.update(id, data)
    set(state => ({ groups: state.groups.map(g => g.id === id ? group : g) }))
  },

  deleteGroup: async (id) => {
    await api.groups.delete(id)
    set(state => ({ groups: state.groups.filter(g => g.id !== id) }))
  },

  loadSettings: async () => {
    const settings = await api.settings.get()
    set({ settings })
    applyTheme(settings)
  },

  updateSettings: async (data) => {
    const settings = await api.settings.update(data)
    set({ settings })
    applyTheme(settings)
  },

  setThemeMode: async (mode) => {
    await get().updateSettings({ theme_mode: mode })
  },

  setThemeAccent: async (accent) => {
    await get().updateSettings({ theme_accent: accent })
  },

  startHealthPolling: () => {
    if (healthCheckInterval) return
    get().loadServices().catch(() => {})
    healthCheckInterval = setInterval(async () => {
      try {
        await get().loadServices()
      } catch {}
    }, 15000)
  },

  stopHealthPolling: () => {
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval)
      healthCheckInterval = null
    }
  },

  checkAuth: async () => {
    try {
      const { user } = await api.auth.status()
      set({
        needsSetup: false,
        authUser: user ?? { sub: 'local-admin', username: 'lokal', role: 'admin', groupId: null },
        isAuthenticated: true,
        isAdmin: true,
        authReady: true,
      })
    } catch {
      set({
        authUser: { sub: 'local-admin', username: 'lokal', role: 'admin', groupId: null },
        authReady: true,
        needsSetup: false,
        isAuthenticated: true,
        isAdmin: true,
      })
    }
  },

  logout: async () => {
    return
  },

  loadBackgrounds: async () => {
    const backgrounds = await api.backgrounds.list()
    set({ backgrounds })
  },

  loadMyBackground: async () => {
    try {
      const result = await api.backgrounds.mine()
      set({ myBackground: result?.url ?? null })
    } catch {
      set({ myBackground: null })
    }
  },

  uploadBackground: async (name, file) => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    const bg = await api.backgrounds.upload(name, base64, file.type)
    set(state => ({ backgrounds: [bg, ...state.backgrounds] }))
  },

  deleteBackground: async (id) => {
    await api.backgrounds.delete(id)
    set(state => ({
      backgrounds: state.backgrounds.filter(b => b.id !== id),
    }))
  },
}))

function applyTheme(settings: Settings) {
  const root = document.documentElement
  const mode = settings.auto_theme_enabled
    ? calcAutoTheme(settings.auto_theme_light_start ?? '08:00', settings.auto_theme_dark_start ?? '20:00')
    : settings.theme_mode
  root.setAttribute('data-theme', mode)
  root.setAttribute('data-accent', settings.theme_accent)
  root.setAttribute('data-radius', settings.design_border_radius ?? 'default')
  root.setAttribute('data-blur', settings.design_glass_blur ?? 'medium')
  root.setAttribute('data-density', settings.design_density ?? 'comfortable')
  root.setAttribute('data-animations', settings.design_animations ?? 'full')
  root.setAttribute('data-sidebar', settings.design_sidebar_style ?? 'default')
  let el = document.getElementById('mardash-custom-css') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'mardash-custom-css'
    document.head.appendChild(el)
  }
  el.textContent = settings.design_custom_css ?? ''
}
