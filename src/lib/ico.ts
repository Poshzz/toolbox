/**
 * สร้างไฟล์ ICO จาก PNG payloads ตามโครงสร้าง MS-Windows ICONDIR
 * ICONDIR (reserved u16 = 0, type u16 = 1, count u16)
 *   + ICONDIRENTRY ต่อรูป (width u8 — 0 หมายถึง 256, height u8, colorCount u8 = 0,
 *     reserved u8 = 0, planes u16 = 1, bitCount u16 = 32, bytesInRes u32 LE,
 *     imageOffset u32 LE) แล้วตามด้วย PNG ดิบๆ เรียงกัน
 * เป็น pure array ล้วน — ใช้ได้ทั้งใน node (เทส) และเบราว์เซอร์
 */
export interface IcoImage {
  size: number
  png: Uint8Array
}

const DIR_SIZE = 6
const ENTRY_SIZE = 16

export function buildIco(images: IcoImage[]): Uint8Array<ArrayBuffer> {
  const payloadSize = images.reduce((sum, img) => sum + img.png.length, 0)
  const out = new Uint8Array(DIR_SIZE + ENTRY_SIZE * images.length + payloadSize)
  const view = new DataView(out.buffer)
  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type: 1 = icon
  view.setUint16(4, images.length, true) // count

  let offset = DIR_SIZE + ENTRY_SIZE * images.length
  images.forEach((img, i) => {
    const e = DIR_SIZE + i * ENTRY_SIZE
    const dim = img.size >= 256 ? 0 : img.size // u8 เดียว — 0 คือความหมายของ 256
    out[e] = dim
    out[e + 1] = dim
    out[e + 2] = 0 // colorCount (ไม่ใช้กับ PNG)
    out[e + 3] = 0 // reserved
    view.setUint16(e + 4, 1, true) // planes
    view.setUint16(e + 6, 32, true) // bitCount
    view.setUint32(e + 8, img.png.length, true) // bytesInRes
    view.setUint32(e + 12, offset, true) // imageOffset
    out.set(img.png, offset)
    offset += img.png.length
  })

  return out
}
