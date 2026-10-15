import { useEffect, useState } from 'react'
import { FileDrop, Stat } from '../../components/ui'
import { formatBytes } from '../../lib/utils'

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

export default function ImageInfo() {
  const [file, setFile] = useState<File | null>(null)
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const [url, setUrl] = useState('')
  const [avg, setAvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setImg(null)
    setUrl('')
    setError('')
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    let cancelled = false
    const image = new Image()
    image.onload = () => {
      if (!cancelled) {
        setImg(image)
        setUrl(objectUrl)
      }
    }
    image.onerror = () => {
      if (!cancelled) setError('เปิดไฟล์นี้ไม่ได้ — รองรับเฉพาะไฟล์รูปภาพ')
    }
    image.src = objectUrl
    return () => {
      cancelled = true
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  useEffect(() => {
    if (!img) {
      setAvg('')
      return
    }
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.imageSmoothingEnabled = true
      ctx.drawImage(img, 0, 0, 1, 1)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      setAvg(`#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase())
    } catch {
      setAvg('')
    }
  }, [img])

  const w = img?.naturalWidth ?? 0
  const h = img?.naturalHeight ?? 0
  const g = gcd(w, h)
  const rgbText = avg
    ? `rgb(${parseInt(avg.slice(1, 3), 16)}, ${parseInt(avg.slice(3, 5), 16)}, ${parseInt(avg.slice(5, 7), 16)})`
    : ''

  return (
    <div className="flex flex-col gap-5">
      <FileDrop accept="image/*" onFile={setFile} label="ลากรูปมาวาง หรือคลิกเพื่อดูข้อมูลรูป" />

      {error && (
        <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
          ✗ {error}
        </p>
      )}

      {!file && <p className="text-sm text-inksoft">ยังไม่มีรูป — เลือกไฟล์ก่อนนะ</p>}

      {img && file && (
        <>
          <img
            src={url}
            className="max-h-72 max-w-full rounded-2xl border border-ink/10"
            alt="ตัวอย่างรูป"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="ชื่อไฟล์" value={file.name} />
            <Stat label="ชนิด" value={file.type || '—'} mono />
            <Stat label="ขนาดไฟล์" value={formatBytes(file.size)} mono />
            <Stat label="มิติ" value={`${w} × ${h} px`} mono />
            <Stat label="เมกะพิกเซล" value={`${((w * h) / 1e6).toFixed(1)} MP`} mono />
            <Stat label="อัตราส่วน" value={`${w / g}:${h / g} (≈${(w / h).toFixed(2)}:1)`} mono />
            <Stat label="แก้ไขล่าสุด" value={new Date(file.lastModified).toLocaleString('th-TH')} />
          </div>

          <div className="card p-5 md:p-6">
            <h3 className="font-display text-xl">สีเฉลี่ย</h3>
            {avg ? (
              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl border border-ink/10" style={{ background: avg }} />
                <span className="font-mono">{avg}</span>
                <span className="font-mono text-sm text-inksoft">{rgbText}</span>
              </div>
            ) : (
              <p className="mt-2 text-sm text-inksoft">—</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
