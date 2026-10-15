import { useMemo, useState } from 'react'
import { CopyButton, Field, Input } from '../../components/ui'
import { analyzeCron } from '../../lib/cron'
import { cn } from '../../lib/utils'

const PRESETS = ['*/5 * * * *', '0 9 * * 1-5', '30 4 1,15 * *', '0 0 29 2 *', '0 0 * * 0']
const FIELD_LABELS = ['นาที', 'ชั่วโมง', 'วันของเดือน', 'เดือน', 'วันในสัปดาห์']

const dayFmt = new Intl.DateTimeFormat('th-TH', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
const timeFmt = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
const rtf = new Intl.RelativeTimeFormat('th', { numeric: 'auto' })

function formatRun(d: Date) {
  return `${dayFmt.format(d)} · ${timeFmt.format(d)} น.`
}

function relativeLabel(target: Date, now: Date) {
  const diff = target.getTime() - now.getTime()
  const abs = Math.abs(diff)
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
  ]
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'minute') return rtf.format(Math.round(diff / ms), unit)
  }
  return '—'
}

export default function CronParser() {
  const [expr, setExpr] = useState('*/5 * * * *')
  const [now, setNow] = useState(() => new Date())

  const result = useMemo(() => analyzeCron(expr, now, 5), [expr, now])
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const fields = useMemo(() => {
    const parts = expr.trim().split(/\s+/)
    return parts.length === 5 ? parts : null
  }, [expr])

  const leapNote =
    result.ok &&
    result.parsed.months.length === 1 &&
    result.parsed.months[0] === 2 &&
    result.parsed.daysOfMonth.includes(29)

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-4 p-5 md:p-6">
        <Field
          label="Cron expression (5 ฟิลด์)"
          hint={
            <>
              <span className="font-mono">*</span> = ทุกค่า · <span className="font-mono">*/n</span> = ทุก ๆ n ·{' '}
              <span className="font-mono">1-5</span> = ช่วง · <span className="font-mono">1,15</span> = หลายค่า
            </>
          }
        >
          <Input
            value={expr}
            onChange={(e) => setExpr(e.target.value)}
            placeholder="*/5 * * * *"
            className="font-mono"
            spellCheck={false}
          />
        </Field>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-inksoft">ตัวอย่าง:</span>
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setExpr(p)}
              className={cn(
                'cursor-pointer rounded-full border px-3 py-1 font-mono text-xs transition',
                expr.trim() === p
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/15 text-inksoft hover:border-ink hover:text-ink',
              )}
            >
              {p}
            </button>
          ))}
        </div>

        {!expr.trim() && (
          <p className="rounded-2xl border border-ink/10 bg-white/45 dark:bg-white/5 px-4 py-3 text-sm text-inksoft">
            รูปแบบคือ <span className="font-mono">นาที ชั่วโมง วันของเดือน เดือน วันในสัปดาห์</span> — ลำดับสำคัญที่สุด
            เช่น <span className="font-mono">30 4 * * *</span> คือตี 4 ครึ่ง (นาที 30 ของชั่วโมง 4) ส่วน{' '}
            <span className="font-mono">4 30 * * *</span> จะ error เพราะชั่วโมง 30 เกินช่วง 0–23
          </p>
        )}

        {!result.ok && expr.trim() !== '' && (
          <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 font-mono text-xs text-rustdeep">
            ✗ {result.error}
          </p>
        )}

        {result.ok && (
          <>
            <div className="rounded-2xl border border-ink/10 bg-white/45 dark:bg-white/5 px-4 py-3.5">
              <div className="text-[10px] font-semibold tracking-[0.16em] text-inksoft uppercase">ความหมาย</div>
              <p className="mt-1.5 font-display text-2xl leading-snug">{result.description}</p>
            </div>
            {fields && (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {fields.map((f, i) => (
                  <div key={i} className="rounded-2xl border border-ink/10 bg-white/45 dark:bg-white/5 px-3 py-2">
                    <div className="text-[10px] font-semibold tracking-[0.14em] text-inksoft uppercase">
                      {FIELD_LABELS[i]}
                    </div>
                    <div className="mt-0.5 font-mono text-sm break-all">{f}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {result.ok && (
        <div className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 px-5 py-3">
            <h3 className="font-display text-xl">เวลารันถัดไป 5 ครั้ง</h3>
            <button type="button" className="btn btn-ghost text-xs" onClick={() => setNow(new Date())}>
              อัปเดตเวลาปัจจุบัน
            </button>
          </div>
          {result.runs.length === 0 ? (
            <p className="px-5 py-6 text-sm text-inksoft">
              ไม่พบเวลารันใน 40 ปีข้างหน้า — นิพจน์นี้อาจอ้างวันที่ที่เป็นไปไม่ได้ (เช่น 31 กุมภาพันธ์)
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink/15 text-left text-[10px] tracking-[0.14em] text-inksoft uppercase">
                    <th className="px-5 py-2 font-semibold">#</th>
                    <th className="px-3 py-2 font-semibold">วันเวลา ({timeZone})</th>
                    <th className="px-3 py-2 font-semibold">อีก</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {result.runs.map((run, i) => (
                    <tr key={run.getTime()} className="border-b border-ink/5">
                      <td className="px-5 py-2.5 text-inksoft">{i + 1}</td>
                      <td className="px-3 py-2.5">{formatRun(run)}</td>
                      <td className="px-3 py-2.5 text-xs text-inksoft">{relativeLabel(run, now)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <CopyButton text={formatRun(run)} label="" className="border-transparent" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {result.runs.length < 5 && (
                <p className="px-5 py-3 text-xs text-inksoft">
                  พบเพียง {result.runs.length} ครั้งในช่วง 40 ปี — นิพจน์นี้เป็นวันที่ที่เกิดได้ยาก
                </p>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs leading-relaxed text-inksoft">
        คำนวณตามเขตเวลาเครื่องของคุณ ({timeZone}) — cron บนเซิร์ฟเวอร์มักตั้งเป็น UTC ก่อนนำไปใช้จริงควรเช็คเขตเวลา
        ของเซิร์ฟเวอร์ปลายทางด้วย และเมื่อกำหนดทั้งวันของเดือนและวันในสัปดาห์ ระบบจะรันเมื่อ “ตรงเงื่อนไขใดเงื่อนไขหนึ่ง”
        (กฎ OR ตามมาตรฐาน cron)
        {leapNote && ' · วันที่ 29 กุมภาพันธ์มีเฉพาะปีอธิกสุรทิน จึงรันห่างกันราว 4 ปี'}
      </p>
    </div>
  )
}
