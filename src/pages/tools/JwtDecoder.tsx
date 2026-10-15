import { useMemo, useState } from 'react'
import { Check, Copy, ShieldAlert, ShieldCheck } from 'lucide-react'
import { CopyButton, Field, Input, Textarea } from '../../components/ui'
import { cn } from '../../lib/utils'

function b64urlToBytes(s: string) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4))
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad
  const bin = atob(b64)
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

function b64urlDecode(s: string) {
  return new TextDecoder().decode(b64urlToBytes(s))
}

function bytesToB64url(bytes: Uint8Array) {
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function verifyHs256(token: string, secret: string) {
  const [h, p, sig] = token.split('.')
  if (!h || !p || !sig) return false
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${p}`))
  return bytesToB64url(new Uint8Array(mac)) === sig.replace(/=+$/, '')
}

const CLAIM_LABELS: Record<string, string> = {
  exp: 'หมดอายุเมื่อ',
  iat: 'ออกให้เมื่อ',
  nbf: 'เริ่มใช้ได้เมื่อ',
}

type Decoded =
  | {
      ok: true
      header: Record<string, unknown>
      payload: Record<string, unknown>
      headerText: string
      payloadText: string
      alg: string
    }
  | { ok: false; error: string }

export default function JwtDecoder() {
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')
  const [verdict, setVerdict] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')

  const parsed = useMemo<Decoded | null>(() => {
    const t = token.trim()
    if (!t) return null
    const parts = t.split('.')
    if (parts.length !== 3) {
      return { ok: false, error: 'JWT ต้องมี 3 ส่วนคั่นด้วยจุด (header.payload.signature)' }
    }
    try {
      const header = JSON.parse(b64urlDecode(parts[0])) as Record<string, unknown>
      const payload = JSON.parse(b64urlDecode(parts[1])) as Record<string, unknown>
      return {
        ok: true,
        header,
        payload,
        headerText: JSON.stringify(header, null, 2),
        payloadText: JSON.stringify(payload, null, 2),
        alg: String(header.alg ?? ''),
      }
    } catch {
      return { ok: false, error: 'ถอดรหัสไม่ได้ — token อาจไม่ครบหรือไม่ใช่ Base64url' }
    }
  }, [token])

  const now = Math.floor(Date.now() / 1000)
  const payload = parsed && parsed.ok ? parsed.payload : null
  const exp = payload ? Number(payload.exp) : NaN
  const expired = Number.isFinite(exp) ? exp < now : null

  let claimRows: Array<{ k: string; label: string; time: string }> = []
  if (payload) {
    const p = payload
    claimRows = Object.entries(CLAIM_LABELS).flatMap(([k, label]) => {
      const v = Number(p[k])
      if (!Number.isFinite(v)) return []
      return [
        {
          k,
          label,
          time: new Date(v * 1000).toLocaleString('th-TH', {
            dateStyle: 'medium',
            timeStyle: 'short',
          }),
        },
      ]
    })
  }

  const check = async () => {
    if (!parsed || !parsed.ok) return
    setVerdict('checking')
    try {
      const ok = await verifyHs256(token.trim(), secret)
      setVerdict(ok ? 'valid' : 'invalid')
    } catch {
      setVerdict('invalid')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <h3 className="label">Token</h3>
        <Textarea
          value={token}
          onChange={(e) => {
            setToken(e.target.value)
            setVerdict('idle')
          }}
          placeholder="วาง JWT (eyJhbGciOi…) ตรงนี้"
          className="min-h-32"
        />
      </div>

      {parsed && !parsed.ok && (
        <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
          ✗ {parsed.error}
        </p>
      )}

      {parsed && parsed.ok && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            {expired !== null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold',
                  expired
                    ? 'border-rust/40 bg-rust/10 text-rustdeep'
                    : 'border-olive/40 bg-olive/10 text-olive',
                )}
              >
                {expired ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                {expired ? 'Token หมดอายุแล้ว' : 'ยังไม่หมดอายุ'}
              </span>
            )}
            <span className="chip font-mono">alg: {parsed.alg || '—'}</span>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="label mb-0">Header</h3>
                <CopyButton text={parsed.headerText} />
              </div>
              <pre className="mt-2 max-h-72 overflow-auto rounded-2xl bg-paper2/50 p-4 font-mono text-xs">
                {parsed.headerText}
              </pre>
            </div>
            <div className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="label mb-0">Payload</h3>
                <CopyButton text={parsed.payloadText} />
              </div>
              <pre className="mt-2 max-h-72 overflow-auto rounded-2xl bg-paper2/50 p-4 font-mono text-xs">
                {parsed.payloadText}
              </pre>
            </div>
          </div>

          {claimRows.length > 0 && (
            <div className="card p-5">
              <h3 className="label">เวลาใน Token</h3>
              <div className="mt-1 grid gap-2">
                {claimRows.map((row) => (
                  <div
                    key={row.k}
                    className="flex flex-wrap items-baseline justify-between gap-2 border-b border-dashed border-ink/10 py-2 text-sm last:border-0"
                  >
                    <span className="text-inksoft">
                      {row.label} <span className="font-mono text-xs">({row.k})</span>
                    </span>
                    <span className="font-mono text-xs">{row.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card p-5 md:p-6">
            <h3 className="font-display text-xl">ตรวจลายเซ็น (HS256)</h3>
            <p className="mt-1 text-xs text-inksoft">
              ใส่ secret ที่ใช้เซ็น token นี้ — การตรวจเกิดขึ้นในเบราว์เซอร์ของคุณเท่านั้น secret ไม่ถูกส่งไปไหน
            </p>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <div className="min-w-56 flex-1">
                <Field label="Secret">
                  <Input
                    type="password"
                    value={secret}
                    onChange={(e) => {
                      setSecret(e.target.value)
                      setVerdict('idle')
                    }}
                    placeholder="your-256-bit-secret"
                    className="font-mono"
                  />
                </Field>
              </div>
              <button
                type="button"
                className="btn btn-rust mb-0.5"
                disabled={!secret || parsed.alg !== 'HS256' || verdict === 'checking'}
                onClick={() => void check()}
              >
                ตรวจลายเซ็น
              </button>
            </div>
            {parsed.alg !== 'HS256' && (
              <p className="mt-3 text-xs text-inksoft">
                ตรวจได้เฉพาะ token ที่ใช้ HS256 (ตัวนี้ใช้ {parsed.alg || 'ไม่ทราบ'})
              </p>
            )}
            {verdict === 'valid' && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-olive/40 bg-olive/10 px-4 py-2 text-xs font-medium text-olive">
                <Check className="h-4 w-4" /> ลายเซ็นถูกต้อง — token นี้เซ็นด้วย secret ข้างบนจริง
              </p>
            )}
            {verdict === 'invalid' && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2 text-xs font-medium text-rustdeep">
                <Copy className="h-4 w-4 rotate-90" /> ลายเซ็นไม่ตรง — secret ผิด หรือ token ถูกแก้
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
