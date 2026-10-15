import { useState } from 'react'
import { CopyField, Field, Input, Segmented } from '../../components/ui'
import { addVat, extractVat } from '../../lib/vat'

type Mode = 'add' | 'extract'

const fmtSatang = (n: number) =>
  n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function VatCalculator() {
  const [mode, setMode] = useState<Mode>('add')
  const [price, setPrice] = useState('100')
  const [rate, setRate] = useState('7')

  const p = Number.parseFloat(price)
  const r = Number.parseFloat(rate)
  const valid = Number.isFinite(p) && p >= 0 && Number.isFinite(r) && r >= 0 && r <= 100
  const result = valid ? (mode === 'add' ? addVat(p, r) : extractVat(p, r)) : null
  const show = (v: number | undefined) => (result && v !== undefined ? fmtSatang(v) : '')

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className="label">โหมดคำนวณ</span>
            <Segmented
              options={[
                { value: 'add', label: 'บวก VAT' },
                { value: 'extract', label: 'ถอด VAT' },
              ]}
              value={mode}
              onChange={setMode}
            />
          </div>
          <div className="w-full min-w-40 sm:w-48">
            <Field label={mode === 'add' ? 'ราคา (ก่อน VAT)' : 'ราคา (รวม VAT แล้ว)'}>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="font-mono"
              />
            </Field>
          </div>
          <div className="w-32">
            <Field label="อัตรา VAT (%)">
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="any"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="font-mono"
              />
            </Field>
          </div>
        </div>
        <p className="mt-3 text-xs text-inksoft">
          {mode === 'add'
            ? 'โหมดบวก VAT — ใส่ราคาก่อนภาษี ระบบจะคำนวณภาษีและยอดรวมให้'
            : 'โหมดถอด VAT — ใส่ราคาที่รวมภาษีแล้ว ระบบจะถอดเป็นมูลค่าก่อนภาษีและภาษีให้'}
        </p>
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">ผลลัพธ์</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <span className="label">ก่อน VAT</span>
            <CopyField value={show(result?.base)} />
          </div>
          <div>
            <span className="label">ภาษีมูลค่าเพิ่ม</span>
            <CopyField value={show(result?.vat)} />
          </div>
          <div>
            <span className="label">รวมทั้งสิ้น</span>
            <CopyField value={show(result?.total)} />
          </div>
        </div>
        {!result && (
          <p className="mt-3 text-xs text-rustdeep">
            ใส่ตัวเลขก่อนนะ — ราคาต้องไม่ติดลบ และอัตรา VAT อยู่ระหว่าง 0–100 (ใส่ทศนิยมได้)
          </p>
        )}
        <p className="mt-3 text-xs text-inksoft">
          หมายเหตุ: ผลลัพธ์ปัดเป็นสตางค์ (ทศนิยม 2 ตำแหน่ง) แบบ half-up — โหมดบวกคำนวณภาษีจากราคาก่อนภาษี
          ส่วนโหมดถอดคำนวณภาษีจากยอดรวม แล้วหามูลค่าก่อนภาษีจากส่วนต่าง ยอดทั้งสามช่องจึงบวกกลับกันได้ลงตัวเสมอ
        </p>
      </div>
    </div>
  )
}
