import { useMemo, useState } from 'react'
import { Field, Input, Stat } from '../../components/ui'
import { formatTHB, formatNumber } from '../../lib/utils'

export default function LoanCalc() {
  const [principal, setPrincipal] = useState('1500000')
  const [rate, setRate] = useState('5.5')
  const [years, setYears] = useState('25')

  const p = parseFloat(principal)
  const ratePct = parseFloat(rate)
  const y = parseFloat(years)

  const result = useMemo(() => {
    if (!Number.isFinite(p) || !Number.isFinite(ratePct) || !Number.isFinite(y)) return null
    if (p <= 0 || y <= 0 || ratePct < 0) return null
    const n = Math.max(1, Math.round(y * 12))
    const r = ratePct / 100 / 12
    const monthly = r === 0 ? p / n : (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
    const totalPay = monthly * n
    const totalInterest = totalPay - p
    const firstInterest = p * r
    const firstPrincipal = monthly - firstInterest
    return { n, monthly, totalPay, totalInterest, firstInterest, firstPrincipal }
  }, [p, ratePct, y])

  return (
    <div className="flex flex-col gap-5">
      <div className="card grid gap-5 p-5 sm:grid-cols-3 md:p-6">
        <Field label="ยอดเงินกู้ (บาท)">
          <Input type="number" value={principal} onChange={(e) => setPrincipal(e.target.value)} className="font-mono" />
        </Field>
        <Field label="ดอกเบี้ย (% ต่อปี)">
          <Input type="number" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className="font-mono" />
        </Field>
        <Field label="ระยะเวลาผ่อน (ปี)">
          <Input type="number" step="1" value={years} onChange={(e) => setYears(e.target.value)} className="font-mono" />
        </Field>
      </div>

      {result ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card bg-ink/90 p-5 text-paper">
              <div className="text-[10px] font-semibold tracking-[0.16em] uppercase opacity-70">
                ค่างวดต่อเดือน
              </div>
              <div className="mt-2 font-display text-3xl">{formatTHB(result.monthly)}</div>
              <div className="mt-1 text-xs opacity-60">ทั้งสิ้น {result.n} งวด</div>
            </div>
            <Stat label="ดอกเบี้ยรวมทั้งสัญญา" value={formatTHB(result.totalInterest)} />
            <Stat label="ยอดชำระรวม" value={formatTHB(result.totalPay)} />
            <Stat
              label="งวดแรก: ดอกเบี้ย / เงินต้น"
              value={`${formatNumber(result.firstInterest, 0)} / ${formatNumber(result.firstPrincipal, 0)} บาท`}
            />
          </div>
          <p className="text-xs leading-relaxed text-inksoft">
            คำนวณแบบลดต้นลดดอก (amortized) ตามสูตรค่างวดเท่ากันทุกเดือน — ในชีวิตจริงธนาคารอาจมีค่าธรรมเนียม
            ค่าประกัน หรืออัตราดอกเบี้ยลอยตัวมาคิดเพิ่ม ตัวเลขนี้ใช้เพื่อวางแผนเบื้องต้นเท่านั้น
          </p>
        </>
      ) : (
        <p className="text-sm text-inksoft">กรอกยอดเงินกู้ ดอกเบี้ย และระยะเวลาให้ครบก่อนนะ</p>
      )}
    </div>
  )
}
