// CSS gradient string building + deterministic random generator.
// Pure functions only — no React.
import { hslToRgb, normalizeHex, rgbToHex } from './palette'

export type GradientType = 'linear' | 'radial'

export interface GradientStop {
  hex: string
  pos: number // 0–100 (%)
}

export interface GradientConfig {
  type: GradientType
  angle: number
  stops: GradientStop[]
}

export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}

export function sortStops(stops: GradientStop[]): GradientStop[] {
  return [...stops].sort((a, b) => a.pos - b.pos)
}

const clampPos = (pos: number) => Math.max(0, Math.min(100, Math.round(pos)))

export function gradientFunction(type: GradientType, angle: number, stops: GradientStop[]): string {
  const inner = sortStops(stops)
    .map((s) => `${normalizeHex(s.hex) ?? '#000000'} ${clampPos(s.pos)}%`)
    .join(', ')
  if (type === 'radial') return `radial-gradient(circle, ${inner})`
  return `linear-gradient(${Math.round(normalizeAngle(angle))}deg, ${inner})`
}

export function buildGradientCss(type: GradientType, angle: number, stops: GradientStop[]): string {
  return `background: ${gradientFunction(type, angle, stops)};`
}

// mulberry32 — small deterministic PRNG so a seed fully reproduces a gradient.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomGradient(seed: number, stopCount?: number): GradientConfig {
  const rng = mulberry32(seed)
  const type: GradientType = rng() < 0.75 ? 'linear' : 'radial'
  const angle = Math.floor(rng() * 360)
  const count = Math.max(2, Math.min(4, Math.floor(stopCount ?? 2 + Math.floor(rng() * 3))))

  // Middle positions: distinct integers in 1..98, endpoints pinned at 0 and 100.
  const used = new Set<number>([0, 100])
  const mids: number[] = []
  while (mids.length < count - 2) {
    let p = 1 + Math.floor(rng() * 98)
    while (used.has(p)) p = (p % 98) + 1
    used.add(p)
    mids.push(p)
  }
  const positions = [0, ...mids, 100].sort((a, b) => a - b)

  const stops = positions.map((pos) => {
    const h = Math.floor(rng() * 360)
    const s = 55 + Math.floor(rng() * 30) // 55–84
    const l = 38 + Math.floor(rng() * 30) // 38–67
    return { hex: rgbToHex(hslToRgb({ h, s, l })), pos }
  })

  return { type, angle, stops }
}
