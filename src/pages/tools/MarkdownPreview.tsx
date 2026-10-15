import { useMemo, useState } from 'react'
import { CopyButton, Textarea } from '../../components/ui'
import { render } from '../../lib/minimd'

const SAMPLE = `# พรีวิว Markdown แบบสด ๆ
พิมพ์ข้อความด้านซ้าย แล้วเห็นผลทางขวาทันที — Thai & English ทั้งคู่

## จุดเด่น
- **ตัวหนา** · *ตัวเอียง* · ~~ขีดฆ่า~~ · \`โค้ดในบรรทัด\`
- ลิงก์ที่ [ปลอดภัย](https://example.com) รองรับ http / https / mailto เท่านั้น

> ทุกอย่างเรนเดอร์ในเครื่องคุณ 100% ไม่มีการส่งข้อมูลออกไปไหน

\`\`\`js
const greet = (name) => \`สวัสดี \${name}\`
\`\`\`

---
![ตัวอย่างรูป](https://example.com/photo.jpg) — รูปจะแสดงเป็นข้อความ ไม่โหลดจากปลายทาง`

export default function MarkdownPreview() {
  const [text, setText] = useState('')
  const html = useMemo(() => render(text), [text])

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="label mb-0">Markdown ต้นฉบับ</h3>
            <button
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() => setText('')}
              disabled={!text}
            >
              ล้าง
            </button>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={SAMPLE}
            className="mt-1.5 min-h-96"
          />
          <p className="mt-2 text-xs text-inksoft">
            หมายเหตุ: พรีวิวเป็น HTML ที่ escape แล้ว — แท็ก HTML ในข้อความจะไม่ถูกสั่งให้ทำงาน
            และรูปภาพจะไม่ถูกโหลดจากปลายทาง
          </p>
        </div>

        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h3 className="label mb-0">พรีวิวสด</h3>
            <CopyButton text={html} label="ก๊อป HTML" />
          </div>
          {text.trim() ? (
            <div
              className="mt-1.5 min-h-96 overflow-x-auto rounded-2xl border border-ink/10 bg-white/45 px-4 py-3 text-sm text-ink"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div className="mt-1.5 flex min-h-96 items-center justify-center rounded-2xl border border-dashed border-ink/15 bg-white/25 px-4 py-3 text-center text-sm text-inksoft">
              เริ่มพิมพ์ Markdown ด้านซ้าย แล้วผลลัพธ์จะขึ้นตรงนี้ทันที
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
