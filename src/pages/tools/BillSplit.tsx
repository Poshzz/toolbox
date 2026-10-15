import { useState } from 'react'
import { CheckRow, CopyButton, Field, Input, Stat } from '../../components/ui'
import { formatTHB } from '../../lib/utils'

export default function BillSplit() {
  const [total, setTotal] = useState('1250')
  const [tip, setTip] = useState(10)
  const [people, setPeople] = useState(4)
  const [roundUp, setRoundUp] = useState(false)

  const t = parseFloat(total) || 0
  const tipAmount = (t * tip) / 100
  const grand = t + tipAmount
  const per = people > 0 ? grand / people : 0
  const perFinal = roundUp ? Math.ceil(per) : per
  const collected = roundUp ? perFinal * people : grand

  const summary = [
    '🧾 สรุปบิล',
    `ยอดอาหาร: ${formatTHB(t)}`,
    `ทิป ${tip}%: ${formatTHB(tipAmount)}`,
    `รวมทั้งสิ้น: ${formatTHB(grand)}`,
    `หาร ${people} คน = ${formatTHB(perFinal)}/คน${roundUp ? ' (ปัดขึ้น)' : ''}`,
  ].join('\n')

  return (
    <div className="flex flex-col gap-5">
      <div className="card grid gap-5 p-5 sm:grid-cols-3 md:p-6">
        <Field label="ยอดบิล (บาท)">
          <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="font-mono" />
        </Field>
        <Field label="จำนวนคน">
          <Input
            type="number"
            min={1}
            value={people}
            onChange={(e) => setPeople(Math.max(1, Number(e.target.value) || 1))}
            className="font-mono"
          />
        </Field>
        <div>
          <span className="label">ทิป</span>
          <div className="flex flex-wrap items-center gap-2">
            {[0, 5, 10, 15].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setTip(v)}
                className={
                  tip === v
                    ? 'cursor-pointer rounded-full bg-ink px-3.5 py-1.5 font-mono text-xs text-paper'
                    : 'cursor-pointer rounded-full border border-ink/15 px-3.5 py-1.5 font-mono text-xs text-inksoft transition hover:border-ink hover:text-ink'
                }
              >
                {v}%
              </button>
            ))}
            <Input
              type="number"
              value={tip}
              onChange={(e) => setTip(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 font-mono"
            />
          </div>
        </div>
        <div className="sm:col-span-3">
          <CheckRow checked={roundUp} onChange={setRoundUp} label="ปัดขึ้นเป็นจำนวนเต็มบาท (เก็บบิลครบง่าย)" />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="ทิป" value={formatTHB(tipAmount)} />
        <Stat label="ยอดรวมทั้งหมด" value={formatTHB(grand)} />
        <Stat label="ต่อคน" value={`${formatTHB(perFinal)}`} />
        <Stat
          label={roundUp ? 'เก็บจริงรวม (ปัดขึ้น)' : 'ต่อคนแบบไม่ปัด'}
          value={roundUp ? formatTHB(collected) : formatTHB(per)}
        />
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-xl">สรุปข้อความ</h3>
          <CopyButton text={summary} label="คัดลอกส่งให้เพื่อน" />
        </div>
        <pre className="mt-3 rounded-2xl border border-ink/10 bg-paper2/40 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap">
          {summary}
        </pre>
      </div>
    </div>
  )
}
