import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserSettingStore } from '../userSettings'
import * as api from '@/api/userSettings'
import type { UserSetting } from '@/api/types'

vi.mock('@/api/userSettings')

const defaultSetting: UserSetting = {
  start_day: 1,
  closing_day: 31,
  week_start: 'sunday',
}

describe('useUserSettingStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  describe('fetchSettings', () => {
    it('成功時にsettingがセットされる', async () => {
      vi.mocked(api.getUserSettings).mockResolvedValue({
        data: { start_day: 21, closing_day: 20, week_start: 'monday' },
      } as any)

      const store = useUserSettingStore()
      await store.fetchSettings()

      expect(store.setting.start_day).toBe(21)
      expect(store.setting.closing_day).toBe(20)
      expect(store.setting.week_start).toBe('monday')
      expect(store.error).toBeNull()
    })

    it('失敗時にデフォルト値を維持しerrorがセットされる', async () => {
      vi.mocked(api.getUserSettings).mockRejectedValue(new Error('network error'))

      const store = useUserSettingStore()
      await store.fetchSettings()

      expect(store.setting).toEqual(defaultSetting)
      expect(store.error).toBe('設定の読み込みに失敗しました')
    })
  })

  describe('saveSettings', () => {
    it('成功時にsettingが更新される', async () => {
      const updated: UserSetting = { start_day: 16, closing_day: 15, week_start: 'monday' }
      vi.mocked(api.updateUserSettings).mockResolvedValue({ data: updated } as any)

      const store = useUserSettingStore()
      await store.saveSettings(updated)

      expect(store.setting).toEqual(updated)
      expect(store.error).toBeNull()
    })

    it('失敗時にerrorがセットされる', async () => {
      vi.mocked(api.updateUserSettings).mockRejectedValue(new Error('network error'))

      const store = useUserSettingStore()
      await store.saveSettings(defaultSetting)

      expect(store.error).toBe('設定の保存に失敗しました')
    })
  })
})
