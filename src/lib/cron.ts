// ตรรกะล้วนสำหรับอ่าน cron expression (5 ฟิลด์) — ไม่มี React
//
// สมมติฐานเขตเวลา: ทั้งการ parse และการคำนวณ "เวลารันถัดไป" ทำงานบนเขตเวลา
// ท้องถิ่น (local timezone) ของเครื่องที่รันเสมอ — ตรงกับที่ผู้ใช้ตั้ง cron บน
// เครื่องตัวเอง แต่เซิร์ฟเวอร์ส่วนใหญ่ตั้ง cron เป็น UTC จึงควรตรวจเขตเวลาก่อนใช้จริง
// (รองรับเขตเวลาแบบ 5 ฟิลด์เท่านั้น: นาที ชั่วโมง วันของเดือน เดือน วันในสัปดาห์)

export interface ParsedCron {
  minutes: number[]
  hours: number[]
  daysOfMonth: number[]
  months: number[]
  /** 0 = อาทิตย์ … 6 = เสาร์ (ค่า 7 ถูกแปลงเป็น 0 ให้แล้ว) */
  daysOfWeek: number[]
  /** step ของฟิลด์นาทีถ้าเขียนเป็นแบบมี /n (เช่น ทุก 5 จาก /5) — ไม่นับลิสต์ที่บังเอิญห่างเท่ากัน */
  minuteStep: number | null
  /** ฟิลด์วันของเดือนไม่ได้ขึ้นต้นด้วย * (ใช้กฎ OR แบบ cron มาตรฐาน) */
  domRestricted: boolean
  /** ฟิลด์วันในสัปดาห์ไม่ได้ขึ้นต้นด้วย * */
  dowRestricted: boolean
}

export type ParseCronResult = { ok: true; parsed: ParsedCron } | { ok: false; error: string }

export type AnalyzeCronResult =
  | { ok: true; parsed: ParsedCron; description: string; runs: Date[] }
  | { ok: false; error: string }

const DOW_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
const MONTH_TH = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

interface FieldDef {
  th: string
  min: number
  max: number
}

const FIELDS: FieldDef[] = [
  { th: 'นาที', min: 0, max: 59 },
  { th: 'ชั่วโมง', min: 0, max: 23 },
  { th: 'วันของเดือน', min: 1, max: 31 },
  { th: 'เดือน', min: 1, max: 12 },
  { th: 'วันในสัปดาห์', min: 0, max: 7 },
]

function parseField(raw: string, def: FieldDef): { ok: true; values: number[]; stepped: boolean } | { ok: false; error: string } {
  const out = new Set<number>()
  let stepped = false
  for (const piece of raw.split(',')) {
    if (!piece) return { ok: false, error: 'มีเครื่องหมาย , เกิน (เช่น ,, หรือลงท้ายด้วย ,)' }
    const m = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(piece)
    if (!m) return { ok: false, error: `รูปแบบ "${piece}" ไม่ถูกต้อง — ใช้ได้แค่ * , - / และตัวเลข` }
    const base = m[1]
    const stepRaw = m[2]
    if (stepRaw !== undefined) stepped = true
    const step = stepRaw === undefined ? 1 : Number(stepRaw)
    if (step < 1) return { ok: false, error: `ตัวเลขหลัง / ต้องมากกว่าหรือเท่ากับ 1 (พบ ${stepRaw})` }
    let start: number
    let end: number
    if (base === '*') {
      start = def.min
      end = def.max
    } else {
      const [a, b] = base.split('-')
      start = Number(a)
      // "5/2" แบบ cron มาตรฐาน = เริ่มที่ 5 ไปจนสุดช่วง เพิ่มทีละ 2
      end = b === undefined ? (stepRaw === undefined ? start : def.max) : Number(b)
    }
    if (start < def.min || start > def.max) return { ok: false, error: `ค่า ${start} อยู่นอกช่วง ${def.min}–${def.max}` }
    if (end < def.min || end > def.max) return { ok: false, error: `ค่า ${end} อยู่นอกช่วง ${def.min}–${def.max}` }
    if (end < start) return { ok: false, error: `ช่วง ${start}-${end} ย้อนกลับ — ต้องเรียงจากน้อยไปมาก` }
    for (let v = start; v <= end; v += step) out.add(v)
  }
  return { ok: true, values: [...out].sort((a, b) => a - b), stepped }
}

export function parseCron(expr: string): ParseCronResult {
  const trimmed = expr.trim()
  if (!trimmed) return { ok: false, error: 'กรุณากรอก cron expression ก่อน' }
  const parts = trimmed.split(/\s+/)
  if (parts.length !== 5) {
    return {
      ok: false,
      error: `ต้องมี 5 ฟิลด์ (นาที ชั่วโมง วันของเดือน เดือน วันในสัปดาห์) — ตอนนี้มี ${parts.length} ฟิลด์`,
    }
  }
  const values: number[][] = []
  let minuteStepped = false
  for (let i = 0; i < 5; i++) {
    const r = parseField(parts[i], FIELDS[i])
    if (!r.ok) return { ok: false, error: `ฟิลด์${FIELDS[i].th}: ${r.error}` }
    if (i === 0) minuteStepped = r.stepped
    values.push(r.values)
  }
  const dow = [...new Set(values[4].map((v) => (v === 7 ? 0 : v)))].sort((a, b) => a - b)
  // step ของนาทีใช้ได้เฉพาะเมื่อเขียนแบบ /n จริง และค่าที่ได้ยังห่างเท่ากันสม่ำเสมอ
  const minuteStep = minuteStepped ? uniformStep(values[0]) : null
  return {
    ok: true,
    parsed: {
      minutes: values[0],
      hours: values[1],
      daysOfMonth: values[2],
      months: values[3],
      daysOfWeek: dow,
      minuteStep,
      domRestricted: !parts[2].startsWith('*'),
      dowRestricted: !parts[4].startsWith('*'),
    },
  }
}

/** รวมลิสต์ตัวเลขเป็นข้อความไทย ๆ เช่น "1 และ 15" หรือ "จันทร์–ศุกร์" */
function joinRuns(nums: number[], fmt: (n: number) => string): string {
  const runs: string[] = []
  let i = 0
  while (i < nums.length) {
    let j = i
    while (j + 1 < nums.length && nums[j + 1] === nums[j] + 1) j++
    if (j - i >= 2) runs.push(`${fmt(nums[i])}–${fmt(nums[j])}`)
    else for (let k = i; k <= j; k++) runs.push(fmt(nums[k]))
    i = j + 1
  }
  if (runs.length === 1) return runs[0]
  return `${runs.slice(0, -1).join(', ')} และ ${runs[runs.length - 1]}`
}

/** ตรวจว่าลิสต์เป็นขั้นสม่ำเสมอหรือไม่ — คืน step ถ้าใช่ (ใช้เฉพาะฟิลด์ที่เขียนแบบ /n จริง) */
function uniformStep(nums: number[]): number | null {
  if (nums.length < 2) return null
  const step = nums[1] - nums[0]
  if (step < 2) return null
  for (let i = 2; i < nums.length; i++) if (nums[i] - nums[i - 1] !== step) return null
  return step
}

const pad = (n: number) => String(n).padStart(2, '0')

export function describeCron(p: ParsedCron): string {
  const mAll = p.minutes.length === 60
  const hAll = p.hours.length === 24
  const stepM = p.minuteStep
  const hList = () => joinRuns(p.hours, String)

  // ---- ส่วนเวลา ----
  let time: string
  if (mAll && hAll) time = 'ทุกนาที'
  else if (mAll && p.hours.length === 1) time = `ทุกนาทีของชั่วโมง ${pad(p.hours[0])}`
  else if (mAll) time = `ทุกนาทีของชั่วโมงที่ ${hList()}`
  else if (stepM && hAll) time = `ทุก ${stepM} นาที`
  else if (stepM && p.hours.length === 1) time = `ทุก ${stepM} นาทีของชั่วโมง ${pad(p.hours[0])}`
  else if (stepM) time = `ทุก ${stepM} นาทีของชั่วโมงที่ ${hList()}`
  else if (p.minutes.length === 1 && p.hours.length === 1) time = `เวลา ${pad(p.hours[0])}:${pad(p.minutes[0])}`
  else if (p.minutes.length === 1 && hAll) time = `นาทีที่ ${p.minutes[0]} ของทุกชั่วโมง`
  else if (p.minutes.length === 1 && p.hours.length <= 6)
    time = `เวลา ${p.hours.map((h) => `${pad(h)}:${pad(p.minutes[0])}`).join(' และ ')}`
  else time = `นาทีที่ ${joinRuns(p.minutes, String)} ของชั่วโมงที่ ${hList()}`

  // ---- ส่วนวัน / เดือน ----
  const domText = `วันที่ ${joinRuns(p.daysOfMonth, String)}`
  const dowText = `ทุกวัน${joinRuns(p.daysOfWeek, (v) => DOW_TH[v])}`
  let when = ''
  if (p.domRestricted && p.dowRestricted) when = `${domText} หรือ${dowText}`
  else if (p.domRestricted) when = domText
  else if (p.dowRestricted) when = dowText

  const monthsRestricted = p.months.length !== 12
  if (monthsRestricted) {
    const monthText = joinRuns(p.months.map((m) => m - 1), (i) => MONTH_TH[i])
    if (!when) when = `ทุกวันในเดือน${monthText}`
    else if (p.domRestricted) when += ` ของเดือน${monthText}`
    else when += ` ในเดือน${monthText}`
  } else if (p.domRestricted && !p.dowRestricted) {
    when += ' ของทุกเดือน'
  }

  return when ? `${when} ${time}` : time
}

// สแกนสูงสุด ~40 ปี — พอสำหรับรอบที่หายากที่สุด (29 ก.พ. ที่ตรงวันในสัปดาห์
// เดียวกันจะวนซ้ำราว 28 ปี) ถ้าไม่เจอภายในนี้ถือว่าไม่พบ
const SCAN_DAYS = 366 * 40

/** หาเวลารันถัดไป count ครั้งจากเวลา from (ไม่รวมเวลาที่ตรงจากเป๊ะ ๆ) ตามเขตเวลาท้องถิ่น */
export function nextRuns(parsed: ParsedCron, from: Date, count: number, maxDays = SCAN_DAYS): Date[] {
  if (count <= 0) return []
  const startMs = Math.floor(from.getTime() / 60_000) * 60_000 + 60_000
  const times: Array<[number, number]> = []
  for (const h of parsed.hours) for (const m of parsed.minutes) times.push([h, m])
  times.sort((a, b) => a[0] - b[0] || a[1] - b[1])

  const monthSet = new Set(parsed.months)
  const domSet = new Set(parsed.daysOfMonth)
  const dowSet = new Set(parsed.daysOfWeek)
  const runs: Date[] = []
  const base = new Date(startMs)
  const y0 = base.getFullYear()
  const m0 = base.getMonth()
  const d0 = base.getDate()

  for (let i = 0; i < maxDays && runs.length < count; i++) {
    const probe = new Date(y0, m0, d0 + i)
    if (!monthSet.has(probe.getMonth() + 1)) continue
    const domHit = domSet.has(probe.getDate())
    const dowHit = dowSet.has(probe.getDay())
    const dayOk =
      parsed.domRestricted && parsed.dowRestricted
        ? domHit || dowHit
        : parsed.domRestricted
          ? domHit
          : parsed.dowRestricted
            ? dowHit
            : true
    if (!dayOk) continue
    const y = probe.getFullYear()
    const mo = probe.getMonth()
    const d = probe.getDate()
    for (const [h, m] of times) {
      if (runs.length >= count) break
      const dt = new Date(y, mo, d, h, m)
      if (dt.getTime() >= startMs) runs.push(dt)
    }
  }
  return runs
}

export function analyzeCron(expr: string, from: Date, count = 5): AnalyzeCronResult {
  const parsed = parseCron(expr)
  if (!parsed.ok) return parsed
  return {
    ok: true,
    parsed: parsed.parsed,
    description: describeCron(parsed.parsed),
    runs: nextRuns(parsed.parsed, from, count),
  }
}
