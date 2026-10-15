import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowUp, Upload, X } from 'lucide-react'
import { Field, FileDrop, Input, Segmented, Stat } from '../../components/ui'
import { cn, download, formatBytes } from '../../lib/utils'
import { countPages, extractPages, mergePdfs, parsePageRanges } from '../../lib/pdf'

type Mode = 'merge' | 'extract'

/** เลือกได้หลายไฟล์ — โครงเดียวกับ FileDrop ใน ui.tsx แต่เพิ่ม multiple */
function MultiFileDrop({ onFiles }: { onFiles: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const picked = Array.from(e.dataTransfer.files)
        if (picked.length) onFiles(picked)
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition',
        over ? 'border-rust bg-rust/5' : 'border-ink/20 bg-white/35 hover:border-ink/40 dark:bg-white/5',
      )}
    >
      <Upload className="h-6 w-6 text-inksoft" />
      <div className="text-sm font-medium">ลากไฟล์ PDF มาวาง หรือคลิกเพื่อเลือกหลายไฟล์</div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? [])
          if (picked.length) onFiles(picked)
          e.target.value = ''
        }}
      />
    </div>
  )
}

export default function PdfTools() {
  const [mode, setMode] = useState<Mode>('merge')

  // ---- รวมไฟล์ (Merge) ----
  const [files, setFiles] = useState<File[]>([])
  const [merging, setMerging] = useState(false)
  const [mergeError, setMergeError] = useState('')

  // ---- แยกหน้า (Extract) ----
  const [file, setFile] = useState<File | null>(null)
  const [data, setData] = useState<Uint8Array | null>(null)
  const [total, setTotal] = useState<number | null>(null)
  const [ranges, setRanges] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')

  // อ่านไฟล์ + นับหน้าใหม่ทุกครั้งที่เปลี่ยนไฟล์ และล้างผลเก่าให้สะอาด
  useEffect(() => {
    setData(null)
    setTotal(null)
    setRanges('')
    setExtractError('')
    if (!file) return
    let cancelled = false
    ;(async () => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer())
        const n = await countPages(bytes)
        if (cancelled) return
        setData(bytes)
        setTotal(n)
      } catch (e) {
        if (!cancelled) setExtractError(e instanceof Error ? e.message : 'อ่านไฟล์ PDF ไม่ได้')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [file])

  const parsed = useMemo(
    () => (total === null ? {} : parsePageRanges(ranges, total)),
    [ranges, total],
  )

  const addFiles = (incoming: File[]) => {
    setMergeError('')
    setFiles((prev) => [...prev, ...incoming])
  }

  const moveFile = (i: number, dir: -1 | 1) => {
    setFiles((prev) => {
      const j = i + dir
      if (j < 0 || j >= prev.length) return prev
      const next = [...prev]
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
  }

  const removeFile = (i: number) => {
    setMergeError('')
    setFiles((prev) => prev.filter((_, k) => k !== i))
  }

  const merge = async () => {
    if (files.length < 2 || merging) return
    setMerging(true)
    setMergeError('')
    try {
      const inputs = await Promise.all(
        files.map(async (f) => new Uint8Array(await f.arrayBuffer())),
      )
      const out = await mergePdfs(inputs)
      download(new Blob([out], { type: 'application/pdf' }), 'merged.pdf')
    } catch (e) {
      setMergeError(e instanceof Error ? e.message : 'รวมไฟล์ไม่สำเร็จ')
    } finally {
      setMerging(false)
    }
  }

  const extract = async () => {
    if (!data || !parsed.pages || extracting) return
    setExtracting(true)
    setExtractError('')
    try {
      const out = await extractPages(data, parsed.pages)
      download(new Blob([out], { type: 'application/pdf' }), 'extracted.pdf')
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : 'แยกหน้าไม่สำเร็จ')
    } finally {
      setExtracting(false)
    }
  }

  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  return (
    <div className="flex flex-col gap-5">
      <div className="card flex flex-wrap items-center gap-4 p-5 md:p-6">
        <Segmented
          options={[
            { value: 'merge', label: 'รวมไฟล์ (Merge)' },
            { value: 'extract', label: 'แยกหน้า (Extract)' },
          ]}
          value={mode}
          onChange={setMode}
        />
        <span className="text-xs text-inksoft">
          {mode === 'merge'
            ? 'รวม PDF หลายไฟล์เป็นไฟล์เดียว — จัดลำดับไฟล์ได้'
            : 'ดึงเฉพาะหน้าที่ต้องการออกเป็นไฟล์ใหม่ — ระบุซ้ำเพื่อทำสำเนาได้'}
        </span>
      </div>

      {mode === 'merge' ? (
        <div className="flex flex-col gap-5">
          <div>
            <MultiFileDrop onFiles={addFiles} />
            <p className="mt-2 text-center text-xs text-inksoft">ไฟล์ไม่ออกจากเครื่องคุณ 100%</p>
          </div>

          {files.length > 0 && (
            <div className="card p-5 md:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="label mb-0">ลำดับการรวม ({files.length} ไฟล์)</h3>
                <span className="text-xs text-inksoft">รวมทั้งหมด {formatBytes(totalSize)}</span>
              </div>
              <p className="mt-1 text-xs text-inksoft">
                รวมจากบนลงล่าง — ใช้ปุ่มลูกศรเพื่อเลื่อนลำดับ
              </p>

              <ul className="mt-3 flex flex-col gap-2">
                {files.map((f, i) => (
                  <li
                    key={`${f.name}-${f.size}-${i}`}
                    className="flex items-center gap-2 rounded-2xl border border-ink/10 bg-white/45 dark:bg-white/5 px-3 py-2.5 sm:gap-3 sm:px-4"
                  >
                    <span className="w-5 shrink-0 text-center font-mono text-xs text-inksoft">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{f.name}</span>
                      <span className="block text-xs text-inksoft">{formatBytes(f.size)}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-ghost px-2.5 py-1.5"
                        onClick={() => moveFile(i, -1)}
                        disabled={i === 0}
                        aria-label={`เลื่อน ${f.name} ขึ้น`}
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost px-2.5 py-1.5"
                        onClick={() => moveFile(i, 1)}
                        disabled={i === files.length - 1}
                        aria-label={`เลื่อน ${f.name} ลง`}
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost px-2.5 py-1.5 hover:text-rustdeep"
                        onClick={() => removeFile(i)}
                        aria-label={`ลบ ${f.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  </li>
                ))}
              </ul>

              {mergeError && (
                <p className="mt-4 rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
                  ✗ {mergeError}
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="btn btn-rust"
                  onClick={merge}
                  disabled={files.length < 2 || merging}
                >
                  {merging ? 'กำลังรวมไฟล์…' : 'รวมและดาวน์โหลด'}
                </button>
                {files.length < 2 && (
                  <span className="text-xs text-inksoft">เลือกอย่างน้อย 2 ไฟล์เพื่อรวม</span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <FileDrop
              accept="application/pdf"
              onFile={setFile}
              label="ลากไฟล์ PDF มาวาง หรือคลิกเพื่อเลือกไฟล์"
            />
            <p className="mt-2 text-center text-xs text-inksoft">ไฟล์ไม่ออกจากเครื่องคุณ 100%</p>
          </div>

          {file && (
            <div className="card p-5 md:p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="ชื่อไฟล์" value={file.name} />
                <Stat label="ขนาดไฟล์" value={formatBytes(file.size)} />
                <Stat
                  label="จำนวนหน้า"
                  value={total === null ? (extractError ? '—' : 'กำลังอ่าน…') : `${total} หน้า`}
                />
              </div>

              {total !== null && (
                <>
                  <div className="mt-5">
                    <Field
                      label="หน้าที่ต้องการ (ระบุได้หลายช่วง)"
                      hint="คั่นด้วยจุลภาค ใช้ - สำหรับช่วง เช่น 1-3,5,8-10 — ระบุซ้ำได้เพื่อทำสำเนา"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <Input
                          value={ranges}
                          onChange={(e) => setRanges(e.target.value)}
                          placeholder={total > 1 ? `1-${total}` : '1'}
                          className="font-mono sm:max-w-xs"
                        />
                        <button
                          type="button"
                          className="btn btn-ghost text-xs"
                          onClick={() => setRanges(`1-${total}`)}
                        >
                          ทั้งหมด
                        </button>
                      </div>
                    </Field>
                  </div>

                  {ranges.trim() !== '' && parsed.error && (
                    <p className="mt-2 text-xs text-rustdeep">✗ {parsed.error}</p>
                  )}
                  {parsed.pages && (
                    <p className="mt-2 text-xs text-olive">จะได้ {parsed.pages.length} หน้า</p>
                  )}
                </>
              )}

              {extractError && (
                <p className="mt-4 rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2.5 text-xs text-rustdeep">
                  ✗ {extractError}
                </p>
              )}

              <div className="mt-5">
                <button
                  type="button"
                  className="btn btn-rust"
                  onClick={extract}
                  disabled={!parsed.pages || extracting}
                >
                  {extracting ? 'กำลังแยกหน้า…' : 'แยกและดาวน์โหลด'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
