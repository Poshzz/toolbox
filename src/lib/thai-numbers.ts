// อ่านจำนวนเป็นคำอ่านไทย · เลขไทย · จำนวนเงินบาท/สตางค์
// Pure logic — ห้าม import React

const DIGIT_WORDS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
const PLACE_WORDS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน']
const THAI_DIGIT_CHARS = '๐๑๒๓๔๕๖๗๘๙'
const MAX_INT_DIGITS = 14 // รองรับถึงหลักแสนล้านล้าน (ประมาณ 10^14)

export interface ParsedNumber {
  negative: boolean
  /** ส่วนจำนวนเต็ม ไม่มีศูนย์นำหน้า และมีค่าเป็น "0" ได้ */
  int: string
  /** หลักหลังจุดทศนิยมตามที่ผู้ใช้พิมพ์ (อาจเป็น "" ได้) */
  frac: string
}

/** แปลงข้อความตัวเลข (คั่นจุลภาคได้ มีเครื่องหมายลบและจุดทศนิยมได้) → ชิ้นส่วนตัวเลข หรือ null ถ้าอ่านไม่ได้ */
export function parseNumberInput(raw: string | number): ParsedNumber | null {
  const s = (typeof raw === 'number' ? String(raw) : raw).trim()
  if (!s) return null

  let negative = false
  let t = s
  if (t.startsWith('-')) {
    negative = true
    t = t.slice(1)
  }
  t = t.replace(/,/g, '')
  if (!/^\d*\.?\d*$/.test(t) || !/\d/.test(t)) return null

  const [intRaw, frac] = t.split('.') as [string, string | undefined]
  const int = (intRaw ?? '').replace(/^0+(?=\d)/, '') || '0'
  if (int.length > MAX_INT_DIGITS) return null
  return { negative, int, frac: frac ?? '' }
}

/** อ่านกลุ่มตัวเลข 6 หลัก (ตัดศูนย์นำหน้าออกแล้ว) — ใช้ภายในเท่านั้น */
function readGroup(digits: string, isMostSignificant: boolean): string {
  // หลักหน่วยเป็น 1 → "เอ็ด" เสมอ ยกเว้นกรณีที่ทั้งจำนวนคือ 1 เฉย ๆ (กลุ่มเดียว ความยาว 1 และเป็นกลุ่มสูงสุด)
  const usesEd = !(isMostSignificant && digits.length === 1)
  let out = ''
  for (let k = 0; k < digits.length; k++) {
    const d = digits.charCodeAt(k) - 48
    if (d === 0) continue
    const place = digits.length - 1 - k
    if (place === 1) {
      out += d === 1 ? 'สิบ' : d === 2 ? 'ยี่สิบ' : DIGIT_WORDS[d] + 'สิบ'
    } else if (place === 0) {
      out += d === 1 ? (usesEd ? 'เอ็ด' : 'หนึ่ง') : DIGIT_WORDS[d]
    } else {
      out += DIGIT_WORDS[d] + PLACE_WORDS[place]
    }
  }
  return out
}

/** อ่านจำนวนเต็มบวกเป็นคำไทย เช่น "1000000" → "หนึ่งล้าน" — ใช้ภายในเท่านั้น */
function readInteger(digits: string): string {
  if (!digits || digits === '0') return 'ศูนย์'

  // แบ่งเป็นกลุ่มละ 6 หลักจากขวา → แต่ละกลุ่มเหนือขึ้นไปเติม "ล้าน" ตามลำดับ
  const groups: string[] = []
  for (let end = digits.length; end > 0; end -= 6) {
    groups.push(digits.slice(Math.max(0, end - 6), end))
  }

  let out = ''
  for (let g = groups.length - 1; g >= 0; g--) {
    const group = groups[g].replace(/^0+/, '')
    if (!group) continue
    out += readGroup(group, g === groups.length - 1) + 'ล้าน'.repeat(g)
  }
  return out
}

/** เลข 0 และ "ลบศูนย์" — ถ้าค่าทั้งหมดเป็นศูนย์จะไม่มีการเติม "ลบ" */
function isNonzero(p: ParsedNumber): boolean {
  return p.int !== '0' || /[1-9]/.test(p.frac)
}

/**
 * อ่านจำนวนเป็นคำอ่านไทยทีละหลัก
 * "1001" → "หนึ่งพันเอ็ด" · "1250.5" → "หนึ่งพันสองร้อยห้าสิบจุดห้า" · "-2" → "ลบสอง"
 * ทศนิยมอ่านทีละหลักหลังคำว่า "จุด" · คืน null ถ้าอ่านไม่ได้
 */
export function numberToThaiWords(raw: string | number): string | null {
  const p = parseNumberInput(raw)
  if (!p) return null
  const core =
    readInteger(p.int) +
    (p.frac ? 'จุด' + [...p.frac].map((d) => DIGIT_WORDS[Number(d)]).join('') : '')
  return (p.negative && isNonzero(p) ? 'ลบ' : '') + core
}

/** แปลงเลข 0–9 ในข้อความเป็นเลขไทย ๐–๙ (อักขระอื่นคงเดิม) */
export function toThaiDigits(text: string): string {
  let out = ''
  for (const ch of text) {
    const d = ch.charCodeAt(0) - 48
    out += d >= 0 && d <= 9 ? THAI_DIGIT_CHARS[d] : ch
  }
  return out
}

/** ตัวเลขไทยพร้อมจุลภาคคั่นหลัก เช่น "1250.5" → "๑,๒๕๐.๕" — คืน null ถ้าอ่านไม่ได้ */
export function toThaiNumeral(raw: string | number): string | null {
  const p = parseNumberInput(raw)
  if (!p) return null
  const sign = p.negative && isNonzero(p) ? '-' : ''
  const int = BigInt(p.int).toLocaleString('en-US')
  return toThaiDigits(`${sign}${int}${p.frac ? '.' + p.frac : ''}`)
}

/**
 * อ่านจำนวนเงินเป็นคำไทย (บาท/สตางค์) — กฎการอ่าน:
 * 1. แยกส่วนบาท (จำนวนเต็ม) กับสตางค์ (ทศนิยม 2 ตำแหน่ง) — หลักที่ 3 ตั้งแต่ 5 ขึ้นไปปัดขึ้น 1 สตางค์
 *    และถ้าปัดจนครบ 100 สตางค์จะยกเข้าเป็น 1 บาท
 * 2. ส่วนสตางค์อ่านด้วยกฎเดียวกับจำนวนเต็ม 0–99 เช่น 1 → "หนึ่งสตางค์", 11 → "สิบเอ็ดสตางค์", 25 → "ยี่สิบห้าสตางค์"
 * 3. ไม่มีสตางค์ (หรือปัดแล้วเหลือ 0.00) → ลงท้ายด้วย "บาทถ้วน"
 * 4. ค่าศูนย์ → "ศูนย์บาทถ้วน"
 * 5. บาทเป็นศูนย์แต่มีสตางค์ → ยังขึ้นต้นด้วย "ศูนย์บาท" เพื่อความชัดเจน เช่น 0.25 → "ศูนย์บาทยี่สิบห้าสตางค์"
 * 6. ค่าติดลบ → ขึ้นต้นด้วย "ลบ" ทั้งจำนวน (ส่วน "-0" ถือเป็นศูนย์ ไม่เติมลบ)
 * คืน null ถ้าอ่านไม่ได้
 */
export function bahtText(raw: string | number): string | null {
  const p = parseNumberInput(raw)
  if (!p) return null

  let baht = BigInt(p.int)
  const frac2 = (p.frac + '00').slice(0, 2)
  let satang = Number(frac2)
  if (p.frac.length > 2 && p.frac[2] >= '5') satang += 1
  if (satang >= 100) {
    satang -= 100
    baht += 1n
  }

  const zero = baht === 0n && satang === 0
  const body = zero
    ? 'ศูนย์บาทถ้วน'
    : readInteger(baht.toString()) + 'บาท' + (satang === 0 ? 'ถ้วน' : readInteger(String(satang)) + 'สตางค์')
  return (p.negative && !zero ? 'ลบ' : '') + body
}
