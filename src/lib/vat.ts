/**
 * VAT math — ฟังก์ชันบริสุทธิ์ ไม่มี React
 * ทุกยอดปัดเป็นสตางค์ (ทศนิยม 2 ตำแหน่ง) แบบครึ่งขึ้น (half-up)
 */

export interface VatResult {
  base: number
  vat: number
  total: number
}

/** ปัดเป็นสตางค์: ทศนิยม 2 ตำแหน่ง ครึ่งขึ้น — +epsilon กัน binary float trap (0.145*100 = 14.4999…) */
function satang(v: number): number {
  const sign = v < 0 ? -1 : 1
  return (sign * Math.round(Math.abs(v) * 100 + 1e-9)) / 100
}

/**
 * โหมดบวก VAT: ได้ราคาก่อนภาษีมา — คำนวณ vat จาก base
 * แล้วปัดทีละขั้นเพื่อให้ base + vat = total ตรงกันเสมอ
 */
export function addVat(price: number, rate: number): VatResult {
  const base = satang(price)
  const vat = satang((base * rate) / 100)
  const total = satang(base + vat)
  return { base, vat, total }
}

/**
 * โหมดถอด VAT: ได้ราคารวมภาษีมา — คำนวณ vat จาก total
 * แล้ว base คือส่วนต่าง เพื่อให้ base + vat = total ลงตัวเป๊ะ
 */
export function extractVat(total: number, rate: number): VatResult {
  const t = satang(total)
  const vat = satang((t * rate) / (100 + rate))
  const base = satang(t - vat)
  return { base, vat, total: t }
}
