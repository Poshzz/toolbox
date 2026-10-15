import { useMemo, useState } from 'react'
import { Field, Input, Segmented, Select, Stat } from '../../components/ui'
import { formatTHB } from '../../lib/utils'

type Kind = 'simple' | 'compound'

const FREQS = [
  { value: '1', label: 'ปีละครั้ง' },
  { value: '2', label: 'ครึ่งปี (2×)' },
  { value: '4', label: 'รายไตรมาส (4×)' },
  { value: '12', label: 'รายเดือน (12×)' },
  { value: '365', label: 'รายวัน (365×)' },
]

export default function InterestCalc() {
  const [principal, setPrincipal] = useState('100000')
  const [rate, setRate] = useState('3')
  const [years, setYears] = useState('5')
  const [kind, setKind] = useState<Kind>('compound')
  const [freq, setFreq] = useState('12')

  const p = parseFloat(principal)
  const r = parseFloat(rate)
  const t = parseFloat(years)
  const n = parseInt(freq, 10)

  const calc = useMemo(() => {
    if (!Number.isFinite(p) || !Number.isFinite(r) || !Number.isFinite(t) || p <= 0 || t <= 0) return null
    if (kind === 'simple') {
      const interest = (p * r * t) / 100
      return { total: p + interest, interest, effective: r }
    }
    const total = p * Math.pow(1 + r / 100 / n, n * t)
    const effective = (Math.pow(1 + r / 100 / n, n) - 1) * 100
    return { total, interest: total - p, effective }
  }, [p, r, t, kind, n])

  const rows = useMemo(() => {
    if (!calc || !Number.isFinite(t)) return []
    const count = Math.min(Math.floor(t), 40)
    const out: Array<{ year: number; interest: number; total: number; yearInterest: number }> = []
    let prevInterest = 0
    for (let y = 1; y <= count; y++) {
      let interest: number
      if (kind === 'simple') {
        interest = (p * r * y) / 100
      } else {
        interest = p * Math.pow(1 + r / 100 / n, n * y) - p
      }
      out.push({ year: y, interest, total: p + interest, yearInterest: interest - prevInterest })
      prevInterest = interest
    }
    return out
  }, [calc, p, r, t, kind, n])

  return (
    <div className="flex flex-col gap-5">
      <div className="card grid gap-5 p-5 md:grid-cols-2 md:p-6">
        <Field label="เงินต้น (บาท)">
          <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="font-mono" />
        </Field>
        <Field label="อัตราดอกเบี้ย (% ต่อปี)">
          <Input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className="font-mono" />
        </Field>
        <Field label="ระยะเวลา (ปี)">
          <Input type="number" step="0.5" value={years} onChange={(e) => setYears(e.target.value)} className="font-mono" />
        </Field>
        <div>
          <span className="label">รูปแบบดอกเบี้ย</span>
          <Segmented
            options={[
              { value: 'simple', label: 'ธรรมดา (Simple)' },
              { value: 'compound', label: 'ทบต้น (Compound)' },
            ]}
            value={kind}
            onChange={setKind}
          />
        </div>
        {kind === 'compound' && (
          <Field label="ความถี่ในการทบต้น">
            <Select value={freq} onChange={(e) => setFreq(e.target.value)}>
              {FREQS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {calc && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="ดอกเบี้ยที่ได้" value={formatTHB(calc.interest)} />
            <Stat label="ยอดรวมเมื่อครบกำหนด" value={formatTHB(calc.total)} />
            {kind === 'compound' && (
              <Stat label="อัตราดอกเบี้ยที่แท้จริงต่อปี" value={`${calc.effective.toFixed(3)}%`} />
            )}
          </div>

          {rows.length > 0 && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-ink/15 text-left text-[10px] tracking-[0.14em] text-inksoft uppercase">
                      <th className="px-5 py-3 font-semibold">ปีที่</th>
                      <th className="px-3 py-3 font-semibold">ดอกเบี้ยปีนี้</th>
                      <th className="px-3 py-3 font-semibold">ดอกเบี้ยสะสม</th>
                      <th className="px-5 py-3 font-semibold">ยอดเงินรวม</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {rows.map((row) => (
                      <tr key={row.year} className="border-b border-ink/5">
                        <td className="px-5 py-2.5">{row.year}</td>
                        <td className="px-3 py-2.5">{formatTHB(row.yearInterest)}</td>
                        <td className="px-3 py-2.5 text-olive">{formatTHB(row.interest)}</td>
                        <td className="px-5 py-2.5 font-semibold">{formatTHB(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {Math.floor(t) > 40 && (
                <p className="border-t border-ink/10 px-5 py-2 text-xs text-inksoft">แสดงตาราง 40 ปีแรก</p>
              )}
            </div>
          )}
        </>
      )}

      {!calc && <p className="text-sm text-inksoft">ใส่ตัวเลขให้ครบ (มากกว่า 0) แล้วผลลัพธ์จะขึ้นที่นี่</p>}
    </div>
  )
}
