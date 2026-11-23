import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Trash2 } from 'lucide-react'
import { db, PEvent } from '../db'
import { daysUntil, fa, fmt, today } from '../jalali'

const CATS = ['امتحان', 'کوییز', 'نوبت دکتر', 'جلسه', 'Deadline', 'شخصی', 'سایر']
const PRI = { high: '#F87171', medium: '#F59E0B', low: '#94A3B8' }
const MIN: [number, string][] = [[5, '۵ دقیقه'], [15, '۱۵ دقیقه'], [30, '۳۰ دقیقه'], [60, '۱ ساعت'], [180, '۳ ساعت'], [1440, '۱ روز']]

export default function Events() {
  const all = useLiveQuery(() => db.events.orderBy('date').toArray()) ?? []
  const [f, setF] = useState({ title: '', date: today(), time: '', category: CATS[0], priority: 'medium' as PEvent['priority'], remind: true, min: 15 })
  const add = async () => {
    if (!f.title.trim() || !f.date) return
    const n = Date.now()
    await db.events.add({ title: f.title.trim(), date: f.date, time: f.time || undefined, category: f.category, priority: f.priority, reminderEnabled: f.remind, reminderMinutesBefore: f.min, createdAt: n, updatedAt: n })
    setF({ ...f, title: '' })
  }
  const t = today(), up = all.filter(e => e.date >= t), past = all.filter(e => e.date < t).reverse()
  const row = (e: PEvent) => (
    <div key={e.id} className="flex items-center gap-2 text-sm"><span className="w-1.5 h-8 rounded" style={{ background: PRI[e.priority] }} />
      <span className="flex-1">{e.title}<div className="text-mu text-xs">{e.category} · {fmt(e.date)} · {e.time ?? 'همه‌روز'}</div></span>
      <span className="text-xs text-mu">{daysUntil(e.date) === 0 ? 'امروز' : daysUntil(e.date) > 0 ? `${fa(daysUntil(e.date))} روز` : ''}</span>
      <button aria-label="حذف" onClick={() => db.events.delete(e.id!)}><Trash2 size={15} className="text-mu" /></button></div>)
  return (
    <div className="space-y-4">
      <div className="card grid grid-cols-2 gap-2"><b className="text-sm col-span-2">رویداد جدید</b>
        <input className="inp col-span-2" placeholder="عنوان" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
        <input className="inp" type="date" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} />
        <input className="inp" type="time" value={f.time} onChange={e => setF({ ...f, time: e.target.value })} />
        <select className="inp" value={f.category} onChange={e => setF({ ...f, category: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
        <select className="inp" value={f.priority} onChange={e => setF({ ...f, priority: e.target.value as PEvent['priority'] })}><option value="high">اولویت بالا</option><option value="medium">اولویت متوسط</option><option value="low">اولویت پایین</option></select>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={f.remind} onChange={e => setF({ ...f, remind: e.target.checked })} />یادآوری</label>
        <select className="inp" value={f.min} onChange={e => setF({ ...f, min: Number(e.target.value) })}>{MIN.map(([v, l]) => <option key={v} value={v}>{l} قبل</option>)}</select>
        <button className="btn col-span-2" onClick={add}>افزودن رویداد</button></div>
      <div className="card space-y-3"><b className="text-sm">آینده</b>{up.length === 0 && <p className="text-mu text-sm">رویداد آینده‌ای ندارید.</p>}{up.map(row)}</div>
      <div className="card space-y-3"><b className="text-sm">گذشته</b>{past.length === 0 && <p className="text-mu text-sm">سابقه‌ای نیست.</p>}{past.map(row)}</div>
    </div>)
}
