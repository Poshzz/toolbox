import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import type { QRCodeErrorCorrectionLevel } from 'qrcode'
import { Field, Input, Select, Textarea } from '../../components/ui'

const LEVELS: Array<{ value: QRCodeErrorCorrectionLevel; label: string }> = [
  { value: 'L', label: 'L — 7%' },
  { value: 'M', label: 'M — 15%' },
  { value: 'Q', label: 'Q — 25%' },
  { value: 'H', label: 'H — 30%' },
]

export default function QrGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [text, setText] = useState('https://example.com')
  const [size, setSize] = useState(320)
  const [level, setLevel] = useState<QRCodeErrorCorrectionLevel>('M')
  const [margin, setMargin] = useState(2)
  const [dark, setDark] = useState('#221B12')
  const [light, setLight] = useState('#FBF8F0')
  const [error, setError] = useState('')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (!text.trim()) {
      const ctx = canvas.getContext('2d')
      canvas.width = 320
      canvas.height = 320
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      setError('')
      return
    }
    QRCode.toCanvas(canvas, text, {
      width: size,
      margin,
      errorCorrectionLevel: level,
      color: { dark, light },
    })
      .then(() => setError(''))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'สร้าง QR ไม่สำเร็จ'))
  }, [text, size, level, margin, dark, light])

  const downloadPng = () => {
    const canvas = canvasRef.current
    if (!canvas || !text.trim()) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = 'qr-code.png'
    a.click()
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
      <div className="flex flex-col gap-5">
        <div className="card p-5 md:p-6">
          <Field label="ข้อความหรือลิงก์">
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="https://… หรือข้อความอะไรก็ได้"
              className="min-h-24 font-sans text-sm"
            />
          </Field>
        </div>

        <div className="card grid gap-5 p-5 sm:grid-cols-2 md:p-6">
          <Field label="ขนาด (px)">
            <Input
              type="number"
              min={128}
              max={1024}
              step={32}
              value={size}
              onChange={(e) => setSize(Math.max(128, Math.min(1024, Number(e.target.value) || 320)))}
              className="font-mono"
            />
          </Field>
          <div>
            <span className="label">ระดับแก้ error</span>
            <Select value={level} onChange={(e) => setLevel(e.target.value as QRCodeErrorCorrectionLevel)}>
              {LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </Select>
          </div>
          <Field label="ขอบ (margin)" hint="0–1 กำลังดีสำหรับการใช้งานทั่วไป">
            <Input
              type="number"
              min={0}
              max={10}
              value={margin}
              onChange={(e) => setMargin(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
              className="font-mono"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="สีจุด (dark)">
              <input
                type="color"
                value={dark}
                onChange={(e) => setDark(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-ink/15 bg-crema p-1"
              />
            </Field>
            <Field label="สีพื้น (light)">
              <input
                type="color"
                value={light}
                onChange={(e) => setLight(e.target.value)}
                className="h-10 w-full cursor-pointer rounded-xl border border-ink/15 bg-crema p-1"
              />
            </Field>
          </div>
        </div>

        {error && (
          <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
            ✗ {error} — ลองลดระดับแก้ error หรือท่อนข้อความให้สั้นลง
          </p>
        )}
      </div>

      <div className="card flex flex-col items-center justify-center gap-4 p-6 lg:w-96">
        <div className="flex w-full items-center justify-between">
          <h3 className="font-display text-xl">ตัวอย่าง</h3>
          <button type="button" className="btn btn-rust" onClick={downloadPng} disabled={!text.trim()}>
            ดาวน์โหลด PNG
          </button>
        </div>
        <div className="flex w-full flex-1 items-center justify-center rounded-2xl border border-dashed border-ink/20 bg-paper2/40 p-4">
          <canvas ref={canvasRef} className="max-w-full rounded-lg" />
        </div>
        <p className="text-center text-xs text-inksoft">
          QR ถูกสร้างในเครื่องคุณเท่านั้น — ไม่มีข้อมูลส่งออกไปเซิร์ฟเวอร์ใด
        </p>
      </div>
    </div>
  )
}
