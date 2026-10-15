// ตรรกะล้วนสำหรับสร้าง slug — ไม่มี React
//
// รองรับอักษรละติน + อักษรไทย (ค่าปริยายเก็บอักษรไทยไว้ เพราะ URL สมัยใหม่
// รองรับ Unicode และเบราว์เซอร์จะ encode เป็น %E0... ให้เอง)
// โหมดทับศัพท์ใช้ตารางแปลงแบบง่ายตามลำดับตัวอักษรเท่านั้น — ไม่จัดเรียงสระหน้า
// (เ แ โ ใ ไ) ให้ตรงเสียงจริงและไม่ออกเสียงวรรณยุกต์ จึงเป็นเพียง "ประมาณ"

export interface SlugOptions {
  separator: '-' | '_'
  lowercase: boolean
  keepThai: boolean
  /** ตัดวรรณยุกต์ละติน (é → e) — วรรณยุกต์ไทยไม่ถูกแตะ เพราะอยู่นอกช่วง combining marks ละติน */
  stripDiacritics: boolean
  /** ทับศัพท์ไทยเป็นละตินแบบประมาณด้วยตารางด้านล่าง (ทำงานก่อนล้างอักขระอื่น ๆ) */
  transliterate: boolean
}

export const DEFAULT_SLUG_OPTIONS: SlugOptions = {
  separator: '-',
  lowercase: true,
  keepThai: true,
  stripDiacritics: true,
  transliterate: false,
}

/** ตารางทับศัพท์แบบง่าย: พยัญชนะ สระ วรรณยุกต์ (วรรณยุกต์/การันต์ = ตัดออก) และเลขไทย */
const THAI_MAP: Record<string, string> = {
  // พยัญชนะ
  'ก': 'k', 'ข': 'kh', 'ฃ': 'kh', 'ค': 'kh', 'ฅ': 'kh', 'ฆ': 'kh',
  'ง': 'ng', 'จ': 'ch', 'ฉ': 'ch', 'ช': 'ch', 'ซ': 's', 'ฌ': 'ch', 'ญ': 'y',
  'ฎ': 'd', 'ฏ': 't', 'ฐ': 'th', 'ฑ': 'th', 'ฒ': 'th', 'ณ': 'n',
  'ด': 'd', 'ต': 't', 'ถ': 'th', 'ท': 'th', 'ธ': 'th', 'น': 'n',
  'บ': 'b', 'ป': 'p', 'ผ': 'ph', 'ฝ': 'f', 'พ': 'ph', 'ฟ': 'f', 'ภ': 'ph', 'ม': 'm',
  'ย': 'y', 'ร': 'r', 'ล': 'l', 'ว': 'w', 'ศ': 's', 'ษ': 's', 'ส': 's', 'ห': 'h', 'ฬ': 'l', 'อ': 'o', 'ฮ': 'h',
  // สระ / สระเกิน / ฤๅ
  'ะ': 'a', 'ั': 'a', 'า': 'a', 'ำ': 'am', 'ิ': 'i', 'ี': 'i', 'ึ': 'ue', 'ื': 'ue', 'ุ': 'u', 'ู': 'u',
  'เ': 'e', 'แ': 'ae', 'โ': 'o', 'ใ': 'ai', 'ไ': 'ai', 'ฤ': 'rue', 'ฦ': 'lue',
  // วรรณยุกต์ / การันต์ / ซ้ำ = ตัดออก
  '็': '', '่': '', '้': '', '๊': '', '๋': '', '์': '', 'ํ': '', 'ฺ': '', 'ๆ': '', 'ฯ': '',
  // สัญลักษณ์เงินบาท
  '฿': 'thb',
  // เลขไทย
  '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4',
  '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9',
}

function transliterateThai(text: string): string {
  let out = ''
  for (const ch of text) out += THAI_MAP[ch] ?? ch
  return out
}

export function slugify(text: string, options: Partial<SlugOptions> = {}): string {
  const opts = { ...DEFAULT_SLUG_OPTIONS, ...options }
  const sep = opts.separator
  // โหมดทับศัพท์: แปลงไทยเป็นละตินก่อน แล้วจึงไม่เก็บอักษรไทยที่เหลือ
  const keepThai = opts.transliterate ? false : opts.keepThai
  let s = text

  if (opts.transliterate) s = transliterateThai(s)
  if (opts.stripDiacritics) {
    // NFD แยกตัวอักษรละติน+วรรณยุกต์ แล้วลบ combining marks ละติน (\u0300-\u036f)
    // จากนั้น NFC ประกอบคืน — จำเป็นเพราะ ำ (U+0E33) จะถูกแยกเป็น ํ + า เป็นการชั่วคราว
    s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').normalize('NFC')
  }
  if (opts.lowercase) s = s.toLowerCase()
  // apostrophe ทุกแบบตัดออกโดยไม่เว้นช่องว่าง (Tom's → toms)
  s = s.replace(/['’`´]/g, '')

  const letters = opts.lowercase ? 'a-z0-9' : 'a-zA-Z0-9'
  const allowed = keepThai ? `${letters}\\u0E00-\\u0E7F` : letters
  s = s.replace(new RegExp(`[^${allowed}]+`, 'g'), sep)
  // ยุบตัวคั่นซ้ำแล้วตัดหัวท้าย
  s = s.replace(new RegExp(`${sep}+`, 'g'), sep).replace(new RegExp(`^${sep}+|${sep}+$`, 'g'), '')
  return s
}
