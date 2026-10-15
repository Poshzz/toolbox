import { ArrowRight, Coffee, Github, Lock, Sparkles, Zap } from 'lucide-react'
import { CHAPTERS, TOOLS, chapterTools } from '../data/tools'
import { SITE } from '../data/site'
import { scrollToId } from '../lib/utils'
import ToolCard from '../components/ToolCard'
import { Reveal } from '../components/ui'

const STATS: Array<[string, string]> = [
  [String(TOOLS.length), 'เครื่องมือ'],
  [String(CHAPTERS.length), 'หมวด (บท)'],
  ['100%', 'รันในเบราว์เซอร์'],
  ['0฿', 'ฟรี ไม่ต้องสมัคร'],
]

export default function Home() {
  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="wrap pt-12 pb-12 md:pt-20 md:pb-16">
        <div className="grid items-start gap-12 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-fade-up">
            <p className="overline">Toolbox — กล่องเครื่องมือออนไลน์</p>
            <h1 className="mt-5 font-display text-5xl leading-[1.04] tracking-tight sm:text-6xl md:text-7xl">
              Everyday tools,
              <br />
              <span className="text-rust italic">ครบจบ</span>ในกล่องเดียว
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-inksoft">
              รวม {TOOLS.length} เครื่องมือใช้บ่อยสำหรับงานประจำวันและสาย dev — นับคำ แปลงหน่วย สร้าง QR
              เข้ารหัส คำนวณเงิน ย่อรูป ทุกอย่างทำงานในเบราว์เซอร์ของคุณ 100% ไม่มีการส่งข้อมูลออกไปไหน
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => scrollToId('chapters')}
                className="btn btn-rust px-6 py-2.5"
              >
                เริ่มเลือกเครื่องมือ <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new Event('open-search'))}
                className="btn px-5 py-2.5"
              >
                ค้นหาเครื่องมือ…
                <kbd className="rounded-md border border-ink/15 bg-paper2 px-1.5 py-0.5 font-mono text-[10px]">
                  Ctrl K
                </kbd>
              </button>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-10 gap-y-5 border-t border-ink/10 pt-6">
              {STATS.map(([v, k]) => (
                <div key={k}>
                  <div className="font-display text-3xl">{v}</div>
                  <div className="mt-0.5 text-[11px] tracking-[0.14em] text-inksoft uppercase">{k}</div>
                </div>
              ))}
            </div>
          </div>

          {/* receipt */}
          <div className="animate-fade-up relative" style={{ animationDelay: '140ms' }}>
            <div className="card relative p-6 md:p-7">
              <div className="flex items-center justify-between border-b border-dashed border-ink/20 pb-4">
                <span className="font-mono text-[11px] tracking-[0.2em] text-inksoft uppercase">
                  The Toolbox Receipt
                </span>
                <span className="font-mono text-[11px] text-inksoft">EST. 2026</span>
              </div>
              <ul className="font-mono text-[13px]">
                {CHAPTERS.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between border-b border-dashed border-ink/10 py-2.5"
                  >
                    <span>
                      {c.no} · {c.en.toUpperCase()}
                    </span>
                    <span className="text-inksoft">{chapterTools(c.id).length} รายการ</span>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-4 font-mono text-sm font-semibold">
                <span>TOTAL</span>
                <span>{TOOLS.length} TOOLS</span>
              </div>
              <div aria-hidden className="mt-5 flex h-9 items-end gap-[3px] opacity-70">
                {Array.from({ length: 46 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-[3px] bg-ink"
                    style={{ height: `${9 + ((i * 37) % 27)}px` }}
                  />
                ))}
              </div>
            </div>

            {/* rotating stamp */}
            <div className="absolute -top-5 -right-5 hidden h-28 w-28 sm:block">
              <div className="spin-slow relative h-full w-full rounded-full border border-ink/15 bg-paper2/90">
                <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full">
                  <defs>
                    <path
                      id="stamp-circ"
                      d="M 50,50 m -38,0 a 38,38 0 1,1 76,0 a 38,38 0 1,1 -76,0"
                    />
                  </defs>
                  <text
                    className="fill-inksoft font-mono text-[8.4px] uppercase"
                    style={{ letterSpacing: '0.22em' }}
                  >
                    <textPath href="#stamp-circ">
                      Brewed in the browser · Toolbox ·
                    </textPath>
                  </text>
                </svg>
                <Coffee className="absolute top-1/2 left-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 text-rust" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Marquee ---------- */}
      <section className="border-y border-ink/10 bg-ink py-3.5 text-paper">
        <div className="marquee">
          <div className="marquee-track">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center">
                {TOOLS.map((t) => (
                  <span
                    key={`${half}-${t.id}`}
                    className="flex items-center gap-4 px-4 font-mono text-[11px] tracking-[0.18em] uppercase"
                  >
                    {t.name}
                    <Sparkles className="h-3.5 w-3.5 text-gold" />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Chapters ---------- */}
      <section id="chapters" className="wrap scroll-mt-20 py-16 md:py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="overline">Chapters</p>
            <h2 className="mt-3 font-display text-4xl tracking-tight md:text-5xl">
              เลือกตามบทที่ต้องการ
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm text-inksoft md:block">
            ทุกเครื่องมือทำงานฝั่ง client ล้วน — เร็ว ปลอดภัย และไม่ต้องสมัครสมาชิก
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {CHAPTERS.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => scrollToId(`chapter-${c.id}`)}
              className="chip cursor-pointer transition hover:border-ink hover:text-ink"
            >
              {c.no} · {c.en} — {c.th}
            </button>
          ))}
        </div>

        <div className="mt-14 flex flex-col gap-16">
          {CHAPTERS.map((c) => {
            const tools = chapterTools(c.id)
            return (
              <Reveal key={c.id}>
                <section id={`chapter-${c.id}`} className="scroll-mt-24">
                  <div className="flex flex-col gap-4 border-b border-ink/15 pb-6 md:flex-row md:items-end md:justify-between">
                    <div className="flex items-start gap-5">
                      <span className="font-display text-6xl leading-none text-ink/15 md:text-7xl">
                        {c.no}
                      </span>
                      <div>
                        <h3 className="font-display text-3xl tracking-tight md:text-4xl">
                          {c.en} <span className="text-inksoft">— {c.th}</span>
                        </h3>
                        <p className="mt-1.5 text-sm text-inksoft">{c.desc}</p>
                      </div>
                    </div>
                    <span className="chip shrink-0">{tools.length} เครื่องมือ</span>
                  </div>
                  <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tools.map((t, i) => (
                      <ToolCard key={t.id} tool={t} index={i} />
                    ))}
                  </div>
                </section>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ---------- Why ---------- */}
      <section className="wrap pb-16 md:pb-20">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Zap,
              title: 'เร็วทันใจ',
              desc: 'ไม่มีเซิร์ฟเวอร์ ไม่มีคิว ทุกอย่างคำนวณในเบราว์เซอร์ของคุณทันทีที่พิมพ์',
            },
            {
              icon: Lock,
              title: 'ข้อมูลอยู่ในเครื่อง',
              desc: 'ข้อความและไฟล์ไม่ถูกอัปโหลด ปลอดภัยแม้เป็นข้อมูลอ่อนไหวในที่ทำงาน',
            },
            {
              icon: Github,
              title: 'โอเพนซอร์ส',
              desc: 'โค้ดเปิดบน GitHub — fork ไปเพิ่มเครื่องมือบทใหม่ของตัวเองได้เลย',
            },
          ].map((f) => (
            <Reveal key={f.title}>
              <div className="card h-full p-6">
                <f.icon className="h-5 w-5 text-rust" />
                <h4 className="mt-4 font-display text-xl">{f.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-inksoft">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- CTA ---------- */}
      <section className="wrap pb-20">
        <Reveal>
          <div className="card overflow-hidden bg-ink p-8 text-paper md:p-12">
            <p className="overline text-gold">Missing something?</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl tracking-tight md:text-4xl">
              อยากได้เครื่องมืออะไรเพิ่ม บอกได้เลย
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-paper/70">
              เปิด issue ไว้บน GitHub ได้เลย หรือจะ fork ไปเพิ่มเครื่องมือของตัวเองเป็นบทใหม่ก็ยินดี
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={SITE.repo}
                target="_blank"
                rel="noreferrer"
                className="btn border-paper/30 text-paper hover:bg-paper hover:text-ink"
              >
                <Github className="h-4 w-4" /> เปิด GitHub
              </a>
              <button
                type="button"
                onClick={() => scrollToId('chapters')}
                className="btn border-transparent text-paper/70 hover:text-paper"
              >
                กลับไปเลือกเครื่องมือ <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  )
}
