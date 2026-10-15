export type ConvResult<T> = { ok: true; value: T } | { ok: false; error: string }

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

function lineColumn(text: string, pos: number) {
  const p = Math.max(0, Math.min(pos, text.length))
  let line = 1
  let lastNewline = -1
  for (let i = 0; i < p; i++) {
    if (text.charCodeAt(i) === 10) {
      line++
      lastNewline = i
    }
  }
  return { line, column: p - lastNewline }
}

/** แปลง error ของ JSON.parse เป็นข้อความไทยพร้อมบรรทัด/คอลัมน์ (ถ้าหาได้) */
export function describeJsonError(text: string, e: unknown): string {
  const message = e instanceof Error ? e.message : String(e)
  const lc = message.match(/line (\d+) column (\d+)/)
  if (lc) return `JSON ไม่ถูกต้อง (บรรทัดที่ ${lc[1]} คอลัมน์ ${lc[2]})`
  const pos = message.match(/position (\d+)/)
  if (pos) {
    const { line, column } = lineColumn(text, Number(pos[1]))
    return `JSON ไม่ถูกต้อง (บรรทัดที่ ${line} คอลัมน์ ${column})`
  }
  return `JSON ไม่ถูกต้อง: ${message}`
}

/**
 * JSON (array ของ object) -> CSV
 * - คีย์เป็น union ของทุกแถว เรียงตามที่พบครั้งแรก
 * - object/array ซ้อน -> JSON string ในเซลล์เดียว / null -> เซลล์ว่าง
 * - ตัวเลขและ boolean ถูกเขียนเป็นข้อความ
 * - ค่าที่มี " , หรือขึ้นบรรทัดใหม่ จะถูกครอบด้วย " ตาม RFC 4180
 */
export function jsonToCsv(text: string, opts: { bom?: boolean } = {}): ConvResult<string> {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  let parsed: unknown
  try {
    parsed = JSON.parse(clean)
  } catch (e) {
    return { ok: false, error: describeJsonError(clean, e) }
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'JSON ต้องเป็น array เช่น [{"name": "..."}, ...] ไม่รองรับ object เดี่ยว' }
  }
  if (parsed.length === 0) return { ok: true, value: '' }

  const keys: string[] = []
  const seen = new Set<string>()
  let hasPrimitive = false
  for (const item of parsed) {
    if (isPlainObject(item)) {
      for (const k of Object.keys(item)) {
        if (!seen.has(k)) {
          seen.add(k)
          keys.push(k)
        }
      }
    } else {
      hasPrimitive = true
    }
  }
  if (hasPrimitive && !seen.has('value')) keys.push('value')

  const lines: string[] = [keys.map(csvCell).join(',')]
  for (const item of parsed) {
    if (isPlainObject(item)) {
      lines.push(keys.map((k) => csvCell(cellText(item[k]))).join(','))
    } else {
      lines.push(keys.map((k) => csvCell(k === 'value' ? cellText(item) : '')).join(','))
    }
  }
  return { ok: true, value: (opts.bom ? '\uFEFF' : '') + lines.join('\r\n') + '\r\n' }
}

function cellText(v: unknown): string {
  if (v === null || v === undefined) return ''
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return JSON.stringify(v)
}

function csvCell(s: string): string {
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
}

/**
 * CSV (RFC 4180) -> ตาราง string
 * - รองรับ "..." / "" escape / จุลภาค-ขึ้นบรรทัดใหม่ในเครื่องหมายคำพูด
 * - ตัวคั่นบรรทัดใช้ได้ทั้ง \r\n, \n และ \r
 * - บรรทัดว่างกลางไฟล์นับเป็นแถวว่าง แต่ newline ปิดท้ายไฟล์ไม่สร้างแถวเพิ่ม
 */
export function parseCsv(text: string): ConvResult<string[][]> {
  const s = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  let afterQuote = false
  let quoteLine = 1
  let line = 1
  let started = false
  let i = 0
  const n = s.length

  const endField = () => {
    row.push(field)
    field = ''
    afterQuote = false
  }
  const endRecord = () => {
    endField()
    rows.push(row)
    row = []
    started = false
  }

  while (i < n) {
    const c = s[i]
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"'
          i += 2
        } else {
          inQuotes = false
          afterQuote = true
          i++
        }
      } else if (c === '\r') {
        field += '\n'
        if (s[i + 1] === '\n') i++
        line++
        i++
      } else if (c === '\n') {
        field += '\n'
        line++
        i++
      } else {
        field += c
        i++
      }
    } else if (c === '"') {
      if (field === '' && !afterQuote) {
        inQuotes = true
        started = true
        quoteLine = line
        i++
      } else {
        return {
          ok: false,
          error: `บรรทัดที่ ${line}: พบเครื่องหมายคำพูด " กลางฟิลด์ — ฟิลด์ที่มี " ต้องครอบด้วย "..." ทั้งฟิลด์`,
        }
      }
    } else if (c === ',') {
      started = true
      endField()
      i++
    } else if (c === '\r' || c === '\n') {
      endRecord()
      if (c === '\r' && s[i + 1] === '\n') i++
      line++
      i++
    } else {
      if (afterQuote) {
        return {
          ok: false,
          error: `บรรทัดที่ ${line}: พบอักขระ "${c}" ต่อจากเครื่องหมายคำพูดปิด — หลัง " ต้องเป็นจุลภาคหรือขึ้นบรรทัดใหม่เท่านั้น`,
        }
      }
      field += c
      started = true
      i++
    }
  }
  if (inQuotes) {
    return {
      ok: false,
      error: `บรรทัดที่ ${quoteLine}: เครื่องหมายคำพูดเปิดไม่ถูกปิด — ตรวจสอบ " ที่ไม่ครบคู่`,
    }
  }
  if (started || row.length > 0 || field !== '') endRecord()
  return { ok: true, value: rows }
}

/**
 * CSV -> JSON: แถวแรกคือ header, ค่าทุกช่องถูกอ่านเป็น string
 * (ตัวเลขที่มีศูนย์นำหน้าหรือเบอร์โทรจะไม่เพี้ยน)
 */
export function csvToJson(text: string): ConvResult<string> {
  const parsed = parseCsv(text)
  if (!parsed.ok) return parsed
  const rows = parsed.value
  if (rows.length === 0) return { ok: true, value: '[]' }
  const keys = dedupeKeys(rows[0])
  const out: Array<Record<string, string>> = []
  for (let r = 1; r < rows.length; r++) {
    const source = rows[r]
    const obj: Record<string, string> = {}
    for (let c = 0; c < keys.length; c++) obj[keys[c]] = c < source.length ? source[c] : ''
    for (let c = keys.length; c < source.length; c++) obj[`column${c + 1}`] = source[c]
    out.push(obj)
  }
  return { ok: true, value: JSON.stringify(out, null, 2) }
}

function dedupeKeys(header: string[]): string[] {
  const used = new Set<string>()
  return header.map((h) => {
    let key = h
    let n = 1
    while (used.has(key)) {
      n++
      key = `${h}_${n}`
    }
    used.add(key)
    return key
  })
}
