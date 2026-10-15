import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { Field, Input } from '../../components/ui'
import { formatNumber } from '../../lib/utils'

export default function PercentCalc() {
  const [a1, setA1] = useState('15')
  const [a2, setA2] = useState('200')
  const [b1, setB1] = useState('30')
  const [b2, setB2] = useState('120')
  const [c1, setC1] = useState('80')
  const [c2, setC2] = useState('100')

  const r1 = (parseFloat(a1) / 100) * parseFloat(a2)
  const r2 = (parseFloat(b1) / parseFloat(b2)) * 100
  const d = parseFloat(c2) - parseFloat(c1)
  const r3 = (d / parseFloat(c1)) * 100

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-24">
            <Field label="ค่า %">
              <Input type="number" value={a1} onChange={(e) => setA1(e.target.value)} className="font-mono" />
            </Field>
          </div>
          <span className="pb-2.5 text-sm text-inksoft">% ของ</span>
          <div className="w-36">
            <Field label="จำนวน">
              <Input type="number" value={a2} onChange={(e) => setA2(e.target.value)} className="font-mono" />
            </Field>
          </div>
          <span className="pb-2.5 font-mono text-inksoft">=</span>
          <div className="font-mono text-3xl font-semibold text-rust">
            {Number.isFinite(r1) ? formatNumber(r1, 4) : '—'}
          </div>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-32">
            <Field label="จำนวน">
              <Input type="number" value={b1} onChange={(e) => setB1(e.target.value)} className="font-mono" />
            </Field>
          </div>
          <span className="pb-2.5 text-sm text-inksoft">เป็นกี่ % ของ</span>
          <div className="w-32">
            <Field label="ทั้งหมด">
              <Input type="number" value={b2} onChange={(e) => setB2(e.target.value)} className="font-mono" />
            </Field>
          </div>
          <span className="pb-2.5 font-mono text-inksoft">=</span>
          <div className="font-mono text-3xl font-semibold text-rust">
            {Number.isFinite(r2) ? `${formatNumber(r2, 4)}%` : '—'}
          </div>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-32">
            <Field label="จาก">
              <Input type="number" value={c1} onChange={(e) => setC1(e.target.value)} className="font-mono" />
            </Field>
          </div>
          <ArrowRight className="pb-2.5 h-4 w-4 text-inksoft" />
          <div className="w-32">
            <Field label="เป็น">
              <Input type="number" value={c2} onChange={(e) => setC2(e.target.value)} className="font-mono" />
            </Field>
          </div>
          <span className="pb-2.5 text-sm text-inksoft">เปลี่ยนแปลง</span>
          <div className="flex items-center gap-2 pb-0.5">
            <span className="font-mono text-3xl font-semibold text-rust">
              {Number.isFinite(r3) ? `${r3 >= 0 ? '+' : ''}${formatNumber(r3, 4)}%` : '—'}
            </span>
            {Number.isFinite(r3) && (
              <span className="chip">{r3 >= 0 ? 'เพิ่มขึ้น ↑' : 'ลดลง ↓'}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
