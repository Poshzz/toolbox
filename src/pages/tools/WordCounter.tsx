import { useMemo, useState } from 'react'
import { Stat, Textarea } from '../../components/ui'

export default function WordCounter() {
  const [text, setText] = useState('')

  const stats = useMemo(() => {
    const chars = Array.from(text).length
    const charsNoSpace = Array.from(text.replace(/\s/g, '')).length
    const trimmed = text.trim()
    const words = trimmed ? trimmed.split(/\s+/).length : 0
    const sentences = text.split(/[.!?…]+/).filter((s) => s.trim().length > 0).length
    const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length
    const lines = text ? text.split('\n').length : 0
    return { chars, charsNoSpace, words, sentences, paragraphs, lines }
  }, [text])

  const topWords = useMemo(() => {
    const tokens = text.toLowerCase().match(/[\p{L}\p{N}']+/gu) ?? []
    const map = new Map<string, number>()
    for (const t of tokens) {
      if (t.length < 2) continue
      map.set(t, (map.get(t) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [text])

  const readingLabel =
    stats.words === 0 ? '—' : stats.words / 200 < 0.5 ? 'น้อยกว่า 1 นาที' : `${Math.ceil(stats.words / 200)} นาที`
  const speakingLabel =
    stats.words === 0 ? '—' : stats.words / 130 < 0.5 ? 'น้อยกว่า 1 นาที' : `${Math.ceil(stats.words / 130)} นาที`

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="วางหรือพิมพ์ข้อความตรงนี้… ตัวเลขจะขยับตามแบบเรียลไทม์"
          className="min-h-56"
        />
        <p className="mt-2.5 text-xs text-inksoft">
          หมายเหตุ: การนับ “คำ” ใช้ช่องว่างเป็นตัวแบ่ง คำในภาษาไทยที่เขียนติดกันจะนับเป็น 1 คำ — ส่วน “ประโยค”
          นับจากเครื่องหมาย . ! ? และ …
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="ตัวอักษร" value={stats.chars.toLocaleString()} />
        <Stat label="ไม่รวมช่องว่าง" value={stats.charsNoSpace.toLocaleString()} />
        <Stat label="คำ" value={stats.words.toLocaleString()} />
        <Stat label="ประโยค" value={stats.sentences.toLocaleString()} />
        <Stat label="ย่อหน้า" value={stats.paragraphs.toLocaleString()} />
        <Stat label="บรรทัด" value={stats.lines.toLocaleString()} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h3 className="font-display text-xl">เวลาในการอ่าน</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="อ่านในใจ (200 คำ/นาที)" value={readingLabel} />
            <Stat label="อ่านออกเสียง (130 คำ/นาที)" value={speakingLabel} />
          </div>
        </div>

        <div className="card p-5 md:p-6">
          <h3 className="font-display text-xl">คำที่ใช้บ่อย</h3>
          {topWords.length === 0 ? (
            <p className="mt-3 text-sm text-inksoft">ยังไม่มีข้อมูล — เริ่มพิมพ์ก่อนนะ</p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {topWords.map(([word, count]) => (
                <span key={word} className="chip">
                  {word} <span className="font-mono text-rust">×{count}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
