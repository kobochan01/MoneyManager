import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useGroupStore } from '../group'
import * as groupApi from '@/api/group'
import * as invitationsApi from '@/api/invitations'
import type { Group } from '@/api/types'

vi.mock('@/api/group')
vi.mock('@/api/invitations')

const makeGroup = (): Group => ({
  id: 1,
  name: '山田家の家計簿',
  members: [{ id: 1, name: '山田太郎', role: 'owner' }],
})

describe('useGroupStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('fetchGroup', () => {
    it('成功時にgroupがセットされる', async () => {
      vi.mocked(groupApi.getGroup).mockResolvedValue({
        data: { group: makeGroup() },
      } as any)

      const store = useGroupStore()
      await store.fetchGroup()

      expect(store.group?.name).toBe('山田家の家計簿')
      expect(store.group?.members).toHaveLength(1)
      expect(store.error).toBeNull()
    })

    it('失敗時にerrorがセットされる', async () => {
      vi.mocked(groupApi.getGroup).mockRejectedValue(new Error('network error'))

      const store = useGroupStore()
      await store.fetchGroup()

      expect(store.group).toBeNull()
      expect(store.error).toBe('グループ情報の取得に失敗しました')
    })
  })

  describe('issueInvitation', () => {
    it('成功時にinviteTokenがセットされる', async () => {
      vi.mocked(invitationsApi.createInvitation).mockResolvedValue({
        data: { token: 'abc123token' },
      } as any)

      const store = useGroupStore()
      await store.issueInvitation('guest@example.com')

      expect(store.inviteToken).toBe('abc123token')
      expect(store.error).toBeNull()
    })

    it('失敗時にerrorがセットされる', async () => {
      vi.mocked(invitationsApi.createInvitation).mockRejectedValue(new Error('network error'))

      const store = useGroupStore()
      await store.issueInvitation('guest@example.com')

      expect(store.inviteToken).toBeNull()
      expect(store.error).toBe('招待URLの発行に失敗しました')
    })
  })
})
