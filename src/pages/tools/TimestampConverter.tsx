import { useEffect, useState } from 'react'
import { CopyField, Field, Input, Stat } from '../../components/ui'

const rtf = new Intl.RelativeTimeFormat('th', { numeric: 'auto' })

function relativeLabel(target: Date, now: Date) {
  const diff = target.getTime() - now.getTime()
  const abs = Math.abs(diff)
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31_536_000_000],
    ['month', 2_592_000_000],
    ['day', 86_400_000],
    ['hour', 3_600_000],
    ['minute', 60_000],
    ['second', 1000],
  ]
  for (const [unit, ms] of units) {
    if (abs >= ms || unit === 'second') return rtf.format(Math.round(diff / ms), unit)
  }
  return '—'
}

function parseInput(raw: string): Date | null {
  const s = raw.trim()
  if (!s) return null
  if (/^-?\d+$/.test(s)) {
    const n = Number(s)
    const ms = s.replace('-', '').length >= 12 ? n : n * 1000
    const d = new Date(ms)
    return Number.isNaN(d.getTime()) ? null : d
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

export default function TimestampConverter() {
  const [now, setNow] = useState(() => new Date())
  const [input, setInput] = useState('')

  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(t)
  }, [])

  const dt = parseInput(input)

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">ตอนนี้</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Unix (วินาที)" value={Math.floor(now.getTime() / 1000).toLocaleString()} mono />
          <Stat label="Unix (มิลลิวินาที)" value={now.getTime().toLocaleString()} mono />
          <Stat
            label="เวลาไทย"
            value={now.toLocaleTimeString('th-TH', { hour12: false, timeZone: 'Asia/Bangkok' })}
            mono
          />
          <Stat label="เขตเวลาเครื่อง" value={Intl.DateTimeFormat().resolvedOptions().timeZone} mono />
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <Field
          label="แปลงค่า"
          hint='พิมพ์ Unix timestamp (วินาทีหรือมิลลิวินาที) หรือวันที่ เช่น "2026-10-15 09:30" หรือ "Oct 15 2026"'
        >
          <div className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="1770000000 หรือ 2026-10-15T09:30:00"
              className="font-mono"
            />
            <button
              type="button"
              className="btn shrink-0"
              onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}
            >
              ใส่เวลาปัจจุบัน
            </button>
          </div>
        </Field>

        {input.trim() && !dt && (
          <p className="mt-4 rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
            ✗ อ่านค่านี้ไม่ได้ ลองรูปแบบอื่นดู
          </p>
        )}

        {dt && (
          <div className="mt-5 grid gap-3">
            <CopyField value={String(Math.floor(dt.getTime() / 1000))} />
            <CopyField value={String(dt.getTime())} />
            <CopyField value={dt.toISOString()} />
            <CopyField
              value={dt.toLocaleString('th-TH', {
                dateStyle: 'full',
                timeStyle: 'long',
                timeZone: 'Asia/Bangkok',
              })}
            />
            <CopyField value={relativeLabel(dt, now)} />
            <div className="flex flex-wrap gap-x-8 gap-y-1 pt-1 text-xs text-inksoft">
              <span>บรรทัดที่ 1–2: Unix วินาที / มิลลิวินาที</span>
              <span>บรรทัดที่ 3: ISO 8601 (UTC)</span>
              <span>บรรทัดที่ 4: วันที่แบบไทย</span>
              <span>บรรทัดที่ 5: เทียบกับตอนนี้</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
