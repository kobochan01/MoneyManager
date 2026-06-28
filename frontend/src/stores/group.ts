import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getGroup } from '@/api/group'
import { createInvitation } from '@/api/invitations'
import type { Group } from '@/api/types'

export const useGroupStore = defineStore('group', () => {
  const group = ref<Group | null>(null)
  const inviteToken = ref<string | null>(null)
  const error = ref<string | null>(null)

  const fetchGroup = async () => {
    error.value = null
    try {
      const res = await getGroup()
      group.value = res.data.group
    } catch {
      error.value = 'グループ情報の取得に失敗しました'
    }
  }

  const issueInvitation = async (email: string) => {
    error.value = null
    inviteToken.value = null
    try {
      const res = await createInvitation(email)
      inviteToken.value = res.data.token
    } catch {
      error.value = '招待URLの発行に失敗しました'
    }
  }

  return { group, inviteToken, error, fetchGroup, issueInvitation }
})
