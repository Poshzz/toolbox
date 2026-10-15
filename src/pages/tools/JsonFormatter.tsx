import { useMemo, useState } from 'react'
import { CopyButton, Segmented, Textarea } from '../../components/ui'
import { cn } from '../../lib/utils'

type Indent = '2' | '4'
type Status = { kind: 'idle' } | { kind: 'ok' } | { kind: 'error'; message: string }

function jsonStats(value: unknown) {
  let keys = 0
  let depth = 0
  const walk = (v: unknown, d: number) => {
    depth = Math.max(depth, d)
    if (Array.isArray(v)) {
      v.forEach((item) => walk(item, d + 1))
    } else if (v && typeof v === 'object') {
      for (const [k, child] of Object.entries(v)) {
        keys++
        walk(child, d + 1)
        void k
      }
    }
  }
  walk(value, 1)
  return { keys, depth }
}

export default function JsonFormatter() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [indent, setIndent] = useState<Indent>('2')
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  const stats = useMemo(() => {
    try {
      return jsonStats(JSON.parse(input))
    } catch {
      return null
    }
  }, [input])

  const run = (kind: 'pretty' | 'minify' | 'validate') => {
    try {
      const parsed = JSON.parse(input)
      if (kind === 'pretty') setOutput(JSON.stringify(parsed, null, indent === '2' ? 2 : 4))
      if (kind === 'minify') setOutput(JSON.stringify(parsed))
      if (kind === 'validate') setOutput('')
      setStatus({ kind: 'ok' })
    } catch (e) {
      setStatus({ kind: 'error', message: e instanceof Error ? e.message : String(e) })
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-center gap-3 p-5 md:p-6">
        <button type="button" className="btn btn-rust" onClick={() => run('pretty')} disabled={!input}>
          จัดสวย (Pretty)
        </button>
        <button type="button" className="btn" onClick={() => run('minify')} disabled={!input}>
          ย่อ (Minify)
        </button>
        <button type="button" className="btn" onClick={() => run('validate')} disabled={!input}>
          ตรวจสอบเท่านั้น
        </button>
        <span className="ml-auto flex items-center gap-2 text-xs text-inksoft">
          ย่อหน้า
          <Segmented
            options={[
              { value: '2', label: '2' },
              { value: '4', label: '4' },
            ]}
            value={indent}
            onChange={setIndent}
          />
        </span>
      </div>

      {status.kind !== 'idle' && (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 font-mono text-xs',
            status.kind === 'ok'
              ? 'border-olive/40 bg-olive/10 text-olive'
              : 'border-rust/40 bg-rust/10 text-rustdeep',
          )}
        >
          {status.kind === 'ok' ? '✓ JSON ถูกต้อง' : `✗ ไม่ถูกต้อง: ${status.message}`}
          {stats && status.kind === 'ok' && (
            <span className="ml-3 opacity-70">
              ({stats.keys} คีย์ · ลึก {stats.depth} ชั้น · {Array.from(input).length.toLocaleString()} ตัวอักษร)
            </span>
          )}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h3 className="label">JSON ต้นฉบับ</h3>
          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setStatus({ kind: 'idle' })
            }}
            placeholder='{"hello": "world", "list": [1, 2, 3]}'
            className="min-h-72"
          />
        </div>
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="label mb-0">ผลลัพธ์</h3>
            <CopyButton text={output} />
          </div>
          <Textarea value={output} readOnly className="mt-1.5 min-h-72" placeholder="กดปุ่มด้านบนเพื่อจัดรูปแบบ" />
        </div>
      </div>
    </div>
  )
}
