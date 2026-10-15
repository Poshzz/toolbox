import { useEffect, useMemo, useState } from 'react'
import { CheckRow, CopyField, Textarea } from '../../components/ui'
import { md5 } from '../../lib/md5'

const SHA_ALGOS = ['SHA-1', 'SHA-256', 'SHA-512'] as const
type ShaAlgo = (typeof SHA_ALGOS)[number]
type Results = Record<'MD5' | ShaAlgo, string>

const EMPTY: Results = { MD5: '', 'SHA-1': '', 'SHA-256': '', 'SHA-512': '' }

function bufToHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')
}

function sha(algo: ShaAlgo, bytes: Uint8Array) {
  return crypto.subtle.digest(algo, bytes.buffer as ArrayBuffer).then(bufToHex)
}

export default function HashTool() {
  const [text, setText] = useState('')
  const [uppercase, setUppercase] = useState(false)
  const [results, setResults] = useState<Results>(EMPTY)

  useEffect(() => {
    let cancelled = false
    if (!text) {
      setResults(EMPTY)
      return
    }
    const bytes = new TextEncoder().encode(text)
    const localMd5 = md5(bytes)
    void Promise.all(SHA_ALGOS.map((a) => sha(a, bytes))).then(([sha1, sha256, sha512]) => {
      if (cancelled) return
      setResults({ MD5: localMd5, 'SHA-1': sha1, 'SHA-256': sha256, 'SHA-512': sha512 })
    })
    return () => {
      cancelled = true
    }
  }, [text])

  const shown = useMemo(() => {
    const out = { ...results }
    if (uppercase) {
      for (const k of Object.keys(out) as Array<keyof Results>) out[k] = out[k].toUpperCase()
    }
    return out
  }, [results, uppercase])

  const charCount = Array.from(text).length

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="label mb-0">ข้อความ</h3>
          <CheckRow checked={uppercase} onChange={setUppercase} label="ตัวพิมพ์ใหญ่" />
        </div>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="พิมพ์หรือวางข้อความที่ต้องการคำนวณแฮช…"
          className="mt-1.5 min-h-40"
        />
        <p className="mt-2 text-xs text-inksoft">{charCount.toLocaleString()} ตัวอักษร (UTF-8)</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(shown) as Array<keyof Results>).map((k) => (
          <div key={k} className="card p-5">
            <h3 className="label">{k}</h3>
            <CopyField value={shown[k]} />
          </div>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-inksoft">
        MD5 และ SHA-1 ใช้สำหรับ checksum หรือเทียบไฟล์เท่านั้น — หากต้องการความปลอดภัยจริงจังควรใช้
        SHA-256 ขึ้นไป (แฮชทั้งหมดคำนวณในเบราว์เซอร์ของคุณผ่าน Web Crypto)
      </p>
    </div>
  )
}
