/**
 * ตรรกะสำหรับเครื่องมือ PDF (รวมไฟล์ / แยกหน้า) — ประมวลผลในเบราว์เซอร์ 100%
 * parsePageRanges เป็น pure function (ทดสอบได้ใน node)
 * ส่วน mergePdfs / extractPages / countPages เป็น wrapper บางๆ ของ pdf-lib
 */
import { PDFDocument } from 'pdf-lib'

/** แปลง error จาก pdf-lib เป็นข้อความไทยที่ผู้ใช้เข้าใจ */
export function thaiPdfErrorMessage(e: unknown): string {
  const msg = e instanceof Error ? e.message : ''
  if (/encrypted/i.test(msg)) return 'ไฟล์นี้มีการป้องกันด้วยรหัสผ่าน'
  return 'อ่านไฟล์ PDF ไม่ได้ (อาจเสียหายหรือไม่ใช่ PDF)'
}

/** อ่าน PDF พร้อมแปลง error ของ pdf-lib เป็นข้อความไทย */
async function loadPdf(data: Uint8Array): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(data)
  } catch (e) {
    throw new Error(thaiPdfErrorMessage(e))
  }
}

/** จำนวนหน้าของไฟล์ PDF (ใช้ตรวจช่วงหน้าแบบ live ในหน้าเว็บ) */
export async function countPages(data: Uint8Array): Promise<number> {
  return (await loadPdf(data)).getPageCount()
}

/** แปลงข้อความช่วงหน้า เช่น "1-3,5,8-10" → ลำดับหน้าจริง (1-based)
 *  - ตัดช่องว่างหัวท้าย และรอบ '-' (เช่น "1 - 3")
 *  - ผู้ใช้ระบุซ้ำได้ตามต้องการ (ใช้ทำสำเนาหน้า) และคงลำดับตามที่พิมพ์ เช่น "3,3,1" → [3,3,1]
 *  - ช่วง 2-2 คือหน้าเดียว
 */
export function parsePageRanges(input: string, total: number): { pages?: number[]; error?: string } {
  const raw = input.trim()
  if (!raw) return { error: 'กรุณาระบุช่วงหน้า เช่น 1-3,5' }

  const outOfBounds = (n: number) =>
    `หน้า ${n} อยู่นอกช่วง — ไฟล์นี้มี ${total} หน้า (ใช้ได้ 1-${total})`

  const pages: number[] = []
  for (const part of raw.split(',')) {
    const t = part.trim()
    const single = /^\d+$/.exec(t)
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(t)

    if (range) {
      const a = Number(range[1])
      const b = Number(range[2])
      if (b < a) return { error: `ช่วงหน้า "${t}" ต้องเรียงจากน้อยไปมาก เช่น ${b}-${a}` }
      if (a < 1 || a > total) return { error: outOfBounds(a) }
      if (b < 1 || b > total) return { error: outOfBounds(b) }
      for (let p = a; p <= b; p++) pages.push(p)
    } else if (single) {
      const p = Number(t)
      if (p < 1 || p > total) return { error: outOfBounds(p) }
      pages.push(p)
    } else {
      return { error: `รูปแบบไม่ถูกต้อง: "${t}" — ใช้ตัวเลขหรือช่วง เช่น 1-3,5` }
    }
  }
  return { pages }
}

/** รวม PDF หลายไฟล์ตามลำดับที่ส่งมา (คัดลอกทุกหน้าของแต่ละไฟล์) */
export async function mergePdfs(inputs: Uint8Array[]): Promise<Uint8Array<ArrayBuffer>> {
  if (inputs.length === 0) throw new Error('ไม่มีไฟล์ให้รวม — เลือกไฟล์ PDF ก่อน')

  const out = await PDFDocument.create()
  for (const input of inputs) {
    const src = await loadPdf(input)
    const copied = await out.copyPages(src, src.getPageIndices())
    for (const page of copied) out.addPage(page)
  }
  // หมายเหตุ: pdf-lib เขียน Producer เป็นของตัวเองทุกครั้งใน save() — กำหนดได้แค่ Creator
  out.setCreator('Toolbox')
  // save() คืน Uint8Array ธรรมดา (ArrayBuffer) — cast ให้ตรงกับ type ที่รับเข้า Blob ได้
  return (await out.save()) as Uint8Array<ArrayBuffer>
}

/** ดึงเฉพาะหน้าที่ต้องการตามลำดับที่ให้มา — รองรับระบุซ้ำเพื่อทำสำเนา */
export async function extractPages(
  data: Uint8Array,
  pages: number[],
): Promise<Uint8Array<ArrayBuffer>> {
  const src = await loadPdf(data)
  const total = src.getPageCount()
  for (const p of pages) {
    if (!Number.isInteger(p) || p < 1 || p > total)
      throw new Error(`หน้า ${p} อยู่นอกช่วง — ไฟล์นี้มี ${total} หน้า (ใช้ได้ 1-${total})`)
  }

  const out = await PDFDocument.create()
  const copied = await out.copyPages(
    src,
    pages.map((p) => p - 1),
  )
  for (const page of copied) out.addPage(page)
  out.setCreator('Toolbox')
  return (await out.save()) as Uint8Array<ArrayBuffer>
}
