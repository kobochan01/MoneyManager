import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DayTransactionListModal from '../DayTransactionListModal.vue'
import { useTransactionStore } from '@/stores/transactions'
import * as transactionsApi from '@/api/transactions'
import type { Transaction } from '@/api/types'

vi.mock('@/api/transactions')

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 1,
  transaction_type: 'expense',
  amount: '3000',
  date: '2026-07-10',
  memo: null,
  category: { id: 1, name: '食費' },
  user: { id: 1, name: 'テスト' },
  ...overrides,
})

describe('DayTransactionListModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('指定した日付の収支だけが一覧表示される', () => {
    const store = useTransactionStore()
    store.transactions = [
      makeTx({ id: 1, date: '2026-07-10', category: { id: 1, name: '食費' } }),
      makeTx({ id: 2, date: '2026-07-11', category: { id: 2, name: '交通費' } }),
    ]

    const wrapper = mount(DayTransactionListModal, {
      props: { date: '2026-07-10' },
      global: { stubs: { TransactionModal: true } },
    })

    expect(wrapper.text()).toContain('食費')
    expect(wrapper.text()).not.toContain('交通費')
  })

  it('タイトルの日付表記がハイフンではなくスラッシュ区切りになる', () => {
    const wrapper = mount(DayTransactionListModal, {
      props: { date: '2026-07-10' },
      global: { stubs: { TransactionModal: true } },
    })

    expect(wrapper.find('.modal-header h2').text()).toContain('2026/07/10')
    expect(wrapper.find('.modal-header h2').text()).not.toContain('2026-07-10')
  })

  it('その日の収支が0件のとき、その旨が表示される', () => {
    const store = useTransactionStore()
    store.transactions = []

    const wrapper = mount(DayTransactionListModal, {
      props: { date: '2026-07-10' },
      global: { stubs: { TransactionModal: true } },
    })

    expect(wrapper.text()).toContain('登録されていません')
  })

  it('＋ボタンを押すと収支入力モーダルが表示される', async () => {
    const wrapper = mount(DayTransactionListModal, {
      props: { date: '2026-07-10' },
      global: { stubs: { TransactionModal: true } },
    })

    expect(wrapper.findComponent({ name: 'TransactionModal' }).exists()).toBe(false)
    await wrapper.find('.btn-add').trigger('click')
    expect(wrapper.findComponent({ name: 'TransactionModal' }).exists()).toBe(true)
  })

  it('削除ボタンを押しても即削除されず、確認後に削除される', async () => {
    const store = useTransactionStore()
    store.transactions = [makeTx({ id: 1, date: '2026-07-10' })]
    vi.mocked(transactionsApi.deleteTransaction).mockResolvedValue({} as any)

    const wrapper = mount(DayTransactionListModal, {
      props: { date: '2026-07-10' },
      global: { stubs: { TransactionModal: true } },
    })

    await wrapper.find('.btn-delete').trigger('click')
    expect(transactionsApi.deleteTransaction).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('本当に削除しますか')

    await wrapper.find('.btn-delete-confirm').trigger('click')
    expect(transactionsApi.deleteTransaction).toHaveBeenCalledWith(1)
  })
})
