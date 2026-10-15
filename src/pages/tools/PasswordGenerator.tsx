import { useCallback, useEffect, useState } from 'react'
import { CheckRow, CopyField } from '../../components/ui'
import { cn } from '../../lib/utils'

function randInt(max: number) {
  const arr = new Uint32Array(1)
  const limit = Math.floor(4294967296 / max) * max
  let x = 0
  do {
    crypto.getRandomValues(arr)
    x = arr[0]
  } while (x >= limit)
  return x % max
}

const SETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/',
} as const

const AMBIGUOUS = new Set(['0', 'O', 'o', '1', 'l', 'I', '|'])

type SetKey = keyof typeof SETS

export default function PasswordGenerator() {
  const [length, setLength] = useState(20)
  const [opts, setOpts] = useState<Record<SetKey, boolean>>({
    lower: true,
    upper: true,
    digits: true,
    symbols: true,
  })
  const [excludeAmbiguous, setExcludeAmbiguous] = useState(false)
  const [password, setPassword] = useState('')

  const generate = useCallback(() => {
    const pools = (Object.keys(SETS) as SetKey[])
      .filter((k) => opts[k])
      .map((k) => SETS[k].split('').filter((c) => !excludeAmbiguous || !AMBIGUOUS.has(c)))
      .filter((p) => p.length > 0)

    if (pools.length === 0) {
      setPassword('')
      return
    }

    const chars: string[] = []
    for (const pool of pools) chars.push(pool[randInt(pool.length)])

    const all = pools.flat()
    while (chars.length < length) chars.push(all[randInt(all.length)])

    for (let i = chars.length - 1; i > 0; i--) {
      const j = randInt(i + 1)
      ;[chars[i], chars[j]] = [chars[j], chars[i]]
    }
    setPassword(chars.slice(0, length).join(''))
  }, [length, opts, excludeAmbiguous])

  useEffect(() => {
    generate()
  }, [generate])

  const poolSize = (Object.keys(SETS) as SetKey[])
    .filter((k) => opts[k])
    .reduce((sum, k) => sum + SETS[k].split('').filter((c) => !excludeAmbiguous || !AMBIGUOUS.has(c)).length, 0)
  const entropy = password ? Math.round(length * Math.log2(Math.max(poolSize, 2))) : 0
  const strength =
    entropy >= 100
      ? { label: 'แข็งแรงมาก', color: 'bg-olive' }
      : entropy >= 70
        ? { label: 'แข็งแรง', color: 'bg-olive/70' }
        : entropy >= 40
          ? { label: 'ปานกลาง', color: 'bg-gold' }
          : { label: 'อ่อน', color: 'bg-rust' }

  const selectNone = !opts.lower && !opts.upper && !opts.digits && !opts.symbols

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="label mb-0">รหัสผ่านของคุณ</h3>
          <button type="button" className="btn btn-rust" onClick={generate}>
            สุ่มใหม่ ↻
          </button>
        </div>
        <div className="mt-2">
          <CopyField value={password} />
        </div>

        {selectNone ? (
          <p className="mt-4 rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
            ✗ เลือกอย่างน้อยหนึ่งรูปแบบตัวอักษรก่อนนะ
          </p>
        ) : (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-inksoft">
              <span>
                ความแข็งแรง: <span className="font-semibold text-ink">{strength.label}</span> (~{entropy} bits)
              </span>
              <span>{length} ตัวอักษร</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-paper2">
              <div
                className={cn('h-full rounded-full transition-all duration-500', strength.color)}
                style={{ width: `${Math.min(100, (entropy / 128) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="label">ตัวเลือก</h3>
        <div className="mt-1 grid gap-5">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span>ความยาว</span>
              <span className="font-mono font-semibold">{length}</span>
            </div>
            <input
              type="range"
              min={4}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="mt-2 w-full cursor-pointer accent-rust"
            />
            <div className="flex justify-between font-mono text-[10px] text-inksoft">
              <span>4</span>
              <span>64</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <CheckRow checked={opts.lower} onChange={(v) => setOpts((o) => ({ ...o, lower: v }))} label="ตัวพิมพ์เล็ก a-z" />
            <CheckRow checked={opts.upper} onChange={(v) => setOpts((o) => ({ ...o, upper: v }))} label="ตัวพิมพ์ใหญ่ A-Z" />
            <CheckRow checked={opts.digits} onChange={(v) => setOpts((o) => ({ ...o, digits: v }))} label="ตัวเลข 0-9" />
            <CheckRow checked={opts.symbols} onChange={(v) => setOpts((o) => ({ ...o, symbols: v }))} label="สัญลักษณ์ !@#$%" />
            <CheckRow
              checked={excludeAmbiguous}
              onChange={setExcludeAmbiguous}
              label="ตัดตัวอักษรที่อ่านยาก (0O 1lI)"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
