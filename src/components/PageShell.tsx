import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { chapterById, chapterTools, type ToolMeta } from '../data/tools'

export default function PageShell({ tool, children }: { tool: ToolMeta; children: ReactNode }) {
  const chapter = chapterById(tool.chapter)
  const list = chapterTools(tool.chapter)
  const idx = list.findIndex((t) => t.id === tool.id)
  const prev = idx > 0 ? list[idx - 1] : undefined
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : undefined
  const Icon = tool.icon

  return (
    <div className="wrap py-10 md:py-14">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-inksoft">
        <Link to="/" className="transition hover:text-ink">
          หน้าหลัก
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span>
          บทที่ {chapter.no} · {chapter.en}
        </span>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-ink">{tool.name}</span>
      </nav>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-ink/15 bg-crema">
              <Icon className="h-5 w-5" />
            </span>
            <span className="overline">
              Chapter {chapter.no} — {chapter.en}
            </span>
          </div>
          <h1 className="mt-4 font-display text-4xl tracking-tight md:text-5xl">{tool.name}</h1>
          <p className="mt-2 text-lg text-inksoft">{tool.th}</p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-inksoft">{tool.desc}</p>
        </div>
        <div className="chip shrink-0">ทำงานในเบราว์เซอร์ 100% — ข้อมูลไม่ออกจากเครื่อง</div>
      </div>

      <div className="mt-8">{children}</div>

      <nav className="mt-12 flex flex-col gap-3 border-t border-ink/10 pt-6 sm:flex-row sm:justify-between">
        {prev ? (
          <Link
            to={`/tool/${prev.id}`}
            className="group card flex flex-1 items-center gap-4 p-4 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
          >
            <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span className="min-w-0">
              <span className="block text-[10px] tracking-[0.16em] text-inksoft uppercase group-hover:text-paper/60">
                ก่อนหน้า
              </span>
              <span className="block truncate font-display text-base">{prev.name}</span>
            </span>
          </Link>
        ) : (
          <span className="hidden flex-1 sm:block" />
        )}
        {next && (
          <Link
            to={`/tool/${next.id}`}
            className="group card flex flex-1 items-center justify-end gap-4 p-4 text-right transition-colors hover:border-ink hover:bg-ink hover:text-paper"
          >
            <span className="min-w-0">
              <span className="block text-[10px] tracking-[0.16em] text-inksoft uppercase group-hover:text-paper/60">
                ถัดไป
              </span>
              <span className="block truncate font-display text-base">{next.name}</span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </nav>
    </div>
  )
}
