import { useNavigate } from 'react-router-dom'
import { CHAPTERS } from '../data/tools'
import { SITE } from '../data/site'
import { scrollToId } from '../lib/utils'

export default function Footer() {
  const navigate = useNavigate()

  const goChapter = (id: string) => {
    navigate('/')
    window.setTimeout(() => scrollToId(`chapter-${id}`), 90)
  }

  return (
    <footer className="mt-8 overflow-hidden border-t border-ink/10 bg-ink text-paper">
      <div className="wrap pt-12 pb-6">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="font-display text-2xl font-semibold">
              Toolbox<span className="text-rust">.</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-paper/70">
              {SITE.tagline} — เครื่องมือทั้งหมดทำงานฝั่ง client ข้อมูลของคุณไม่ออกจากเครื่องแม้แต่ไบต์เดียว
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-2.5 text-sm sm:grid-cols-3">
            {CHAPTERS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => goChapter(c.id)}
                className="cursor-pointer text-left text-paper/70 transition hover:text-paper"
              >
                {c.no} · {c.th}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-1.5 border-t border-paper/15 pt-6 text-xs text-paper/50">
          <p>
            © {SITE.year} {SITE.name} — ฟรีสำหรับทุกการใช้งาน
          </p>
          <p>
            สไตล์ได้แรงบันดาลใจจาก “Coffee Cycle” โดย Delta Cafés (Bürocratik) · Built with Vite + React +
            Tailwind
          </p>
        </div>
      </div>
      <div
        aria-hidden
        className="pointer-events-none -mb-[3vw] flex justify-center font-display text-[17vw] leading-none font-semibold tracking-tight whitespace-nowrap text-paper/5 select-none"
      >
        TOOLBOX · TOOLBOX
      </div>
    </footer>
  )
}
