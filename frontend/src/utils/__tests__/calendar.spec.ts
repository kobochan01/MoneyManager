import { describe, it, expect } from 'vitest'
import { buildCalendarGrid, computeTapeStatus } from '../calendar'
import type { Transaction } from '@/api/types'

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 1,
  transaction_type: 'expense',
  amount: '1000',
  date: '2026-05-10',
  memo: null,
  category: { id: 1, name: '食費' },
  user: { id: 1, name: 'test' },
  ...overrides,
})

describe('buildCalendarGrid', () => {
  it('セル数は7の倍数になる', () => {
    expect(buildCalendarGrid(2026, 5).length % 7).toBe(0)
    expect(buildCalendarGrid(2026, 2).length % 7).toBe(0)
    expect(buildCalendarGrid(2026, 1).length % 7).toBe(0)
  })

  it('日曜始まりのとき2026年5月1日（金曜）の前に5個のnullが来る', () => {
    // 2026-05-01 は金曜日（0=Sun, 5=Fri）→ 5個のnullがパディング
    const grid = buildCalendarGrid(2026, 5)
    expect(grid[0]).toBeNull()
    expect(grid[4]).toBeNull()
    expect(grid[5]).toBe('2026-05-01')
  })

  it('月曜始まりのとき2026年5月1日（金曜）の前に4個のnullが来る', () => {
    // Mon-based: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4 → 4個のnull
    const grid = buildCalendarGrid(2026, 5, true)
    expect(grid[0]).toBeNull()
    expect(grid[3]).toBeNull()
    expect(grid[4]).toBe('2026-05-01')
  })

  it('月の最初と最後の日付が正しい', () => {
    const grid = buildCalendarGrid(2026, 5)
    const dates = grid.filter((d): d is string => d !== null)
    expect(dates[0]).toBe('2026-05-01')
    expect(dates[dates.length - 1]).toBe('2026-05-31')
  })

  it('末尾の余りセルはnull', () => {
    const grid = buildCalendarGrid(2026, 5)
    const lastDateIdx = grid.lastIndexOf('2026-05-31')
    grid.slice(lastDateIdx + 1).forEach((cell) => expect(cell).toBeNull())
  })
})

describe('computeTapeStatus', () => {
  it('収入がなければ空のMapを返す', () => {
    const txs = [makeTx({ transaction_type: 'expense', date: '2026-05-10' })]
    expect(computeTapeStatus(txs, 2026, 5).size).toBe(0)
  })

  it('最初の収入日からテープが緑で始まり月末まで続く', () => {
    const txs = [makeTx({ transaction_type: 'income', amount: '100000', date: '2026-05-07' })]
    const map = computeTapeStatus(txs, 2026, 5)
    expect(map.get('2026-05-06')).toBeUndefined()
    expect(map.get('2026-05-07')).toBe('green')
    expect(map.get('2026-05-31')).toBe('green')
  })

  it('残高がマイナスになった日から赤に切り替わる', () => {
    const txs = [
      makeTx({ id: 1, transaction_type: 'income', amount: '10000', date: '2026-05-07' }),
      makeTx({ id: 2, transaction_type: 'expense', amount: '15000', date: '2026-05-10' }),
    ]
    const map = computeTapeStatus(txs, 2026, 5)
    expect(map.get('2026-05-07')).toBe('green')
    expect(map.get('2026-05-09')).toBe('green')
    expect(map.get('2026-05-10')).toBe('red')
    expect(map.get('2026-05-31')).toBe('red')
  })

  it('一度赤に転落したら後から収入があっても月末まで赤のまま', () => {
    const txs = [
      makeTx({ id: 1, transaction_type: 'income', amount: '10000', date: '2026-05-07' }),
      makeTx({ id: 2, transaction_type: 'expense', amount: '15000', date: '2026-05-10' }),
      makeTx({ id: 3, transaction_type: 'income', amount: '100000', date: '2026-05-20' }),
    ]
    const map = computeTapeStatus(txs, 2026, 5)
    expect(map.get('2026-05-10')).toBe('red')
    expect(map.get('2026-05-20')).toBe('red')
    expect(map.get('2026-05-31')).toBe('red')
  })

  it('支出でマイナスにならなければ月末まで緑のまま', () => {
    const txs = [
      makeTx({ id: 1, transaction_type: 'income', amount: '100000', date: '2026-05-07' }),
      makeTx({ id: 2, transaction_type: 'expense', amount: '30000', date: '2026-05-15' }),
    ]
    const map = computeTapeStatus(txs, 2026, 5)
    expect(map.get('2026-05-07')).toBe('green')
    expect(map.get('2026-05-31')).toBe('green')
    expect(map.has('2026-05-06')).toBe(false)
  })

  it('他の月のトランザクションは無視される', () => {
    const txs = [
      makeTx({ id: 1, transaction_type: 'income', amount: '100000', date: '2026-04-07' }),
    ]
    expect(computeTapeStatus(txs, 2026, 5).size).toBe(0)
  })
})
