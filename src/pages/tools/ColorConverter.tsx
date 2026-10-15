import { useMemo, useState } from 'react'
import { Field, Input } from '../../components/ui'
import { cn } from '../../lib/utils'

interface Rgb {
  r: number
  g: number
  b: number
}

function hexToRgb(hex: string): Rgb | null {
  let h = hex.trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function toHex2(n: number) {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
}

function rgbToHex({ r, g, b }: Rgb) {
  return `#${toHex2(r)}${toHex2(g)}${toHex2(b)}`.toUpperCase()
}

function rgbToHsl({ r, g, b }: Rgb) {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const l = (max + min) / 2
  let h = 0
  let s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === rr) h = ((gg - bb) / d) % 6
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function luminance({ r, g, b }: Rgb) {
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
}

function contrast(a: Rgb, b: Rgb) {
  const l1 = luminance(a)
  const l2 = luminance(b)
  const hi = Math.max(l1, l2)
  const lo = Math.min(l1, l2)
  return (hi + 0.05) / (lo + 0.05)
}

function mix(c: Rgb, target: Rgb, t: number): Rgb {
  return {
    r: c.r + (target.r - c.r) * t,
    g: c.g + (target.g - c.g) * t,
    b: c.b + (target.b - c.b) * t,
  }
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 }
const BLACK: Rgb = { r: 0, g: 0, b: 0 }

function contrastBadge(ratio: number) {
  if (ratio >= 7) return { label: 'AAA', className: 'bg-olive/15 text-olive border-olive/40' }
  if (ratio >= 4.5) return { label: 'AA', className: 'bg-gold/20 text-ink border-gold/50' }
  if (ratio >= 3) return { label: 'AA (ตัวใหญ่)', className: 'bg-gold/20 text-ink border-gold/50' }
  return { label: 'ไม่ผ่าน', className: 'bg-rust/10 text-rustdeep border-rust/40' }
}

export default function ColorConverter() {
  const [hex, setHex] = useState('#C24E2A')

  const rgb = useMemo(() => hexToRgb(hex), [hex])

  const shades = useMemo(() => {
    if (!rgb) return []
    const out: Array<{ hex: string; t: number }> = []
    for (let i = -5; i <= 5; i++) {
      const t = i / 10
      const target = t < 0 ? BLACK : WHITE
      out.push({ hex: rgbToHex(mix(rgb, target, Math.abs(t))), t })
    }
    return out
  }, [rgb])

  const ratioWhite = rgb ? contrast(rgb, WHITE) : 0
  const ratioBlack = rgb ? contrast(rgb, BLACK) : 0
  const textOnColor = rgb && luminance(rgb) > 0.35 ? '#221B12' : '#FBF8F0'

  return (
    <div className="flex flex-col gap-5">
      <div className="card grid gap-6 p-5 md:grid-cols-[1fr_1.4fr] md:p-6">
        <div className="flex items-start gap-5">
          <input
            type="color"
            value={rgb ? rgbToHex(rgb) : '#000000'}
            onChange={(e) => setHex(e.target.value.toUpperCase())}
            className="h-20 w-20 cursor-pointer rounded-2xl border border-ink/15 bg-crema p-1.5"
            aria-label="เลือกสี"
          />
          <div className="flex-1">
            <Field label="โค้ดสี (HEX)">
              <Input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                placeholder="#C24E2A"
                className="font-mono uppercase"
              />
            </Field>
            {!rgb && <p className="mt-2 text-xs text-rustdeep">✗ รูปแบบไม่ถูกต้อง — ใช้ #RGB หรือ #RRGGBB</p>}
          </div>
        </div>

        <div
          className="flex min-h-32 flex-col justify-between rounded-3xl border border-ink/10 p-5"
          style={{ background: rgb ? rgbToHex(rgb) : '#EAE0CA' }}
        >
          <span className="font-display text-2xl" style={{ color: textOnColor }}>
            Aa — ตัวอย่างข้อความบนสีนี้
          </span>
          <span className="font-mono text-xs opacity-80" style={{ color: textOnColor }}>
            {rgb ? rgbToHex(rgb) : '—'}
          </span>
        </div>
      </div>

      {rgb && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card p-5">
              <h3 className="label">HEX</h3>
              <p className="mono-val">{rgbToHex(rgb)}</p>
            </div>
            <div className="card p-5">
              <h3 className="label">RGB</h3>
              <p className="mono-val">
                rgb({rgb.r}, {rgb.g}, {rgb.b})
              </p>
            </div>
            <div className="card p-5">
              <h3 className="label">HSL</h3>
              <p className="mono-val">
                hsl({rgbToHsl(rgb).h}, {rgbToHsl(rgb).s}%, {rgbToHsl(rgb).l}%)
              </p>
            </div>
          </div>

          <div className="card p-5 md:p-6">
            <h3 className="font-display text-xl">เฉดสี (คลิกเพื่อเลือกและคัดลอก)</h3>
            <div className="mt-4 grid grid-cols-11 gap-1.5">
              {shades.map((s) => (
                <button
                  key={`${s.t}-${s.hex}`}
                  type="button"
                  title={s.hex}
                  onClick={() => {
                    setHex(s.hex)
                    void navigator.clipboard.writeText(s.hex).catch(() => undefined)
                  }}
                  className="h-14 cursor-pointer rounded-xl border border-ink/10 transition hover:scale-105 hover:border-ink/40"
                  style={{ background: s.hex }}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-inksoft">
              <span>เข้มขึ้น (ผสมดำ)</span>
              <span>อ่อนลง (ผสมขาว)</span>
            </div>
          </div>

          <div className="card p-5 md:p-6">
            <h3 className="font-display text-xl">คอนทราสต์ตาม WCAG</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                { name: 'ข้อความสีขาวบนสีนี้', ratio: ratioWhite, bg: WHITE },
                { name: 'ข้อความสีดำบนสีนี้', ratio: ratioBlack, bg: BLACK },
              ].map((c) => {
                const badge = contrastBadge(c.ratio)
                return (
                  <div key={c.name} className="rounded-2xl border border-ink/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{c.name}</span>
                      <span className={cn('rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', badge.className)}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="font-mono text-2xl font-semibold">{c.ratio.toFixed(2)}:1</span>
                      <span
                        className="rounded-xl px-4 py-2 font-mono text-xs"
                        style={{ background: rgbToHex(rgb), color: rgbToHex(c.bg) }}
                      >
                        ตัวอย่าง
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
