import { useMemo, useState } from 'react'
import { CopyField, Field, Input, Segmented } from '../../components/ui'

type Base = '2' | '8' | '10' | '16'

const LABELS: Record<Base, string> = {
  '2': 'ไบนารี (Base 2)',
  '8': 'อ็อกทัล (Base 8)',
  '10': 'ทศนิยม (Base 10)',
  '16': 'เฮกซะเดซิมัล (Base 16)',
}

const PATTERNS: Record<Base, RegExp> = {
  '2': /^[01]+$/,
  '8': /^[0-7]+$/,
  '10': /^\d+$/,
  '16': /^[0-9a-fA-F]+$/,
}

function parse(value: string, base: Base): bigint {
  let s = value.trim().replace(/[\s_]/g, '')
  if (!s) throw new Error('empty')
  const negative = s.startsWith('-')
  if (negative) s = s.slice(1)
  if (!s || !PATTERNS[base].test(s)) throw new Error(`ตัวอักษรไม่ตรงกับฐาน ${base}`)
  const prefix = base === '2' ? '0b' : base === '8' ? '0o' : base === '16' ? '0x' : ''
  const n = BigInt(prefix + s)
  return negative ? -n : n
}

export default function BaseConverter() {
  const [value, setValue] = useState('')
  const [base, setBase] = useState<Base>('10')

  const parsed = useMemo(() => {
    if (!value.trim()) return { ok: true as const, n: null }
    try {
      return { ok: true as const, n: parse(value, base) }
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : 'ค่าไม่ถูกต้อง' }
    }
  }, [value, base])

  const converted = useMemo(() => {
    if (!parsed.ok || parsed.n === null) return null
    const n = parsed.n
    return {
      '2': n.toString(2),
      '8': n.toString(8),
      '10': n.toString(10),
      '16': n.toString(16),
    } as Record<Base, string>
  }, [parsed])

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-end gap-5">
          <div className="min-w-52 flex-1">
            <Field label="ค่าที่ต้องการแปลง" hint="รองรับตัวเลขขนาดใหญ่ (BigInt) — เว้นวรรคหรือ _ คั่นได้">
              <Input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={base === '16' ? 'เช่น DEADBEEF' : 'เช่น 255'}
                className="font-mono"
              />
            </Field>
          </div>
          <div>
            <span className="label">ฐานของค่าด้านบน</span>
            <Segmented
              options={(
                [
                  ['2', 'Bin'],
                  ['8', 'Oct'],
                  ['10', 'Dec'],
                  ['16', 'Hex'],
                ] as Array<[Base, string]>
              ).map(([v, l]) => ({ value: v, label: l }))}
              value={base}
              onChange={setBase}
            />
          </div>
        </div>
        {!parsed.ok && (
          <p className="mt-4 rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 font-mono text-xs text-rustdeep">
            ✗ {parsed.message}
          </p>
        )}
        {parsed.ok && parsed.n !== null && parsed.n < 0n && (
          <p className="mt-4 text-xs text-inksoft">ตัวเลขติดลบจะไม่รองรับไบนารีแบบ signed — ใช้ two's complement ในโค้ดของคุณแทน</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(LABELS) as Base[]).map((b) => (
          <div key={b} className="card p-5">
            <h3 className="label">{LABELS[b]}</h3>
            <CopyField value={converted ? converted[b] : ''} />
          </div>
        ))}
      </div>
    </div>
  )
}
