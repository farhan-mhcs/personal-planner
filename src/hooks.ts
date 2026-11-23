import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'
import { monthRange, toJ, parse } from './jalali'
export function useMonth(jy: number, jm: number) {
  return useLiveQuery(async () => {
    const r = monthRange(jy, jm)
    const budget = (await db.budgets.where('[year+month]').equals([jy, jm]).first())?.amount ?? 0
    const ex = await db.expenses.where('date').between(r.start, r.end, true, true).toArray()
    const days: number[] = Array(r.len).fill(0)
    ex.forEach(e => { days[toJ(e.date).jd - 1] += e.amount })
    return { budget, spent: days.reduce((a, b) => a + b, 0), days, len: r.len, start: r.start, end: r.end }
  }, [jy, jm])
}
export function useReminders() {
  useEffect(() => {
    const run = async () => {
      const now = Date.now()
      const evs = await db.events.filter(e => e.reminderEnabled && !e.remindedAt).toArray()
      for (const e of evs) {
        const [h, m] = (e.time ?? '09:00').split(':').map(Number)
        const at = parse(e.date); at.setHours(h, m, 0, 0)
        if (now >= at.getTime() - (e.reminderMinutesBefore ?? 15) * 60000) {
          await db.events.update(e.id!, { remindedAt: now })
          await db.notifications.add({ title: e.title, body: now > at.getTime() ? 'یادآوری ازدست‌رفته' : 'به‌زودی شروع می‌شود', eventId: e.id, read: false, createdAt: now })
        }
      }
    }
    run()
    const i = setInterval(run, 30000)
    const v = () => { if (document.visibilityState === 'visible') run() }
    document.addEventListener('visibilitychange', v)
    return () => { clearInterval(i); document.removeEventListener('visibilitychange', v) }
  }, [])
}
