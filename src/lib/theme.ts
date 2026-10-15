/**
 * ธีมสว่าง/มืด — ฟังก์ชันบริสุทธิ์ ไม่มี React
 * เก็บเฉพาะ "ค่าที่ผู้ใช้เลือก" ไว้ใน localStorage คีย์เดียว (toolbox-theme)
 * ไม่ส่งข้อมูลใด ๆ ออกนอกเครื่อง · ถ้าอ่าน/เขียนไม่ได้ (private mode) จะ fallback ตามระบบ
 */

export type Theme = 'light' | 'dark'

export const THEME_KEY = 'toolbox-theme'

/** สีพื้นหน้าเว็บของแต่ละธีม — ใช้ sync <meta name="theme-color"> */
export const THEME_COLORS: Record<Theme, string> = {
  light: '#f4edde',
  dark: '#16100a',
}

type StorageReader = Pick<Storage, 'getItem'>
type StorageWriter = Pick<Storage, 'setItem'>

export function normalizeTheme(v: unknown): Theme | null {
  return v === 'light' || v === 'dark' ? v : null
}

/** ค่าที่เคยเลือก > ค่าตามระบบ */
export function resolveInitialTheme(stored: unknown, systemDark: boolean): Theme {
  return normalizeTheme(stored) ?? (systemDark ? 'dark' : 'light')
}

export function nextTheme(t: Theme): Theme {
  return t === 'dark' ? 'light' : 'dark'
}

export function readStoredTheme(storage?: StorageReader | null): Theme | null {
  try {
    const s = storage ?? globalThis.localStorage
    return normalizeTheme(s.getItem(THEME_KEY))
  } catch {
    return null
  }
}

export function writeStoredTheme(theme: Theme, storage?: StorageWriter | null): void {
  try {
    const s = storage ?? globalThis.localStorage
    s.setItem(THEME_KEY, theme)
  } catch {
    // localStorage ถูกปิด/เต็ม — ใช้ค่าชั่วคราวในหน่วยความจำแทนได้
  }
}

export interface ThemeRoot {
  classList: { toggle(token: string, force?: boolean): unknown }
}

export function applyTheme(theme: Theme, root?: ThemeRoot | null): void {
  const el = root ?? (typeof document !== 'undefined' ? document.documentElement : null)
  el?.classList.toggle('dark', theme === 'dark')
}
