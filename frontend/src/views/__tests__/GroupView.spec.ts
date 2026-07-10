import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GroupView from '../GroupView.vue'
import * as groupApi from '@/api/group'

vi.mock('@/api/group')
vi.mock('@/api/invitations')

const pushMock = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

describe('GroupView', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(groupApi.getGroup).mockResolvedValue({
      data: { group: { id: 1, name: 'テストグループ', members: [] } },
    } as any)
  })

  it('カレンダーに戻るボタンをクリックするとカレンダー画面に遷移する', async () => {
    const wrapper = mount(GroupView)
    const backButton = wrapper.findAll('button').find((b) => b.text().includes('カレンダーに戻る'))

    expect(backButton).toBeTruthy()
    await backButton!.trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/calendar')
  })
})
