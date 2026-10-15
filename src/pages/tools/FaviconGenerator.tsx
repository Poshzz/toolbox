import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Download } from 'lucide-react'
import { CopyField, Field, FileDrop, Segmented, Stat } from '../../components/ui'
import { download, formatBytes } from '../../lib/utils'
import { buildIco, type IcoImage } from '../../lib/ico'

type Padding = '0' | '8' | '16'
type BgMode = 'none' | 'paper' | 'custom'

const PAPER = '#F4EDDE'
const SIZES = [16, 32, 48, 180, 192, 512] as const
const ICO_SIZES = [16, 32, 48] as const

const PAD_OPTIONS: Array<{ value: Padding; label: string }> = [
  { value: '0', label: '0%' },
  { value: '8', label: '8%' },
  { value: '16', label: '16%' },
]

const BG_OPTIONS: Array<{ value: BgMode; label: string }> = [
  { value: 'none', label: 'ไม่มี – โปร่งใส' },
  { value: 'paper', label: `กระดาษ ${PAPER}` },
  { value: 'custom', label: 'เลือกสีเอง' },
]

const HTML_SNIPPET = [
  '<link rel="icon" href="/favicon.ico" sizes="any">',
  '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16.png">',
  '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">',
  '<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48.png">',
  '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">',
  '<link rel="manifest" href="/site.webmanifest">',
].join('\n')

const MANIFEST_SNIPPET = [
  '{',
  '  "name": "ชื่อเว็บไซต์ของฉัน",',
  '  "short_name": "ชื่อย่อ",',
  '  "icons": [',
  '    { "src": "/favicon-192.png", "sizes": "192x192", "type": "image/png" },',
  '    { "src": "/favicon-512.png", "sizes": "512x512", "type": "image/png" }',
  '  ]',
  '}',
].join('\n')

// ลายตารางหมากรุกไว้โชว์ความโปร่งใสของไอคอน
const CHECKER: CSSProperties = {
  backgroundImage:
    'linear-gradient(45deg, rgba(34,27,18,0.13) 25%, transparent 25%, transparent 75%, rgba(34,27,18,0.13) 75%), linear-gradient(45deg, rgba(34,27,18,0.13) 25%, transparent 25%, transparent 75%, rgba(34,27,18,0.13) 75%)',
  backgroundSize: '12px 12px',
  backgroundPosition: '0 0, 6px 6px',
}

function fileNameFor(size: number) {
  return size === 180 ? 'apple-touch-icon.png' : `favicon-${size}.png`
}

/** วาดรูปแบบ contain-fit ลง canvas ที่เตรียมไว้แล้ว (สี่เหลี่ยมจัตุรัส size × size) */
function paintIcon(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  size: number,
  padPct: number,
  bg: string | null,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('เบราว์เซอร์ไม่รองรับ Canvas')
  const iw = img.naturalWidth
  const ih = img.naturalHeight

  const pad = Math.round((size * padPct) / 100)
  const box = Math.max(1, size - pad * 2)
  const scale = Math.min(box / iw, box / ih)
  const dw = Math.max(1, Math.round(iw * scale))
  const dh = Math.max(1, Math.round(ih * scale))

  ctx.clearRect(0, 0, size, size)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  if (bg) {
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, size, size)
  }

  // รูปใหญ่ย่อทีเดียวจะแตกเป็นรอยหยัก — เลือกย่อครึ่งทีละขั้น (step-down halving)
  // จนเหลือไม่เกิน 2 เท่าของขนาดเป้าหมาย แล้วค่อยวาดรอบสุดท้าย
  let src: CanvasImageSource = img
  let sw = iw
  let sh = ih
  while (sw > dw * 2) {
    const half = document.createElement('canvas')
    half.width = Math.max(1, Math.floor(sw / 2))
    half.height = Math.max(1, Math.floor(sh / 2))
    const hctx = half.getContext('2d')
    if (!hctx) break
    hctx.imageSmoothingEnabled = true
    hctx.imageSmoothingQuality = 'high'
    hctx.drawImage(src, 0, 0, half.width, half.height)
    src = half
    sw = half.width
    sh = half.height
  }

  ctx.drawImage(src, Math.round((size - dw) / 2), Math.round((size - dh) / 2), dw, dh)
}

/** สร้าง canvas ใหม่ขนาด size × size แล้ววาดไอคอนลงไป — ใช้ตอนดาวน์โหลด */
function renderIcon(
  img: HTMLImageElement,
  size: number,
  padPct: number,
  bg: string | null,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  paintIcon(canvas, img, size, padPct, bg)
  return canvas
}

function toPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('สร้างไฟล์ PNG ไม่สำเร็จ'))
    }, 'image/png')
  })
}

export default function FaviconGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [pad, setPad] = useState<Padding>('0')
  const [bg, setBg] = useState<BgMode>('none')
  const [custom, setCustom] = useState(PAPER)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const previewRefs = useRef(new Map<number, HTMLCanvasElement>())

  useEffect(() => {
    setImg(null)
    setError('')
    if (!file) return
    const url = URL.createObjectURL(file)
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (cancelled) return
      if (image.naturalWidth === 0 || image.naturalHeight === 0) {
        setError('อ่านมิติของรูปไม่ได้ — ถ้าเป็น SVG ให้กำหนด width/height ในไฟล์ก่อน')
        return
      }
      setImg(image)
    }
    image.onerror = () => {
      if (!cancelled) {
        setError('เปิดไฟล์นี้ไม่ได้ — รองรับเฉพาะไฟล์รูปภาพ (PNG / JPG / WebP / SVG)')
      }
    }
    image.src = url
    return () => {
      cancelled = true
      URL.revokeObjectURL(url)
    }
  }, [file])

  const bgColor = bg === 'none' ? null : bg === 'paper' ? PAPER : custom

  // วาดตัวอย่างสดๆ ลง canvas จริงของแต่ละขนาด ทุกครั้งที่รูปหรือตัวเลือกเปลี่ยน
  useEffect(() => {
    for (const size of SIZES) {
      const canvas = previewRefs.current.get(size)
      if (!canvas) continue
      const ctx = canvas.getContext('2d')
      if (!ctx) continue
      if (!img) {
        ctx.clearRect(0, 0, size, size)
        continue
      }
      try {
        paintIcon(canvas, img, size, Number(pad), bgColor)
      } catch {
        ctx.clearRect(0, 0, size, size)
      }
    }
  }, [img, pad, bgColor])

  const downloadPng = async (size: number) => {
    if (!img) return
    setBusy(true)
    try {
      const blob = await toPngBlob(renderIcon(img, size, Number(pad), bgColor))
      // download() สร้าง object URL แล้ว revoke ทันทีหลังคลิก — ไม่มี URL ค้าง
      download(blob, fileNameFor(size))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ดาวน์โหลดไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  const downloadIco = async () => {
    if (!img) return
    setBusy(true)
    try {
      const images: IcoImage[] = []
      for (const size of ICO_SIZES) {
        const blob = await toPngBlob(renderIcon(img, size, Number(pad), bgColor))
        images.push({ size, png: new Uint8Array(await blob.arrayBuffer()) })
      }
      download(new Blob([buildIco(images)], { type: 'image/x-icon' }), 'favicon.ico')
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'สร้าง favicon.ico ไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <FileDrop
          accept="image/*"
          onFile={setFile}
          label="ลากรูปมาวาง หรือคลิกเพื่อเลือกรูป (PNG / JPG / WebP / SVG)"
        />
        <p className="mt-2 text-center text-xs text-inksoft">
          ทุกอย่างทำในเครื่อง ไม่มีการอัปโหลด — ประมวลผลในเบราว์เซอร์ของคุณ 100%
        </p>
      </div>

      {error && (
        <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
          ✗ {error}
        </p>
      )}

      {file && img && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="ชื่อไฟล์" value={file.name} />
          <Stat label="มิติเดิม" value={`${img.naturalWidth} × ${img.naturalHeight} px`} />
          <Stat label="ขนาดไฟล์" value={formatBytes(file.size)} />
        </div>
      )}

      <div className="card p-5 md:p-6">
        <h3 className="label">ตัวเลือกไอคอน</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="ระยะขอบ (padding)" hint="เว้นขอบรอบรูป — ช่วยให้ไอคอนขนาดเล็กอ่านง่ายขึ้น">
            <Segmented options={PAD_OPTIONS} value={pad} onChange={setPad} />
          </Field>
          <Field label="พื้นหลัง" hint="ไอคอนโปร่งใสใช้ได้กับแท็บเบราว์เซอร์สมัยใหม่">
            <Segmented options={BG_OPTIONS} value={bg} onChange={setBg} />
            {bg === 'custom' && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="color"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  className="h-10 w-24 cursor-pointer rounded-xl border border-ink/15 bg-crema p-1"
                />
                <span className="font-mono text-sm text-inksoft">{custom.toUpperCase()}</span>
              </div>
            )}
          </Field>
        </div>
      </div>

      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl">ตัวอย่างไอคอน</h3>
          <button
            type="button"
            className="btn btn-rust"
            onClick={downloadIco}
            disabled={!img || busy}
          >
            <Download className="h-4 w-4" />
            {busy ? 'กำลังสร้าง…' : 'ดาวน์โหลด favicon.ico'}
          </button>
        </div>

        {!img ? (
          <p className="mt-3 text-sm text-inksoft">ยังไม่มีรูป — เลือกไฟล์ก่อนนะ</p>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-4">
              {SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-2">
                  <div className="rounded-xl border border-ink/10 p-1.5" style={CHECKER}>
                    <canvas
                      ref={(el) => {
                        if (el) {
                          previewRefs.current.set(size, el)
                        } else {
                          previewRefs.current.delete(size)
                        }
                      }}
                      width={size}
                      height={size}
                      className="block"
                      style={{ width: Math.min(size, 96), height: Math.min(size, 96) }}
                      aria-label={`ตัวอย่าง ${size}×${size}`}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-inksoft">
                    {size}×{size}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost px-2.5 py-1 text-[11px]"
                    onClick={() => downloadPng(size)}
                    disabled={!img || busy}
                    title={`ดาวน์โหลด ${fileNameFor(size)}`}
                  >
                    <Download className="h-3 w-3" />
                    PNG
                  </button>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-inksoft">
              favicon.ico รวม 16 + 32 + 48 px · ขนาด 180 บันทึกเป็น apple-touch-icon.png ให้อัตโนมัติ ·
              192 และ 512 ใช้คู่กับ site.webmanifest
            </p>
          </>
        )}
      </div>

      <div className="card p-5 md:p-6">
        <h3 className="font-display text-xl">โค้ดพร้อมใช้</h3>
        <p className="mt-1 text-xs text-inksoft">
          วางไฟล์ที่ดาวน์โหลดไว้ในโฟลเดอร์ public/ ของเว็บคุณ แล้วแปะโค้ดด้านล่าง
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <span className="label">HTML (ใน &lt;head&gt;)</span>
          <CopyField value={HTML_SNIPPET} />
          <span className="label mt-2">site.webmanifest</span>
          <CopyField value={MANIFEST_SNIPPET} />
        </div>
      </div>
    </div>
  )
}
