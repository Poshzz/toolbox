import { useMemo, useState } from 'react'
import { CheckRow, CopyButton, Textarea } from '../../components/ui'
import { download } from '../../lib/utils'

interface Opts {
  trim: boolean
  collapse: boolean
  removeEmpty: boolean
  dedupe: boolean
  sortAsc: boolean
  sortDesc: boolean
  reverse: boolean
  stripHtml: boolean
  stripAllSpaces: boolean
}

export default function TextCleaner() {
  const [text, setText] = useState('')
  const [o, setO] = useState<Opts>({
    trim: true,
    collapse: true,
    removeEmpty: false,
    dedupe: false,
    sortAsc: false,
    sortDesc: false,
    reverse: false,
    stripHtml: false,
    stripAllSpaces: false,
  })

  const set = (k: keyof Opts, v: boolean) =>
    setO((prev) => ({
      ...prev,
      [k]: v,
      ...(k === 'sortAsc' && v ? { sortDesc: false } : {}),
      ...(k === 'sortDesc' && v ? { sortAsc: false } : {}),
    }))

  const output = useMemo(() => {
    let out = text
    if (o.stripHtml) out = out.replace(/<[^>]*>/g, '')
    if (o.stripAllSpaces) out = out.replace(/\s+/g, '')
    if (o.collapse) out = out.replace(/[ \t]{2,}/g, ' ')
    let lines = out.split('\n')
    if (o.trim) lines = lines.map((l) => l.trim())
    if (o.removeEmpty) lines = lines.filter((l) => l.length > 0)
    if (o.dedupe) {
      const seen = new Set<string>()
      lines = lines.filter((l) => (seen.has(l) ? false : (seen.add(l), true)))
    }
    if (o.sortAsc) lines = [...lines].sort((a, b) => a.localeCompare(b, 'th'))
    if (o.sortDesc) lines = [...lines].sort((a, b) => b.localeCompare(a, 'th'))
    if (o.reverse) lines = [...lines].reverse()
    return lines.join('\n')
  }, [text, o])

  const before = text ? text.split('\n').length : 0
  const after = output ? output.split('\n').length : 0
  const removedChars = Array.from(text).length - Array.from(output).length

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <h3 className="label">ตัวเลือกการจัดระเบียบ</h3>
        <div className="mt-1 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <CheckRow checked={o.trim} onChange={(v) => set('trim', v)} label="ตัดช่องว่างหัวท้ายบรรทัด" />
          <CheckRow checked={o.collapse} onChange={(v) => set('collapse', v)} label="รวมช่องว่างซ้ำให้เหลือ 1" />
          <CheckRow checked={o.stripAllSpaces} onChange={(v) => set('stripAllSpaces', v)} label="ลบช่องว่างทั้งหมด" />
          <CheckRow checked={o.removeEmpty} onChange={(v) => set('removeEmpty', v)} label="ลบบรรทัดว่าง" />
          <CheckRow checked={o.dedupe} onChange={(v) => set('dedupe', v)} label="ลบบรรทัดซ้ำ (เก็บบรรทัดแรก)" />
          <CheckRow checked={o.stripHtml} onChange={(v) => set('stripHtml', v)} label="ลบแท็ก HTML" />
          <CheckRow checked={o.sortAsc} onChange={(v) => set('sortAsc', v)} label="เรียงบรรทัด ก→ฮ / A→Z" />
          <CheckRow checked={o.sortDesc} onChange={(v) => set('sortDesc', v)} label="เรียงบรรทัด ฮ→ก / Z→A" />
          <CheckRow checked={o.reverse} onChange={(v) => set('reverse', v)} label="กลับลำดับบรรทัด" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h3 className="label">ข้อความต้นฉบับ</h3>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={'วางข้อความที่ต้องการจัดระเบียบ…\nเช่น รายการที่ยังมีบรรทัดซ้ำ'}
            className="min-h-64"
          />
        </div>
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="label mb-0">
              ผลลัพธ์{' '}
              {before > 0 && (
                <span className="ml-2 font-mono text-[11px] font-normal normal-case">
                  {before} → {after} บรรทัด
                  {removedChars > 0 && ` · ลด ${removedChars} ตัวอักษร`}
                </span>
              )}
            </h3>
            <span className="flex shrink-0 gap-1">
              <CopyButton text={output} />
              <button
                type="button"
                disabled={!output}
                onClick={() => download(output, 'cleaned.txt')}
                className="btn btn-ghost text-xs"
              >
                ดาวน์โหลด .txt
              </button>
            </span>
          </div>
          <Textarea value={output} readOnly className="mt-1.5 min-h-64" placeholder="ผลลัพธ์จะขึ้นที่นี่" />
        </div>
      </div>
    </div>
  )
}
