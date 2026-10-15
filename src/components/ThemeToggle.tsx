import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import {
  applyTheme,
  nextTheme,
  readStoredTheme,
  resolveInitialTheme,
  THEME_COLORS,
  writeStoredTheme,
  type Theme,
} from '../lib/theme'

function systemDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

function syncMeta(theme: Theme) {
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[theme])
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() =>
    resolveInitialTheme(readStoredTheme(), systemDark()),
  )

  // ใช้กับ <html> + meta ทุกครั้งที่ธีมเปลี่ยน
  useEffect(() => {
    applyTheme(theme)
    syncMeta(theme)
  }, [theme])

  // ตามระบบต่อไปจนกว่าผู้ใช้จะกดเลือกเอง (มีค่าใน localStorage แล้ว = หยุดตาม)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e: MediaQueryListEvent) => {
      if (readStoredTheme() === null) setTheme(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const dark = theme === 'dark'

  const toggle = () => {
    const next = nextTheme(theme)
    writeStoredTheme(next)
    setTheme(next)
  }

  return (
    <button
      type="button"
      data-theme-toggle
      onClick={toggle}
      className="btn btn-ghost px-3 text-inksoft"
      aria-label={dark ? 'โหมดมืดอยู่ — สลับเป็นโหมดสว่าง' : 'โหมดสว่างอยู่ — สลับเป็นโหมดมืด'}
      title={dark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  )
}
