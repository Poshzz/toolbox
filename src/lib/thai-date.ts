/**
 * วันที่ไทย (พ.ศ.) — ตรรกะวันที่ล้วน ไม่มี React
 * เลขาคณิตทั้งหมดใช้ UTC เที่ยงคืน (input/output เป็น ISO date 'YYYY-MM-DD')
 * เพื่อตัดปัญหา timezone / DST ทิ้งไปเลย
 */
const MS_PER_DAY = 86_400_000
const BE_OFFSET = 543

export interface YMD {
  years: number
  months: number
  days: number
}

const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const pad2 = (n: number) => String(n).padStart(2, '0')

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function daysInMonth(year: number, month: number) {
  return month === 1 && isLeapYear(year) ? 29 : MONTH_DAYS[month]
}

const negate = (n: number) => (n === 0 ? 0 : -n)

/** ISO date 'YYYY-MM-DD' (ค.ศ.) → Date ที่เที่ยงคืน UTC หรือ null ถ้าไม่ถูกต้อง */
export function parseISODate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (year < 1 || month < 1 || month > 12 || day < 1) return null
  const d = new Date(0)
  d.setUTCFullYear(year, month - 1, day)
  if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
    return null
  }
  return d
}

/** Date (UTC) → ISO date 'YYYY-MM-DD' */
function toISODate(d: Date): string {
  return `${String(d.getUTCFullYear()).padStart(4, '0')}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

/** บวกเดือนแบบ clamp วันให้อยู่ในช่วงของเดือนปลายทาง (31 ม.ค. + 1 เดือน = 29/28 ก.พ.) */
function addMonthsClamped(d: Date, months: number): Date {
  const total = d.getUTCFullYear() * 12 + d.getUTCMonth() + months
  const year = Math.floor(total / 12)
  const month = total - year * 12
  const day = Math.min(d.getUTCDate(), daysInMonth(year, month))
  const r = new Date(0)
  r.setUTCFullYear(year, month, day)
  return r
}

/** ปี ค.ศ. → ปี พ.ศ. (+543) */
export function toBE(ceYear: number): number {
  return ceYear + BE_OFFSET
}

/** ปี พ.ศ. → ปี ค.ศ. (−543) */
export function fromBE(beYear: number): number {
  return beYear - BE_OFFSET
}

/** จำนวนวันจาก from ถึง to (ติดลบ = ย้อนหลัง) หรือ null ถ้าวันที่ไม่ถูกต้อง */
export function diffDays(fromISO: string, toISO: string): number | null {
  const from = parseISODate(fromISO)
  const to = parseISODate(toISO)
  if (!from || !to) return null
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY)
}

/**
 * แยกช่วงวันที่เป็น ปี/เดือน/วัน ตามปฏิทิน (ตัดวันตามเดือนปลายทาง ไม่ใช่หาร 30)
 * สลับลำดับ → ได้ค่าติดลบทั้งชุด
 */
export function breakdownYMD(fromISO: string, toISO: string): YMD | null {
  const a = parseISODate(fromISO)
  const b = parseISODate(toISO)
  if (!a || !b) return null
  const reversed = b.getTime() < a.getTime()
  const from = reversed ? b : a
  const to = reversed ? a : b

  // จำนวนเดือนเต็มสูงสุดที่ไม่เลย `to` — ประมาณจากช่องปี/เดือนแล้วปรับหนึ่งครั้ง
  let months =
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth())
  if (addMonthsClamped(from, months).getTime() > to.getTime()) months -= 1

  const base = addMonthsClamped(from, months)
  const days = Math.round((to.getTime() - base.getTime()) / MS_PER_DAY)
  const years = Math.floor(months / 12)
  const rest = months - years * 12
  return reversed
    ? { years: negate(years), months: negate(rest), days: negate(days) }
    : { years, months: rest, days }
}

/** บวก/ลบจำนวนวัน (ต้องเป็นจำนวนเต็ม) จาก ISO date → ISO date หรือ null ถ้าเกินช่วง ค.ศ. 1–9999 */
export function addDaysToISO(iso: string, days: number): string | null {
  const d = parseISODate(iso)
  if (!d || !Number.isInteger(days)) return null
  const t = d.getTime() + days * MS_PER_DAY
  if (!Number.isFinite(t)) return null
  const out = toISODate(new Date(t))
  return parseISODate(out) ? out : null
}

const THAI_FULL = new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** ISO date → 'วันพฤหัสบดีที่ 16 ตุลาคม พ.ศ. 2569' หรือ null ถ้าวันที่ไม่ถูกต้อง */
export function formatThaiFull(iso: string): string | null {
  const d = parseISODate(iso)
  if (!d) return null
  const parts = new Map(THAI_FULL.formatToParts(d).map((p) => [p.type, p.value]))
  return `${parts.get('weekday') ?? ''}ที่ ${parts.get('day') ?? ''} ${parts.get('month') ?? ''} พ.ศ. ${parts.get('year') ?? ''}`
}

const CE_FULL = new Intl.DateTimeFormat('th-TH-u-ca-gregory', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/** ISO date → 'วันพฤหัสบดีที่ 16 ตุลาคม ค.ศ. 2026' (เกรกอเรียน) หรือ null ถ้าวันที่ไม่ถูกต้อง */
export function formatCEFull(iso: string): string | null {
  const d = parseISODate(iso)
  if (!d) return null
  const parts = new Map(CE_FULL.formatToParts(d).map((p) => [p.type, p.value]))
  return `${parts.get('weekday') ?? ''}ที่ ${parts.get('day') ?? ''} ${parts.get('month') ?? ''} ค.ศ. ${parts.get('year') ?? ''}`
}

/** อายุ ณ วันที่กำหนด (ปี/เดือน/วัน) — คืน null ถ้าเกิดหลังวันที่อ้างอิงหรือวันที่ไม่ถูกต้อง */
export function ageYMD(birthISO: string, asOfISO: string): YMD | null {
  const birth = parseISODate(birthISO)
  const asOf = parseISODate(asOfISO)
  if (!birth || !asOf || asOf.getTime() < birth.getTime()) return null
  return breakdownYMD(birthISO, asOfISO)
}

/** วันที่วันนี้ตามปฏิทินเครื่องผู้ใช้ → 'YYYY-MM-DD' */
export function todayISO(): string {
  const d = new Date()
  return `${String(d.getFullYear()).padStart(4, '0')}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}
