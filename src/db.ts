
import Dexie, { Table } from 'dexie'

export type Quality = 'bad' | 'mid' | 'good'

export interface Activity {
  id?: number
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  color: string
  quality?: Quality
  createdAt: number
  updatedAt: number
}

export interface Expense {
  id?: number
  title: string
  description?: string
  amount: number
  date: string
  categoryId?: number
  createdAt: number
  updatedAt: number
}

export interface Category {
  id?: number
  name: string
  color: string
  createdAt: number
  updatedAt: number
}

export interface Budget {
  id?: number
  year: number
  month: number
  amount: number
  createdAt: number
  updatedAt: number
}

export interface PEvent {
  id?: number
  title: string
  description?: string
  date: string
  time?: string
  category: string
  priority: 'high' | 'medium' | 'low'
  reminderEnabled: boolean
  reminderMinutesBefore?: number
  remindedAt?: number
  createdAt: number
  updatedAt: number
}

export interface Notice {
  id?: number
  title: string
  body: string
  eventId?: number
  read: boolean
  createdAt: number
}

export interface Setting {
  key: string
  value: unknown
}

export const QUALITY_COLOR: Record<Quality, string> = {
  bad: '#F87171',
  mid: '#F59E0B',
  good: '#34D399'
}

export const QUALITY_LABEL: Record<Quality, string> = {
  bad: 'بد',
  mid: 'متوسط',
  good: 'خوب'
}

class DB extends Dexie {
  activities!: Table<Activity, number>
  expenses!: Table<Expense, number>
  categories!: Table<Category, number>
  budgets!: Table<Budget, number>
  events!: Table<PEvent, number>
  notifications!: Table<Notice, number>
  settings!: Table<Setting, string>

  constructor() {
    super('personal-planner')

    // Version 1: Original database schema
    this.version(1).stores({
      activities: '++id,date',
      expenses: '++id,date,categoryId',
      categories: '++id',
      budgets: '++id,[year+month]',
      events: '++id,date',
      notifications: '++id',
      settings: 'key'
    })

    // Version 2: Add createdAt index to notifications
    this.version(2).stores({
      activities: '++id,date',
      expenses: '++id,date,categoryId',
      categories: '++id',
      budgets: '++id,[year+month]',
      events: '++id,date',
      notifications: '++id,createdAt',
      settings: 'key'
    })

    this.on('populate', tx => {
      const n = Date.now()

      const c: [string, string][] = [
        ['خوراک', '#F59E0B'],
        ['حمل‌ونقل', '#60A5FA'],
        ['آموزش', '#34D399'],
        ['پوشاک', '#F472B6'],
        ['تفریح', '#A78BFA'],
        ['درمان', '#F87171'],
        ['سایر', '#94A3B8']
      ]

      tx.table('categories').bulkAdd(
        c.map(([name, color]) => ({
          name,
          color,
          createdAt: n,
          updatedAt: n
        }))
      )
    })
  }
}

export const db = new DB()
