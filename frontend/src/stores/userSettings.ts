import { ref } from 'vue'
import { defineStore } from 'pinia'
import { getUserSettings, updateUserSettings } from '@/api/userSettings'
import type { UserSetting } from '@/api/types'

const DEFAULT_SETTING: UserSetting = {
  start_day: 1,
  closing_day: 31,
  week_start: 'sunday',
}

export const useUserSettingStore = defineStore('userSettings', () => {
  const setting = ref<UserSetting>({ ...DEFAULT_SETTING })
  const error = ref<string | null>(null)

  async function fetchSettings(): Promise<void> {
    try {
      const response = await getUserSettings()
      setting.value = response.data
      error.value = null
    } catch {
      setting.value = { ...DEFAULT_SETTING }
      error.value = '設定の読み込みに失敗しました'
    }
  }

  async function saveSettings(data: UserSetting): Promise<void> {
    try {
      const response = await updateUserSettings(data)
      setting.value = response.data
      error.value = null
    } catch {
      error.value = '設定の保存に失敗しました'
    }
  }

  return { setting, error, fetchSettings, saveSettings }
})
