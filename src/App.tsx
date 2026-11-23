import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Home, CalendarDays, Star, Wallet, Sparkles, Settings as Cog, Bell } from 'lucide-react'
import { db } from './db'
import { useUI, Tab } from './store'
import { useReminders } from './hooks'
import { fmt, today } from './jalali'
import Dashboard from './pages/Dashboard'
import Planner from './pages/Planner'
import Events from './pages/Events'
import Expenses from './pages/Expenses'
import Assistant from './pages/Assistant'
import Settings from './pages/Settings'

const tabs: { id: Tab; label: string; icon: typeof Home; page: () => JSX.Element | null }[] = [
  { id: 'home', label: 'خانه', icon: Home, page: Dashboard },
  { id: 'week', label: 'هفتگی', icon: CalendarDays, page: Planner },
  { id: 'events', label: 'رویدادها', icon: Star, page: Events },
  { id: 'expenses', label: 'هزینه‌ها', icon: Wallet, page: Expenses },
  { id: 'assistant', label: 'دستیار', icon: Sparkles, page: Assistant },
  { id: 'settings', label: 'تنظیمات', icon: Cog, page: Settings }
]

export default function App() {
  const { tab, setTab, theme } = useUI()
  const [open, setOpen] = useState(false)
  useReminders()
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const apply = () => document.documentElement.classList.toggle('dark', theme === 'dark' || (theme === 'system' && mq.matches))
    apply(); mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
  const notes = useLiveQuery(() => db.notifications.orderBy('createdAt').reverse().toArray()) ?? []
  const unread = notes.filter(n => !n.read).length
  const Page = tabs.find(t => t.id === tab)!.page
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden md:flex md:flex-col w-52 border-e border-bd p-3 gap-1 sticky top-0 h-screen">
        <div className="font-bold text-lg mb-4 px-2">Personal Planner</div>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${tab === t.id ? 'bg-pri text-onpri font-bold' : 'hover:bg-sec'}`}>
            <t.icon size={18} />{t.label}</button>))}
      </aside>
      <div className="flex-1 min-w-0">
        <header className="flex items-center justify-between p-4 relative">
          <div><div className="font-bold md:hidden">Personal Planner</div><div className="text-xs text-mu">{fmt(today())}</div></div>
          <button className="relative btn2" aria-label="اعلان‌ها" onClick={() => setOpen(!open)}>
            <Bell size={18} />{unread > 0 && <span className="absolute -top-1 -start-1 bg-pri text-onpri text-[10px] rounded-full w-4 h-4 grid place-items-center">{unread}</span>}
          </button>
          {open && (
            <div className="card absolute end-4 top-14 w-72 z-30 max-h-80 overflow-auto space-y-2 shadow-xl">
              <div className="flex justify-between text-sm"><b>اعلان‌ها</b>
                <button className="text-pri" onClick={() => db.notifications.toCollection().modify({ read: true })}>همه خوانده شد</button></div>
              {notes.length === 0 && <p className="text-mu text-sm">اعلانی وجود ندارد.</p>}
              {notes.map(n => (
                <div key={n.id} onClick={() => { db.notifications.update(n.id!, { read: true }); setTab('events'); setOpen(false) }} className={`text-sm rounded-lg p-2 cursor-pointer ${n.read ? 'opacity-60' : 'bg-sec'}`}>
                  <div className="font-bold">{n.title}</div><div className="text-mu text-xs">{n.body}</div></div>))}
            </div>)}
        </header>
        <main className="px-4 pb-28 md:pb-8 max-w-5xl mx-auto"><Page /></main>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-bd grid grid-cols-6 pb-[env(safe-area-inset-bottom)] z-20">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-0.5 py-2 text-[10px] ${tab === t.id ? 'text-pri font-bold' : 'text-mu'}`}>
            <t.icon size={20} />{t.label}</button>))}
      </nav>
    </div>)
}
