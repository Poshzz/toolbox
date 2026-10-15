import { useEffect, useState } from 'react'
import { CheckRow, Field, FileDrop, Input, Select, Stat } from '../../components/ui'
import { download, formatBytes } from '../../lib/utils'

type Format = 'keep' | 'png' | 'jpeg' | 'webp'

const FORMATS: Array<{ value: Format; label: string }> = [
  { value: 'keep', label: 'คงรูปแบบเดิม (PNG สำหรับอื่นๆ)' },
  { value: 'png', label: 'PNG' },
  { value: 'jpeg', label: 'JPEG' },
  { value: 'webp', label: 'WebP' },
]

const QUICK = [25, 50, 75, 100]

function targetMime(format: Format, file: File | null): string {
  if (format !== 'keep') return `image/${format}`
  const type = file?.type ?? ''
  if (type === 'image/png' || type === 'image/jpeg' || type === 'image/webp') return type
  return 'image/png'
}

function extFor(mime: string): string {
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'png'
}

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lock, setLock] = useState(true)
  const [format, setFormat] = useState<Format>('keep')
  const [quality, setQuality] = useState(0.9)
  const [outBlob, setOutBlob] = useState<Blob | null>(null)
  const [outUrl, setOutUrl] = useState('')
  const [outDims, setOutDims] = useState<{ w: number; h: number } | null>(null)
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

  // ล้างผลลัพธ์เก่า และตั้งค่ามิติใหม่ทุกครั้งที่รูปเปลี่ยน
  useEffect(() => {
    setOutBlob(null)
    setOutUrl('')
    setOutDims(null)
    setError('')
    if (!img) return
    setWidth(img.naturalWidth)
    setHeight(img.naturalHeight)
  }, [img])

  const mime = targetMime(format, file)
  const showQuality = mime === 'image/jpeg' || mime === 'image/webp'
  const ratio = img ? img.naturalWidth / img.naturalHeight : 1

  const changeWidth = (v: number) => {
    setWidth(v)
    if (lock && img) setHeight(Math.round(v / ratio))
  }

  const changeHeight = (v: number) => {
    setHeight(v)
    if (lock && img) setWidth(Math.round(v * ratio))
  }

  const changeLock = (v: boolean) => {
    setLock(v)
    if (v && img) setHeight(Math.round(width / ratio))
  }

  const scaleTo = (pct: number) => {
    if (!img) return
    setWidth(Math.max(1, Math.round((img.naturalWidth * pct) / 100)))
    setHeight(Math.max(1, Math.round((img.naturalHeight * pct) / 100)))
  }

  const resize = async () => {
    if (!img || !file) return
    const w = Math.round(width)
    const h = Math.round(height)
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      setError('กรุณากรอกความกว้างและความสูงให้มากกว่า 0')
      return
    }
    try {
      const outMime = targetMime(format, file)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('เบราว์เซอร์ไม่รองรับ Canvas')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      if (outMime === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, w, h)
      }
      ctx.drawImage(img, 0, 0, w, h)
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, outMime, quality))
      if (!blob) throw new Error('สร้างไฟล์ผลลัพธ์ไม่สำเร็จ')
      setOutBlob(blob)
      setOutUrl(URL.createObjectURL(blob))
      setOutDims({ w, h })
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ย่อรูปไม่สำเร็จ')
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <FileDrop
          accept="image/*"
          onFile={setFile}
          label="ลากรูปมาวาง หรือคลิกเพื่อเลือกรูป (PNG / JPEG / WebP)"
        />
        <p className="mt-2 text-center text-xs text-inksoft">
          ข้อมูลรูปไม่ถูกอัปโหลด — ประมวลผลในเบราว์เซอร์ของคุณ 100%
        </p>
      </div>

      {file && img && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="ชื่อไฟล์" value={file.name} />
          <Stat label="มิติเดิม" value={`${img.naturalWidth} × ${img.naturalHeight} px`} />
          <Stat label="ขนาดไฟล์" value={formatBytes(file.size)} />
        </div>
      )}

      <div className="card p-5 md:p-6">
        <h3 className="label">ตั้งค่าการย่อ</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="กว้าง (px)">
            <Input
              type="number"
              min={1}
              value={img ? width : ''}
              onChange={(e) => changeWidth(Number(e.target.value))}
              disabled={!img}
              className="font-mono"
            />
          </Field>
          <Field label="สูง (px)">
            <Input
              type="number"
              min={1}
              value={img ? height : ''}
              onChange={(e) => changeHeight(Number(e.target.value))}
              disabled={!img}
              className="font-mono"
            />
          </Field>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-3">
          {QUICK.map((p) => (
            <button
              key={p}
              type="button"
              className="btn btn-ghost text-xs"
              onClick={() => scaleTo(p)}
              disabled={!img}
            >
              {p}%
            </button>
          ))}
          <div className="ml-1">
            <CheckRow checked={lock} onChange={changeLock} label="ล็อกอัตราส่วน" />
          </div>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <Field label="รูปแบบไฟล์">
            <Select
              value={format}
              onChange={(e) => setFormat(e.target.value as Format)}
              disabled={!img}
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </Select>
          </Field>
          {showQuality && (
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
          )}
        </div>

        {error && (
          <p className="mt-4 rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
            ✗ {error}
          </p>
        )}

        <div className="mt-5">
          <button type="button" className="btn btn-rust" onClick={resize} disabled={!img}>
            ย่อรูปเลย
          </button>
        </div>
      </div>

      {outUrl && outBlob && outDims && file && (
        <div className="card p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-xl">ผลลัพธ์</h3>
            <button
              type="button"
              className="btn"
              onClick={() => download(outBlob, `resized.${extFor(outBlob.type)}`)}
            >
              ดาวน์โหลดรูป
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-start">
            <img
              src={outUrl}
              className="max-h-80 w-auto rounded-2xl border border-ink/10"
              alt="ผลลัพธ์"
            />
            <div className="grid flex-1 gap-4 sm:grid-cols-2">
              <Stat label="มิติใหม่" value={`${outDims.w} × ${outDims.h} px`} />
              <Stat
                label="ขนาด"
                value={`${formatBytes(file.size)} → ${formatBytes(outBlob.size)}`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
