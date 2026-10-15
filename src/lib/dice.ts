// Dice rolling + coin flipping on top of crypto.getRandomValues.
// Uniform via rejection sampling (same pattern as RandomPicker) — no modulo bias.
// Pure logic — no React.

export const DICE_TYPES = [4, 6, 8, 10, 12, 20] as const
export type DiceType = (typeof DICE_TYPES)[number]
export type CoinSide = 'heads' | 'tails'

const TWO_32 = 4294967296
const MAX_ROLLS = 1000

// Uniform integer in [0, max) — rejection sampling over 32 random bits.
function randInt(max: number): number {
  const arr = new Uint32Array(1)
  const limit = Math.floor(TWO_32 / max) * max
  let x = 0
  do {
    globalThis.crypto.getRandomValues(arr)
    x = arr[0]
  } while (x >= limit)
  return x % max
}

export function roll(count: number, faces: DiceType): number[] {
  if (!Number.isInteger(count) || count < 1 || count > MAX_ROLLS) {
    throw new RangeError(`count must be an integer between 1 and ${MAX_ROLLS} (got ${count})`)
  }
  if (!DICE_TYPES.includes(faces)) {
    throw new RangeError(`faces must be one of ${DICE_TYPES.join(', ')} (got ${faces})`)
  }
  return Array.from({ length: count }, () => 1 + randInt(faces))
}

export function flipCoin(): CoinSide {
  return randInt(2) === 0 ? 'heads' : 'tails'
}
