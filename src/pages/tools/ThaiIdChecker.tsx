import { useState } from 'react'
import { BadgeCheck, BadgeX } from 'lucide-react'
import { CopyField, Field, Input } from '../../components/ui'
import { cn } from '../../lib/utils'
import { formatThaiId, normalizeThaiIdInput, validateThaiId } from '../../lib/thai-id'

export default function ThaiIdChecker() {
  const [raw, setRaw] = useState('')

  const cleaned = normalizeThaiIdInput(raw)
  const result = validateThaiId(cleaned)
  const formatted = formatThaiId(cleaned)

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <Field
          label="เลขบัตรประชาชน 13 หลัก"
          hint="พิมพ์หรือวางได้เลย — ระบบตัดช่องว่าง/ขีด และแปลงเลขไทย ๐–๙ ให้อัตโนมัติ"
        >
          <Input
            value={cleaned}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="1-2345-67890-12-1"
            inputMode="numeric"
            className="font-mono text-lg tracking-wider"
            aria-label="เลขบัตรประชาชน"
          />
        </Field>
      </div>

      <div className="card p-5 md:p-6">
        <Field label="รูปแบบมาตรฐาน (Formatted)">
          <CopyField value={formatted} />
        </Field>

        {cleaned ? (
          <div
            className={cn(
              'mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-2xl border px-4 py-3',
              result.valid ? 'border-olive/40 bg-olive/10 text-olive' : 'border-rust/40 bg-rust/10 text-rustdeep',
            )}
          >
            {result.valid ? (
              <BadgeCheck className="h-5 w-5 shrink-0" />
            ) : (
              <BadgeX className="h-5 w-5 shrink-0" />
            )}
            <span className="text-sm font-semibold">{result.valid ? 'ถูกต้อง' : 'ไม่ถูกต้อง'}</span>
            {!result.valid && <span className="text-xs opacity-90">{result.reason}</span>}
          </div>
        ) : (
          <p className="mt-4 text-sm text-inksoft">ยังไม่มีข้อมูล — พิมพ์เลขบัตรประชาชนเพื่อตรวจสอบ</p>
        )}
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">การตรวจสอบทำอย่างไร</h3>
        <p className="mt-2 text-sm leading-relaxed text-inksoft">
          นำเลข 12 หลักแรกคูณน้ำหนัก 13, 12, 11, … , 2 ตามลำดับ รวมกัน หารเอาเศษ mod 11 แล้วเทียบกับหลักที่ 13
          (หลักตรวจสอบ) — ทั้งหมดคำนวณในเบราว์เซอร์ ข้อมูลไม่ออกจากเครื่อง
          และการผ่านการตรวจนี้หมายถึงรูปแบบกับหลักตรวจสอบถูกต้องเท่านั้น ไม่ได้ยืนยันว่ามีเลขบัตรนี้อยู่จริง
        </p>
      </div>
    </div>
  )
}
