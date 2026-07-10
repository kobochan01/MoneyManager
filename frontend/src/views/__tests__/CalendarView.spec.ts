import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import CalendarView from '../CalendarView.vue'
import * as transactionsApi from '@/api/transactions'
import * as userSettingsApi from '@/api/userSettings'
import * as fixedExpensesApi from '@/api/fixedExpenses'

vi.mock('@/api/transactions')
vi.mock('@/api/userSettings')
vi.mock('@/api/fixedExpenses')
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

describe('CalendarView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
    vi.mocked(transactionsApi.getTransactions).mockResolvedValue({
      data: { transactions: [] },
    } as any)
    vi.mocked(userSettingsApi.getUserSettings).mockResolvedValue({
      data: { start_day: 1, closing_day: 31, week_start: 'sunday' },
    } as any)
    vi.mocked(fixedExpensesApi.getScheduledFixedExpenses).mockResolvedValue({
      data: { scheduled: [] },
    } as any)
  })

  it('月タイトルと期間ラベルが別要素になっており、月タイトル単体が中央寄せの対象になる', async () => {
    const wrapper = mount(CalendarView)
    await flushPromises()

    const title = wrapper.find('.month-title')
    const periodLabel = wrapper.find('.period-label')

    expect(title.exists()).toBe(true)
    expect(periodLabel.exists()).toBe(true)
    expect(title.text()).toMatch(/^\d+年\s*\d+月$/)
    expect(periodLabel.text()).toContain('〜')
  })
})
