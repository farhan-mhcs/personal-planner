import * as J from 'jalaali-js'
const jalaali: any = (J as any).default ?? J
export const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => iso(new Date())
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (s: string, n: number) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d) }
export const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند']
export const DAYS = ['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه']
export const weekStart = (s: string) => addDays(s, -((parse(s).getDay() + 1) % 7))
export const toJ = (s: string): { jy: number; jm: number; jd: number } => { const d = parse(s); return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate()) }
export const fmt = (s: string) => { const j = toJ(s); return `${fa(j.jd)} ${MONTHS[j.jm - 1]} ${fa(j.jy, false)}` }
export const monthRange = (jy: number, jm: number) => {
  const len: number = jalaali.jalaaliMonthLength(jy, jm)
  const a = jalaali.toGregorian(jy, jm, 1), b = jalaali.toGregorian(jy, jm, len)
  return { start: `${a.gy}-${pad(a.gm)}-${pad(a.gd)}`, end: `${b.gy}-${pad(b.gm)}-${pad(b.gd)}`, len }
}
export const fa = (n: number, group = true) => n.toLocaleString('fa-IR', { useGrouping: group })
export const daysUntil = (s: string) => Math.round((parse(s).getTime() - parse(today()).getTime()) / 864e5)
export const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
export const fromMin = (n: number) => `${pad(Math.floor(n / 60))}:${pad(n % 60)}`
