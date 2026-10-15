export type DiffType = 'same' | 'add' | 'del'

export interface DiffRow {
  type: DiffType
  text: string
}

/**
 * Line diff แบบ LCS — เหมาะกับข้อความระดับไม่กี่พันบรรทัด
 * ถ้าใหญ่เกินจะ fallback เป็นเทียบบรรทัดต่อบรรทัด (positional)
 */
export function diffLines(aText: string, bText: string, ignoreWhitespace = false): DiffRow[] {
  const a = aText === '' ? [] : aText.split('\n')
  const b = bText === '' ? [] : bText.split('\n')
  const norm = (s: string) => (ignoreWhitespace ? s.trim() : s)
  const n = a.length
  const m = b.length

  if (n * m > 4_000_000) {
    const rows: DiffRow[] = []
    const max = Math.max(n, m)
    for (let i = 0; i < max; i++) {
      if (i < n && i < m) {
        rows.push({ type: norm(a[i]) === norm(b[i]) ? 'same' : 'del', text: a[i] })
        if (norm(a[i]) !== norm(b[i])) rows.push({ type: 'add', text: b[i] })
      } else if (i < n) {
        rows.push({ type: 'del', text: a[i] })
      } else {
        rows.push({ type: 'add', text: b[i] })
      }
    }
    return rows
  }

  const dp: Uint32Array[] = []
  for (let i = 0; i <= n; i++) dp.push(new Uint32Array(m + 1))

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] =
        norm(a[i]) === norm(b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const rows: DiffRow[] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (norm(a[i]) === norm(b[j])) {
      rows.push({ type: 'same', text: a[i] })
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({ type: 'del', text: a[i] })
      i++
    } else {
      rows.push({ type: 'add', text: b[j] })
      j++
    }
  }
  while (i < n) {
    rows.push({ type: 'del', text: a[i] })
    i++
  }
  while (j < m) {
    rows.push({ type: 'add', text: b[j] })
    j++
  }
  return rows
}
