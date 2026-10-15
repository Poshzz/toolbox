import { useEffect, useRef, useState } from 'react'
import { Coins, Dices } from 'lucide-react'
import { Field, Input, Segmented, Stat } from '../../components/ui'
import { cn } from '../../lib/utils'
import { DICE_TYPES, flipCoin, roll, type CoinSide, type DiceType } from '../../lib/dice'

type Mode = 'dice' | 'coin'

const DICE_FACES = '⚀⚁⚂⚃⚄⚅'
const COIN_TH: Record<CoinSide, string> = { heads: 'หัว', tails: 'ก้อย' }
const SPIN_TICKS = 9
const SPIN_MS = 70

interface RollEntry {
  faces: DiceType
  dice: number[]
  total: number
  at: string
}

const now = () =>
  new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function DiceRoller() {
  const [mode, setMode] = useState<Mode>('dice')

  // dice
  const [faces, setFaces] = useState<DiceType>(6)
  const [count, setCount] = useState(2)
  const [dice, setDice] = useState<number[]>([])
  const [rolling, setRolling] = useState(false)
  const [history, setHistory] = useState<RollEntry[]>([])

  // coin
  const [coin, setCoin] = useState<CoinSide | null>(null)
  const [flips, setFlips] = useState<CoinSide[]>([])
  const [flipping, setFlipping] = useState(false)

  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearInterval(timer.current)
    },
    [],
  )

  const stopTimer = () => {
    if (timer.current !== null) {
      window.clearInterval(timer.current)
      timer.current = null
    }
  }

  const rollDice = () => {
    if (rolling) return
    const finalDice = roll(count, faces)
    const commit = () => {
      setDice(finalDice)
      setRolling(false)
      setHistory((prev) =>
        [
          {
            faces,
            dice: finalDice,
            total: finalDice.reduce((a, b) => a + b, 0),
            at: now(),
          },
          ...prev,
        ].slice(0, 10),
      )
    }
    stopTimer()
    if (reducedMotion()) {
      commit()
      return
    }
    setRolling(true)
    setDice(roll(count, faces))
    let tick = 0
    timer.current = window.setInterval(() => {
      tick += 1
      if (tick >= SPIN_TICKS) {
        stopTimer()
        commit()
      } else {
        setDice(roll(count, faces))
      }
    }, SPIN_MS)
  }

  const flip = () => {
    if (flipping) return
    const finalCoin = flipCoin()
    const commit = () => {
      setCoin(finalCoin)
      setFlipping(false)
      setFlips((prev) => [finalCoin, ...prev].slice(0, 10))
    }
    stopTimer()
    if (reducedMotion()) {
      commit()
      return
    }
    setFlipping(true)
    setCoin(flipCoin())
    let tick = 0
    timer.current = window.setInterval(() => {
      tick += 1
      if (tick >= SPIN_TICKS) {
        stopTimer()
        commit()
      } else {
        setCoin(flipCoin())
      }
    }, SPIN_MS)
  }

  const total = dice.reduce((a, b) => a + b, 0)
  const heads = flips.filter((f) => f === 'heads').length

  return (
    <div className="flex flex-col gap-5">
      <Segmented
        className="w-fit"
        options={[
          { value: 'dice', label: 'ลูกเต๋า' },
          { value: 'coin', label: 'เหรียญ' },
        ]}
        value={mode}
        onChange={setMode}
      />

      {mode === 'dice' && (
        <>
          <div className="card flex flex-col items-center gap-6 p-6 md:p-8">
            <div
              className={cn(
                'flex min-h-16 flex-wrap items-center justify-center gap-3',
                rolling && 'opacity-70',
              )}
            >
              {dice.length === 0 ? (
                <span className="font-display text-5xl text-ink/20">⚀⚁⚂⚃⚄⚅</span>
              ) : faces === 6 ? (
                dice.map((d, i) => (
                  <span key={i} className="font-display text-6xl leading-none">
                    {DICE_FACES[d - 1]}
                  </span>
                ))
              ) : (
                dice.map((d, i) => (
                  <span
                    key={i}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border border-ink/15 bg-paper2/60 font-display text-2xl"
                  >
                    {d}
                  </span>
                ))
              )}
            </div>

            {dice.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-inksoft">
                <span>
                  รวม <span className="font-display text-2xl text-ink">{total}</span>
                </span>
                <span className="font-mono">
                  d{faces} × {count} ลูก
                </span>
                <span className="font-mono text-xs">{dice.join(' · ')}</span>
              </div>
            )}

            <div className="flex flex-wrap items-end justify-center gap-4">
              <div>
                <span className="label">หน้าเต๋า</span>
                <Segmented
                  options={DICE_TYPES.map((f) => ({ value: String(f), label: `d${f}` }))}
                  value={String(faces)}
                  onChange={(v) => setFaces(Number(v) as DiceType)}
                />
              </div>
              <Field label="จำนวนลูก (1–10)">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={count}
                  onChange={(e) => setCount(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                  className="w-24 font-mono"
                />
              </Field>
              <button
                type="button"
                className="btn btn-rust mb-0.5"
                disabled={rolling}
                onClick={rollDice}
              >
                <Dices className="h-4 w-4" /> {rolling ? 'กำลังทอย…' : 'ทอยเลย'}
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="card p-5 md:p-6">
              <h3 className="label">ประวัติการทอย (10 ล่าสุด)</h3>
              <div className="flex flex-col gap-2">
                {history.map((h, i) => (
                  <div
                    key={`${h.at}-${i}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl border border-ink/10 bg-paper2/40 px-4 py-2.5 text-sm"
                  >
                    <span className="font-mono text-xs text-inksoft">{h.at}</span>
                    <span className="font-mono font-semibold">d{h.faces}</span>
                    <span className="text-inksoft">×{h.dice.length}</span>
                    <span className="font-mono text-xs text-inksoft">{h.dice.join(' · ')}</span>
                    <span className="ml-auto">
                      รวม <span className="font-mono font-semibold">{h.total}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {mode === 'coin' && (
        <>
          <div className="card flex flex-col items-center gap-6 p-6 md:p-8">
            <div
              key={flips.length}
              className={cn(
                'flex h-32 w-32 items-center justify-center rounded-full border-2 border-ink/20 bg-paper2 font-display text-3xl',
                coin && !flipping && 'animate-fade-up',
                flipping && 'opacity-70',
              )}
            >
              {coin ? COIN_TH[coin] : '?'}
            </div>

            {flips.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                <Stat label="หัว" value={heads} />
                <Stat label="ก้อย" value={flips.length - heads} />
                <Stat label="ครั้ง" value={flips.length} />
              </div>
            )}

            <button
              type="button"
              className="btn btn-rust px-8 py-3 text-base"
              disabled={flipping}
              onClick={flip}
            >
              <Coins className="h-4 w-4" /> {flipping ? 'กำลังโยน…' : 'โยนเหรียญ'}
            </button>
          </div>

          {flips.length > 0 && (
            <div className="card p-5 md:p-6">
              <h3 className="label">ผล 10 ครั้งล่าสุด</h3>
              <div className="flex flex-wrap gap-2">
                {flips.map((f, i) => (
                  <span
                    key={i}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs font-medium',
                      f === 'heads'
                        ? 'border-rust/40 bg-rust/10 text-rustdeep'
                        : 'border-olive/40 bg-olive/15 text-olive',
                    )}
                  >
                    {COIN_TH[f]}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
