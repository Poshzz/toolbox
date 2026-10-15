import { useMemo, useState } from 'react'
import { CopyButton, Input, Segmented, Textarea } from '../../components/ui'
import { decodeEntities, encodeEntities, NAMED_ENTITIES } from '../../lib/html-entities'

type Mode = 'encode' | 'decode'

const EXAMPLES: Array<{ mode: Mode; label: string; value: string }> = [
  { mode: 'encode', label: 'HTML ผสมข้อความ', value: `<div class="note">Tom & Jerry's café</div>` },
  { mode: 'encode', label: 'สคริปต์น่าสงสัย', value: `<script>alert("XSS")</script>` },
  { mode: 'decode', label: 'ย่อหน้าที่ถูก encode', value: '&lt;p&gt;สวัสดี &amp; ยินดีต้อนรับ&lt;/p&gt;' },
  { mode: 'decode', label: 'ตัวเลข & hex', value: '&#x1F600; &#8364; &#169;' },
]

function codeLabel(char: string) {
  const cp = char.codePointAt(0) ?? 0
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`
}

export default function HtmlEntity() {
  const [mode, setMode] = useState<Mode>('encode')
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState('')

  const result = useMemo(() => {
    if (!input) return ''
    return mode === 'encode' ? encodeEntities(input) : decodeEntities(input)
  }, [input, mode])

  const filtered = useMemo(() => {
    const raw = filter.trim()
    if (!raw) return NAMED_ENTITIES
    const q = raw.toLowerCase().replace(/^&/, '').replace(/;$/, '')
    return NAMED_ENTITIES.filter(
      ([name, char]) => name.toLowerCase().includes(q) || char === raw || codeLabel(char).toLowerCase() === q,
    )
  }, [filter])

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            options={[
              { value: 'encode', label: 'เข้ารหัส (ข้อความ → entity)' },
              { value: 'decode', label: 'ถอดรหัส (entity → ข้อความ)' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <button
            type="button"
            className="btn text-xs"
            disabled={!result}
            onClick={() => {
              setInput(result)
              setMode((m) => (m === 'encode' ? 'decode' : 'encode'))
            }}
          >
            สลับ ↕ ใช้ผลลัพธ์เป็นอินพุต
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-inksoft">ตัวอย่าง:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setMode(ex.mode)
                setInput(ex.value)
              }}
              className="cursor-pointer rounded-full border border-ink/15 px-3 py-1 text-xs text-inksoft transition hover:border-ink hover:text-ink"
            >
              {ex.label}
            </button>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div>
            <h3 className="label">{mode === 'encode' ? 'ข้อความต้นฉบับ' : 'ข้อความที่ถูก encode'}</h3>
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === 'encode'
                  ? 'พิมพ์หรือวางข้อความ เช่น <b>สวัสดี & ยินดีต้อนรับ</b>'
                  : 'วาง entity เช่น &lt;b&gt;สวัสดี &amp; ยินดีต้อนรับ&lt;/b&gt; หรือ &#x1F600;'
              }
              className="min-h-44 font-mono text-[13px]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <h3 className="label mb-0">ผลลัพธ์</h3>
              <CopyButton text={result} />
            </div>
            <Textarea
              value={result}
              readOnly
              placeholder="ผลลัพธ์จะขึ้นที่นี่"
              className="mt-1.5 min-h-44 font-mono text-[13px]"
            />
          </div>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">ตาราง Named Entities ที่ใช้บ่อย</h3>
        <p className="mt-1 text-xs text-inksoft">
          ทั้งหมด {NAMED_ENTITIES.length} รายการ — คลิกคัดลอกได้เลย ถอดรหัสได้ทั้งชื่อ ตัวเลข (&amp;#38;) และ hex
          (&amp;#x26;)
        </p>
        <div className="mt-3 max-w-xs">
          <Input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="กรอง เช่น copy, arrow, ©"
            className="font-mono text-sm"
          />
        </div>
        <p className="mt-2 text-xs text-inksoft">
          แสดง {filtered.length} จาก {NAMED_ENTITIES.length} รายการ
        </p>
        {filtered.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-ink/10 bg-white/45 dark:bg-white/5 px-4 py-3 text-sm text-inksoft">
            ไม่พบ entity ที่ตรงกับ “{filter}” — ลองพิมพ์ชื่อภาษาอังกฤษ เช่น copy, hellip หรือวางตัวอักษรโดยตรง
          </p>
        ) : (
          <div className="mt-3 max-h-80 overflow-auto rounded-2xl border border-ink/10">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-crema">
                <tr className="border-b border-ink/15 text-left text-[10px] tracking-[0.14em] text-inksoft uppercase">
                  <th className="px-4 py-2 font-semibold">ตัวอักษร</th>
                  <th className="px-3 py-2 font-semibold">Entity</th>
                  <th className="px-3 py-2 font-semibold">รหัส</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(([name, char]) => (
                  <tr key={name} className="border-b border-ink/5">
                    <td className="px-4 py-1.5 text-lg">{char}</td>
                    <td className="px-3 py-1.5 font-mono text-xs">{`&${name};`}</td>
                    <td className="px-3 py-1.5 font-mono text-xs text-inksoft">{codeLabel(char)}</td>
                    <td className="px-3 py-1.5 text-right">
                      <CopyButton text={`&${name};`} label="" className="border-transparent" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-inksoft">
        การเข้ารหัสจะแปลงอักขระสำคัญ 5 ตัว (&amp; &lt; &gt; &quot; &apos;) เป็น named entity — พอสำหรับแสดงข้อความ
        ในหน้าเว็บอย่างปลอดภัย แต่ไม่ใช่เกราะกัน XSS ทั้งหมด ต้อง escape ตอน render ข้อมูลจากผู้ใช้ที่ฝั่งเซิร์ฟเวอร์
        ด้วย ส่วนการถอดรหัสทำครั้งละชั้น: ข้อความที่ถูก encode ซ้ำ (&amp;amp;lt;) ต้องถอดสองรอบจึงจะได้ตัวอักษรจริง
        และ entity ที่ไม่รู้จักจะถูกปล่อยผ่านไปโดยไม่แตะต้อง
      </p>
    </div>
  )
}
