import { ReactNode, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ChevronRight, ChevronLeft } from 'lucide-react'
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import { Activity, db, Quality, QUALITY_COLOR, QUALITY_LABEL } from '../db'
import { addDays, DAYS, fa, fmt, fromMin, pad, today, toMin, weekStart } from '../jalali'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8)
type Draft = Partial<Activity> & { date: string; startTime: string; endTime: string; title: string; color: string }

function Chip({ a, onClick }: { a: Activity; onClick: () => void }) {
  const { setNodeRef, listeners, attributes, transform, isDragging } = useDraggable({ id: String(a.id) })
  return (
    <div ref={setNodeRef} {...listeners} {...attributes} onClick={e => { e.stopPropagation(); onClick() }}
      className="rounded-lg px-1.5 py-1 text-[11px] text-white cursor-grab touch-manipulation"
      style={{ background: a.color, opacity: isDragging ? .6 : 1, transform: transform ? `translate(${transform.x}px,${transform.y}px)` : undefined, borderBottom: a.quality ? `3px solid ${QUALITY_COLOR[a.quality]}` : undefined, position: 'relative', zIndex: isDragging ? 50 : 0 }}>
      {a.title}</div>)
}
function Cell({ id, onClick, children }: { id: string; onClick: () => void; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return <div ref={setNodeRef} onClick={onClick} className={`w-[92px] min-w-[92px] min-h-[56px] border-s border-bd p-0.5 space-y-0.5 ${isOver ? 'bg-sec' : ''}`}>{children}</div>
}

export default function Planner() {
  const [anchor, setAnchor] = useState(today())
  const ws = weekStart(anchor), days = Array.from({ length: 7 }, (_, i) => addDays(ws, i))
  const acts = useLiveQuery(() => db.activities.where('date').between(ws, days[6], true, true).toArray(), [ws]) ?? []
  const exps = useLiveQuery(() => db.expenses.where('date').between(ws, days[6], true, true).toArray(), [ws]) ?? []
  const [d, setD] = useState<Draft | null>(null)
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }))
  const onEnd = async (e: DragEndEvent) => {
    const a = acts.find(x => String(x.id) === e.active.id)
    if (!a || !e.over) return
    const [date, h] = String(e.over.id).split('|')
    const dur = Math.max(toMin(a.endTime) - toMin(a.startTime), 30), s = Number(h) * 60
    await db.activities.update(a.id!, { date, startTime: fromMin(s), endTime: fromMin(Math.min(s + dur, 1439)), updatedAt: Date.now() })
  }
  const save = async () => {
    if (!d || !d.title.trim() || toMin(d.endTime) <= toMin(d.startTime)) return
    const n = Date.now()
    if (d.id) await db.activities.update(d.id, { ...d, updatedAt: n }); else await db.activities.add({ ...d, createdAt: n, updatedAt: n } as Activity)
    setD(null)
  }
  const blank = (date: string, h: number): Draft => ({ title: '', date, startTime: `${pad(h)}:00`, endTime: `${pad(Math.min(h + 1, 23))}:00`, color: '#60A5FA' })
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button className="btn2" aria-label="هفته قبل" onClick={() => setAnchor(addDays(anchor, -7))}><ChevronRight size={16} /></button>
        <button className="btn2" onClick={() => setAnchor(today())}>امروز</button>
        <button className="btn2" aria-label="هفته بعد" onClick={() => setAnchor(addDays(anchor, 7))}><ChevronLeft size={16} /></button>
        <input className="inp w-auto" type="date" value={anchor} onChange={e => e.target.value && setAnchor(e.target.value)} />
        <span className="text-xs text-mu">{fmt(ws)} تا {fmt(days[6])}</span></div>
      <DndContext sensors={sensors} onDragEnd={onEnd}>
        <div className="card p-0 overflow-auto max-h-[70vh]"><div className="min-w-max">
          <div className="flex border-b border-bd text-xs text-mu"><div className="w-24 shrink-0 sticky right-0 bg-card z-10" />
            {HOURS.map(h => <div key={h} className="w-[92px] min-w-[92px] text-center py-1">{fa(h, false)}:۰۰</div>)}<div className="w-28 shrink-0 sticky left-0 bg-card z-10 text-center py-1">هزینه روز</div></div>
          {days.map((day, i) => (
            <div key={day} className={`flex border-b border-bd ${day === today() ? 'bg-sec/50' : ''}`}>
              <div className="w-24 shrink-0 sticky right-0 bg-card z-10 p-2 text-xs"><b>{DAYS[i]}</b><div className="text-mu">{fmt(day)}</div></div>
              {HOURS.map(h => <Cell key={h} id={`${day}|${h}`} onClick={() => setD(blank(day, h))}>
                {acts.filter(a => a.date === day && Math.floor(toMin(a.startTime) / 60) === h).map(a => <Chip key={a.id} a={a} onClick={() => setD(a)} />)}</Cell>)}
              <div className="w-28 shrink-0 sticky left-0 bg-card z-10 p-2 text-xs font-bold text-center">{fa(exps.filter(e => e.date === day).reduce((s, e) => s + e.amount, 0))}</div>
            </div>))}
        </div></div>
      </DndContext>
      <p className="text-xs text-mu">روی یک خانه بزنید تا فعالیت اضافه شود. برای جابه‌جایی، فعالیت را بکشید (در موبایل کمی نگه دارید).</p>
      {d && (
        <div className="fixed inset-0 bg-black/50 z-40 grid place-items-center p-4" onClick={() => setD(null)}>
          <div className="card w-full max-w-sm space-y-2" onClick={e => e.stopPropagation()}>
            <b>{d.id ? 'ویرایش فعالیت' : 'فعالیت جدید'}</b>
            <input className="inp" placeholder="عنوان" value={d.title} onChange={e => setD({ ...d, title: e.target.value })} />
            <textarea className="inp" placeholder="توضیحات" value={d.description ?? ''} onChange={e => setD({ ...d, description: e.target.value })} />
            <input className="inp" type="date" value={d.date} onChange={e => setD({ ...d, date: e.target.value })} />
            <div className="flex gap-2"><input className="inp" type="time" value={d.startTime} onChange={e => setD({ ...d, startTime: e.target.value })} /><input className="inp" type="time" value={d.endTime} onChange={e => setD({ ...d, endTime: e.target.value })} /></div>
            <div className="flex gap-2"><input type="color" className="h-10 w-14 rounded" value={d.color} onChange={e => setD({ ...d, color: e.target.value })} />
              <select className="inp" value={d.quality ?? ''} onChange={e => setD({ ...d, quality: (e.target.value || undefined) as Quality | undefined })}><option value="">بدون کیفیت</option>{(Object.keys(QUALITY_LABEL) as Quality[]).map(q => <option key={q} value={q}>{QUALITY_LABEL[q]}</option>)}</select></div>
            <div className="flex gap-2"><button className="btn flex-1" onClick={save}>ذخیره</button>
              {d.id && <button className="btn2" onClick={async () => { await db.activities.delete(d.id!); setD(null) }}>حذف</button>}</div>
          </div></div>)}
    </div>)
}
