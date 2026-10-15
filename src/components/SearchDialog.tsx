import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CornerDownLeft, Search } from 'lucide-react'
import { CHAPTERS, TOOLS } from '../data/tools'
import { cn } from '../lib/utils'

export default function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    const onOpen = () => setOpen(true)
    window.addEventListener('keydown', onKey)
    window.addEventListener('open-search', onOpen)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('open-search', onOpen)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setQ('')
      setActive(0)
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return TOOLS
    return TOOLS.filter((t) =>
      `${t.name} ${t.th} ${t.desc} ${t.keywords}`.toLowerCase().includes(term),
    )
  }, [q])

  useEffect(() => {
    setActive(0)
  }, [q])

  useEffect(() => {
    if (!open) return
    itemRefs.current[active]?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  if (!open) return null

  const go = (id: string) => {
    setOpen(false)
    navigate(`/tool/${id}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-[12vh] backdrop-blur-sm dark:bg-black/65"
      onClick={() => setOpen(false)}
    >
      <div
        className="card w-full max-w-xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-ink/10 px-5 py-4">
          <Search className="h-4 w-4 shrink-0 text-inksoft" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter' && results[active]) {
                go(results[active].id)
              }
            }}
            placeholder="ค้นหาเครื่องมือ… เช่น นับคำ, QR, สี"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-inksoft/60"
          />
          <kbd className="rounded-md border border-ink/15 bg-paper2 px-1.5 py-0.5 font-mono text-[10px] text-inksoft">
            Esc
          </kbd>
        </div>

        <div className="max-h-[46vh] overflow-y-auto p-2">
          {results.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-inksoft">
              ไม่พบเครื่องมือที่ตรงกับ “{q}” — ลองคำอื่นดูนะ
            </div>
          )}
          {results.map((t, i) => {
            const chapter = CHAPTERS.find((c) => c.id === t.chapter)!
            const Icon = t.icon
            return (
              <button
                key={t.id}
                ref={(el) => {
                  itemRefs.current[i] = el
                }}
                type="button"
                onClick={() => go(t.id)}
                onMouseEnter={() => setActive(i)}
                className={cn(
                  'flex w-full cursor-pointer items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left transition',
                  i === active ? 'bg-ink text-paper' : 'hover:bg-ink/5',
                )}
              >
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                    i === active ? 'border-paper/25' : 'border-ink/15',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {t.name}
                    <span
                      className={cn(
                        'ml-2 text-xs font-normal',
                        i === active ? 'text-paper/60' : 'text-inksoft',
                      )}
                    >
                      {t.th}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block truncate text-xs',
                      i === active ? 'text-paper/60' : 'text-inksoft/80',
                    )}
                  >
                    {t.desc}
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-[10px] tracking-widest uppercase',
                    i === active ? 'text-paper/60' : 'text-inksoft/70',
                  )}
                >
                  {chapter.en}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between border-t border-ink/10 px-5 py-3 text-[11px] text-inksoft">
          <span className="flex items-center gap-1.5">
            <CornerDownLeft className="h-3 w-3" /> Enter เพื่อเปิด
          </span>
          <span>↑ ↓ เลือก · Esc ปิด · Ctrl K เปิดได้ทุกหน้า</span>
        </div>
      </div>
    </div>
  )
}
