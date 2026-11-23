import { useLiveQuery } from 'dexie-react-hooks'
import { db, QUALITY_COLOR } from '../db'
import { useMonth } from '../hooks'
import { useUI } from '../store'
import { daysUntil, fa, fmt, toJ, today, toMin } from '../jalali'
import { QuickExpense } from './Expenses'

export default function Dashboard() {
  const t = today(), j = toJ(t), setTab = useUI(s => s.setTab)
  const acts = useLiveQuery(() => db.activities.where('date').equals(t).sortBy('startTime'), [t]) ?? []
  const exps = useLiveQuery(() => db.expenses.where('date').equals(t).toArray(), [t]) ?? []
  const cats = useLiveQuery(() => db.categories.toArray()) ?? []
  const events = (useLiveQuery(() => db.events.where('date').aboveOrEqual(t).sortBy('date'), [t]) ?? []).slice(0, 3)
  const m = useMonth(j.jy, j.jm)
  const cm = new Map(cats.map(c => [c.id, c]))
  const now = new Date(), nowMin = now.getHours() * 60 + now.getMinutes()
  const sum = exps.reduce((a, e) => a + e.amount, 0)
  const budget = m?.budget ?? 0, spent = m?.spent ?? 0, pct = budget ? Math.round(spent / budget * 100) : 0
  const cards: [string, string][] = [
    ['فعالیت‌های امروز', fa(acts.length)], ['انجام‌شده', fa(acts.filter(a => toMin(a.endTime) <= nowMin).length)],
    ['هزینه امروز', fa(sum)], ['تراکنش‌های امروز', fa(exps.length)],
    ['باقی‌مانده بودجه', budget ? fa(budget - spent) : '—'], ['مصرف بودجه', budget ? `${fa(pct)}٪` : '—']]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map(([l, v]) => <div key={l} className="card"><div className="text-xs text-mu">{l}</div><div className="text-lg font-bold">{v}</div></div>)}</div>
      <div className="card space-y-2"><b className="text-sm">وضعیت بودجه ماه</b>
        <div className="h-2 rounded-full bg-sec overflow-hidden"><div className="h-full" style={{ width: `${Math.min(pct, 100)}%`, background: pct > 100 ? '#F87171' : '#34D399' }} /></div>
        <p className="text-xs text-mu">{budget ? `${fa(spent)} از ${fa(budget)} تومان${spent > budget ? ` · اضافه‌خرج: ${fa(spent - budget)}` : ''}` : 'بودجه‌ای تعیین نشده است. از تب هزینه‌ها تعیین کنید.'}</p></div>
      <div className="card space-y-2"><b className="text-sm">برنامه امروز</b>
        {acts.length === 0 && <p className="text-mu text-sm">فعالیتی برای امروز ثبت نشده است.</p>}
        {acts.map(a => <div key={a.id} className="flex items-center gap-2 text-sm"><span className="w-1.5 h-6 rounded" style={{ background: a.color }} />
          <span className="flex-1">{a.title}</span><span className="text-mu text-xs">{fa(+a.startTime.slice(0, 2), false)}:{a.startTime.slice(3)} - {a.endTime}</span>
          {a.quality && <span className="w-2.5 h-2.5 rounded-full" style={{ background: QUALITY_COLOR[a.quality] }} />}</div>)}
        <button className="btn2" onClick={() => setTab('week')}>برنامه هفتگی</button></div>
      <QuickExpense />
      <div className="card space-y-2"><b className="text-sm">هزینه‌های امروز</b>
        {exps.length === 0 && <p className="text-mu text-sm">هزینه‌ای برای امروز ثبت نشده است.</p>}
        {exps.map(e => <div key={e.id} className="flex items-center gap-2 text-sm"><span className="w-2.5 h-2.5 rounded-full" style={{ background: cm.get(e.categoryId)?.color ?? '#94A3B8' }} />
          <span className="flex-1">{e.title}<span className="text-mu text-xs"> · {cm.get(e.categoryId)?.name ?? 'بدون دسته'}</span></span><b>{fa(e.amount)}</b></div>)}
        <button className="btn2" onClick={() => setTab('expenses')}>گزارش کامل هزینه‌ها</button></div>
      <div className="card space-y-2"><b className="text-sm">رویدادهای آینده</b>
        {events.length === 0 && <p className="text-mu text-sm">رویدادی در پیش نیست.</p>}
        {events.map(e => <div key={e.id} className="flex justify-between text-sm"><span>{e.title}</span><span className="text-mu text-xs">{fmt(e.date)} · {daysUntil(e.date) === 0 ? 'امروز' : `${fa(daysUntil(e.date))} روز دیگر`}</span></div>)}</div>
    </div>)
}
