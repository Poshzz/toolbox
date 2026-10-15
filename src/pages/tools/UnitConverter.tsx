import { useState } from 'react'
import { ArrowLeftRight } from 'lucide-react'
import { CopyField, Field, Input, Segmented, Select } from '../../components/ui'
import { formatNumber } from '../../lib/utils'

interface Unit {
  id: string
  label: string
  factor: number
}

interface Cat {
  id: string
  label: string
  temp?: boolean
  units: Unit[]
}

const CATS: Cat[] = [
  {
    id: 'length',
    label: 'ความยาว',
    units: [
      { id: 'mm', label: 'มิลลิเมตร (mm)', factor: 0.001 },
      { id: 'cm', label: 'เซนติเมตร (cm)', factor: 0.01 },
      { id: 'm', label: 'เมตร (m)', factor: 1 },
      { id: 'km', label: 'กิโลเมตร (km)', factor: 1000 },
      { id: 'in', label: 'นิ้ว (in)', factor: 0.0254 },
      { id: 'ft', label: 'ฟุต (ft)', factor: 0.3048 },
      { id: 'yd', label: 'หลา (yd)', factor: 0.9144 },
      { id: 'mi', label: 'ไมล์ (mi)', factor: 1609.344 },
    ],
  },
  {
    id: 'weight',
    label: 'น้ำหนัก',
    units: [
      { id: 'mg', label: 'มิลลิกรัม (mg)', factor: 0.000001 },
      { id: 'g', label: 'กรัม (g)', factor: 0.001 },
      { id: 'kg', label: 'กิโลกรัม (kg)', factor: 1 },
      { id: 't', label: 'ตัน (t)', factor: 1000 },
      { id: 'oz', label: 'ออนซ์ (oz)', factor: 0.028349523125 },
      { id: 'lb', label: 'ปอนด์ (lb)', factor: 0.45359237 },
    ],
  },
  {
    id: 'temp',
    label: 'อุณหภูมิ',
    temp: true,
    units: [
      { id: 'c', label: 'เซลเซียส (°C)', factor: 1 },
      { id: 'f', label: 'ฟาเรนไฮต์ (°F)', factor: 1 },
      { id: 'k', label: 'เคลวิน (K)', factor: 1 },
    ],
  },
  {
    id: 'area',
    label: 'พื้นที่',
    units: [
      { id: 'cm2', label: 'ตร.เซนติเมตร', factor: 0.0001 },
      { id: 'm2', label: 'ตร.เมตร', factor: 1 },
      { id: 'km2', label: 'ตร.กิโลเมตร', factor: 1_000_000 },
      { id: 'wa', label: 'ตร.วา', factor: 4 },
      { id: 'rai', label: 'ไร่', factor: 1600 },
      { id: 'ha', label: 'เฮกตาร์', factor: 10_000 },
      { id: 'ac', label: 'เอเคอร์', factor: 4046.8564224 },
      { id: 'ft2', label: 'ตร.ฟุต', factor: 0.09290304 },
    ],
  },
  {
    id: 'volume',
    label: 'ปริมาตร',
    units: [
      { id: 'ml', label: 'มิลลิลิตร (ml)', factor: 0.001 },
      { id: 'l', label: 'ลิตร (L)', factor: 1 },
      { id: 'm3', label: 'ลบ.เมตร (m³)', factor: 1000 },
      { id: 'tsp', label: 'ช้อนชา (US)', factor: 0.00492892159375 },
      { id: 'tbsp', label: 'ช้อนโต๊ะ (US)', factor: 0.01478676478125 },
      { id: 'cup', label: 'ถ้วย (US)', factor: 0.2365882365 },
      { id: 'floz', label: 'ฟลูอิดออนซ์ (US)', factor: 0.0295735295625 },
      { id: 'gal', label: 'แกลลอน (US)', factor: 3.785411784 },
    ],
  },
  {
    id: 'speed',
    label: 'ความเร็ว',
    units: [
      { id: 'ms', label: 'เมตร/วินาที (m/s)', factor: 1 },
      { id: 'kmh', label: 'กม./ชม. (km/h)', factor: 0.2777777778 },
      { id: 'mph', label: 'ไมล์/ชม. (mph)', factor: 0.44704 },
      { id: 'kn', label: 'นอต (kn)', factor: 0.5144444444 },
    ],
  },
  {
    id: 'data',
    label: 'ข้อมูลดิจิทัล',
    units: [
      { id: 'bit', label: 'บิต (bit)', factor: 1 },
      { id: 'byte', label: 'ไบต์ (B)', factor: 8 },
      { id: 'kb', label: 'กิโลไบต์ (KB, 1000)', factor: 8000 },
      { id: 'kib', label: 'คิบิไบต์ (KiB, 1024)', factor: 8192 },
      { id: 'mb', label: 'เมกะไบต์ (MB, 1000²)', factor: 8_000_000 },
      { id: 'mib', label: 'เมบิไบต์ (MiB, 1024²)', factor: 8_388_608 },
      { id: 'gb', label: 'กิกะไบต์ (GB, 1000³)', factor: 8_000_000_000 },
      { id: 'gib', label: 'กิบิไบต์ (GiB, 1024³)', factor: 8_589_934_592 },
      { id: 'tb', label: 'เทระไบต์ (TB, 1000⁴)', factor: 8_000_000_000_000 },
    ],
  },
  {
    id: 'time',
    label: 'เวลา',
    units: [
      { id: 'ms', label: 'มิลลิวินาที (ms)', factor: 0.001 },
      { id: 's', label: 'วินาที (s)', factor: 1 },
      { id: 'min', label: 'นาที (min)', factor: 60 },
      { id: 'h', label: 'ชั่วโมง (h)', factor: 3600 },
      { id: 'd', label: 'วัน (d)', factor: 86400 },
      { id: 'w', label: 'สัปดาห์ (w)', factor: 604800 },
    ],
  },
]

function tempConvert(from: string, to: string, v: number): number {
  let c = v
  if (from === 'f') c = ((v - 32) * 5) / 9
  if (from === 'k') c = v - 273.15
  if (to === 'c') return c
  if (to === 'f') return (c * 9) / 5 + 32
  return c + 273.15
}

function convert(cat: Cat, fromId: string, toId: string, v: number): number {
  if (!Number.isFinite(v)) return NaN
  if (cat.temp) return tempConvert(fromId, toId, v)
  const from = cat.units.find((u) => u.id === fromId)
  const to = cat.units.find((u) => u.id === toId)
  if (!from || !to) return NaN
  return (v * from.factor) / to.factor
}

function display(v: number): string {
  if (!Number.isFinite(v)) return '—'
  if (v !== 0 && Math.abs(v) < 0.0001) return v.toExponential(4)
  return formatNumber(v, 6)
}

export default function UnitConverter() {
  const [catId, setCatId] = useState('length')
  const [fromId, setFromId] = useState('cm')
  const [toId, setToId] = useState('in')
  const [value, setValue] = useState('100')

  const cat = CATS.find((c) => c.id === catId)!
  const v = parseFloat(value)
  const result = convert(cat, fromId, toId, v)

  const setCat = (id: string) => {
    const c = CATS.find((x) => x.id === id)!
    setCatId(id)
    setFromId(c.units[0].id)
    setToId(c.units[1]?.id ?? c.units[0].id)
  }

  const swap = () => {
    setFromId(toId)
    setToId(fromId)
    if (Number.isFinite(result)) setValue(display(result).replace(/,/g, ''))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <Segmented
          options={CATS.map((c) => ({ value: c.id, label: c.label }))}
          value={catId}
          onChange={setCat}
        />

        <div className="mt-6 grid items-end gap-4 md:grid-cols-[1fr_auto_1fr]">
          <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
            <Field label="จาก">
              <Select value={fromId} onChange={(e) => setFromId(e.target.value)}>
                {cat.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ค่า">
              <Input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0"
                className="font-mono"
              />
            </Field>
          </div>

          <button
            type="button"
            onClick={swap}
            title="สลับหน่วย"
            className="btn mx-auto h-11 w-11 rounded-full p-0 md:mb-0.5"
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>

          <div className="grid gap-4 sm:grid-cols-[1fr_1.2fr]">
            <Field label="เป็น">
              <Select value={toId} onChange={(e) => setToId(e.target.value)}>
                {cat.units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ผลลัพธ์">
              <CopyField value={display(result)} />
            </Field>
          </div>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">แปลงเป็นหน่วยอื่นทั้งหมด</h3>
        <div className="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {cat.units.map((u) => {
            const val = convert(cat, fromId, u.id, v)
            return (
              <div
                key={u.id}
                className="flex items-baseline justify-between gap-3 border-b border-dashed border-ink/10 py-2 text-sm"
              >
                <span className="text-inksoft">{u.label}</span>
                <span className="font-mono font-medium">{display(val)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
