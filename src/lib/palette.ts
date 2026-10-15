// Colour maths + harmony palettes for the Color Palette tool.
// Pure functions only — no React.

export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  h: number
  s: number
  l: number
}

export function normalizeHex(input: string): string | null {
  let h = input.trim().replace(/^#/, '')
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null
  return `#${h.toUpperCase()}`
}

export function hexToRgb(hex: string): Rgb | null {
  const norm = normalizeHex(hex)
  if (!norm) return null
  const n = parseInt(norm.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgbToHex({ r, g, b }: Rgb): string {
  const to2 = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase()
}

export function normalizeHue(h: number): number {
  return ((h % 360) + 360) % 360
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
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
    h = normalizeHue(h * 60)
  }
  return { h, s: s * 100, l: l * 100 }
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const hh = normalizeHue(h)
  const ss = Math.max(0, Math.min(100, s)) / 100
  const ll = Math.max(0, Math.min(100, l)) / 100
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (hh < 60) {
    r = c
    g = x
  } else if (hh < 120) {
    r = x
    g = c
  } else if (hh < 180) {
    g = c
    b = x
  } else if (hh < 240) {
    g = x
    b = c
  } else if (hh < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

export type Harmony = 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'monochromatic'

// Hue offsets, saturation offsets and lightness offsets per swatch (5 swatches).
const HARMONY_SPECS: Record<Harmony, { hues: number[]; s: number[]; l: number[] }> = {
  analogous: { hues: [-30, -15, 0, 15, 30], s: [-6, 2, 0, 2, -6], l: [6, -4, 0, -6, 8] },
  complementary: { hues: [0, 0, 0, 180, 180], s: [0, 0, -10, 0, -12], l: [-20, 12, 24, -10, 16] },
  triadic: { hues: [0, 120, 240, 0, 120], s: [0, 4, -4, -14, -14], l: [0, -6, 8, 20, 22] },
  tetradic: { hues: [0, 90, 180, 270, 0], s: [0, 4, -4, 6, -18], l: [0, -8, 6, 10, 26] },
  monochromatic: { hues: [0, 0, 0, 0, 0], s: [6, 2, 0, -4, -8], l: [-24, -12, 2, 16, 28] },
}

export function harmonyHues(h: number, harmony: Harmony): number[] {
  return HARMONY_SPECS[harmony].hues.map((off) => normalizeHue(h + off))
}

// Deterministic jitter in [-1, 1) from (seed, slot) — pure, no RNG state.
function jitter(seed: number, slot: number): number {
  let x = (seed ^ Math.imul(slot + 1, 0x9e3779b9)) >>> 0
  x = Math.imul(x ^ (x >>> 15), 0x2c1b3c6d)
  x ^= x >>> 13
  return ((x >>> 0) / 4294967296) * 2 - 1
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n))

export function generatePalette(baseHex: string, harmony: Harmony, seed: number): string[] {
  const rgb = hexToRgb(baseHex)
  // Invalid base → rust fallback keeps the tool usable while typing.
  const base = rgb ? rgbToHsl(rgb) : { h: 14.21, s: 64.41, l: 46.27 }
  const spec = HARMONY_SPECS[harmony]
  return spec.hues.map((_, i) => {
    const h = normalizeHue(base.h + spec.hues[i])
    const s = clamp(base.s + spec.s[i] + 10 * jitter(seed, i * 2), 4, 96)
    const l = clamp(base.l + spec.l[i] + 4 * jitter(seed, i * 2 + 1), 4, 96)
    return rgbToHex(hslToRgb({ h, s, l }))
  })
}

export function regeneratePalette(
  baseHex: string,
  harmony: Harmony,
  seed: number,
  locked: Array<string | null>,
): string[] {
  const fresh = generatePalette(baseHex, harmony, seed)
  return fresh.map((hex, i) => locked[i] ?? hex)
}

// Readable label colour on a given background (WCAG-ish luminance threshold).
export function textOn(hex: string): '#221B12' | '#FBF8F0' {
  const rgb = hexToRgb(hex)
  if (!rgb) return '#221B12'
  const f = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  const lum = 0.2126 * f(rgb.r) + 0.7152 * f(rgb.g) + 0.0722 * f(rgb.b)
  return lum > 0.35 ? '#221B12' : '#FBF8F0'
}
