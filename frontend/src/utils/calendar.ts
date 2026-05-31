import type { Transaction } from '@/api/types'

export type TapeStatus = 'none' | 'green' | 'red'

/**
 * 指定した年月のカレンダーグリッドを返す。
 * 要素は 'YYYY-MM-DD' 形式の日付文字列、またはパディング用の null。
 * 配列長は常に7の倍数（週単位）になる。
 */
export function buildCalendarGrid(
  year: number,
  month: number,
  weekStartsOnMonday = false,
): (string | null)[] {
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay() // 0=Sun, 6=Sat

  const offset = weekStartsOnMonday
    ? firstDayOfWeek === 0
      ? 6
      : firstDayOfWeek - 1
    : firstDayOfWeek

  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const cells: (string | null)[] = Array(offset).fill(null)

  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${monthStr}-${String(d).padStart(2, '0')}`)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

/**
 * 指定した年月のテープ表示ステータスを返す。
 * - 最初の収入登録日から月末まで 'green'
 * - 累計残高がマイナスに転落した日から月末まで 'red'（一度赤になったら戻らない）
 * - テープなし（収入登録日前）は Map に含まれない
 */
export function computeTapeStatus(
  transactions: Transaction[],
  year: number,
  month: number,
): Map<string, TapeStatus> {
  const result = new Map<string, TapeStatus>()
  const monthStr = `${year}-${String(month).padStart(2, '0')}`
  const daysInMonth = new Date(year, month, 0).getDate()

  const allDays = Array.from(
    { length: daysInMonth },
    (_, i) => `${monthStr}-${String(i + 1).padStart(2, '0')}`,
  )

  const monthTxs = transactions.filter((t) => t.date.startsWith(monthStr))
  const monthIncomes = monthTxs.filter((t) => t.transaction_type === 'income')

  if (monthIncomes.length === 0) return result

  const firstIncomeDate = monthIncomes.map((t) => t.date).sort()[0]
  if (firstIncomeDate === undefined) return result

  let runningBalance = 0
  let fallDate: string | null = null

  for (const date of allDays) {
    if (date < firstIncomeDate) continue

    for (const t of monthTxs.filter((tx) => tx.date === date)) {
      const amount = Number(t.amount)
      runningBalance += t.transaction_type === 'income' ? amount : -amount
    }

    if (fallDate === null && runningBalance < 0) {
      fallDate = date
    }
  }

  for (const date of allDays) {
    if (date < firstIncomeDate) continue
    result.set(date, fallDate === null || date < fallDate ? 'green' : 'red')
  }

  return result
}
