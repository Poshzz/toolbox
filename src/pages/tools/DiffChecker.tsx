import { useMemo, useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { CheckRow, Textarea } from '../../components/ui'
import { diffLines } from '../../lib/diff'
import { cn } from '../../lib/utils'

const MAX_ROWS = 2000

export default function DiffChecker() {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [ignoreWs, setIgnoreWs] = useState(false)

  const rows = useMemo(() => (a || b ? diffLines(a, b, ignoreWs) : []), [a, b, ignoreWs])

  const added = rows.filter((r) => r.type === 'add').length
  const removed = rows.filter((r) => r.type === 'del').length
  const shown = rows.slice(0, MAX_ROWS)

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-center gap-4 p-5 md:p-6">
        <CheckRow checked={ignoreWs} onChange={setIgnoreWs} label="มองข้ามช่องว่างหัวท้ายบรรทัด" />
        <button
          type="button"
          className="btn ml-auto"
          onClick={() => {
            setA(b)
            setB(a)
          }}
        >
          <ArrowLeftRight className="h-4 w-4" /> สลับฝั่ง
        </button>
        {rows.length > 0 && (
          <div className="flex gap-2">
            <span className="chip border-olive/40 bg-olive/10 text-olive">+{added} เพิ่ม</span>
            <span className="chip border-rust/40 bg-rust/10 text-rustdeep">−{removed} ลบ</span>
          </div>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h3 className="label">ข้อความ A (ต้นฉบับ)</h3>
          <Textarea value={a} onChange={(e) => setA(e.target.value)} placeholder="วางข้อความชุดแรก…" className="min-h-52" />
        </div>
        <div className="card p-5 md:p-6">
          <h3 className="label">ข้อความ B (ที่แก้ไข)</h3>
          <Textarea value={b} onChange={(e) => setB(e.target.value)} placeholder="วางข้อความชุดที่สอง…" className="min-h-52" />
        </div>
      </div>

      {rows.length > 0 && (
        <div className="card overflow-hidden">
          <div className="border-b border-ink/10 px-5 py-3">
            <h3 className="font-display text-xl">ผลการเทียบ</h3>
          </div>
          <div className="max-h-[32rem] overflow-auto">
            <table className="w-full border-collapse font-mono text-xs">
              <tbody>
                {shown.map((r, i) => (
                  <tr
                    key={i}
                    className={cn(
                      r.type === 'add' && 'bg-olive/10',
                      r.type === 'del' && 'bg-rust/10',
                    )}
                  >
                    <td
                      className={cn(
                        'w-8 border-r border-ink/5 py-0.5 pr-2 text-right align-top text-[10px] select-none',
                        r.type === 'add' ? 'text-olive' : r.type === 'del' ? 'text-rustdeep' : 'text-inksoft/50',
                      )}
                    >
                      {r.type === 'add' ? '+' : r.type === 'del' ? '−' : ' '}
                    </td>
                    <td className="w-full px-3 py-0.5 whitespace-pre-wrap">{r.text || ' '}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > MAX_ROWS && (
            <p className="border-t border-ink/10 px-5 py-2 text-xs text-inksoft">
              แสดง {MAX_ROWS.toLocaleString()} บรรทัดแรกจากทั้งหมด {rows.length.toLocaleString()} บรรทัด
            </p>
          )}
        </div>
      )}
    </div>
  )
}
