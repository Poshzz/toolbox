import { useState } from 'react'
import { Dices } from 'lucide-react'
import { Field, Input, Segmented, Textarea } from '../../components/ui'
import { cn } from '../../lib/utils'

type Mode = 'number' | 'dice' | 'coin' | 'list'

const TWO_32 = 4294967296
const TWO_53 = 9007199254740992

// สุ่มจำนวนเต็ม [0, max) แบบ uniform ด้วย rejection sampling
// max > 2^32 ใช้ 53-bit จาก 2 words — กันกรณี limit เป็น 0 แล้วลูปค้าง
function randInt(max: number) {
  const m = Math.min(max, TWO_53)
  if (!(m > 0)) return 0
  if (m <= TWO_32) {
    const arr = new Uint32Array(1)
    const limit = Math.floor(TWO_32 / m) * m
    let x = 0
    do {
      crypto.getRandomValues(arr)
      x = arr[0]
    } while (x >= limit)
    return x % m
  }
  const arr = new Uint32Array(2)
  const limit = Math.floor(TWO_53 / m) * m
  let x = 0
  do {
    crypto.getRandomValues(arr)
    x = (arr[0] >>> 11) * TWO_32 + arr[1]
  } while (x >= limit)
  return x % m
}

const DICE_FACES = '⚀⚁⚂⚃⚄⚅'

export default function RandomPicker() {
  const [mode, setMode] = useState<Mode>('number')

  // number
  const [min, setMin] = useState(1)
  const [max, setMax] = useState(100)
  const [num, setNum] = useState<number | null>(null)
  const [numError, setNumError] = useState('')

  // dice
  const [diceCount, setDiceCount] = useState(2)
  const [dice, setDice] = useState<number[]>([])

  // coin
  const [coin, setCoin] = useState<'หัว' | 'ก้อย' | null>(null)
  const [flips, setFlips] = useState(0)

  // list
  const [itemsText, setItemsText] = useState('')
  const [pickCount, setPickCount] = useState(1)
  const [picked, setPicked] = useState<string[]>([])

  const items = itemsText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  const rollNumber = () => {
    const lo = Math.min(min, max)
    const hi = Math.max(min, max)
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      setNum(null)
      setNumError('ใส่ตัวเลขให้ถูกต้องก่อนนะ')
      return
    }
    if (hi - lo + 1 > Number.MAX_SAFE_INTEGER) {
      setNum(null)
      setNumError('ช่วงเลขกว้างเกินไป — รองรับไม่เกิน 9,007,199,254,740,991')
      return
    }
    setNumError('')
    setNum(lo + randInt(hi - lo + 1))
  }

  const rollDice = () => setDice(Array.from({ length: diceCount }, () => 1 + randInt(6)))

  const flipCoin = () => {
    setCoin(randInt(2) === 0 ? 'หัว' : 'ก้อย')
    setFlips((f) => f + 1)
  }

  const pickList = () => {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = randInt(i + 1)
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    setPicked(copy.slice(0, Math.min(pickCount, copy.length)))
  }

  return (
    <div className="flex flex-col gap-5">
      <Segmented
        className="w-fit"
        options={[
          { value: 'number', label: 'สุ่มตัวเลข' },
          { value: 'dice', label: 'ลูกเต๋า' },
          { value: 'coin', label: 'เหรียญ' },
          { value: 'list', label: 'จับฉลาก' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'number' && (
        <div className="card flex flex-col items-center gap-6 p-6 md:p-8">
          <div className="grid w-full max-w-md grid-cols-2 gap-4">
            <Field label="ตั้งแต่">
              <Input type="number" value={min} onChange={(e) => setMin(Number(e.target.value) || 0)} className="font-mono" />
            </Field>
            <Field label="ถึง">
              <Input type="number" value={max} onChange={(e) => setMax(Number(e.target.value) || 0)} className="font-mono" />
            </Field>
          </div>
          <div
            key={num === null ? 'empty' : String(num)}
            className={cn('font-display text-7xl tabular-nums', num !== null && 'animate-fade-up')}
          >
            {num ?? '?'}
          </div>
          {numError && (
            <p className="rounded-2xl border border-rust/40 bg-rust/10 px-4 py-2 text-xs text-rustdeep">
              ✗ {numError}
            </p>
          )}
          <button type="button" className="btn btn-rust px-8 py-3 text-base" onClick={rollNumber}>
            สุ่มเลย
          </button>
        </div>
      )}

      {mode === 'dice' && (
        <div className="card flex flex-col items-center gap-6 p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {dice.length === 0 ? (
              <span className="font-display text-6xl text-ink/20">⚀⚁⚂</span>
            ) : (
              dice.map((d, i) => (
                <span key={i} className="font-display text-6xl leading-none">
                  {DICE_FACES[d - 1]}
                </span>
              ))
            )}
          </div>
          {dice.length > 1 && (
            <p className="text-sm text-inksoft">
              รวม <span className="font-mono font-semibold text-ink">{dice.reduce((a, b) => a + b, 0)}</span> ·{' '}
              {dice.join(', ')}
            </p>
          )}
          <div className="flex items-end gap-4">
            <Field label="จำนวนลูก">
              <Input
                type="number"
                min={1}
                max={6}
                value={diceCount}
                onChange={(e) => setDiceCount(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
                className="w-24 font-mono"
              />
            </Field>
            <button type="button" className="btn btn-rust mb-0.5 px-8 py-2.5" onClick={rollDice}>
              <Dices className="h-4 w-4" /> ทอยเลย
            </button>
          </div>
        </div>
      )}

      {mode === 'coin' && (
        <div className="card flex flex-col items-center gap-6 p-6 md:p-8">
          <div
            key={flips}
            className={cn(
              'flex h-28 w-28 items-center justify-center rounded-full border-2 border-ink/20 bg-paper2 font-display text-3xl',
              coin && 'animate-fade-up',
            )}
          >
            {coin ?? '?'}
          </div>
          <button type="button" className="btn btn-rust px-8 py-3 text-base" onClick={flipCoin}>
            โยนเหรียญ
          </button>
          {flips > 0 && <p className="text-xs text-inksoft">โยนแล้ว {flips} ครั้ง</p>}
        </div>
      )}

      {mode === 'list' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5 md:p-6">
            <h3 className="label">รายการ (บรรทัดละ 1 อย่าง)</h3>
            <Textarea
              value={itemsText}
              onChange={(e) => setItemsText(e.target.value)}
              placeholder={'สมชาย\nสมหญิง\nสมปอง\nกุ้งย่าง'}
              className="min-h-52 font-sans text-sm"
            />
            <p className="mt-2 text-xs text-inksoft">{items.length} รายการ</p>
          </div>
          <div className="card flex flex-col p-5 md:p-6">
            <div className="flex items-end gap-4">
              <Field label="จับกี่รายการ">
                <Input
                  type="number"
                  min={1}
                  max={items.length || 1}
                  value={pickCount}
                  onChange={(e) => setPickCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-28 font-mono"
                />
              </Field>
              <button
                type="button"
                className="btn btn-rust mb-0.5"
                disabled={items.length === 0}
                onClick={pickList}
              >
                จับฉลาก!
              </button>
            </div>
            <div className="mt-5 flex flex-1 flex-col gap-2">
              {picked.length === 0 ? (
                <p className="text-sm text-inksoft">ผลที่จับได้จะขึ้นที่นี่ — ไม่ซ้ำกันแน่นอน</p>
              ) : (
                picked.map((p, i) => (
                  <div
                    key={`${p}-${i}`}
                    className="animate-fade-up flex items-center gap-3 rounded-2xl border border-ink/10 bg-paper2/40 px-4 py-3"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <span className="font-mono text-xs text-inksoft">#{i + 1}</span>
                    <span className="font-display text-lg">{p}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
