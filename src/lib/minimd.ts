/**
 * minimd — Markdown → HTML renderer ขนาดจิ๋ว ไม่มี dependency
 * ความปลอดภัยมาก่อน: escape HTML (& < > ") เป็นขั้นแรกเสมอ
 * แล้วค่อยแปลง syntax — ไม่มีทางที่ input ผู้ใช้จะกลายเป็นแท็กจริงได้
 */

const ESC_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ESC_MAP[c])
}

// ---- Tailwind classes (literal strings — Tailwind v4 สแกนจากไฟล์นี้) ----
const P_CLASS = 'my-3 leading-relaxed first:mt-0 last:mb-0'
const IC_CLASS = 'rounded-md bg-ink/10 px-1.5 py-0.5 font-mono text-[0.85em] text-rustdeep dark:text-gold'
const H_CLASS = 'mt-6 mb-2 font-display font-semibold tracking-tight text-ink first:mt-0'
const H_SIZE: Record<number, string> = {
  1: 'text-3xl',
  2: 'text-2xl',
  3: 'text-xl',
  4: 'text-lg',
  5: 'text-base',
  6: 'text-sm',
}
const HR_CLASS = 'my-6 border-t border-ink/20'
const PRE_CLASS = 'my-4 overflow-x-auto rounded-2xl border border-ink/10 bg-paper2/50 p-4'
const PRE_CODE_CLASS = 'font-mono text-[13px] leading-relaxed'
const UL_CLASS = 'my-3 list-disc space-y-1 pl-6 marker:text-rust'
const OL_CLASS = 'my-3 list-decimal space-y-1 pl-6 marker:text-rust'
const LI_CLASS = 'leading-relaxed'
const BQ_CLASS = 'my-4 border-l-2 border-rust/60 bg-white/30 py-1 pl-4 text-inksoft dark:bg-white/5'
const A_CLASS = 'text-rust underline underline-offset-2 hover:text-rustdeep'

const CODE_SLOT = /\u0000(\d+)\u0000/g
const HREF_SLOT = /\u0001(\d+)\u0001/g
const LINK_OR_IMAGE = /!\[([^\]]*)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)/g
/** allowlist — เฉพาะ http, https และ mailto เท่านั้น */
const SAFE_URL = /^(https?:|mailto:)/i

/** แปลง syntax ระดับบรรทัด: code → รูป/ลิงก์ → bold → italic → strikethrough */
function inline(text: string): string {
  let t = esc(text).replace(/[\u0000\u0001]/g, '')
  const codes: string[] = []
  t = t.replace(/`([^`\n]+)`/g, (_m, code: string) => {
    codes.push(code)
    return `\u0000${codes.length - 1}\u0000`
  })
  const hrefs: string[] = []
  t = t.replace(LINK_OR_IMAGE, (m, alt?: string, imgUrl?: string, label?: string, url?: string) => {
    // รูป: แสดงเป็นข้อความล้วน เพื่อไม่ให้เบราว์เซอร์โหลด URL จากปลายทาง (privacy)
    if (alt !== undefined) return `[${alt}](${imgUrl ?? ''})`
    const u = (url ?? '').trim()
    if (!SAFE_URL.test(u)) return m
    hrefs.push(u)
    return `<a href="\u0001${hrefs.length - 1}\u0001" rel="noopener noreferrer" target="_blank" class="${A_CLASS}">${label}</a>`
  })
  t = t.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  t = t.replace(/~~(.+?)~~/g, '<del>$1</del>')
  t = t.replace(HREF_SLOT, (_m, n: string) => hrefs[Number(n)])
  return t.replace(CODE_SLOT, (_m, n: string) => `<code class="${IC_CLASS}">${codes[Number(n)]}</code>`)
}

function isHr(line: string): boolean {
  return /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)
}

function isBlockStart(line: string): boolean {
  return (
    /^```/.test(line) ||
    /^#{1,6}\s/.test(line) ||
    isHr(line) ||
    /^\s*>/.test(line) ||
    /^\s*[-*+]\s+/.test(line) ||
    /^\s*\d+[.)]\s+/.test(line)
  )
}

function renderBlocks(lines: string[]): string {
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (line.trim() === '') {
      i++
      continue
    }

    if (/^```/.test(line)) {
      const code: string[] = []
      i++
      while (i < lines.length && !/^```/.test(lines[i])) {
        code.push(lines[i])
        i++
      }
      if (i < lines.length) i++ // ปิด fence
      out.push(
        `<pre class="${PRE_CLASS}"><code class="${PRE_CODE_CLASS}">${esc(code.join('\n'))}</code></pre>`,
      )
      continue
    }

    const head = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line)
    if (head) {
      const level = head[1].length
      out.push(`<h${level} class="${H_CLASS} ${H_SIZE[level]}">${inline(head[2].trim())}</h${level}>`)
      i++
      continue
    }

    if (isHr(line)) {
      out.push(`<hr class="${HR_CLASS}">`)
      i++
      continue
    }

    if (/^\s*>/.test(line)) {
      const quote: string[] = []
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      out.push(`<blockquote class="${BQ_CLASS}">${renderBlocks(quote)}</blockquote>`)
      continue
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(`<li class="${LI_CLASS}">${inline(lines[i].replace(/^\s*[-*+]\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ul class="${UL_CLASS}">${items.join('')}</ul>`)
      continue
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(`<li class="${LI_CLASS}">${inline(lines[i].replace(/^\s*\d+[.)]\s+/, ''))}</li>`)
        i++
      }
      out.push(`<ol class="${OL_CLASS}">${items.join('')}</ol>`)
      continue
    }

    // ย่อหน้า — do/while กัน infinite loop เมื่อเจอบรรทัดที่ดูเหมือน block start แต่ไม่มี block ไหนรับ
    const para: string[] = []
    do {
      para.push(lines[i])
      i++
    } while (i < lines.length && lines[i].trim() !== '' && !isBlockStart(lines[i]))
    out.push(`<p class="${P_CLASS}">${inline(para.join('\n')).replace(/\n/g, '<br>\n')}</p>`)
  }
  return out.join('\n')
}

/** แปลง Markdown เป็น HTML string (ปลอดภัยสำหรับ dangerouslySetInnerHTML) */
export function render(src: string): string {
  return renderBlocks(src.replace(/\r\n?/g, '\n').split('\n'))
}
