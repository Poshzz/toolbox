/**
 * codefmt — จัดสวย (pretty) และย่อ (minify) สำหรับ SQL / XML / CSS ในเบราว์เซอร์
 * เป็น rule-based formatter: ปลอดภัยกับ string/comment (ไม่แตะเนื้อหาข้างใน)
 * ข้อจำกัด: SQL ไม่ได้ parse ไวยากรณ์เต็มรูปแบบ (keyword ที่ใช้เป็นชื่อตาราง/คอลัมน์อาจถูกจัดบรรทัด/พิมพ์ใหญ่)
 */
export type CodeLang = 'sql' | 'xml' | 'css'

export function minifyCode(lang: CodeLang, code: string): string {
  if (lang === 'sql') return minifySql(code)
  if (lang === 'xml') return minifyXml(code)
  return minifyCss(code)
}

export function formatCode(lang: CodeLang, code: string, opts: { uppercaseKeywords?: boolean } = {}): string {
  if (lang === 'sql') return formatSql(code, opts.uppercaseKeywords ?? false)
  if (lang === 'xml') return formatXml(code)
  return formatCss(code)
}

const isWs = (c: string) => c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f'

// ==================== SQL ====================

interface SqlTok {
  kind: 'word' | 'string' | 'punct'
  text: string
}

const SQL_WORD = /[A-Za-z0-9_$\u0080-\uFFFF.]/

const SQL_RESERVED = new Set(
  (
    'select from where group by order having limit offset join inner left right full outer cross union all ' +
    'on using as and or not null true false is in like between asc desc distinct exists case when then else end ' +
    'values set update insert into delete create table primary key foreign references default unique check index ' +
    'view alter drop add column constraint if'
  ).split(' '),
)

const SQL_CLAUSES = new Set([
  'select',
  'from',
  'where',
  'group by',
  'order by',
  'having',
  'limit',
  'offset',
  'union all',
  'union',
  'inner join',
  'left join',
  'right join',
  'full join',
  'full outer join',
  'cross join',
  'join',
  'insert into',
  'delete from',
  'values',
  'set',
  'update',
])

/** SQL เป็นก้อน: string/identifier ถูกเก็บทั้งก้อน, comment ถูกตัดทิ้ง */
function tokenizeSql(code: string): SqlTok[] {
  const toks: SqlTok[] = []
  const n = code.length
  let i = 0
  while (i < n) {
    const c = code[i]
    if (isWs(c)) {
      i++
      continue
    }
    if (c === '-' && code[i + 1] === '-') {
      while (i < n && code[i] !== '\n') i++
      continue
    }
    if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2)
      i = end === -1 ? n : end + 2
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1
      let text = c
      while (j < n) {
        if (code[j] === c) {
          if (code[j + 1] === c) {
            text += c + c
            j += 2
            continue
          }
          break
        }
        text += code[j]
        j++
      }
      if (j < n) {
        text += c
        j++
      }
      toks.push({ kind: 'string', text })
      i = j
      continue
    }
    if (SQL_WORD.test(c)) {
      let j = i
      let text = ''
      while (j < n && SQL_WORD.test(code[j])) {
        text += code[j]
        j++
      }
      toks.push({ kind: 'word', text })
      i = j
      continue
    }
    const prevIsPunct = toks.length === 0 || toks[toks.length - 1].kind === 'punct'
    if ((c === '-' || c === '+') && prevIsPunct) {
      const num = /^[+-]?[0-9]+(\.[0-9]*)?([eE][+-]?[0-9]+)?/.exec(code.slice(i))
      if (num) {
        toks.push({ kind: 'word', text: num[0] })
        i += num[0].length
        continue
      }
    }
    const pair = code.slice(i, i + 2)
    if (['<=', '>=', '<>', '!=', '||', '&&', '::', '->', ':='].includes(pair)) {
      toks.push({ kind: 'punct', text: pair })
      i += 2
      continue
    }
    toks.push({ kind: 'punct', text: c })
    i++
  }
  return toks
}

function minifySql(code: string): string {
  let out = ''
  const n = code.length
  let i = 0
  let pending = false
  const noSpaceBefore = (ch: string) => ch === ',' || ch === ';' || ch === ')'
  while (i < n) {
    const c = code[i]
    if (isWs(c)) {
      pending = true
      i++
      continue
    }
    if (c === '-' && code[i + 1] === '-') {
      pending = true
      while (i < n && code[i] !== '\n') i++
      continue
    }
    if (c === '/' && code[i + 1] === '*') {
      pending = true
      const end = code.indexOf('*/', i + 2)
      i = end === -1 ? n : end + 2
      continue
    }
    if (c === "'" || c === '"' || c === '`') {
      let j = i + 1
      let text = c
      while (j < n) {
        if (code[j] === c) {
          if (code[j + 1] === c) {
            text += c + c
            j += 2
            continue
          }
          break
        }
        text += code[j]
        j++
      }
      if (j < n) {
        text += c
        j++
      }
      if (pending && out !== '' && out[out.length - 1] !== '(') out += ' '
      out += text
      pending = false
      i = j
      continue
    }
    if (pending && out !== '' && !noSpaceBefore(c) && out[out.length - 1] !== '(') out += ' '
    out += c
    pending = false
    i++
  }
  return out
}

function clauseMatch(toks: SqlTok[], i: number): number {
  for (const len of [3, 2, 1]) {
    if (i + len > toks.length) continue
    const parts: string[] = []
    let ok = true
    for (let k = 0; k < len; k++) {
      const t = toks[i + k]
      if (t.kind !== 'word') {
        ok = false
        break
      }
      parts.push(t.text.toLowerCase())
    }
    if (ok && SQL_CLAUSES.has(parts.join(' '))) return len
  }
  return 0
}

function sqlNeedSpace(prev: SqlTok, cur: SqlTok): boolean {
  const c = cur.text
  if (c === ',' || c === ';' || c === ')' || c === '.') return false
  if (prev.text === '(' || prev.text === '.') return false
  if (c === '(') {
    return !(prev.kind === 'word' && !SQL_RESERVED.has(prev.text.toLowerCase()))
  }
  return true
}

function formatSql(code: string, uppercase: boolean): string {
  const toks = tokenizeSql(code)
  const depthBefore: number[] = []
  let d = 0
  for (const tok of toks) {
    depthBefore.push(d)
    if (tok.text === '(') d++
    else if (tok.text === ')') d = Math.max(0, d - 1)
  }
  const cooked = toks.map((tok) =>
    uppercase && tok.kind === 'word' && SQL_RESERVED.has(tok.text.toLowerCase())
      ? { kind: tok.kind, text: tok.text.toUpperCase() }
      : tok,
  )
  const lines: SqlTok[][] = []
  let cur: SqlTok[] = []
  for (let i = 0; i < cooked.length; i++) {
    if (depthBefore[i] === 0 && cur.length > 0) {
      const m = clauseMatch(cooked, i)
      if (m > 0) {
        lines.push(cur)
        cur = []
        // ยกวลีนี้มาทั้งก้อน เพื่อไม่ให้คำในวลี (เช่น join ใน left join) ถูกตัดบรรทัดซ้ำ
        for (let k = 0; k < m; k++) cur.push(cooked[i + k])
        i += m - 1
        continue
      }
    }
    cur.push(cooked[i])
  }
  if (cur.length > 0) lines.push(cur)
  return lines
    .map((line) => {
      let s = ''
      for (let k = 0; k < line.length; k++) {
        if (k > 0 && sqlNeedSpace(line[k - 1], line[k])) s += ' '
        s += line[k].text
      }
      return s
    })
    .join('\n')
}

// ==================== XML ====================

interface XmlTok {
  type: 'open' | 'close' | 'selfClose' | 'text' | 'comment' | 'cdata' | 'pi' | 'doctype'
  raw: string
  name?: string
}

const XML_VOID = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr',
])

function findTagEnd(code: string, start: number): number {
  let inS: string | null = null
  for (let j = start + 1; j < code.length; j++) {
    const c = code[j]
    if (inS) {
      if (c === inS) inS = null
      continue
    }
    if (c === '"' || c === "'") inS = c
    else if (c === '>') return j
  }
  return -1
}

function findDoctypeEnd(code: string, start: number): number {
  let inS: string | null = null
  let depth = 0
  for (let j = start + 2; j < code.length; j++) {
    const c = code[j]
    if (inS) {
      if (c === inS) inS = null
      continue
    }
    if (c === '"' || c === "'") inS = c
    else if (c === '[') depth++
    else if (c === ']') depth = Math.max(0, depth - 1)
    else if (c === '>' && depth === 0) return j
  }
  return -1
}

function tokenizeXml(code: string): XmlTok[] {
  const toks: XmlTok[] = []
  const n = code.length
  let i = 0
  while (i < n) {
    if (code[i] !== '<') {
      const next = code.indexOf('<', i)
      const end = next === -1 ? n : next
      toks.push({ type: 'text', raw: code.slice(i, end) })
      i = end
      continue
    }
    if (code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i + 4)
      const stop = end === -1 ? n : end + 3
      toks.push({ type: 'comment', raw: code.slice(i, stop) })
      i = stop
      continue
    }
    if (code.startsWith('<![CDATA[', i)) {
      const end = code.indexOf(']]>', i + 9)
      const stop = end === -1 ? n : end + 3
      toks.push({ type: 'cdata', raw: code.slice(i, stop) })
      i = stop
      continue
    }
    if (code.startsWith('<!', i)) {
      const end = findDoctypeEnd(code, i)
      const stop = end === -1 ? n : end + 1
      toks.push({ type: 'doctype', raw: code.slice(i, stop) })
      i = stop
      continue
    }
    if (code.startsWith('<?', i)) {
      const end = code.indexOf('?>', i + 2)
      const stop = end === -1 ? n : end + 2
      toks.push({ type: 'pi', raw: code.slice(i, stop) })
      i = stop
      continue
    }
    const end = findTagEnd(code, i)
    if (end === -1) {
      toks.push({ type: 'text', raw: '<' })
      i++
      continue
    }
    const raw = code.slice(i, end + 1)
    if (code.startsWith('</', i)) {
      const name = /^<\s*\/\s*([^\s>]+)/.exec(raw)?.[1] ?? ''
      toks.push({ type: 'close', raw, name })
    } else {
      const name = /^<\s*([^\s/>]+)/.exec(raw)?.[1] ?? ''
      toks.push({ type: raw.endsWith('/>') ? 'selfClose' : 'open', raw, name })
    }
    i = end + 1
  }
  return toks
}

/** ปรับช่องว่างในแท็ก: ยุบช่องว่างซ้อน, เท่ากับชิด, ไม่แตะค่าภายในเครื่องหมายคำพูด */
function normalizeTag(raw: string): string {
  let out = ''
  let inS: string | null = null
  let i = 0
  while (i < raw.length) {
    const c = raw[i]
    if (inS) {
      out += c
      if (c === inS) inS = null
      i++
      continue
    }
    if (c === '"' || c === "'") {
      inS = c
      out += c
      i++
      continue
    }
    if (isWs(c)) {
      if (out !== '' && !out.endsWith(' ')) out += ' '
      i++
      continue
    }
    if (c === '=') {
      out = out.replace(/\s+$/, '') + '='
      i++
      while (i < raw.length && isWs(raw[i])) i++
      continue
    }
    out += c
    i++
  }
  return out.replace(/\s+$/, '').replace(/\s*\/\s*>$/, '/>').replace(/\s+>$/, '>')
}

function minifyXml(code: string): string {
  let out = ''
  for (const tok of tokenizeXml(code)) {
    if (tok.type === 'text') {
      if (tok.raw.trim() !== '') out += tok.raw
    } else if (tok.type === 'comment') {
      // ตัด comment ทิ้ง
    } else if (tok.type === 'open' || tok.type === 'close' || tok.type === 'selfClose') {
      out += normalizeTag(tok.raw)
    } else {
      out += tok.raw
    }
  }
  return out.trim()
}

interface XmlEl {
  type: 'el'
  name: string
  open: string
  selfClose: boolean
  children: XmlNode[]
}

type XmlNode =
  | XmlEl
  | { type: 'text'; raw: string }
  | { type: 'comment'; raw: string }
  | { type: 'cdata'; raw: string }
  | { type: 'pi'; raw: string }
  | { type: 'doctype'; raw: string }
  | { type: 'orphanClose'; raw: string }

function buildXmlTree(toks: XmlTok[]): XmlNode[] {
  const root: XmlNode[] = []
  const stack: XmlEl[] = []
  const current = () => (stack.length > 0 ? stack[stack.length - 1].children : root)
  for (const tok of toks) {
    if (tok.type === 'open' || tok.type === 'selfClose') {
      const name = tok.name ?? ''
      const el: XmlEl = {
        type: 'el',
        name,
        open: normalizeTag(tok.raw),
        selfClose: tok.type === 'selfClose' || XML_VOID.has(name.toLowerCase()),
        children: [],
      }
      current().push(el)
      if (!el.selfClose) stack.push(el)
    } else if (tok.type === 'close') {
      const name = tok.name ?? ''
      let idx = -1
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k].name === name) {
          idx = k
          break
        }
      }
      if (idx >= 0) stack.length = idx
      else current().push({ type: 'orphanClose', raw: tok.raw })
    } else if (tok.type === 'text') current().push({ type: 'text', raw: tok.raw })
    else if (tok.type === 'comment') current().push({ type: 'comment', raw: tok.raw })
    else if (tok.type === 'cdata') current().push({ type: 'cdata', raw: tok.raw })
    else if (tok.type === 'pi') current().push({ type: 'pi', raw: tok.raw })
    else current().push({ type: 'doctype', raw: tok.raw })
  }
  return root
}

function inlineXml(nodes: XmlNode[]): string {
  let out = ''
  for (const c of nodes) {
    if (c.type === 'el') {
      out += c.open + (c.selfClose ? '' : inlineXml(c.children) + '</' + c.name + '>')
    } else {
      out += c.raw
    }
  }
  return out
}

function renderEl(el: XmlEl, depth: number): string[] {
  const pad = '  '.repeat(depth)
  if (el.selfClose) return [pad + el.open]
  const sig = el.children.filter((c) => !(c.type === 'text' && c.raw.trim() === ''))
  if (sig.length === 0) return [pad + el.open + '</' + el.name + '>']
  if (sig.every((c) => c.type === 'text' || c.type === 'cdata')) {
    const inner = sig.map((c) => c.raw).join('').trim()
    return [pad + el.open + inner + '</' + el.name + '>']
  }
  if (sig.some((c) => c.type === 'text')) {
    return [pad + el.open + inlineXml(sig) + '</' + el.name + '>']
  }
  const body: string[] = []
  for (const c of sig) {
    if (c.type === 'el') body.push(...renderEl(c, depth + 1))
    else if (c.type === 'text') body.push('  '.repeat(depth + 1) + c.raw.trim())
    else body.push('  '.repeat(depth + 1) + c.raw)
  }
  return [pad + el.open, ...body, pad + '</' + el.name + '>']
}

function formatXml(code: string): string {
  const lines: string[] = []
  for (const node of buildXmlTree(tokenizeXml(code))) {
    if (node.type === 'el') lines.push(...renderEl(node, 0))
    else if (node.type === 'text') {
      const t = node.raw.trim()
      if (t !== '') lines.push(t)
    } else lines.push(node.raw)
  }
  return lines.join('\n')
}

// ==================== CSS ====================

function minifyCss(code: string): string {
  let out = ''
  const n = code.length
  let i = 0
  let pending = false
  const trimBefore = new Set(['{', '}', ';', ',', ')'])
  const suppressAfter = new Set(['{', '}', ';', ',', '(', ':'])
  while (i < n) {
    const c = code[i]
    if (isWs(c)) {
      pending = true
      i++
      continue
    }
    if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2)
      i = end === -1 ? n : end + 2
      pending = true
      continue
    }
    if (c === '"' || c === "'") {
      let j = i + 1
      let text = c
      while (j < n) {
        const ch = code[j]
        if (ch === '\\') {
          text += ch + (code[j + 1] ?? '')
          j += 2
          continue
        }
        text += ch
        j++
        if (ch === c) break
      }
      if (pending && out !== '' && !trimBefore.has(c)) out += ' '
      out += text
      pending = false
      i = j
      continue
    }
    if (pending && out !== '' && !trimBefore.has(c)) out += ' '
    if (c === '}') out = out.replace(/;$/, '')
    out += c
    pending = false
    i++
    if (suppressAfter.has(c)) {
      while (i < n && isWs(code[i])) i++
    }
  }
  return out
}

function skipCssString(s: string, start: number): number {
  const quote = s[start]
  let j = start + 1
  while (j < s.length) {
    const ch = s[j]
    if (ch === '\\') {
      j += 2
      continue
    }
    j++
    if (ch === quote) break
  }
  return j
}

function skipCssComment(s: string, start: number): number {
  const end = s.indexOf('*/', start + 2)
  return end === -1 ? s.length : end + 2
}

/** ยุบช่องว่างซ้อนเป็นช่องเดียว โดยไม่แตะใน string/comment */
function collapseWs(s: string): string {
  let out = ''
  let i = 0
  let pending = false
  const n = s.length
  while (i < n) {
    const c = s[i]
    if (isWs(c)) {
      pending = true
      i++
      continue
    }
    if (c === '"' || c === "'") {
      const j = skipCssString(s, i)
      if (pending && out !== '') out += ' '
      out += s.slice(i, j)
      pending = false
      i = j
      continue
    }
    if (c === '/' && s[i + 1] === '*') {
      const j = skipCssComment(s, i)
      if (pending && out !== '') out += ' '
      out += s.slice(i, j)
      pending = false
      i = j
      continue
    }
    if (pending && out !== '') out += ' '
    out += c
    pending = false
    i++
  }
  return out
}

function findTopColon(s: string): number {
  let paren = 0
  let i = 0
  const n = s.length
  while (i < n) {
    const c = s[i]
    if (c === '"' || c === "'") {
      i = skipCssString(s, i)
      continue
    }
    if (c === '/' && s[i + 1] === '*') {
      i = skipCssComment(s, i)
      continue
    }
    if (c === '(') paren++
    else if (c === ')') paren = Math.max(0, paren - 1)
    else if (c === ':' && paren === 0) return i
    i++
  }
  return -1
}

function splitTopComma(s: string): string[] {
  const parts: string[] = []
  let cur = ''
  let paren = 0
  let i = 0
  const n = s.length
  while (i < n) {
    const c = s[i]
    if (c === '"' || c === "'") {
      const j = skipCssString(s, i)
      cur += s.slice(i, j)
      i = j
      continue
    }
    if (c === '/' && s[i + 1] === '*') {
      const j = skipCssComment(s, i)
      cur += s.slice(i, j)
      i = j
      continue
    }
    if (c === '(') paren++
    else if (c === ')') paren = Math.max(0, paren - 1)
    else if (c === ',' && paren === 0) {
      parts.push(cur)
      cur = ''
      i++
      continue
    }
    cur += c
    i++
  }
  parts.push(cur)
  return parts
}

function flushCssDecl(bufRaw: string, depth: number): string | null {
  const text = collapseWs(bufRaw).trim()
  if (text === '') return null
  const pad = '  '.repeat(depth)
  const sep = findTopColon(text)
  if (sep < 0) return pad + text + ';'
  const prop = text.slice(0, sep).trim()
  const val = text.slice(sep + 1).trim()
  return pad + prop + ':' + (val === '' ? '' : ' ' + val) + ';'
}

function renderCssBlock(headerRaw: string, children: string[], depth: number): string {
  const pad = '  '.repeat(depth)
  const header = collapseWs(headerRaw).trim()
  let head: string
  if (header === '' || header.startsWith('@')) {
    head = pad + header + ' {'
  } else {
    const parts = splitTopComma(header)
    head = parts
      .map((p, idx) => pad + p.trim() + (idx < parts.length - 1 ? ',' : ' {'))
      .join('\n')
  }
  if (children.length === 0) return head + '}'
  return head + '\n' + children.join('\n') + '\n' + pad + '}'
}

class CssParser {
  private i = 0
  constructor(private readonly s: string) {}

  parseLevel(depth: number): string[] {
    const items: string[] = []
    const pad = '  '.repeat(depth)
    let buf = ''
    let paren = 0
    const n = this.s.length
    while (this.i < n) {
      const c = this.s[this.i]
      if (c === '"' || c === "'") {
        buf += this.readString()
        continue
      }
      if (c === '/' && this.s[this.i + 1] === '*') {
        const comment = this.readComment()
        if (buf.trim() === '') items.push(pad + comment)
        else buf += ' ' + comment + ' '
        continue
      }
      if (c === '(') {
        paren++
        buf += c
        this.i++
        continue
      }
      if (c === ')') {
        paren = Math.max(0, paren - 1)
        buf += c
        this.i++
        continue
      }
      if (c === '{' && paren === 0) {
        this.i++
        const children = this.parseLevel(depth + 1)
        items.push(renderCssBlock(buf, children, depth))
        buf = ''
        continue
      }
      if (c === '}' && paren === 0) {
        this.i++
        const tail = flushCssDecl(buf, depth)
        if (tail !== null) items.push(tail)
        return items
      }
      if (c === ';' && paren === 0) {
        this.i++
        const decl = flushCssDecl(buf, depth)
        if (decl !== null) items.push(decl)
        buf = ''
        continue
      }
      buf += c
      this.i++
    }
    const tail = flushCssDecl(buf, depth)
    if (tail !== null) items.push(tail)
    return items
  }

  private readString(): string {
    const quote = this.s[this.i]
    let j = this.i + 1
    let text = quote
    const n = this.s.length
    while (j < n) {
      const ch = this.s[j]
      if (ch === '\\') {
        text += ch + (this.s[j + 1] ?? '')
        j += 2
        continue
      }
      text += ch
      j++
      if (ch === quote) break
    }
    this.i = j
    return text
  }

  private readComment(): string {
    const end = this.s.indexOf('*/', this.i + 2)
    const stop = end === -1 ? this.s.length : end + 2
    const raw = this.s.slice(this.i, stop)
    this.i = stop
    return raw
  }
}

function joinCssItems(items: string[]): string {
  let out = ''
  const isComment = (s: string) => /^\s*\/\*/.test(s)
  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      out += isComment(items[i - 1]) || isComment(items[i]) ? '\n' : '\n\n'
    }
    out += items[i]
  }
  return out
}

function formatCss(code: string): string {
  return joinCssItems(new CssParser(code).parseLevel(0))
}
