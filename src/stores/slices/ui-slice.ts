import type { StateCreator } from 'zustand'

export interface UiSlice {
  sidebarCollapsed: boolean
  isLoading: boolean
  loadingKey: string | null
  setSidebarCollapsed: (collapsed: boolean) => void
  setLoading: (loading: boolean, key?: string) => void
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  sidebarCollapsed: false,
  isLoading: false,
  loadingKey: null,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setLoading: (loading, key) =>
    set({ isLoading: loading, loadingKey: key ?? null }),
})
