import { useMemo, useState } from 'react'
import { CheckRow, CopyButton, Segmented, Textarea } from '../../components/ui'
import { formatCode, minifyCode, type CodeLang } from '../../lib/codefmt'

type Mode = 'pretty' | 'minify'

const PLACEHOLDERS: Record<CodeLang, string> = {
  sql: 'select id, name from users where active = true order by id',
  xml: '<?xml version="1.0"?><note><to>สมชาย</to><message>สวัสดี</message></note>',
  css: 'h1, h2 { color: red; } @media (min-width: 600px) { .card { padding: 12px; } }',
}

export default function CodeFormatter() {
  const [lang, setLang] = useState<CodeLang>('sql')
  const [mode, setMode] = useState<Mode>('pretty')
  const [upper, setUpper] = useState(true)
  const [input, setInput] = useState('')

  const output = useMemo(() => {
    if (!input.trim()) return ''
    return mode === 'pretty'
      ? formatCode(lang, input, { uppercaseKeywords: upper })
      : minifyCode(lang, input)
  }, [input, lang, mode, upper])

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-center gap-4 p-5 md:p-6">
        <Segmented
          options={[
            { value: 'sql', label: 'SQL' },
            { value: 'xml', label: 'XML' },
            { value: 'css', label: 'CSS' },
          ]}
          value={lang}
          onChange={setLang}
        />
        <Segmented
          options={[
            { value: 'pretty', label: 'จัดสวย' },
            { value: 'minify', label: 'ย่อ' },
          ]}
          value={mode}
          onChange={setMode}
        />
        {lang === 'sql' && mode === 'pretty' && (
          <CheckRow checked={upper} onChange={setUpper} label="ตัวพิมพ์ใหญ่ keywords" />
        )}
        <button
          type="button"
          className="btn ml-auto"
          disabled={!output}
          onClick={() => {
            if (output) setInput(output)
          }}
        >
          ใช้ผลลัพธ์เป็นอินพุต ↕
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h3 className="label">โค้ดต้นฉบับ ({lang.toUpperCase()})</h3>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={PLACEHOLDERS[lang]}
            className="min-h-72"
          />
        </div>
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="label mb-0">ผลลัพธ์</h3>
            <CopyButton text={output} />
          </div>
          <Textarea
            value={output}
            readOnly
            placeholder="ผลลัพธ์จะแสดงทันทีที่พิมพ์"
            className="mt-1.5 min-h-72"
          />
        </div>
      </div>

      <p className="text-xs leading-relaxed text-inksoft">
        SQL: จัดบรรทัดหน้าคำสั่งหลัก (SELECT / FROM / WHERE / JOIN ฯลฯ) แบบ rule-based ไม่ได้ตรวจไวยากรณ์
        เต็มรูปแบบ — ถ้าตั้งชื่อคอลัมน์หรือตารางซ้ำกับคำสงวนอาจถูกพิมพ์ใหญ่หรือตัดบรรทัดผิด ·
        ตอนย่อ จะไม่ตัดช่องว่างรอบเครื่องหมาย - เพื่อไม่ให้ &quot;--&quot; กลายเป็น comment โดยไม่ตั้งใจ ·
        XML: จัดย่อหน้า 2 ช่องว่าง คงลำดับ attribute และคงข้อความไว้เหมือนเดิม (element ที่มีแต่ข้อความจะอยู่บรรทัดเดียว) ·
        CSS: selector ละบรรทัด property ย่อหน้าในวงเล็บ · minify ทุกภาษาเป็นแบบระวังตัว
        ไม่แตะเนื้อหาภายใน string และ comment
      </p>
    </div>
  )
}
