import { useMemo, useState } from 'react'
import { CheckRow, CopyField, Segmented, Textarea } from '../../components/ui'
import { slugify } from '../../lib/slug'

type ThaiMode = 'keep' | 'translit'
type Separator = '-' | '_'

const EXAMPLES = ['สวัสดีชาวโลก ครับ!', 'Héllo World 🚀', '10 เคล็ดลับกาแฟ Cold Brew!', "Café de l'été"]

export default function SlugGenerator() {
  const [text, setText] = useState('')
  const [thaiMode, setThaiMode] = useState<ThaiMode>('keep')
  const [separator, setSeparator] = useState<Separator>('-')
  const [lowercase, setLowercase] = useState(true)
  const [stripDiacritics, setStripDiacritics] = useState(true)

  const output = useMemo(
    () =>
      slugify(text, {
        separator,
        lowercase,
        stripDiacritics,
        keepThai: thaiMode === 'keep',
        transliterate: thaiMode === 'translit',
      }),
    [text, thaiMode, separator, lowercase, stripDiacritics],
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-col gap-4 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Segmented
            options={[
              { value: 'keep', label: 'คงอักษรไทย' },
              { value: 'translit', label: 'ทับศัพท์อังกฤษ (ประมาณ)' },
            ]}
            value={thaiMode}
            onChange={setThaiMode}
          />
          <Segmented
            options={[
              { value: '-', label: 'ขีดกลาง -' },
              { value: '_', label: 'ขีดล่าง _' },
            ]}
            value={separator}
            onChange={setSeparator}
          />
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <CheckRow checked={lowercase} onChange={setLowercase} label="ตัวพิมพ์เล็กทั้งหมด" />
            <CheckRow checked={stripDiacritics} onChange={setStripDiacritics} label="ตัดวรรณยุกต์ละติน (é → e)" />
          </div>
        </div>

        <div>
          <h3 className="label">ข้อความต้นฉบับ</h3>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="พิมพ์หรือวางข้อความ เช่น สวัสดีชาวโลก ครับ! หรือ Hello World 🚀"
            className="min-h-32"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-inksoft">ตัวอย่าง:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              className="cursor-pointer rounded-full border border-ink/15 px-3 py-1 text-xs text-inksoft transition hover:border-ink hover:text-ink"
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="card flex flex-col gap-3 p-5 md:p-6">
        <div className="flex items-center justify-between">
          <h3 className="label mb-0">Slug ที่ได้</h3>
          <span className="text-xs text-inksoft">{output.length} ตัวอักษร</span>
        </div>
        <CopyField value={output} />
        {!output && text.trim() !== '' && (
          <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
            ✗ ข้อความนี้ไม่เหลือตัวอักษรที่ใช้ได้ — อีโมจิ เครื่องหมาย และอักษรภาษาอื่นจะถูกตัดออก
            {thaiMode === 'translit' && ' (ถ้าเปิดโหมดคงอักษรไทย ตัวอักษรไทยจะถูกเก็บไว้)'}
          </p>
        )}
      </div>

      <p className="text-xs leading-relaxed text-inksoft">
        อักษรไทยเป็นอักษรที่ใช้ใน URL ได้จริง (เบราว์เซอร์จะแปลงเป็น %E0... ให้อัตโนมัติ) จึงเปิด “คงอักษรไทย” เป็น
        ค่าตั้งต้น — โหมด “ทับศัพท์อังกฤษ” เป็นการแปลงแบบง่ายตามตารางตัวอักษรทีละตัว ไม่จัดเรียงสระหน้า (เ แ โ ใ ไ)
        ให้ตรงเสียงจริงและไม่แทนวรรณยุกต์ ใช้เป็นแนวทางเท่านั้น ส่วนการตัดวรรณยุกต์ละตินใช้ NFD ของ Unicode
        และไม่แตะวรรณยุกต์ไทย
      </p>
    </div>
  )
}
