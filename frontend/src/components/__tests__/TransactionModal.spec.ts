import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TransactionModal from '../TransactionModal.vue'
import { useCategoryStore } from '@/stores/categories'

describe('TransactionModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('既存カテゴリがある状態で「＋ 新しいカテゴリを入力」を選ぶと、テキスト入力で新しいカテゴリ名を入力できる', async () => {
    const categoryStore = useCategoryStore()
    categoryStore.categories = [{ id: 1, name: '食費', transaction_type: 'expense' }]

    const wrapper = mount(TransactionModal, {})

    await wrapper.find('#category').setValue('__new__')
    expect(wrapper.find('#category-input').exists()).toBe(true)

    await wrapper.find('#category-input').setValue('交通費')

    const input = wrapper.find('#category-input')
    expect(input.exists()).toBe(true)
    expect((input.element as HTMLInputElement).value).toBe('交通費')
  })
})
