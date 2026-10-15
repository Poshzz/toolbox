import { Link } from 'react-router-dom'
import { Github, Search } from 'lucide-react'
import { SITE } from '../data/site'

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/85 backdrop-blur-md">
      <div className="wrap flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-baseline gap-2.5">
          <span className="font-display text-2xl font-semibold tracking-tight">
            Toolbox<span className="text-rust">.</span>
          </span>
          <span className="hidden text-xs text-inksoft sm:block">กล่องเครื่องมือออนไลน์</span>
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('open-search'))}
            className="btn btn-ghost gap-2 text-inksoft"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">ค้นหาเครื่องมือ</span>
            <kbd className="hidden rounded-md border border-ink/15 bg-paper2 px-1.5 py-0.5 font-mono text-[10px] md:inline">
              Ctrl K
            </kbd>
          </button>
          <a href={SITE.repo} target="_blank" rel="noreferrer" className="btn btn-primary gap-2">
            <Github className="h-4 w-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  )
}
