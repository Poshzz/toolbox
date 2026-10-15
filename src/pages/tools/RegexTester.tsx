import { useMemo, useState, type ReactNode } from 'react'
import { CheckRow, Field, Input, Textarea } from '../../components/ui'

interface Match {
  index: number
  length: number
  text: string
  groups: string[]
}

function findAll(re: RegExp, text: string): Match[] {
  const out: Match[] = []
  const r = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g')
  let m: RegExpExecArray | null
  let guard = 0
  while ((m = r.exec(text)) !== null && guard++ < 5000) {
    out.push({
      index: m.index,
      length: m[0].length,
      text: m[0],
      groups: m.slice(1).map((g) => g ?? ''),
    })
    if (m[0].length === 0) r.lastIndex++
  }
  return out
}

export default function RegexTester() {
  const [pattern, setPattern] = useState('')
  const [flagsOn, setFlagsOn] = useState<Record<'i' | 'm' | 's' | 'u', boolean>>({
    i: false,
    m: false,
    s: false,
    u: false,
  })
  const [text, setText] = useState('')

  const flags = 'g' + (Object.keys(flagsOn) as Array<'i' | 'm' | 's' | 'u'>).filter((f) => flagsOn[f]).join('')

  const compiled = useMemo(() => {
    if (!pattern) return { ok: true as const, re: null, matches: [] as Match[] }
    try {
      const re = new RegExp(pattern, flags)
      const matches = text ? findAll(re, text) : []
      return { ok: true as const, re, matches }
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : 'regex ไม่ถูกต้อง', matches: [] as Match[] }
    }
  }, [pattern, flags, text])

  const highlighted = useMemo(() => {
    if (!compiled.ok || compiled.matches.length === 0) return null
    const parts: ReactNode[] = []
    let last = 0
    compiled.matches.forEach((m, i) => {
      if (m.index > last) parts.push(<span key={`t${i}`}>{text.slice(last, m.index)}</span>)
      if (m.length === 0) {
        parts.push(
          <mark key={`m${i}`} className="rounded bg-gold/50 text-ink">
            ‸
          </mark>,
        )
      } else {
        parts.push(
          <mark key={`m${i}`} className="rounded bg-gold/50 px-0.5 text-ink">
            {text.slice(m.index, m.index + m.length)}
          </mark>,
        )
      }
      last = m.index + m.length
    })
    parts.push(<span key="tail">{text.slice(last)}</span>)
    return parts
  }, [compiled, text])

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-4 p-5 md:p-6">
        <Field label="Pattern (ไม่ต้องใส่ /…/)">
          <Input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="เช่น (\d{4})-(\d{2})-(\d{2})"
            className="font-mono"
          />
        </Field>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {(
            [
              ['i', 'ไม่สนตัวพิมพ์เล็ก-ใหญ่ (i)'],
              ['m', 'หลายบรรทัด (m)'],
              ['s', 'ให้ . ครอบคลุม \n (s)'],
              ['u', 'unicode (u)'],
            ] as Array<['i' | 'm' | 's' | 'u', string]>
          ).map(([f, label]) => (
            <CheckRow
              key={f}
              checked={flagsOn[f]}
              onChange={(v) => setFlagsOn((prev) => ({ ...prev, [f]: v }))}
              label={label}
            />
          ))}
        </div>

        {!compiled.ok && (
          <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 font-mono text-xs text-rustdeep">
            ✗ {compiled.message}
          </p>
        )}
        {compiled.ok && pattern && (
          <p className="text-xs text-inksoft">
            เจอ <span className="font-mono font-semibold text-ink">{compiled.matches.length}</span> แห่งด้วย{' '}
            <span className="font-mono">/{pattern}/{flags}</span>
          </p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h3 className="label">ข้อความทดสอบ</h3>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'วางข้อความที่ต้องการทดสอบ…\n2026-10-15 นัดประชุมตอน 09:30'}
            className="min-h-52"
          />
        </div>
        <div className="card p-5 md:p-6">
          <h3 className="label">ไฮไลต์ผลที่เจอ</h3>
          <pre className="mt-1.5 min-h-52 overflow-auto rounded-2xl border border-ink/10 bg-paper2/40 p-4 font-mono text-[13px] whitespace-pre-wrap">
            {highlighted ?? <span className="text-inksoft/60">ผลที่ match จะถูกไฮไลต์ที่นี่</span>}
          </pre>
        </div>
      </div>

      {compiled.ok && compiled.matches.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink/10 px-5 py-3">
            <h3 className="font-display text-xl">รายละเอียด</h3>
          </div>
          <div className="max-h-80 overflow-auto">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-crema">
                <tr className="border-b border-ink/15 text-left text-[10px] tracking-[0.14em] text-inksoft uppercase">
                  <th className="px-5 py-2 font-semibold">#</th>
                  <th className="px-3 py-2 font-semibold">ตำแหน่ง</th>
                  <th className="px-3 py-2 font-semibold">ข้อความที่เจอ</th>
                  <th className="px-3 py-2 font-semibold">กลุ่มจับได้</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {compiled.matches.map((m, i) => (
                  <tr key={i} className="border-b border-ink/5">
                    <td className="px-5 py-2 text-inksoft">{i + 1}</td>
                    <td className="px-3 py-2">{m.index}</td>
                    <td className="px-3 py-2 break-all">{m.text || '∅ (ว่าง)'}</td>
                    <td className="px-3 py-2 break-all">
                      {m.groups.length === 0 ? (
                        <span className="text-inksoft/50">—</span>
                      ) : (
                        <span className="flex flex-wrap gap-1.5">
                          {m.groups.map((g, gi) => (
                            <span key={gi} className="chip px-2 py-0.5 text-[11px]">
                              ${gi + 1}: {g || '∅'}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
