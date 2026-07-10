import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HelpModal from '../HelpModal.vue'

describe('HelpModal', () => {
  it('主要4項目の見出しが表示される', () => {
    const wrapper = mount(HelpModal)

    expect(wrapper.text()).toContain('カレンダー画面の見方')
    expect(wrapper.text()).toContain('固定費の登録方法')
    expect(wrapper.text()).toContain('グループ招待の使い方')
    expect(wrapper.text()).toContain('締め日・週始まり曜日の設定')
  })

  it('閉じるボタンを押すとcloseイベントが発火する', async () => {
    const wrapper = mount(HelpModal)

    await wrapper.find('.close-btn').trigger('click')

    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
