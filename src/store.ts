import { create } from 'zustand'
export type Tab = 'home' | 'week' | 'events' | 'expenses' | 'assistant' | 'settings'
export type Theme = 'light' | 'dark' | 'system'
interface S { tab: Tab; setTab: (t: Tab) => void; theme: Theme; setTheme: (t: Theme) => void }
export const useUI = create<S>()(set => ({
  tab: 'home', setTab: tab => set({ tab }),
  theme: (localStorage.getItem('theme') as Theme) || 'dark',
  setTheme: theme => { localStorage.setItem('theme', theme); set({ theme }) }
}))
