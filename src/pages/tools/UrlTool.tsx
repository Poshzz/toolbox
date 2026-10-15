import { useMemo, useState } from 'react'
import { CopyButton, CopyField, Segmented, Textarea } from '../../components/ui'

type Mode = 'encode' | 'decode'
type Kind = 'component' | 'full'

function decodeSafe(s: string) {
  try {
    return { ok: true as const, value: decodeURIComponent(s) }
  } catch {
    return { ok: false as const, value: '' }
  }
}

function parseQuery(input: string) {
  const qIndex = input.indexOf('?')
  const s = (qIndex >= 0 ? input.slice(qIndex + 1).split('#')[0] : input.replace(/^[?#]/, '')).trim()
  if (!s) return []
  return s
    .split('&')
    .filter(Boolean)
    .map((pair) => {
      const eq = pair.indexOf('=')
      const rawK = eq >= 0 ? pair.slice(0, eq) : pair
      const rawV = eq >= 0 ? pair.slice(eq + 1) : ''
      const dec = (x: string) => {
        const r = decodeSafe(x.replace(/\+/g, ' '))
        return r.ok ? r.value : x
      }
      return { key: dec(rawK), value: dec(rawV) }
    })
}

export default function UrlTool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [kind, setKind] = useState<Kind>('component')
  const [input, setInput] = useState('')
  const [queryInput, setQueryInput] = useState('https://shop.example.com/search?q=%E0%B8%81%E0%B8%B2%E0%B9%81%E0%B8%9F&page=2&sort=price_desc')

  const result = useMemo(() => {
    if (!input) return { ok: true as const, value: '' }
    if (mode === 'encode') {
      return {
        ok: true as const,
        value: kind === 'component' ? encodeURIComponent(input) : encodeURI(input),
      }
    }
    return decodeSafe(input)
  }, [input, mode, kind])

  const pairs = useMemo(() => parseQuery(queryInput), [queryInput])
  const asJson = useMemo(() => {
    const obj: Record<string, string | string[]> = {}
    for (const { key, value } of pairs) {
      const prev = obj[key]
      if (prev === undefined) obj[key] = value
      else if (Array.isArray(prev)) prev.push(value)
      else obj[key] = [prev, value]
    }
    return JSON.stringify(obj, null, 2)
  }, [pairs])

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-5 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            options={[
              { value: 'encode', label: 'Encode' },
              { value: 'decode', label: 'Decode' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <Segmented
            options={[
              { value: 'component', label: 'แบบชิ้นส่วน (component)' },
              { value: 'full', label: 'แบบ URL เต็ม (URI)' },
            ]}
            value={kind}
            onChange={setKind}
          />
        </div>

        {!result.ok && (
          <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 font-mono text-xs text-rustdeep">
            ✗ ถอดรหัสไม่ได้ — มี % ที่ไม่ถูกต้องอยู่ในข้อความ
          </p>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="label">{mode === 'encode' ? 'ข้อความ / ลิงก์' : 'ข้อความที่เข้ารหัสแล้ว'}</h3>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? 'https://example.com/ค้นหา?q=กาแฟ' : 'https%3A%2F%2Fexample.com'}
              className="min-h-40"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="label mb-0">ผลลัพธ์</h3>
              <CopyButton text={result.value} />
            </div>
            <Textarea value={result.value} readOnly className="mt-1.5 min-h-40" />
          </div>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl">แกะ Query String</h3>
          {pairs.length > 0 && <CopyButton text={asJson} label="คัดลอกเป็น JSON" />}
        </div>
        <Textarea
          value={queryInput}
          onChange={(e) => setQueryInput(e.target.value)}
          placeholder="วาง URL หรือ query string เช่น ?q=hello&page=2"
          className="mt-3 min-h-24"
        />
        {pairs.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/15 text-left text-[11px] tracking-[0.14em] text-inksoft uppercase">
                  <th className="py-2 pr-4 font-semibold">คีย์</th>
                  <th className="py-2 pr-4 font-semibold">ค่า (ถอดรหัสแล้ว)</th>
                </tr>
              </thead>
              <tbody>
                {pairs.map((p, i) => (
                  <tr key={`${p.key}-${i}`} className="border-b border-ink/5">
                    <td className="py-2.5 pr-4 align-top font-mono text-xs font-semibold">{p.key}</td>
                    <td className="w-full py-1.5 align-top">
                      <CopyField value={p.value} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
