import { create } from 'zustand'
import type { DashboardGroup, DashboardItem } from '../types'
import { api } from '../api'

interface DashboardState {
  groups: DashboardGroup[]
  items: DashboardItem[]
  loading: boolean
  editMode: boolean
  showVisibilityOverlay: boolean

  loadDashboard: () => Promise<void>
  setEditMode: (v: boolean) => void
  setShowVisibilityOverlay: (v: boolean) => void

  addServiceItem: (refId: string) => Promise<void>
  addArrItem: (refId: string) => Promise<void>
  addWidgetItem: (refId: string) => Promise<void>
  addPlaceholder: (type: 'small' | 'medium' | 'large') => Promise<void>

  removeItem: (id: string) => Promise<void>
  removeByRef: (type: string, refId: string) => Promise<void>

  reorder: (ids: string[]) => Promise<void>
  createGroup: (name: string) => Promise<void>
  updateGroup: (id: string, data: Partial<DashboardGroup>) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  reorderGroups: (ids: string[]) => Promise<void>
  moveItemToGroup: (itemId: string, groupId: string | null) => Promise<void>
  reorderGroupItems: (groupId: string, orderedIds: string[]) => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  groups: [],
  items: [],
  loading: false,
  editMode: false,
  showVisibilityOverlay: false,

  loadDashboard: async () => {
    set({ loading: true })
    try {
      const { groups, items } = await api.dashboard.list()
      set({ groups, items, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  setEditMode: (v) => set({ editMode: v }),
  setShowVisibilityOverlay: (v) => set({ showVisibilityOverlay: v }),

  addServiceItem: async (refId) => {
    await api.dashboard.addItem('service', refId)
    await get().loadDashboard()
  },

  addArrItem: async (refId) => {
    await api.dashboard.addItem('arr_instance', refId)
    await get().loadDashboard()
  },

  addWidgetItem: async (refId) => {
    await api.dashboard.addItem('widget', refId)
    await get().loadDashboard()
  },

  addPlaceholder: async (type) => {
    await api.dashboard.addItem(type)
    await get().loadDashboard()
  },

  removeItem: async (id) => {
    await api.dashboard.removeItem(id)
    await get().loadDashboard()
  },

  removeByRef: async (type, refId) => {
    await api.dashboard.removeByRef(type, refId)
    await get().loadDashboard()
  },

  reorder: async (ids) => {
    await api.dashboard.reorder(ids)
    await get().loadDashboard()
  },

  createGroup: async (name) => {
    await api.dashboard.createGroup(name)
    await get().loadDashboard()
  },

  updateGroup: async (id, data) => {
    await api.dashboard.updateGroup(id, data)
    await get().loadDashboard()
  },

  deleteGroup: async (id) => {
    await api.dashboard.deleteGroup(id)
    await get().loadDashboard()
  },

  reorderGroups: async (ids) => {
    await api.dashboard.reorderGroups(ids)
    await get().loadDashboard()
  },

  moveItemToGroup: async (itemId, groupId) => {
    await api.dashboard.moveItemToGroup(itemId, groupId)
    await get().loadDashboard()
  },

  reorderGroupItems: async (groupId, orderedIds) => {
    await api.dashboard.reorderGroupItems(groupId, orderedIds)
    await get().loadDashboard()
  },
}))
