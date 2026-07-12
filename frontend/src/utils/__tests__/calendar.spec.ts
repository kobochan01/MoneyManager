import { describe, it, expect } from 'vitest'
import { buildCalendarGrid, computeTapeStatus, computePeriod, buildPeriodEntryList } from '../calendar'
import type { Transaction, ScheduledFixedExpense } from '@/api/types'

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

const makeFixed = (overrides: Partial<ScheduledFixedExpense> = {}): ScheduledFixedExpense => ({
  id: 1,
  name: '家賃',
  amount: 50000,
  date: '2026-05-01',
  category: { id: 2, name: '住居費' },
  ...overrides,
})

describe('computePeriod', () => {
  it('開始日 <= 締め日のとき同月内の期間を返す（デフォルト設定）', () => {
    const { periodStart, periodEnd } = computePeriod(2026, 7, 1, 31)
    expect(periodStart).toBe('2026-07-01')
    expect(periodEnd).toBe('2026-07-31')
  })

  it('開始日 > 締め日のとき前月の開始日〜当月の締め日を返す', () => {
    const { periodStart, periodEnd } = computePeriod(2026, 7, 21, 20)
    expect(periodStart).toBe('2026-06-21')
    expect(periodEnd).toBe('2026-07-20')
  })

  it('1月に開始日 > 締め日のとき前年12月から始まる', () => {
    const { periodStart, periodEnd } = computePeriod(2027, 1, 21, 20)
    expect(periodStart).toBe('2026-12-21')
    expect(periodEnd).toBe('2027-01-20')
  })

  it('締め日が月の日数を超えるとき末日に丸める（2月・締め日31日）', () => {
    const { periodStart, periodEnd } = computePeriod(2026, 2, 1, 31)
    expect(periodStart).toBe('2026-02-01')
    expect(periodEnd).toBe('2026-02-28')
  })
})

describe('buildCalendarGrid', () => {
  it('セル数は7の倍数になる', () => {
    expect(buildCalendarGrid('2026-05-01', '2026-05-31').length % 7).toBe(0)
    expect(buildCalendarGrid('2026-02-01', '2026-02-28').length % 7).toBe(0)
    expect(buildCalendarGrid('2026-06-21', '2026-07-20').length % 7).toBe(0)
  })

  it('日曜始まりのとき2026年5月1日（金曜）の前に5個のnullが来る', () => {
    const grid = buildCalendarGrid('2026-05-01', '2026-05-31')
    expect(grid[0]).toBeNull()
    expect(grid[4]).toBeNull()
    expect(grid[5]).toBe('2026-05-01')
  })

  it('月曜始まりのとき2026年5月1日（金曜）の前に4個のnullが来る', () => {
    const grid = buildCalendarGrid('2026-05-01', '2026-05-31', true)
    expect(grid[0]).toBeNull()
    expect(grid[3]).toBeNull()
    expect(grid[4]).toBe('2026-05-01')
  })

  it('標準月の最初と最後の日付が正しい', () => {
    const grid = buildCalendarGrid('2026-05-01', '2026-05-31')
    const dates = grid.filter((d): d is string => d !== null)
    expect(dates[0]).toBe('2026-05-01')
    expect(dates[dates.length - 1]).toBe('2026-05-31')
  })

  it('カスタム期間（6/21〜7/20）の最初と最後の日付が正しい', () => {
    const grid = buildCalendarGrid('2026-06-21', '2026-07-20')
    const dates = grid.filter((d): d is string => d !== null)
    expect(dates[0]).toBe('2026-06-21')
    expect(dates[dates.length - 1]).toBe('2026-07-20')
  })

  it('末尾の余りセルはnull', () => {
    const grid = buildCalendarGrid('2026-05-01', '2026-05-31')
    const lastDateIdx = grid.lastIndexOf('2026-05-31')
    grid.slice(lastDateIdx + 1).forEach((cell) => expect(cell).toBeNull())
  })
})

describe('computeTapeStatus', () => {
  it('収入がなければ空のMapを返す', () => {
    const txs = [makeTx({ transaction_type: 'expense', date: '2026-05-10' })]
    expect(computeTapeStatus(txs, '2026-05-01', '2026-05-31').size).toBe(0)
  })

  it('最初の収入日からテープが緑で始まり期末まで続く', () => {
    const txs = [makeTx({ transaction_type: 'income', amount: '100000', date: '2026-05-07' })]
    const map = computeTapeStatus(txs, '2026-05-01', '2026-05-31')
    expect(map.get('2026-05-06')).toBeUndefined()
    expect(map.get('2026-05-07')).toBe('green')
    expect(map.get('2026-05-31')).toBe('green')
  })

  it('残高がマイナスになった日から赤に切り替わる', () => {
    const txs = [
      makeTx({ id: 1, transaction_type: 'income', amount: '10000', date: '2026-05-07' }),
      makeTx({ id: 2, transaction_type: 'expense', amount: '15000', date: '2026-05-10' }),
    ]
    const map = computeTapeStatus(txs, '2026-05-01', '2026-05-31')
    expect(map.get('2026-05-07')).toBe('green')
    expect(map.get('2026-05-09')).toBe('green')
    expect(map.get('2026-05-10')).toBe('red')
    expect(map.get('2026-05-31')).toBe('red')
  })

  it('一度赤に転落したら後から収入があっても期末まで赤のまま', () => {
    const txs = [
      makeTx({ id: 1, transaction_type: 'income', amount: '10000', date: '2026-05-07' }),
      makeTx({ id: 2, transaction_type: 'expense', amount: '15000', date: '2026-05-10' }),
      makeTx({ id: 3, transaction_type: 'income', amount: '100000', date: '2026-05-20' }),
    ]
    const map = computeTapeStatus(txs, '2026-05-01', '2026-05-31')
    expect(map.get('2026-05-10')).toBe('red')
    expect(map.get('2026-05-20')).toBe('red')
    expect(map.get('2026-05-31')).toBe('red')
  })

  it('支出でマイナスにならなければ期末まで緑のまま', () => {
    const txs = [
      makeTx({ id: 1, transaction_type: 'income', amount: '100000', date: '2026-05-07' }),
      makeTx({ id: 2, transaction_type: 'expense', amount: '30000', date: '2026-05-15' }),
    ]
    const map = computeTapeStatus(txs, '2026-05-01', '2026-05-31')
    expect(map.get('2026-05-07')).toBe('green')
    expect(map.get('2026-05-31')).toBe('green')
    expect(map.has('2026-05-06')).toBe(false)
  })

  it('期間外のトランザクションは無視される', () => {
    const txs = [
      makeTx({ id: 1, transaction_type: 'income', amount: '100000', date: '2026-04-07' }),
    ]
    expect(computeTapeStatus(txs, '2026-05-01', '2026-05-31').size).toBe(0)
  })

  it('カスタム期間（6/21〜7/20）でも正しく動作する', () => {
    const txs = [
      makeTx({ id: 1, transaction_type: 'income', amount: '100000', date: '2026-06-25' }),
      makeTx({ id: 2, transaction_type: 'expense', amount: '30000', date: '2026-07-10' }),
    ]
    const map = computeTapeStatus(txs, '2026-06-21', '2026-07-20')
    expect(map.get('2026-06-24')).toBeUndefined()
    expect(map.get('2026-06-25')).toBe('green')
    expect(map.get('2026-07-10')).toBe('green')
    expect(map.get('2026-07-20')).toBe('green')
  })
})

describe('buildPeriodEntryList', () => {
  it('通常の収支と固定費予定を日付昇順にまとめる', () => {
    const txs = [
      makeTx({ id: 1, date: '2026-05-10', transaction_type: 'expense', amount: '1000' }),
      makeTx({ id: 2, date: '2026-05-05', transaction_type: 'income', amount: '3000' }),
    ]
    const fixed = [makeFixed({ id: 1, date: '2026-05-01' })]

    const list = buildPeriodEntryList(txs, fixed, '2026-05-01', '2026-05-31')

    expect(list.map((e) => e.date)).toEqual(['2026-05-01', '2026-05-05', '2026-05-10'])
  })

  it('期間外のデータは除外される', () => {
    const txs = [makeTx({ id: 1, date: '2026-04-30' }), makeTx({ id: 2, date: '2026-06-01' })]
    const fixed = [makeFixed({ id: 1, date: '2026-04-01' })]

    const list = buildPeriodEntryList(txs, fixed, '2026-05-01', '2026-05-31')

    expect(list).toHaveLength(0)
  })

  it('通常の収支は kind: transaction で元データを保持する', () => {
    const tx = makeTx({ id: 1, date: '2026-05-10', transaction_type: 'income', amount: '2000' })
    const list = buildPeriodEntryList([tx], [], '2026-05-01', '2026-05-31')

    expect(list[0]).toMatchObject({
      kind: 'transaction',
      date: '2026-05-10',
      categoryName: '食費',
      amount: 2000,
      transactionType: 'income',
      transaction: tx,
    })
  })

  it('固定費予定は kind: fixed_expense で元データを保持する', () => {
    const fe = makeFixed({ id: 1, date: '2026-05-01', amount: 50000 })
    const list = buildPeriodEntryList([], [fe], '2026-05-01', '2026-05-31')

    expect(list[0]).toMatchObject({
      kind: 'fixed_expense',
      date: '2026-05-01',
      categoryName: '住居費',
      amount: 50000,
      scheduledFixedExpense: fe,
    })
  })
})
