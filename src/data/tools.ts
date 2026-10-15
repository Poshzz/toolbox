import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import {
  ArrowLeftRight,
  Binary,
  Braces,
  CaseSensitive,
  Clock,
  Dices,
  Eraser,
  FileCode,
  Fingerprint,
  Hash,
  Info,
  KeyRound,
  Landmark,
  Link2,
  Maximize2,
  Palette,
  Percent,
  QrCode,
  Receipt,
  Repeat,
  Ruler,
  ScrollText,
  SearchCode,
  ShieldCheck,
  TrendingUp,
  Type,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ChapterId = 'text' | 'convert' | 'generate' | 'dev' | 'finance' | 'image'

export interface Chapter {
  id: ChapterId
  no: string
  en: string
  th: string
  desc: string
}

export interface ToolMeta {
  id: string
  name: string
  th: string
  desc: string
  chapter: ChapterId
  icon: LucideIcon
  keywords: string
  component: LazyExoticComponent<ComponentType>
}

export const CHAPTERS: Chapter[] = [
  {
    id: 'text',
    no: '01',
    en: 'Text',
    th: 'ข้อความ',
    desc: 'นับ แปลง จัดระเบียบ และตรวจข้อความให้เรียบร้อย',
  },
  {
    id: 'convert',
    no: '02',
    en: 'Convert',
    th: 'แปลงค่า',
    desc: 'แปลงหน่วย ฐานตัวเลข สี และเวลา',
  },
  {
    id: 'generate',
    no: '03',
    en: 'Generate',
    th: 'สุ่มและสร้าง',
    desc: 'สร้าง QR รหัสผ่าน UUID และสุ่มอย่างมีชั้นเชิง',
  },
  {
    id: 'dev',
    no: '04',
    en: 'Dev',
    th: 'สำหรับนักพัฒนา',
    desc: 'ชุดเครื่องมือประจำวันของสาย dev',
  },
  {
    id: 'finance',
    no: '05',
    en: 'Finance',
    th: 'การเงิน',
    desc: 'คำนวณเงิน ดอกเบี้ย และแบ่งบิล',
  },
  {
    id: 'image',
    no: '06',
    en: 'Image',
    th: 'รูปภาพ',
    desc: 'ย่อ แปลง และตรวจข้อมูลรูปในเบราว์เซอร์',
  },
]

export const TOOLS: ToolMeta[] = [
  // ---- 01 Text ----
  {
    id: 'word-counter',
    name: 'Word Counter',
    th: 'นับคำและตัวอักษร',
    desc: 'นับตัวอักษร คำ ประโยค ย่อหน้า พร้อมเวลาในการอ่าน',
    chapter: 'text',
    icon: Type,
    keywords: 'นับคำ นับตัวอักษร word count character count อ่านกี่นาที',
    component: lazy(() => import('../pages/tools/WordCounter')),
  },
  {
    id: 'case-converter',
    name: 'Case Converter',
    th: 'แปลงตัวพิมพ์',
    desc: 'สลับเป็นพิมพ์ใหญ่ เล็ก Title case, camelCase, snake_case และอื่นๆ',
    chapter: 'text',
    icon: CaseSensitive,
    keywords: 'ตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก upper lower camel snake kebab title case',
    component: lazy(() => import('../pages/tools/CaseConverter')),
  },
  {
    id: 'text-cleaner',
    name: 'Text Cleaner',
    th: 'จัดระเบียบข้อความ',
    desc: 'ลบช่องว่างซ้ำ บรรทัดว่าง บรรทัดซ้ำ เรียงลำดับ และลบแท็ก HTML',
    chapter: 'text',
    icon: Eraser,
    keywords: 'ลบช่องว่าง ลบบรรทัดซ้ำ เรียงบรรทัด dedupe sort trim ลบแท็ก html',
    component: lazy(() => import('../pages/tools/TextCleaner')),
  },
  {
    id: 'json-formatter',
    name: 'JSON Formatter',
    th: 'จัดรูปแบบ JSON',
    desc: 'จัดสวย ย่อ และตรวจสอบ JSON พร้อมบอกตำแหน่ง error',
    chapter: 'text',
    icon: Braces,
    keywords: 'json format pretty minify validate ตรวจ json จัดสวย',
    component: lazy(() => import('../pages/tools/JsonFormatter')),
  },
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum',
    th: 'สร้างข้อความตัวอย่าง',
    desc: 'สร้าง Lorem ipsum ตามจำนวนย่อหน้า ประโยค หรือคำ',
    chapter: 'text',
    icon: ScrollText,
    keywords: 'lorem ipsum ข้อความตัวอย่าง dummy text placeholder',
    component: lazy(() => import('../pages/tools/LoremIpsum')),
  },

  // ---- 02 Convert ----
  {
    id: 'unit-converter',
    name: 'Unit Converter',
    th: 'แปลงหน่วยวัด',
    desc: 'ความยาว น้ำหนัก อุณหภูมิ พื้นที่ ปริมาตร ความเร็ว และข้อมูลดิจิทัล',
    chapter: 'convert',
    icon: Ruler,
    keywords: 'แปลงหน่วย วัด length weight temperature นิ้ว เซนติเมตร กิโลกรัม ปอนด์',
    component: lazy(() => import('../pages/tools/UnitConverter')),
  },
  {
    id: 'base-converter',
    name: 'Base Converter',
    th: 'แปลงฐานตัวเลข',
    desc: 'แปลงเลขระหว่างฐาน 2, 8, 10 และ 16 แบบทันที',
    chapter: 'convert',
    icon: Binary,
    keywords: 'binary decimal hex octal ฐานสอง ฐานสิบ ฐานสิบหก เลขฐาน',
    component: lazy(() => import('../pages/tools/BaseConverter')),
  },
  {
    id: 'color-converter',
    name: 'Color Converter',
    th: 'แปลงค่าสี',
    desc: 'HEX, RGB, HSL พร้อมเฉดสี และเช็คคอนทราสต์ตาม WCAG',
    chapter: 'convert',
    icon: Palette,
    keywords: 'สี color hex rgb hsl คอนทราสต์ contrast wcag palette เฉดสี',
    component: lazy(() => import('../pages/tools/ColorConverter')),
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    th: 'แปลงวันที่และเวลา',
    desc: 'Unix timestamp เป็นวันที่อ่านออก และกลับกัน พร้อมเวลาไทย',
    chapter: 'convert',
    icon: Clock,
    keywords: 'unix timestamp วันที่ เวลา epoch แปลงเวลา iso 8601',
    component: lazy(() => import('../pages/tools/TimestampConverter')),
  },

  // ---- 03 Generate ----
  {
    id: 'qr-generator',
    name: 'QR Generator',
    th: 'สร้าง QR Code',
    desc: 'สร้าง QR จากข้อความหรือลิงก์ เลือกขนาดและระดับแก้ error ได้',
    chapter: 'generate',
    icon: QrCode,
    keywords: 'qr code คิวอาร์ สร้าง qr ลิงก์',
    component: lazy(() => import('../pages/tools/QrGenerator')),
  },
  {
    id: 'password-generator',
    name: 'Password Generator',
    th: 'สุ่มรหัสผ่าน',
    desc: 'สุ่มรหัสผ่านที่ตั้งความยาวและรูปแบบได้ พร้อมวัดความแข็งแรง',
    chapter: 'generate',
    icon: KeyRound,
    keywords: 'รหัสผ่าน password สุ่ม strong password ความปลอดภัย',
    component: lazy(() => import('../pages/tools/PasswordGenerator')),
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    th: 'สร้าง UUID',
    desc: 'สร้าง UUID v4 ทีละหลายรายการ คัดลอกหรือดาวน์โหลดได้',
    chapter: 'generate',
    icon: Fingerprint,
    keywords: 'uuid guid สุ่ม id v4',
    component: lazy(() => import('../pages/tools/UuidGenerator')),
  },
  {
    id: 'random-picker',
    name: 'Random Picker',
    th: 'สุ่มเลข เต๋า จับฉลาก',
    desc: 'สุ่มตัวเลข ลูกเต๋า เหรียญหัวก้อย และจับฉลากจากรายการ',
    chapter: 'generate',
    icon: Dices,
    keywords: 'สุ่ม ลูกเต๋า dice เหรียญ coin toss จับฉลาก lottery random number',
    component: lazy(() => import('../pages/tools/RandomPicker')),
  },

  // ---- 04 Dev ----
  {
    id: 'base64',
    name: 'Base64',
    th: 'เข้ารหัส Base64',
    desc: 'เข้ารหัสและถอดรหัส Base64 รองรับภาษาไทยและอีโมจิ',
    chapter: 'dev',
    icon: FileCode,
    keywords: 'base64 encode decode เข้ารหัส ถอดรหัส',
    component: lazy(() => import('../pages/tools/Base64Tool')),
  },
  {
    id: 'hash',
    name: 'Hash Generator',
    th: 'สร้างค่าแฮช',
    desc: 'คำนวณ MD5, SHA-1, SHA-256 และ SHA-512 จากข้อความ',
    chapter: 'dev',
    icon: Hash,
    keywords: 'hash md5 sha1 sha256 sha512 checksum แฮช',
    component: lazy(() => import('../pages/tools/HashTool')),
  },
  {
    id: 'url-tools',
    name: 'URL Tools',
    th: 'เข้ารหัสและแกะ URL',
    desc: 'Encode/Decode URL และแกะ query string เป็นตาราง',
    chapter: 'dev',
    icon: Link2,
    keywords: 'url encode decode query string แกะลิงก์ พารามิเตอร์',
    component: lazy(() => import('../pages/tools/UrlTool')),
  },
  {
    id: 'jwt-decoder',
    name: 'JWT Decoder',
    th: 'ถอดรหัส JWT',
    desc: 'อ่าน header และ payload ของ JWT พร้อมเช็ควันหมดอายุและลายเซ็น HS256',
    chapter: 'dev',
    icon: ShieldCheck,
    keywords: 'jwt token json web token decode ถอดรหัส hs256 verify',
    component: lazy(() => import('../pages/tools/JwtDecoder')),
  },
  {
    id: 'diff-checker',
    name: 'Diff Checker',
    th: 'เทียบข้อความ',
    desc: 'เทียบข้อความสองชุดแบบทีละบรรทัด เห็นชัดว่าอะไรเพิ่ม อะไรหาย',
    chapter: 'dev',
    icon: ArrowLeftRight,
    keywords: 'diff เทียบข้อความ เปรียบเทียบ compare text',
    component: lazy(() => import('../pages/tools/DiffChecker')),
  },
  {
    id: 'regex-tester',
    name: 'Regex Tester',
    th: 'ทดสอบ Regex',
    desc: 'ทดสอบ regex แบบสดๆ ไฮไลต์ผลที่เจอ พร้อมรายการกลุ่มที่จับได้',
    chapter: 'dev',
    icon: SearchCode,
    keywords: 'regex regular expression ทดสอบ ไฮไลต์ จับกลุ่ม',
    component: lazy(() => import('../pages/tools/RegexTester')),
  },

  // ---- 05 Finance ----
  {
    id: 'percent-calc',
    name: 'Percentage Calculator',
    th: 'คำนวณเปอร์เซ็นต์',
    desc: 'หาเปอร์เซ็นต์ของจำนวน เปอร์เซ็นต์เทียบ และส่วนเพิ่ม-ลด',
    chapter: 'finance',
    icon: Percent,
    keywords: 'เปอร์เซ็นต์ percent ส่วนลด เพิ่ม ลด',
    component: lazy(() => import('../pages/tools/PercentCalc')),
  },
  {
    id: 'interest-calc',
    name: 'Interest Calculator',
    th: 'คำนวณดอกเบี้ย',
    desc: 'ดอกเบี้ยธรรมดาและทบต้น เลือกความถี่ทบได้ พร้อมตารางรายปี',
    chapter: 'finance',
    icon: TrendingUp,
    keywords: 'ดอกเบี้ย interest ทบต้น compound เงินฝาก เงินออม',
    component: lazy(() => import('../pages/tools/InterestCalc')),
  },
  {
    id: 'bill-split',
    name: 'Bill Split',
    th: 'แบ่งบิล',
    desc: 'หารบิลพร้อมทิปต่อคน สรุปข้อความส่งต่อให้เพื่อนได้เลย',
    chapter: 'finance',
    icon: Receipt,
    keywords: 'แบ่งบิล หารบิล ทิป tip bill split ต่อคน',
    component: lazy(() => import('../pages/tools/BillSplit')),
  },
  {
    id: 'loan-calc',
    name: 'Loan Calculator',
    th: 'คำนวณค่างวด',
    desc: 'ผ่อนบ้าน ผ่อนรถ ผ่อนอะไรก็ได้ — ดอกเบี้ยลดต้นลดดอก',
    chapter: 'finance',
    icon: Landmark,
    keywords: 'ค่างวด ผ่อน loan เงินกู้ ดอกเบี้ย บ้าน รถ monthly payment',
    component: lazy(() => import('../pages/tools/LoanCalc')),
  },

  // ---- 06 Image ----
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    th: 'ย่อและขยายรูป',
    desc: 'ย่อ ขยาย ตามขนาดหรือเปอร์เซ็นต์ โดยรูปไม่ถูกอัปโหลดออกไป',
    chapter: 'image',
    icon: Maximize2,
    keywords: 'ย่อรูป resize ขยายรูป ขนาดภาพ',
    component: lazy(() => import('../pages/tools/ImageResizer')),
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    th: 'แปลงไฟล์รูป',
    desc: 'แปลง PNG, JPEG และ WebP พร้อมปรับคุณภาพได้',
    chapter: 'image',
    icon: Repeat,
    keywords: 'แปลงรูป png jpeg jpg webp convert รูปภาพ',
    component: lazy(() => import('../pages/tools/ImageConverter')),
  },
  {
    id: 'image-info',
    name: 'Image Info',
    th: 'ข้อมูลรูปภาพ',
    desc: 'ดูขนาด มิติ อัตราส่วน และสีเฉลี่ยของรูปอย่างรวดเร็ว',
    chapter: 'image',
    icon: Info,
    keywords: 'ข้อมูลรูป ขนาดภาพ มิติ ratio metadata สีเฉลี่ย',
    component: lazy(() => import('../pages/tools/ImageInfo')),
  },
]

export function getTool(id: string) {
  return TOOLS.find((t) => t.id === id)
}

export function chapterTools(chapter: ChapterId) {
  return TOOLS.filter((t) => t.chapter === chapter)
}

export function chapterById(id: ChapterId) {
  return CHAPTERS.find((c) => c.id === id)!
}
