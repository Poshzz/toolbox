import { useMemo, useState } from 'react'
import { CheckRow, CopyButton, Segmented, Textarea } from '../../components/ui'

type Mode = 'encode' | 'decode'

function encodeB64(s: string, urlSafe: boolean) {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  let out = btoa(bin)
  if (urlSafe) out = out.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  return out
}

function decodeB64(s: string, urlSafe: boolean) {
  let b64 = s.trim().replace(/\s/g, '')
  if (urlSafe) b64 = b64.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const bin = atob(b64 + pad)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

export default function Base64Tool() {
  const [mode, setMode] = useState<Mode>('encode')
  const [urlSafe, setUrlSafe] = useState(false)
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: '' }
    try {
      return { ok: true as const, value: mode === 'encode' ? encodeB64(input, urlSafe) : decodeB64(input, urlSafe) }
    } catch {
      return { ok: false as const, value: '' }
    }
  }, [input, mode, urlSafe])

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-center gap-4 p-5 md:p-6">
        <Segmented
          options={[
            { value: 'encode', label: 'เข้ารหัส (→ Base64)' },
            { value: 'decode', label: 'ถอดรหัส (Base64 →)' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <CheckRow checked={urlSafe} onChange={setUrlSafe} label="ใช้แบบ URL-safe (-_ แทน +/)" />
        <button
          type="button"
          className="btn ml-auto"
          disabled={!result.value}
          onClick={() => {
            setInput(result.value)
            setMode((m) => (m === 'encode' ? 'decode' : 'encode'))
          }}
        >
          สลับ ↕ ใช้ผลลัพธ์เป็นอินพุต
        </button>
      </div>

      {!result.ok && (
        <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 font-mono text-xs text-rustdeep">
          ✗ ข้อความนี้ไม่ใช่ Base64 ที่ถูกต้อง
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h3 className="label">{mode === 'encode' ? 'ข้อความต้นฉบับ (UTF-8)' : 'Base64 ต้นฉบับ'}</h3>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={mode === 'encode' ? 'พิมพ์ข้อความไทยก็ได้ อีโมจิก็ได้ 😄' : 'SGVsbG8gVG9vbGJveCE='}
            className="min-h-56"
          />
        </div>
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="label mb-0">ผลลัพธ์</h3>
            <CopyButton text={result.value} />
          </div>
          <Textarea value={result.value} readOnly className="mt-1.5 min-h-56" />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-inksoft">
        รองรับภาษาไทยและอีโมจิเต็มรูปแบบ (เข้ารหัสเป็น UTF-8 bytes ก่อนเสมอ) — เหมาะกับงานข้อมูลและ
        debug แต่ไม่ใช่การเข้ารหัสเพื่อความปลอดภัย เพราะถอดได้โดยไม่มีกุญแจ
      </p>
    </div>
  )
}
