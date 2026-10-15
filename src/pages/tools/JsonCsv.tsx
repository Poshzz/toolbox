import { useMemo, useState } from 'react'
import { CheckRow, CopyButton, Segmented, Textarea } from '../../components/ui'
import { csvToJson, jsonToCsv } from '../../lib/jsoncsv'

type Mode = 'json2csv' | 'csv2json'

export default function JsonCsv() {
  const [mode, setMode] = useState<Mode>('json2csv')
  const [bom, setBom] = useState(false)
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: '' }
    return mode === 'json2csv' ? jsonToCsv(input, { bom }) : csvToJson(input)
  }, [input, mode, bom])

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-center gap-4 p-5 md:p-6">
        <Segmented
          options={[
            { value: 'json2csv', label: 'JSON → CSV' },
            { value: 'csv2json', label: 'CSV → JSON' },
          ]}
          value={mode}
          onChange={setMode}
        />
        {mode === 'json2csv' && (
          <CheckRow checked={bom} onChange={setBom} label="เพิ่ม BOM สำหรับ Excel" />
        )}
        <button
          type="button"
          className="btn ml-auto"
          disabled={!result.ok || !result.value}
          onClick={() => {
            if (!result.ok || !result.value) return
            setInput(result.value)
            setMode((m) => (m === 'json2csv' ? 'csv2json' : 'json2csv'))
          }}
        >
          สลับ ↕ ใช้ผลลัพธ์เป็นอินพุต
        </button>
      </div>

      {!result.ok && (
        <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 font-mono text-xs text-rustdeep">
          ✗ {result.error}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h3 className="label">{mode === 'json2csv' ? 'JSON ต้นฉบับ' : 'CSV ต้นฉบับ'}</h3>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'json2csv'
                ? '[{"name": "สมชาย", "age": 30}, {"name": "Jane", "age": 25}]'
                : 'name,age\nสมชาย,30\nJane,25'
            }
            className="min-h-72"
          />
        </div>
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="label mb-0">ผลลัพธ์</h3>
            <CopyButton text={result.ok ? result.value : ''} />
          </div>
          <Textarea
            value={result.ok ? result.value : ''}
            readOnly
            placeholder="ผลลัพธ์จะแสดงทันทีที่พิมพ์"
            className="mt-1.5 min-h-72"
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-inksoft">
        JSON → CSV: ใช้ array ของ object — คีย์ถูกนำมารวมกันทุกแถวเรียงตามที่พบครั้งแรก ช่องที่ไม่มีค่าจะว่าง
        object/array ซ้อนถูกเก็บเป็น JSON string ในเซลล์เดียว และค่าที่มีจุลภาค เครื่องหมายคำพูด
        หรือขึ้นบรรทัดใหม่จะถูกครอบด้วย &quot; ตาม RFC 4180 · CSV → JSON: แถวแรกเป็นหัวตาราง
        ค่าทุกช่องถูกอ่านเป็นข้อความ (string) ทั้งหมด เพื่อไม่ให้เบอร์โทรหรือรหัสที่ขึ้นต้นด้วย 0 เพี้ยน ·
        ติ๊ก BOM เฉพาะเมื่อนำ CSV ไปเปิดใน Excel แล้วภาษาไทยเพี้ยน · ไฟล์ CSV จาก Excel ที่มี BOM
        สามารถวางได้เลย
      </p>
    </div>
  )
}
