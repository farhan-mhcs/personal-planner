import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Trash2 } from 'lucide-react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '../db'
import { useMonth } from '../hooks'
import { fa, toJ, today, MONTHS, fmt } from '../jalali'

export function QuickExpense() {
  const cats = useLiveQuery(() => db.categories.toArray()) ?? []
  const [title, setTitle] = useState(''), [amt, setAmt] = useState(''), [cat, setCat] = useState('')
  const add = async () => {
    const amount = Math.round(Number(amt))
    if (!title.trim() || !(amount > 0)) return
    const n = Date.now()
    await db.expenses.add({ title: title.trim(), amount, date: today(), categoryId: cat ? Number(cat) : cats[0]?.id, createdAt: n, updatedAt: n })
    setTitle(''); setAmt('')
  }
  return (
    <div className="card space-y-2"><b className="text-sm">ثبت سریع هزینه</b>
      <div className="grid grid-cols-2 gap-2">
        <input className="inp" placeholder="عنوان" value={title} onChange={e => setTitle(e.target.value)} />
        <input className="inp" placeholder="مبلغ (تومان)" inputMode="numeric" type="number" value={amt} onChange={e => setAmt(e.target.value)} />
        <select className="inp" value={cat} onChange={e => setCat(e.target.value)}>{cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <button className="btn" onClick={add}>ثبت</button></div></div>)
}

export default function Expenses() {
  const j = toJ(today())
  const m = useMonth(j.jy, j.jm)
  const cats = useLiveQuery(() => db.categories.toArray()) ?? []
  const list = useLiveQuery(async () => m ? (await db.expenses.where('date').between(m.start, m.end, true, true).toArray()).sort((a, b) => b.date.localeCompare(a.date) || (b.id! - a.id!)) : [], [m?.start]) ?? []
  const [bud, setBud] = useState('')
  const cm = new Map(cats.map(c => [c.id, c]))
  const saveBudget = async () => {
    const amount = Math.round(Number(bud)); if (!(amount >= 0) || bud === '') return
    const ex = await db.budgets.where('[year+month]').equals([j.jy, j.jm]).first(), n = Date.now()
    if (ex) await db.budgets.update(ex.id!, { amount, updatedAt: n }); else await db.budgets.add({ year: j.jy, month: j.jm, amount, createdAt: n, updatedAt: n })
    setBud('')
  }
  if (!m) return null
  let cum = 0
  const base = m.days.slice(0, j.jd).reduce((a, b) => a + b, 0), avg = base / j.jd
  const data = m.days.map((v, i) => { cum += v; const d = i + 1
    return { d, actual: d <= j.jd ? cum : null, ideal: Math.round(m.budget / m.len * d), forecast: d >= j.jd ? Math.round(base + avg * (d - j.jd)) : null } })
  const ideal = m.budget / m.len * j.jd, projected = Math.round(avg * m.len)
  let verdict = 'اطلاعات کافی برای تحلیل وجود ندارد.'
  if (m.budget > 0 && j.jd >= 3) verdict = base > ideal * 1.1 ? 'سرعت خرج بیشتر از روند بودجه است.' : base < ideal * 0.9 ? 'سرعت خرج کمتر از روند بودجه است.' : 'سرعت خرج مطابق روند بودجه است.'
  if (m.budget > 0 && j.jd >= 3 && projected > m.budget) verdict += ' احتمال اتمام بودجه قبل از پایان ماه وجود دارد.'
  return (
    <div className="space-y-4">
      <QuickExpense />
      <div className="card space-y-2"><b className="text-sm">بودجه {MONTHS[j.jm - 1]}: {fa(m.budget)} تومان</b>
        <div className="flex gap-2"><input className="inp" type="number" inputMode="numeric" placeholder="بودجه جدید" value={bud} onChange={e => setBud(e.target.value)} /><button className="btn" onClick={saveBudget}>ذخیره</button></div></div>
      <div className="card space-y-2"><b className="text-sm">سرعت خرج‌کردن</b>
        <div dir="ltr" className="h-56"><ResponsiveContainer><LineChart data={data}><CartesianGrid strokeOpacity={.2} /><XAxis dataKey="d" fontSize={10} /><YAxis fontSize={10} width={50} tickFormatter={v => `${Math.round(v / 1000)}k`} /><Tooltip /><Legend />
          <Line dataKey="actual" name="واقعی" stroke="#F59E0B" dot={false} strokeWidth={2} />
          <Line dataKey="ideal" name="متناسب با بودجه" stroke="#34D399" dot={false} strokeDasharray="4 4" />
          <Line dataKey="forecast" name="پیش‌بینی" stroke="#60A5FA" dot={false} strokeDasharray="2 4" /></LineChart></ResponsiveContainer></div>
        <p className="text-sm">{verdict}</p>
        <p className="text-xs text-mu">میانگین روزانه: {fa(Math.round(avg))} · پیش‌بینی پایان ماه: {fa(projected)}{m.budget > 0 && ` · اختلاف با بودجه: ${fa(projected - m.budget)}`}</p></div>
      <div className="card space-y-2"><b className="text-sm">هزینه‌های این ماه</b>
        {list.length === 0 && <p className="text-mu text-sm">هنوز هزینه‌ای ثبت نشده است.</p>}
        {list.map(e => (<div key={e.id} className="flex items-center gap-2 text-sm">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: cm.get(e.categoryId)?.color ?? '#94A3B8' }} />
          <span className="flex-1">{e.title}<span className="text-mu text-xs"> · {fmt(e.date)}</span></span><b>{fa(e.amount)}</b>
          <button aria-label="حذف" onClick={() => db.expenses.delete(e.id!)}><Trash2 size={15} className="text-mu" /></button></div>))}</div>
    </div>)
}
