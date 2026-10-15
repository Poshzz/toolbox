import { useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { Check, ChevronDown, Copy, Upload } from 'lucide-react'
import { cn, useCopy, useReveal } from '../lib/utils'

export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={cn('reveal', className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export function Field({
  label,
  children,
  hint,
}: {
  label: ReactNode
  children: ReactNode
  hint?: ReactNode
}) {
  return (
    <div className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-inksoft">{hint}</span>}
    </div>
  )
}

export function Input(props: ComponentProps<'input'>) {
  return <input {...props} className={cn('input', props.className)} />
}

export function Textarea(props: ComponentProps<'textarea'>) {
  return <textarea {...props} className={cn('textarea', props.className)} />
}

export function Select({ children, ...props }: ComponentProps<'select'>) {
  return (
    <span className="relative block">
      <select {...props} className={cn('select', props.className)}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-inksoft" />
    </span>
  )
}

export function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-rust"
      />
      <span>{label}</span>
    </label>
  )
}

export function CopyButton({
  text,
  label = 'คัดลอก',
  className,
}: {
  text: string
  label?: string
  className?: string
}) {
  const { copied, copy } = useCopy()
  return (
    <button
      type="button"
      onClick={() => copy(text)}
      disabled={!text}
      className={cn('btn btn-ghost text-xs', className)}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-olive" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'คัดลอกแล้ว' : label}
    </button>
  )
}

export function CopyField({ value, mono = true }: { value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-ink/15 bg-paper2/40 px-4 py-2.5">
      <span className={cn('min-w-0 flex-1 break-all', mono && 'mono-val')}>
        {value || <span className="text-inksoft/50">—</span>}
      </span>
      <CopyButton text={value} label="" className="shrink-0 border-transparent" />
    </div>
  )
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: T; label: ReactNode }>
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div
      className={cn(
        'inline-flex flex-wrap gap-1 rounded-full border border-ink/10 bg-paper2/50 p-1',
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            'cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-medium transition',
            value === o.value ? 'bg-ink text-paper' : 'text-inksoft hover:bg-ink/5 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Stat({
  label,
  value,
  mono,
}: {
  label: ReactNode
  value: ReactNode
  mono?: boolean
}) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-paper2/40 px-4 py-3">
      <div className="text-[10px] font-semibold tracking-[0.16em] text-inksoft uppercase">
        {label}
      </div>
      <div className={cn('mt-1 text-lg font-semibold break-all', mono && 'font-mono text-sm')}>
        {value}
      </div>
    </div>
  )
}

export function FileDrop({
  accept,
  onFile,
  label,
  className,
}: {
  accept: string
  onFile: (f: File) => void
  label?: ReactNode
  className?: string
}) {
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
        const f = e.dataTransfer.files?.[0]
        if (f) onFile(f)
      }}
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed px-6 py-10 text-center transition',
        over ? 'border-rust bg-rust/5' : 'border-ink/20 bg-paper2/30 hover:border-ink/40',
        className,
      )}
    >
      <Upload className="h-6 w-6 text-inksoft" />
      <div className="text-sm font-medium">{label ?? 'ลากไฟล์มาวาง หรือคลิกเพื่อเลือกไฟล์'}</div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFile(f)
          e.target.value = ''
        }}
      />
    </div>
  )
}
