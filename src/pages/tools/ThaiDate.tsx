import { useState } from 'react'
import { CopyButton, CopyField, Field, Input, Stat } from '../../components/ui'
import { cn, formatNumber } from '../../lib/utils'
import {
  addDaysToISO,
  ageYMD,
  breakdownYMD,
  diffDays,
  formatCEFull,
  formatThaiFull,
  fromBE,
  todayISO,
  toBE,
} from '../../lib/thai-date'

function ymdLabel(y: number, m: number, d: number) {
  return `${y} ปี ${m} เดือน ${d} วัน`
}

export default function ThaiDate() {
  const [today] = useState(todayISO)
  const beThisYear = toBE(Number(today.slice(0, 4)))

  // 1) แปลงปี พ.ศ. ↔ ค.ศ.
  const [be, setBe] = useState(String(beThisYear))
  const [ce, setCe] = useState(today.slice(0, 4))

  const onBe = (v: string) => {
    setBe(v)
    const n = Number(v)
    setCe(v.trim() === '' || !Number.isFinite(n) ? '' : String(fromBE(n)))
  }
  const onCe = (v: string) => {
    setCe(v)
    const n = Number(v)
    setBe(v.trim() === '' || !Number.isFinite(n) ? '' : String(toBE(n)))
  }
  const fillThisYear = () => {
    setBe(String(beThisYear))
    setCe(String(fromBE(beThisYear)))
  }

  // 2) วันที่ไทยแบบเต็ม
  const [thaiDate, setThaiDate] = useState(today)
  const thaiFull = formatThaiFull(thaiDate)
  const ceFull = formatCEFull(thaiDate)

  // 3) นับวันระหว่างวันที่
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(() => addDaysToISO(today, 30) ?? today)
  const totalDays = diffDays(from, to)
  const bd = breakdownYMD(from, to)
  const absDays = totalDays === null ? null : Math.abs(totalDays)
  const weeksLabel =
    absDays === null
      ? '—'
      : absDays === 0
        ? '0 วัน'
        : absDays < 7
          ? `ไม่ถึง 1 สัปดาห์ (${absDays} วัน)`
          : absDays % 7 === 0
            ? `${formatNumber(absDays / 7, 0)} สัปดาห์`
            : `${formatNumber(Math.floor(absDays / 7), 0)} สัปดาห์ ${absDays % 7} วัน`

  // 4) อายุจากวันเกิด
  const [birth, setBirth] = useState('')
  const age = birth ? ageYMD(birth, today) : null
  const ageTotal = birth ? diffDays(birth, today) : null

  // 5) บวก/ลบจำนวนวัน
  const [base, setBase] = useState(today)
  const [delta, setDelta] = useState('7')
  const deltaNum = delta.trim() === '' ? null : Number(delta)
  const deltaValid = deltaNum !== null && Number.isInteger(deltaNum)
  const resultISO = deltaValid ? addDaysToISO(base, deltaNum) : null
  const resultThai = resultISO ? formatThaiFull(resultISO) : null
  const addHint =
    delta.trim() !== '' && !deltaValid
      ? '✗ ใส่จำนวนวันเป็นจำนวนเต็ม (ติดลบได้)'
      : base === ''
        ? 'เลือกวันที่ตั้งต้นก่อนนะ'
        : delta.trim() === ''
          ? 'ใส่จำนวนวันเพื่อดูผลลัพธ์'
          : resultISO === null
            ? '✗ ผลลัพธ์เลยช่วงวันที่ที่รองรับ (ค.ศ. 1–9999)'
            : null

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl">แปลงปี พ.ศ. ↔ ค.ศ.</h3>
          <button
            type="button"
            onClick={fillThisYear}
            className="chip cursor-pointer transition hover:border-rust/50 hover:text-ink"
          >
            ปีนี้ · พ.ศ. {beThisYear}
          </button>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="ปี พ.ศ. (Buddhist Era)">
            <Input
              type="number"
              value={be}
              onChange={(e) => onBe(e.target.value)}
              placeholder="2569"
              className="font-mono"
            />
          </Field>
          <Field label="ปี ค.ศ. (Common Era)">
            <Input
              type="number"
              value={ce}
              onChange={(e) => onCe(e.target.value)}
              placeholder="2026"
              className="font-mono"
            />
          </Field>
        </div>
        <p className="mt-3 text-xs text-inksoft">
          ต่างกันคงที่ 543 ปี: พ.ศ. = ค.ศ. + 543 (และ ค.ศ. = พ.ศ. − 543) — แก้ช่องไหน อีกช่องอัปเดตทันที
        </p>
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">วันที่ไทยแบบเต็ม</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="เลือกวันที่ (ค.ศ.)" hint="แปลงเป็น พ.ศ. พร้อมวันในสัปดาห์ตามธรรมเนียมไทย">
            <Input type="date" value={thaiDate} onChange={(e) => setThaiDate(e.target.value)} />
          </Field>
          <div className="flex items-end">
            {thaiFull ? (
              <div className="font-display text-xl text-rust">{thaiFull}</div>
            ) : (
              <p className="text-sm text-inksoft">เลือกวันที่ก่อนนะ แล้วรูปแบบไทยเต็มจะขึ้นตรงนี้</p>
            )}
          </div>
        </div>
        {thaiFull && ceFull && (
          <div className="mt-4 grid gap-3">
            <CopyField value={thaiFull} />
            <CopyField value={ceFull} />
            <CopyField value={thaiDate} />
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-xs text-inksoft">
              <span>บรรทัดที่ 1: วันที่ไทยเต็ม (พ.ศ.)</span>
              <span>บรรทัดที่ 2: วันเดียวกันแบบ ค.ศ.</span>
              <span>บรรทัดที่ 3: ISO 8601</span>
            </div>
          </div>
        )}
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">นับวันระหว่างวันที่</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="จากวันที่ (ค.ศ.)">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="ถึงวันที่ (ค.ศ.)">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="รวมทั้งสิ้น" value={absDays === null ? '—' : `${formatNumber(absDays, 0)} วัน`} />
          <Stat label="คิดเป็นสัปดาห์" value={weeksLabel} />
          <Stat
            label="ปี เดือน วัน"
            value={bd ? ymdLabel(Math.abs(bd.years), Math.abs(bd.months), Math.abs(bd.days)) : '—'}
          />
          <Stat
            label="ทิศทาง"
            value={
              totalDays === null ? '—' : totalDays === 0 ? 'วันเดียวกัน' : totalDays > 0 ? 'ไปข้างหน้า' : 'ย้อนหลัง'
            }
          />
        </div>
        {(from === '' || to === '') && (
          <p className="mt-3 text-xs text-inksoft">เลือกวันจาก–ถึงก่อนนะ แล้วผลการนับจะขึ้นตรงนี้</p>
        )}
        {totalDays !== null && bd && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <CopyButton
              text={`ห่างกัน ${formatNumber(Math.abs(totalDays), 0)} วัน (${ymdLabel(Math.abs(bd.years), Math.abs(bd.months), Math.abs(bd.days))}) — ${from} ถึง ${to}`}
              label="คัดลอกสรุป"
            />
            <span className="chip">
              {from} → {to}
            </span>
          </div>
        )}
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">อายุจากวันเกิด</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="วันเกิด (ค.ศ.)" hint="คิดอายุถึงวันนี้เป็น ปี / เดือน / วัน">
            <Input type="date" value={birth} onChange={(e) => setBirth(e.target.value)} max={today} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="อายุ" value={age ? ymdLabel(age.years, age.months, age.days) : '—'} />
            <Stat
              label="รวมเป็นวัน"
              value={ageTotal !== null && ageTotal >= 0 ? `${formatNumber(ageTotal, 0)} วัน` : '—'}
            />
          </div>
        </div>
        {age && age.months === 0 && age.days === 0 && (
          <p className="mt-3 text-xs text-olive">
            {age.years === 0
              ? '🎉 เกิดวันนี้เลย — อายุ 0 ปี 0 เดือน 0 วัน'
              : `🎂 วันนี้ครบรอบวันเกิดพอดี ${age.years} ปี — สุขสันต์วันเกิด!`}
          </p>
        )}
        {birth === '' && (
          <p className="mt-3 text-xs text-inksoft">ยังไม่ได้เลือกวันเกิด — เลือกแล้วผลจะขึ้นทันที</p>
        )}
        {birth !== '' && !age && (
          <p className="mt-3 rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
            ✗ วันเกิดต้องเป็นวันที่ไม่เกินวันนี้
          </p>
        )}
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">บวก / ลบจำนวนวัน</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="วันที่ตั้งต้น (ค.ศ.)">
            <Input type="date" value={base} onChange={(e) => setBase(e.target.value)} />
          </Field>
          <Field label="จำนวนวัน (ลบ = ย้อนหลัง)">
            <Input
              type="number"
              step={1}
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="7"
              className="font-mono"
            />
          </Field>
        </div>
        {resultISO && (
          <div className="mt-4 grid gap-3">
            <div className="font-display text-xl text-rust">{resultThai ?? resultISO}</div>
            <CopyField value={resultISO} />
            {resultThai && <CopyField value={resultThai} />}
          </div>
        )}
        {addHint && (
          <p
            className={cn(
              'mt-3 text-xs',
              addHint.startsWith('✗')
                ? 'rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-rustdeep'
                : 'text-inksoft',
            )}
          >
            {addHint}
          </p>
        )}
      </div>
    </div>
  )
}
