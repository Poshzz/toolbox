import { useEffect, useState } from 'react'
import { Field, FileDrop, Segmented, Stat } from '../../components/ui'
import { download, formatBytes } from '../../lib/utils'

type Mime = 'image/png' | 'image/jpeg' | 'image/webp'

const FORMATS: Array<{ value: Mime; label: string }> = [
  { value: 'image/png', label: 'PNG' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/webp', label: 'WebP' },
]

function extFor(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'png'
}

export default function ImageConverter() {
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [format, setFormat] = useState<Mime>('image/png')
  const [quality, setQuality] = useState(0.9)
  const [outBlob, setOutBlob] = useState<Blob | null>(null)
  const [outUrl, setOutUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setImg(null)
    if (!file) return
    const url = URL.createObjectURL(file)
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (!cancelled) setImg(image)
    }
    image.onerror = () => {
      if (!cancelled) setError('เปิดไฟล์นี้ไม่ได้ — รองรับเฉพาะไฟล์รูปภาพ')
    }
    image.src = url
    return () => {
      cancelled = true
      URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(
    () => () => {
      if (outUrl) URL.revokeObjectURL(outUrl)
    },
    [outUrl],
  )

  // ล้างผลลัพธ์เก่าทุกครั้งที่รูปเปลี่ยน
  useEffect(() => {
    setOutBlob(null)
    setOutUrl('')
    setError('')
  }, [img])

  const convert = async () => {
    if (!img) return
    try {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('เบราว์เซอร์ไม่รองรับ Canvas')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      if (format === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, format, quality))
      if (!blob) throw new Error('สร้างไฟล์ผลลัพธ์ไม่สำเร็จ')
      setOutBlob(blob)
      setOutUrl(URL.createObjectURL(blob))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'แปลงไฟล์ไม่สำเร็จ')
    }
  }

  const diff = file && outBlob ? ((outBlob.size - file.size) / file.size) * 100 : 0

  return (
    <div className="flex flex-col gap-5">
      <div>
        <FileDrop accept="image/*" onFile={setFile} />
        <p className="mt-2 text-center text-xs text-inksoft">
          ข้อมูลรูปไม่ถูกอัปโหลด — ประมวลผลในเบราว์เซอร์ของคุณ 100%
        </p>
      </div>

      {file && img && (
        <div className="card flex flex-col gap-4 p-5 md:p-6">
          <img
            src={img.src}
            alt="รูปต้นฉบับ"
            className="max-h-56 w-auto rounded-2xl border border-ink/10"
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="ชนิด" value={file.type || '—'} mono />
            <Stat label="ขนาด" value={formatBytes(file.size)} />
            <Stat label="มิติ" value={`${img.naturalWidth} × ${img.naturalHeight} px`} />
          </div>
        </div>
      )}

      <div className="card p-5 md:p-6">
        <h3 className="label">รูปแบบเป้าหมาย</h3>
        <Segmented options={FORMATS} value={format} onChange={setFormat} />

        {format !== 'image/png' && (
          <div className="mt-4">
            <Field
              label={`คุณภาพ (quality) — ${quality.toFixed(2)}`}
              hint="ยิ่งค่าต่ำ ไฟล์ยิ่งเล็ก แต่รายละเอียดจะลดลง"
            >
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={quality}
                onChange={(e) => setQuality(Number(e.target.value))}
                className="w-full cursor-pointer accent-rust"
              />
            </Field>
          </div>
        )}

        {format === 'image/jpeg' && (
          <p className="mt-3 text-xs text-inksoft">
            JPEG ไม่รองรับความโปร่งใส — พื้นหลังโปร่งใสจะถูกเติมเป็นสีขาว
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
            ✗ {error}
          </p>
        )}

        <div className="mt-5">
          <button type="button" className="btn btn-rust" onClick={convert} disabled={!img}>
            แปลงไฟล์
          </button>
        </div>
      </div>

      {outUrl && outBlob && file && (
        <div className="card p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl">ผลลัพธ์</h3>
            <button
              type="button"
              className="btn"
              onClick={() => download(outBlob, `converted.${extFor(outBlob.type)}`)}
            >
              ดาวน์โหลดรูป
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start">
            <img
              src={outUrl}
              alt="ผลลัพธ์"
              className="max-h-80 w-auto rounded-2xl border border-ink/10"
            />
            <div className="grid flex-1 gap-4 sm:grid-cols-3">
              <Stat label="ก่อน" value={`${file.type} · ${formatBytes(file.size)}`} mono />
              <Stat label="หลัง" value={`${outBlob.type} · ${formatBytes(outBlob.size)}`} mono />
              <Stat
                label="ผลต่าง"
                value={`${diff < 0 ? 'เล็กลง' : 'ใหญ่ขึ้น'} ${Math.abs(diff).toFixed(1)}%`}
                mono
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
