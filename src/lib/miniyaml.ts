/**
 * miniyaml — YAML subset มาตรฐานที่ใช้บ่อย: mapping / sequence / ซ้อนชั้น / quoted และ plain scalars
 * รองรับ: comments, true/false/null (~), int/float/hex/0o, string ไทย
 * ไม่รองรับ: anchors/aliases, tags, multi-document (---), flow style ([…] {…}), block scalar (| >)
 * — จะแจ้ง error ภาษาไทยพร้อมเลขบรรทัดเสมอ
 */
export type YamlResult = { ok: true; value: unknown } | { ok: false; error: string; line?: number }

interface Tok {
  no: number
  indent: number
  text: string
}

class YamlError extends Error {
  constructor(
    message: string,
    readonly line?: number,
  ) {
    super(message)
  }
}

/** เครื่องหมายคำพูดจะ "เปิด" ได้เฉพาะตอนเริ่ม scalar เท่านั้น — อะพอสโตรฟีกลางคำ (it's) ไม่นับ */
function opensQuote(s: string, i: number): boolean {
  if (i === 0) return true
  const prev = s[i - 1]
  return prev === ' ' || prev === '\t' || prev === ':'
}

function stripComment(s: string): string {
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (inDouble) {
      if (c === '\\') i++
      else if (c === '"') inDouble = false
      continue
    }
    if (inSingle) {
      if (c === "'") {
        if (s[i + 1] === "'") i++
        else inSingle = false
      }
      continue
    }
    if (c === "'" && opensQuote(s, i)) inSingle = true
    else if (c === '"' && opensQuote(s, i)) inDouble = true
    else if (c === '#' && (i === 0 || s[i - 1] === ' ' || s[i - 1] === '\t')) return s.slice(0, i)
  }
  return s
}

/** ตำแหน่ง ':' ที่แยกคีย์/ค่า (ต้องตามด้วยช่องว่างหรือจบบรรทัด และไม่อยู่ในเครื่องหมายคำพูด) */
function findKeySep(text: string): number {
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inDouble) {
      if (c === '\\') i++
      else if (c === '"') inDouble = false
      continue
    }
    if (inSingle) {
      if (c === "'") {
        if (text[i + 1] === "'") i++
        else inSingle = false
      }
      continue
    }
    if (c === "'" && opensQuote(text, i)) inSingle = true
    else if (c === '"' && opensQuote(text, i)) inDouble = true
    else if (c === ':' && (i === text.length - 1 || text[i + 1] === ' ')) return i
  }
  return -1
}

const isSeqMarker = (text: string) => text === '-' || text.startsWith('- ')

function toToks(text: string): Tok[] {
  const toks: Tok[] = []
  const rawLines = text.split(/\r\n|\r|\n/)
  for (let li = 0; li < rawLines.length; li++) {
    const raw = rawLines[li]
    const no = li + 1
    const lead = /^[ \t]*/.exec(raw)?.[0] ?? ''
    if (lead.includes('\t')) {
      throw new YamlError(`บรรทัดที่ ${no}: ไม่รองรับการย่อหน้าด้วยแท็บ (Tab) — ใช้ช่องว่างแทน`, no)
    }
    const indent = lead.length
    const content = stripComment(raw.slice(indent)).replace(/\s+$/, '')
    if (content === '') continue
    if (indent === 0) {
      if (/^(---|\.\.\.)(\s|$)/.test(content)) {
        throw new YamlError(`บรรทัดที่ ${no}: ไม่รองรับเครื่องหมายเอกสาร (--- / ...) — ใช้ได้เฉพาะ YAML เอกสารเดียว`, no)
      }
      if (content.startsWith('%')) {
        throw new YamlError(`บรรทัดที่ ${no}: ไม่รองรับ YAML directive (%)`, no)
      }
      if (content === '?' || content.startsWith('? ')) {
        throw new YamlError(`บรรทัดที่ ${no}: ไม่รองรับ complex key (? ...)`, no)
      }
    }
    toks.push({ no, indent, text: content })
  }
  return toks
}

function checkSpecial(s: string, no: number) {
  if (s[0] === '&') throw new YamlError(`บรรทัดที่ ${no}: ไม่รองรับ anchor (&...)`, no)
  if (s[0] === '*') throw new YamlError(`บรรทัดที่ ${no}: ไม่รองรับ alias (*...)`, no)
  if (s[0] === '!') throw new YamlError(`บรรทัดที่ ${no}: ไม่รองรับ tag (!...)`, no)
  if (s[0] === '{' || s[0] === '[') {
    throw new YamlError(`บรรทัดที่ ${no}: ไม่รองรับ flow style ({...} หรือ [...]) — ใช้รูปแบบ block (ย่อหน้า) แทน`, no)
  }
  if (s === '|' || s === '>' || /^[|>][+-]?[0-9]*$/.test(s)) {
    throw new YamlError(`บรรทัดที่ ${no}: ไม่รองรับ block scalar (| หรือ >)`, no)
  }
}

/** ค่า scalar แบบ plain: null/true/false/ตัวเลข/string */
function plainValue(s: string): unknown {
  const lower = s.toLowerCase()
  if (lower === 'null' || lower === '~') return null
  if (lower === 'true') return true
  if (lower === 'false') return false
  if (/^[+-]?(0|[1-9][0-9]*)$/.test(s)) return parseInt(s, 10)
  const hex = /^([+-]?)0x([0-9a-fA-F]+)$/.exec(s)
  if (hex) {
    const n = parseInt(hex[2], 16)
    return hex[1] === '-' ? -n : n
  }
  const oct = /^([+-]?)0o([0-7]+)$/.exec(s)
  if (oct) {
    const n = parseInt(oct[2], 8)
    return oct[1] === '-' ? -n : n
  }
  if (/^[+-]?(\d+\.\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) return parseFloat(s)
  if (/^[+-]?\d+[eE][+-]?\d+$/.test(s)) return parseFloat(s)
  return s
}

function parseScalar(s: string, no: number): unknown {
  if (s[0] === "'") {
    let out = ''
    let i = 1
    while (i < s.length) {
      if (s[i] === "'") {
        if (s[i + 1] === "'") {
          out += "'"
          i += 2
          continue
        }
        if (i === s.length - 1) return out
        throw new YamlError(`บรรทัดที่ ${no}: พบอักขระเกินหลังเครื่องหมายคำพูดปิด`, no)
      }
      out += s[i]
      i++
    }
    throw new YamlError(`บรรทัดที่ ${no}: เครื่องหมายคำพูดเดี่ยว ( ' ) เปิดแล้วไม่ถูกปิด`, no)
  }
  if (s[0] === '"') {
    let out = ''
    let i = 1
    while (i < s.length) {
      const c = s[i]
      if (c === '"') {
        if (i === s.length - 1) return out
        throw new YamlError(`บรรทัดที่ ${no}: พบอักขระเกินหลังเครื่องหมายคำพูดปิด`, no)
      }
      if (c === '\\') {
        const e = s[i + 1]
        if (e === 'n') out += '\n'
        else if (e === 't') out += '\t'
        else if (e === 'r') out += '\r'
        else if (e === 'b') out += '\b'
        else if (e === 'f') out += '\f'
        else if (e === '"' || e === '\\' || e === '/') out += e
        else if (e === 'u') {
          const hex = s.slice(i + 2, i + 6)
          if (!/^[0-9a-fA-F]{4}$/.test(hex)) {
            throw new YamlError(`บรรทัดที่ ${no}: escape \\u ต้องตามด้วยเลขฐาน 16 สี่หลัก`, no)
          }
          out += String.fromCharCode(parseInt(hex, 16))
          i += 6
          continue
        } else {
          throw new YamlError(`บรรทัดที่ ${no}: ไม่รองรับ escape \\${e ?? ''} ในเครื่องหมายคำพูด`, no)
        }
        i += 2
        continue
      }
      out += c
      i++
    }
    throw new YamlError(`บรรทัดที่ ${no}: เครื่องหมายคำพูดคู่ ( " ) เปิดแล้วไม่ถูกปิด`, no)
  }
  return plainValue(s)
}

/** ค่าที่อยู่บรรทัดเดียว: [] และ {} เปล่าได้, ที่เหลือเช็ค syntax ที่ไม่รองรับก่อน */
function parseInlineNode(s: string, no: number): unknown {
  if (s === '[]') return []
  if (s === '{}') return {}
  checkSpecial(s, no)
  return parseScalar(s, no)
}

function parseKey(raw: string, no: number): string {
  const k = raw.trim()
  if (k === '') throw new YamlError(`บรรทัดที่ ${no}: คีย์ว่างเปล่า`, no)
  const v = parseScalar(k, no)
  if (typeof v === 'string') return v
  if (v === null) return 'null'
  return String(v)
}

class Parser {
  private pos = 0
  constructor(private toks: Tok[]) {}

  private peek(): Tok | undefined {
    return this.toks[this.pos]
  }

  private err(tok: Tok, msg: string): never {
    throw new YamlError(`บรรทัดที่ ${tok.no}: ${msg}`, tok.no)
  }

  parseDocument(): unknown {
    const first = this.toks[0]
    let value: unknown
    if (isSeqMarker(first.text)) value = this.parseSeq(first.indent)
    else if (findKeySep(first.text) >= 0) value = this.parseMap(first.indent)
    else {
      this.pos = 1
      value = parseInlineNode(first.text, first.no)
      const next = this.peek()
      if (next) this.err(next, 'ไม่รองรับข้อความ plain ต่อหลายบรรทัด')
    }
    const leftover = this.peek()
    if (leftover) this.err(leftover, 'ย่อหน้าไม่ตรงกับโครงสร้าง — จัดบรรทัดนี้เข้ากับเอกสารไม่ได้')
    return value
  }

  private parseBlock(indent: number): unknown {
    const first = this.peek()
    if (!first) throw new YamlError('รูปแบบ YAML ไม่ครบถ้วน')
    if (first.indent !== indent) this.err(first, 'ย่อหน้าไม่ตรงกับโครงสร้าง')
    if (isSeqMarker(first.text)) return this.parseSeq(indent)
    if (findKeySep(first.text) >= 0) return this.parseMap(indent)
    this.pos++
    const v = parseInlineNode(first.text, first.no)
    const next = this.peek()
    if (next && next.indent >= indent) this.err(next, 'ไม่รองรับข้อความ plain ต่อหลายบรรทัด')
    return v
  }

  private parseSeq(indent: number): unknown[] {
    const out: unknown[] = []
    while (this.pos < this.toks.length) {
      const line = this.toks[this.pos]
      if (line.indent < indent) break
      if (line.indent > indent) this.err(line, 'ย่อหน้าไม่ตรงกับรายการ')
      if (!isSeqMarker(line.text)) this.err(line, 'ในบล็อกรายการ บรรทัดต้องขึ้นต้นด้วย "- "')
      const rest = line.text === '-' ? '' : line.text.slice(2).trim()
      this.pos++
      if (rest === '') {
        const next = this.peek()
        if (next && next.indent > indent) out.push(this.parseBlock(next.indent))
        else out.push(null)
      } else {
        const col = indent + 2
        if (isSeqMarker(rest)) {
          this.toks.splice(this.pos, 0, { no: line.no, indent: col, text: rest })
          out.push(this.parseSeq(col))
        } else if (findKeySep(rest) >= 0) {
          this.toks.splice(this.pos, 0, { no: line.no, indent: col, text: rest })
          out.push(this.parseMap(col))
        } else {
          out.push(parseInlineNode(rest, line.no))
          const next = this.peek()
          if (next && next.indent >= col) {
            this.err(next, 'ย่อหน้าเกินหลังค่าของรายการ — ไม่รองรับข้อความ plain ต่อหลายบรรทัด')
          }
        }
      }
    }
    return out
  }

  private parseMap(indent: number): Record<string, unknown> {
    const obj: Record<string, unknown> = {}
    while (this.pos < this.toks.length) {
      const line = this.toks[this.pos]
      if (line.indent < indent) break
      if (line.indent > indent) this.err(line, 'ย่อหน้าไม่ตรงกับโครงสร้าง — ไม่รองรับข้อความ plain ต่อหลายบรรทัด')
      if (isSeqMarker(line.text)) this.err(line, 'พบรายการ "-" ในบล็อก mapping — ตรวจสอบการย่อหน้า')
      const sep = findKeySep(line.text)
      if (sep < 0) this.err(line, 'ไม่พบเครื่องหมาย : แยกคีย์กับค่า')
      const key = parseKey(line.text.slice(0, sep), line.no)
      const rest = line.text.slice(sep + 1).trim()
      this.pos++
      if (rest === '') {
        const next = this.peek()
        if (next && next.indent > indent) obj[key] = this.parseBlock(next.indent)
        else obj[key] = null
      } else {
        if (isSeqMarker(rest)) this.err(line, 'พบรายการ "-" ต่อจากค่าในบรรทัดเดียว — ให้ขึ้นบรรทัดใหม่แล้วย่อหน้า')
        if (findKeySep(rest) >= 0) {
          this.err(line, 'พบเครื่องหมาย : ซ้อน — ไม่รองรับ mapping ซ้อนในบรรทัดเดียว ให้ใช้การย่อหน้าแทน')
        }
        obj[key] = parseInlineNode(rest, line.no)
        const next = this.peek()
        if (next && next.indent > indent) this.err(next, 'ย่อหน้าเกิน — ไม่รองรับข้อความ plain ต่อหลายบรรทัด')
      }
    }
    return obj
  }
}

export function yamlToJson(text: string): YamlResult {
  try {
    const toks = toToks(text)
    if (toks.length === 0) return { ok: true, value: null }
    return { ok: true, value: new Parser(toks).parseDocument() }
  } catch (e) {
    if (e instanceof YamlError) return { ok: false, error: e.message, line: e.line }
    return { ok: false, error: 'YAML ไม่ถูกต้อง: ' + (e instanceof Error ? e.message : String(e)) }
  }
}

// ---------- emitter: JS value -> YAML ----------

function plainValueIsString(s: string): boolean {
  return typeof plainValue(s) === 'string'
}

function needsQuotes(s: string): boolean {
  if (s === '') return true
  if (s !== s.trim()) return true
  if (/[\n\r\t\u0000-\u001f\u007f-\u009f]/.test(s)) return true
  if (/^[-?:!&*#{}[\],|>@`'"%]/.test(s)) return true
  if (/^(yes|no|on|off|y|n|true|false|null)$/i.test(s)) return true
  if (s.endsWith(':')) return true
  if (s.includes(': ') || s.includes(' #')) return true
  return !plainValueIsString(s)
}

function doubleQuote(s: string): string {
  let out = '"'
  for (const ch of s) {
    if (ch === '"') out += '\\"'
    else if (ch === '\\') out += '\\\\'
    else if (ch === '\n') out += '\\n'
    else if (ch === '\r') out += '\\r'
    else if (ch === '\t') out += '\\t'
    else {
      const code = ch.codePointAt(0) ?? 0
      out +=
        code < 0x20 || code === 0x7f || (code >= 0x80 && code <= 0x9f)
          ? '\\u' + code.toString(16).padStart(4, '0')
          : ch
    }
  }
  return out + '"'
}

function quoteIfNeeded(s: string): string {
  if (!needsQuotes(s)) return s
  if (/[\n\r\t\u0000-\u001f\u007f-\u009f]/.test(s) || s.includes("'")) return doubleQuote(s)
  return "'" + s + "'"
}

function scalarText(v: unknown): string {
  if (v === null || v === undefined) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return "'NaN'"
    if (!Number.isFinite(v)) return v > 0 ? "'.inf'" : "'-.inf'"
    return Object.is(v, -0) ? '-0' : String(v)
  }
  return quoteIfNeeded(typeof v === 'string' ? v : String(v))
}

function emitAny(v: unknown, indent: number, out: string[]): void {
  const pad = ' '.repeat(indent)
  if (Array.isArray(v)) {
    if (v.length === 0) out.push(pad + '[]')
    else emitSeq(v, indent, out)
  } else if (v !== null && typeof v === 'object') {
    const obj = v as Record<string, unknown>
    if (Object.keys(obj).length === 0) out.push(pad + '{}')
    else emitMap(obj, indent, out, null)
  } else {
    out.push(pad + scalarText(v))
  }
}

function emitSeq(arr: unknown[], indent: number, out: string[]): void {
  const pad = ' '.repeat(indent)
  for (const item of arr) {
    if (Array.isArray(item) || (item !== null && typeof item === 'object')) {
      const coll = item as object
      const empty = Array.isArray(coll) ? coll.length === 0 : Object.keys(coll).length === 0
      if (empty) {
        out.push(pad + '- ' + (Array.isArray(coll) ? '[]' : '{}'))
      } else if (Array.isArray(item)) {
        out.push(pad + '-')
        emitSeq(item, indent + 2, out)
      } else {
        emitMap(item as Record<string, unknown>, indent + 2, out, pad + '- ')
      }
    } else {
      out.push(pad + '- ' + scalarText(item))
    }
  }
}

function emitMap(obj: Record<string, unknown>, indent: number, out: string[], firstLead: string | null): void {
  const pad = ' '.repeat(indent)
  let first = true
  for (const [k, v] of Object.entries(obj)) {
    const lead = first && firstLead !== null ? firstLead : pad
    first = false
    const key = quoteIfNeeded(k)
    if (Array.isArray(v) || (v !== null && typeof v === 'object')) {
      const coll = v as object
      const empty = Array.isArray(coll) ? coll.length === 0 : Object.keys(coll).length === 0
      if (empty) {
        out.push(lead + key + ': ' + (Array.isArray(coll) ? '[]' : '{}'))
      } else {
        out.push(lead + key + ':')
        emitAny(v, indent + 2, out)
      }
    } else {
      out.push(lead + key + ': ' + scalarText(v))
    }
  }
}

export function jsonToYaml(value: unknown): string {
  const out: string[] = []
  emitAny(value, 0, out)
  return out.join('\n')
}
