import { useMemo, useState } from 'react'
import { CopyButton, Textarea } from '../../components/ui'
import { cn } from '../../lib/utils'

type Mode =
  | 'upper'
  | 'lower'
  | 'sentence'
  | 'title'
  | 'camel'
  | 'pascal'
  | 'snake'
  | 'kebab'
  | 'constant'
  | 'alternating'
  | 'reverse'

const MODES: Array<{ value: Mode; label: string }> = [
  { value: 'upper', label: 'UPPERCASE' },
  { value: 'lower', label: 'lowercase' },
  { value: 'sentence', label: 'Sentence case' },
  { value: 'title', label: 'Title Case' },
  { value: 'camel', label: 'camelCase' },
  { value: 'pascal', label: 'PascalCase' },
  { value: 'snake', label: 'snake_case' },
  { value: 'kebab', label: 'kebab-case' },
  { value: 'constant', label: 'CONSTANT_CASE' },
  { value: 'alternating', label: 'aLtErNaTiNg' },
  { value: 'reverse', label: 'กลับด้าน ⟲' },
]

function toWords(s: string) {
  return s
    .replace(/([a-zก-๙0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9ก-๙]+/)
    .filter(Boolean)
}

function transform(text: string, mode: Mode): string {
  switch (mode) {
    case 'upper':
      return text.toUpperCase()
    case 'lower':
      return text.toLowerCase()
    case 'sentence':
      return text
        .toLowerCase()
        .replace(/(^\s*[a-z])|([.!?]\s+[a-z])/g, (m) => m.toUpperCase())
    case 'title':
      return text.replace(/\S+/g, (w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    case 'camel': {
      const words = toWords(text)
      return words.map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join('')
    }
    case 'pascal':
      return toWords(text)
        .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
        .join('')
    case 'snake':
      return toWords(text)
        .map((w) => w.toLowerCase())
        .join('_')
    case 'kebab':
      return toWords(text)
        .map((w) => w.toLowerCase())
        .join('-')
    case 'constant':
      return toWords(text)
        .map((w) => w.toUpperCase())
        .join('_')
    case 'alternating':
      return Array.from(text.toLowerCase())
        .map((ch, i) => (i % 2 === 0 ? ch : ch.toUpperCase()))
        .join('')
    case 'reverse':
      return Array.from(text).reverse().join('')
  }
}

export default function CaseConverter() {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<Mode>('upper')

  const output = useMemo(() => transform(text, mode), [text, mode])

  return (
    <div className="flex flex-col gap-5">
      <div className="card p-5 md:p-6">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={cn(
                'cursor-pointer rounded-full border px-3.5 py-1.5 font-mono text-xs font-medium transition',
                mode === m.value
                  ? 'border-ink bg-ink text-paper'
                  : 'border-ink/15 text-inksoft hover:border-ink hover:text-ink',
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card p-5 md:p-6">
          <h3 className="label">ข้อความต้นฉบับ</h3>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="พิมพ์หรือวางข้อความที่ต้องการแปลง…"
            className="min-h-52"
          />
        </div>
        <div className="card p-5 md:p-6">
          <div className="flex items-center justify-between">
            <h3 className="label mb-0">ผลลัพธ์</h3>
            <CopyButton text={output} />
          </div>
          <Textarea value={output} readOnly className="mt-1.5 min-h-52" placeholder="ผลลัพธ์จะขึ้นที่นี่" />
        </div>
      </div>
    </div>
  )
}
