import { useRef, useState } from 'react'
import { z } from 'zod'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db'
import { useUI, Theme } from '../store'

const T = ['activities', 'expenses', 'categories', 'budgets', 'events', 'notifications', 'settings'] as const
const arr = z.array(z.object({}).passthrough())
const schema = z.object({ app: z.literal('personal-planner'), activities: arr, expenses: arr, categories: arr, budgets: arr, events: arr, notifications: arr.default([]), settings: arr.default([]) })

export default function Settings() {
  const { theme, setTheme } = useUI()
  const [msg, setMsg] = useState('')
  const file = useRef<HTMLInputElement>(null)
  const counts = useLiveQuery(async () => Promise.all(T.map(async t => `${t}: ${await db.table(t).count()}`))) ?? []
  const exportData = async () => {
    const data: Record<string, unknown> = { app: 'personal-planner', version: 1, theme }
    for (const t of T) data[t] = await db.table(t).toArray()
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }))
    a.download = `planner-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click()
  }
  const restore = async (f: File) => {
    try {
      const r = schema.safeParse(JSON.parse(await f.text()))
      if (!r.success) return setMsg('فایل پشتیبان معتبر نیست؛ اطلاعات فعلی تغییری نکرد.')
      if (!confirm('تمام اطلاعات فعلی با محتوای این فایل جایگزین می‌شود. ادامه می‌دهید؟')) return
      await db.transaction('rw', db.tables, async () => { for (const t of T) { await db.table(t).clear(); await db.table(t).bulkAdd(r.data[t] as any[]) } })
      setMsg('بازیابی با موفقیت انجام شد.')
    } catch { setMsg('خواندن فایل ناموفق بود؛ اطلاعات فعلی تغییری نکرد.') }
  }
  return (
    <div className="space-y-4">
      <div className="card space-y-2"><b className="text-sm">ظاهر</b>
        <div className="flex gap-2">{(['light', 'dark', 'system'] as Theme[]).map(t => <button key={t} onClick={() => setTheme(t)} className={theme === t ? 'btn' : 'btn2'}>{t === 'light' ? 'روشن' : t === 'dark' ? 'تیره' : 'سیستم'}</button>)}</div></div>
      <div className="card space-y-2"><b className="text-sm">پشتیبان‌گیری</b>
        <div className="flex gap-2"><button className="btn" onClick={exportData}>دریافت پشتیبان</button><button className="btn2" onClick={() => file.current?.click()}>بازیابی (جایگزینی)</button></div>
        <input ref={file} type="file" accept="application/json" hidden onChange={e => { const f = e.target.files?.[0]; if (f) restore(f); e.target.value = '' }} />
        {msg && <p className="text-sm">{msg}</p>}<p className="text-xs text-mu" dir="ltr">{counts.join(' · ')}</p></div>
      <div className="card text-sm"><b>درباره</b><p className="text-mu">Personal Planner · نسخه ۱٫۰٫۰ · برنامه شخصی با ذخیره‌سازی محلی؛ هیچ داده‌ای به سرور ارسال نمی‌شود.</p></div>
    </div>)
}
