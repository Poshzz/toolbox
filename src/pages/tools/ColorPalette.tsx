import { useMemo, useState } from 'react'
import { Lock, LockOpen, RefreshCw } from 'lucide-react'
import { CopyButton, Field, Input, Segmented } from '../../components/ui'
import { cn } from '../../lib/utils'
import {
  hexToRgb,
  normalizeHex,
  regeneratePalette,
  textOn,
  type Harmony,
} from '../../lib/palette'

const HARMONY_OPTIONS: Array<{ value: Harmony; label: string }> = [
  { value: 'analogous', label: 'คล้าย' },
  { value: 'complementary', label: 'ตรงข้าม' },
  { value: 'triadic', label: 'สามเหลี่ยม' },
  { value: 'tetradic', label: 'สี่เหลี่ยม' },
  { value: 'monochromatic', label: 'โมโนโครม' },
]

export default function ColorPalette() {
  const [hexInput, setHexInput] = useState('#C24E2A')
  const [base, setBase] = useState('#C24E2A') // last valid value drives the palette
  const [harmony, setHarmony] = useState<Harmony>('analogous')
  const [seed, setSeed] = useState(1)
  const [locked, setLocked] = useState<Array<string | null>>([null, null, null, null, null])

  const valid = normalizeHex(hexInput) !== null

  const palette = useMemo(
    () => regeneratePalette(base, harmony, seed, locked),
    [base, harmony, seed, locked],
  )

  const allLocked = locked.every(Boolean)

  const updateBase = (value: string) => {
    setHexInput(value)
    const norm = normalizeHex(value)
    if (norm) setBase(norm)
  }

  const toggleLock = (i: number) =>
    setLocked((prev) => prev.map((v, j) => (j === i ? (v ? null : palette[i]) : v)))

  return (
    <div className="flex flex-col gap-5">
      <div className="card grid gap-6 p-5 md:grid-cols-[1.2fr_1fr] md:p-6">
        <div className="flex items-start gap-4">
          <input
            type="color"
            value={base}
            onChange={(e) => updateBase(e.target.value.toUpperCase())}
            className="h-20 w-20 shrink-0 cursor-pointer rounded-2xl border border-ink/15 bg-crema p-1.5"
            aria-label="เลือกสีหลัก"
          />
          <div className="min-w-0 flex-1">
            <Field label="สีหลัก (HEX)" hint="พิมพ์โค้ดสีเองได้ เช่น #C24E2A">
              <Input
                value={hexInput}
                onChange={(e) => updateBase(e.target.value)}
                placeholder="#C24E2A"
                className="font-mono uppercase"
              />
            </Field>
            {!valid && (
              <p className="mt-2 text-xs text-rustdeep">✗ รูปแบบไม่ถูกต้อง — ใช้ #RGB หรือ #RRGGBB</p>
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div>
            <span className="label">โทนสี (Harmony)</span>
            <Segmented options={HARMONY_OPTIONS} value={harmony} onChange={setHarmony} />
          </div>
          <button
            type="button"
            className="btn btn-rust self-start"
            disabled={allLocked}
            onClick={() => setSeed((s) => s + 1)}
          >
            <RefreshCw className="h-4 w-4" /> สุ่มใหม่
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {palette.map((hex, i) => {
          const rgb = hexToRgb(hex)
          const isLocked = locked[i] !== null
          return (
            <div key={i} className={cn('card overflow-hidden', isLocked && 'ring-2 ring-gold')}>
              <div
                className="flex min-h-28 flex-col justify-between p-4"
                style={{ background: hex, color: textOn(hex) }}
              >
                <span className="font-mono text-sm font-semibold">{hex}</span>
                <span className="font-mono text-[11px] opacity-85">
                  {rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 px-2.5 py-2">
                <CopyButton text={hex} />
                <button
                  type="button"
                  onClick={() => toggleLock(i)}
                  aria-pressed={isLocked}
                  className={cn(
                    'btn btn-ghost text-xs',
                    isLocked && 'border-gold/60 bg-gold/15 text-ink',
                  )}
                >
                  {isLocked ? <Lock className="h-3.5 w-3.5" /> : <LockOpen className="h-3.5 w-3.5" />}
                  {isLocked ? 'ล็อกอยู่' : 'ล็อกสี'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-inksoft">
        ล็อกสีที่ชอบไว้ แล้วกด “สุ่มใหม่” — ระบบจะเปลี่ยนเฉพาะสีที่ยังไม่ถูกล็อก
      </p>
    </div>
  )
}
