import { useEffect, useState } from 'react'
import { CheckRow, Field, Input } from '../../components/ui'
import { download } from '../../lib/utils'

function uuidv4() {
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export default function UuidGenerator() {
  const [count, setCount] = useState(5)
  const [uppercase, setUppercase] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [list, setList] = useState<string[]>([])

  useEffect(() => {
    setList(Array.from({ length: count }, uuidv4))
  }, [count])

  const shown = list.map((u) => {
    let out = uppercase ? u.toUpperCase() : u
    if (!hyphens) out = out.replace(/-/g, '')
    return out
  })

  const all = shown.join('\n')

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-end gap-5 p-5 md:p-6">
        <Field label="จำนวน">
          <Input
            type="number"
            min={1}
            max={200}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(200, Number(e.target.value) || 1)))}
            className="w-28 font-mono"
          />
        </Field>
        <div className="flex flex-wrap gap-x-6 gap-y-2 pb-2.5">
          <CheckRow checked={uppercase} onChange={setUppercase} label="ตัวพิมพ์ใหญ่" />
          <CheckRow checked={hyphens} onChange={setHyphens} label="ใส่ขีด (-)" />
        </div>
        <div className="ml-auto flex gap-2 pb-0.5">
          <button type="button" className="btn" onClick={() => setList(Array.from({ length: count }, uuidv4))}>
            สุ่มใหม่ ↻
          </button>
          <button type="button" className="btn" disabled={!all} onClick={() => download(all, 'uuids.txt')}>
            ดาวน์โหลด .txt
          </button>
          <button
            type="button"
            className="btn btn-rust"
            disabled={!all}
            onClick={() => void navigator.clipboard.writeText(all).catch(() => undefined)}
          >
            คัดลอกทั้งหมด
          </button>
        </div>
      </div>

      <div className="card p-3 md:p-4">
        <ul className="divide-y divide-ink/5">
          {shown.map((u) => (
            <li key={u} className="group flex items-center gap-3 px-2 py-2.5">
              <span className="mono-val min-w-0 flex-1">{u}</span>
              <button
                type="button"
                onClick={() => void navigator.clipboard.writeText(u).catch(() => undefined)}
                className="btn btn-ghost px-3 py-1 text-[11px] opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              >
                คัดลอก
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs leading-relaxed text-inksoft">
        สร้างด้วย crypto.getRandomValues ตามมาตรฐาน UUID v4 (RFC 4122) — ปลอดภัยพอสำหรับใช้เป็น id
        จริงจังในระบบของคุณ
      </p>
    </div>
  )
}
