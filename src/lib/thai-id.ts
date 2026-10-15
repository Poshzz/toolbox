// ตรวจความถูกต้องของเลขบัตรประชาชน 13 หลัก (ตามสูตรหลักตรวจสอบของกรมการปกครอง)
// Pure logic — ห้าม import React

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙'
const GROUP_SIZES = [1, 4, 5, 2, 3] // รูปแบบ 1-2345-67890-12-3

export interface ThaiIdResult {
  valid: boolean
  reason?: string
  /** รูปแบบมาตรฐาน 1-2345-67890-12-3 (เท่าที่มีตัวเลข) */
  formatted: string
}

/**
 * ตัดช่องว่าง/ขีด และแปลงเลขไทย ๐–๙ เป็น 0–9 (อักขระอื่นคงไว้ เพื่อให้ตรวจและรายงาน error ได้)
 */
export function normalizeThaiIdInput(raw: string): string {
  let out = ''
  for (const ch of raw) {
    const i = THAI_DIGITS.indexOf(ch)
    if (i >= 0) out += String(i)
    else if (ch !== '-' && !/\s/.test(ch)) out += ch
  }
  return out
}

/** จัดกลุ่มตัวเลขเป็นรูปแบบมาตรฐาน 1-2345-67890-12-3 — รับได้ทั้งเลขล้วนและเลขที่มีอักขระคั่น */
export function formatThaiId(input: string): string {
  const digits = normalizeThaiIdInput(input).replace(/[^0-9]/g, '')
  if (!digits) return ''

  const parts: string[] = []
  let i = 0
  for (const size of GROUP_SIZES) {
    if (i >= digits.length) break
    parts.push(digits.slice(i, i + size))
    i += size
  }
  if (i < digits.length) parts[parts.length - 1] += digits.slice(i) // เกิน 13 หลัก → ต่อท้ายกลุ่มสุดท้าย
  return parts.join('-')
}

/**
 * ตรวจเลขบัตรประชาชน 13 หลัก
 * - ตัดช่องว่าง/ขีด และแปลงเลขไทยให้อัตโนมัติก่อนตรวจ
 * - หลักตรวจสอบ (หลักที่ 13) = (11 - (ผลรวม d[i] × (13 - i) สำหรับ i = 0..11 mod 11)) mod 10
 * - หมายเหตุ: ผ่านการตรวจนี้หมายถึง "รูปแบบ/หลักตรวจสอบถูกต้อง" ไม่ได้ยืนยันว่ามีเลขนี้อยู่จริง
 */
export function validateThaiId(raw: string): ThaiIdResult {
  const normalized = normalizeThaiIdInput(raw)
  const formatted = formatThaiId(normalized)

  if (!normalized) return { valid: false, reason: 'กรุณากรอกเลขบัตรประชาชน', formatted: '' }
  if (/[^0-9]/.test(normalized)) return { valid: false, reason: 'มีอักขระที่ไม่ใช่ตัวเลข', formatted }
  if (normalized.length !== 13) return { valid: false, reason: 'ต้องมี 13 หลัก', formatted }

  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(normalized[i]) * (13 - i)
  const check = (11 - (sum % 11)) % 10
  if (check !== Number(normalized[12])) {
    return { valid: false, reason: 'หลักตรวจสอบไม่ตรง', formatted }
  }
  return { valid: true, formatted }
}
