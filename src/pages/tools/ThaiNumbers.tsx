import { useState } from 'react'
import { CopyField, Field, Input } from '../../components/ui'
import { bahtText, numberToThaiWords, parseNumberInput, toThaiNumeral } from '../../lib/thai-numbers'

export default function ThaiNumbers() {
  const [input, setInput] = useState('1250.5')

  const parsed = parseNumberInput(input)
  const words = numberToThaiWords(input)
  const numeral = toThaiNumeral(input)
  const money = bahtText(input)

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <Field
          label="จำนวน"
          hint="พิมพ์ตัวเลขได้เลย — คั่นหลักด้วยจุลภาคได้ ใส่ทศนิยมได้ รองรับสูงสุด 14 หลัก"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="1,250.5"
            inputMode="decimal"
            className="font-mono text-lg"
            aria-label="จำนวนที่ต้องการอ่าน"
          />
        </Field>
        {input.trim() !== '' && !parsed && (
          <p className="mt-3 rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
            ✗ อ่านค่านี้ไม่ได้ — ใช้ตัวเลข 0–9 (คั่นจุลภาคได้) เครื่องหมายลบ และจุดทศนิยมหนึ่งจุด
          </p>
        )}
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">ผลลัพธ์</h3>
        <div className="mt-4 grid gap-4">
          <Field label="คำอ่านแบบอ่านตัวเลข (Words)">
            <CopyField value={words ?? ''} mono={false} />
          </Field>
          <Field label="ตัวเลขไทย (Thai digits)">
            <CopyField value={numeral ?? ''} />
          </Field>
          <Field label="จำนวนเงินบาท/สตางค์ (Baht & satang)">
            <CopyField value={money ?? ''} mono={false} />
          </Field>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-inksoft">
          กฎการอ่าน: หลักสิบ 1 อ่าน “สิบ” · หลักหน่วย 1 ที่มีหลักข้างหน้า อ่าน “เอ็ด” · หลักสิบ 2 อ่าน “ยี่สิบ” ·
          ทศนิยมอ่านทีละหลักหลังคำว่า “จุด” · จำนวนเงินปัดที่ตำแหน่งสตางค์ (2 ตำแหน่ง) ถ้าไม่มีสตางค์ลงท้าย “ถ้วน” ค่าติดลบขึ้นต้นด้วย “ลบ”
        </p>
      </div>
    </div>
  )
}
