import type { Transaction } from '@/api/types'

export type TapeStatus = 'none' | 'green' | 'red'

export function computePeriod(
  displayYear: number,
  displayMonth: number,
  startDay: number,
  closingDay: number,
): { periodStart: string; periodEnd: string } {
  const pad = (n: number) => String(n).padStart(2, '0')

  const daysInDisplayMonth = new Date(displayYear, displayMonth, 0).getDate()
  const actualClosingDay = Math.min(closingDay, daysInDisplayMonth)
  const periodEnd = `${displayYear}-${pad(displayMonth)}-${pad(actualClosingDay)}`

  let startYear = displayYear
  let startMonth = displayMonth
  if (startDay > closingDay) {
    startMonth = displayMonth - 1
    if (startMonth === 0) {
      startMonth = 12
      startYear = displayYear - 1
    }
  }

  const daysInStartMonth = new Date(startYear, startMonth, 0).getDate()
  const actualStartDay = Math.min(startDay, daysInStartMonth)
  const periodStart = `${startYear}-${pad(startMonth)}-${pad(actualStartDay)}`

  return { periodStart, periodEnd }
}

export function buildCalendarGrid(
  periodStart: string,
  periodEnd: string,
  weekStartsOnMonday = false,
): (string | null)[] {
  const start = new Date(periodStart)
  const end = new Date(periodEnd)

  const firstDayOfWeek = start.getDay() // 0=Sun, 6=Sat
  const offset = weekStartsOnMonday
    ? firstDayOfWeek === 0
      ? 6
      : firstDayOfWeek - 1
    : firstDayOfWeek

  const cells: (string | null)[] = Array(offset).fill(null)

  const current = new Date(start)
  while (current <= end) {
    cells.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export function computeTapeStatus(
  transactions: Transaction[],
  periodStart: string,
  periodEnd: string,
): Map<string, TapeStatus> {
  const result = new Map<string, TapeStatus>()

  const periodTxs = transactions.filter(
    (t) => t.date >= periodStart && t.date <= periodEnd,
  )
  const periodIncomes = periodTxs.filter((t) => t.transaction_type === 'income')

  if (periodIncomes.length === 0) return result

  const firstIncomeDate = periodIncomes.map((t) => t.date).sort()[0]
  if (firstIncomeDate === undefined) return result

  const allDays: string[] = []
  const current = new Date(periodStart)
  const end = new Date(periodEnd)
  while (current <= end) {
    allDays.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }

  let runningBalance = 0
  let fallDate: string | null = null

  for (const date of allDays) {
    if (date < firstIncomeDate) continue
    for (const t of periodTxs.filter((tx) => tx.date === date)) {
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
