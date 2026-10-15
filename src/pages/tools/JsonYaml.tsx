import { useMemo, useState } from 'react'
import { CopyButton, Segmented, Textarea } from '../../components/ui'
import { describeJsonError } from '../../lib/jsoncsv'
import { jsonToYaml, yamlToJson } from '../../lib/miniyaml'

type Mode = 'json2yaml' | 'yaml2json'

export default function JsonYaml() {
  const [mode, setMode] = useState<Mode>('json2yaml')
  const [input, setInput] = useState('')

  const result = useMemo(() => {
    if (!input.trim()) return { ok: true as const, value: '' }
    if (mode === 'json2yaml') {
      const clean = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input
      try {
        return { ok: true as const, value: jsonToYaml(JSON.parse(clean)) }
      } catch (e) {
        return { ok: false as const, error: describeJsonError(clean, e) }
      }
    }
    const parsed = yamlToJson(input)
    if (!parsed.ok) return { ok: false as const, error: parsed.error }
    return { ok: true as const, value: JSON.stringify(parsed.value, null, 2) }
  }, [input, mode])

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-center gap-4 p-5 md:p-6">
        <Segmented
          options={[
            { value: 'json2yaml', label: 'JSON → YAML' },
            { value: 'yaml2json', label: 'YAML → JSON' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <button
          type="button"
          className="btn ml-auto"
          disabled={!result.ok || !result.value}
          onClick={() => {
            if (!result.ok || !result.value) return
            setInput(result.value)
            setMode((m) => (m === 'json2yaml' ? 'yaml2json' : 'json2yaml'))
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
          <h3 className="label">{mode === 'json2yaml' ? 'JSON ต้นฉบับ' : 'YAML ต้นฉบับ'}</h3>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === 'json2yaml'
                ? '{"name": "สมชาย", "skills": ["Go", "SQL"], "active": true}'
                : 'name: สมชาย\nskills:\n  - Go\n  - SQL\nactive: true'
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
        รองรับ YAML ชุดมาตรฐานที่ใช้บ่อย: mapping, sequence, ซ้อนชั้น, เครื่องหมายคำพูดแบบ &apos;...&apos; และ
        &quot;...&quot;, true/false/null (~), ตัวเลข, ภาษาไทย และ comment (#) ·
        ยังไม่รองรับ anchors/aliases (&amp; *), tags (!), หลายเอกสาร (---), flow style ([...] &#123;...&#125;)
        และ block scalar (| &gt;) — จะแจ้ง error เป็นภาษาไทยพร้อมเลขบรรทัด ·
        ตอนสร้าง YAML จะใส่เครื่องหมายคำพูดให้อัตโนมัติเมื่อจำเป็น (เช่น &apos;yes&apos;, &apos;123&apos;, ค่าที่มี &quot;: &quot;)
      </p>
    </div>
  )
}
