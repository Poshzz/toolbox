import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { chapterById, type ToolMeta } from '../data/tools'

export default function ToolCard({ tool, index }: { tool: ToolMeta; index: number }) {
  const chapter = chapterById(tool.chapter)
  const Icon = tool.icon
  return (
    <Link
      to={`/tool/${tool.id}`}
      className="group card relative flex flex-col gap-4 p-5 transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-paper"
    >
      <div className="flex items-start justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 transition-colors group-hover:border-paper/30">
          <Icon className="h-5 w-5" />
        </span>
        <span className="font-mono text-xs text-inksoft transition-colors group-hover:text-paper/50">
          № {String(index + 1).padStart(2, '0')}
        </span>
      </div>
      <div className="flex-1">
        <h3 className="font-display text-xl leading-snug">{tool.name}</h3>
        <p className="mt-0.5 text-sm font-medium text-inksoft transition-colors group-hover:text-paper/80">
          {tool.th}
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-inksoft/90 transition-colors group-hover:text-paper/70">
          {tool.desc}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <span className="chip transition-colors group-hover:border-paper/25 group-hover:bg-paper/10 group-hover:text-paper/80">
          {chapter.no} · {chapter.en}
        </span>
        <ArrowUpRight className="h-5 w-5 text-inksoft transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-paper" />
      </div>
    </Link>
  )
}
