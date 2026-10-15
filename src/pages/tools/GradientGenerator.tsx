import { useState } from 'react'
import { Plus, Shuffle, Trash2 } from 'lucide-react'
import { CopyField, Field, Input, Segmented } from '../../components/ui'
import {
  buildGradientCss,
  gradientFunction,
  randomGradient,
  type GradientStop,
  type GradientType,
} from '../../lib/gradient'
import { hslToRgb, normalizeHex, rgbToHex } from '../../lib/palette'

const DEFAULT_STOPS: GradientStop[] = [
  { hex: '#C24E2A', pos: 0 },
  { hex: '#C89B54', pos: 50 },
  { hex: '#65724B', pos: 100 },
]

export default function GradientGenerator() {
  const [type, setType] = useState<GradientType>('linear')
  const [angle, setAngle] = useState(135)
  const [stops, setStops] = useState<GradientStop[]>(DEFAULT_STOPS)

  const css = gradientFunction(type, angle, stops)

  const updateStop = (i: number, patch: Partial<GradientStop>) =>
    setStops((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s)))

  const addStop = () => {
    if (stops.length >= 4) return
    const a = stops[stops.length - 2]
    const b = stops[stops.length - 1]
    const hex = rgbToHex(hslToRgb({ h: Math.floor(Math.random() * 360), s: 70, l: 55 }))
    setStops((prev) => [...prev, { hex, pos: Math.round((a.pos + b.pos) / 2) }])
  }

  const removeStop = (i: number) => setStops((prev) => prev.filter((_, j) => j !== i))

  const randomize = () => {
    const g = randomGradient(Math.floor(Math.random() * 2 ** 31), stops.length)
    setType(g.type)
    setAngle(g.angle)
    setStops(g.stops)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-4 md:p-5">
        <div
          className="h-44 rounded-2xl border border-ink/10 md:h-64"
          style={{ background: css }}
          role="img"
          aria-label="ตัวอย่าง gradient"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card flex flex-col gap-5 p-5 md:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="label">รูปแบบ</span>
              <Segmented
                options={[
                  { value: 'linear', label: 'เชิงเส้น' },
                  { value: 'radial', label: 'วงกลม' },
                ]}
                value={type}
                onChange={setType}
              />
            </div>
            <button type="button" className="btn btn-primary" onClick={randomize}>
              <Shuffle className="h-4 w-4" /> สุ่มใหม่
            </button>
          </div>

          {type === 'linear' && (
            <Field label={`องศา — ${angle}°`}>
              <input
                type="range"
                min={0}
                max={360}
                value={angle}
                onChange={(e) => setAngle(Number(e.target.value))}
                className="w-full accent-rust"
                aria-label="มุมของ gradient"
              />
            </Field>
          )}

          <div>
            <div className="flex items-center justify-between">
              <span className="label mb-0">จุดสี ({stops.length}/4)</span>
              <button
                type="button"
                className="btn btn-ghost text-xs"
                disabled={stops.length >= 4}
                onClick={addStop}
              >
                <Plus className="h-3.5 w-3.5" /> เพิ่มสี
              </button>
            </div>
            <div className="mt-2 flex flex-col gap-2.5">
              {stops.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={normalizeHex(s.hex) ?? '#000000'}
                    onChange={(e) => updateStop(i, { hex: e.target.value.toUpperCase() })}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-xl border border-ink/15 bg-crema p-1"
                    aria-label={`สีจุดที่ ${i + 1}`}
                  />
                  <Input
                    value={s.hex}
                    onChange={(e) => updateStop(i, { hex: e.target.value })}
                    className="font-mono uppercase"
                    aria-label={`โค้ดสีจุดที่ ${i + 1}`}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={s.pos}
                    onChange={(e) => updateStop(i, { pos: Number(e.target.value) || 0 })}
                    className="w-20 shrink-0 font-mono"
                    aria-label={`ตำแหน่งจุดที่ ${i + 1} (เปอร์เซ็นต์)`}
                  />
                  <span className="text-xs text-inksoft">%</span>
                  <button
                    type="button"
                    className="btn btn-ghost shrink-0 px-2.5"
                    disabled={stops.length <= 2}
                    onClick={() => removeStop(i)}
                    aria-label={`ลบจุดสีที่ ${i + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card flex flex-col gap-4 p-5 md:p-6">
          <h3 className="font-display text-xl">โค้ด CSS</h3>
          <CopyField value={buildGradientCss(type, angle, stops)} />
          <p className="text-xs text-inksoft">
            ก๊อปไปวางใน CSS หรือ inline style ได้เลย — จุดสีถูกเรียงและค่าเปอร์เซ็นต์ถูกจัดให้อยู่ในช่วง 0–100 ให้แล้ว
          </p>
        </div>
      </div>
    </div>
  )
}
