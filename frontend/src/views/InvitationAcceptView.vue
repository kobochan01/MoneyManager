<template>
  <div class="invitation-view">
    <div v-if="isLoading" class="message">読み込み中...</div>

    <div v-else-if="errorMessage" class="error-box">
      <p>{{ errorMessage }}</p>
      <router-link to="/login">ログインページへ</router-link>
    </div>

    <div v-else-if="invitation" class="invitation-box">
      <h1>グループへの招待</h1>
      <p><strong>{{ invitation.invited_by }}</strong> さんから招待が届いています</p>
      <p>グループ名：<strong>{{ invitation.group_name }}</strong></p>

      <div v-if="invitation.accepted" class="message">
        この招待はすでに使用済みです
      </div>
      <div v-else-if="invitation.expired" class="message">
        この招待は有効期限切れです
      </div>
      <div v-else class="actions">
        <button @click="handleAccept" :disabled="isAccepting">
          {{ isAccepting ? '参加中...' : 'グループに参加する' }}
        </button>
        <router-link to="/calendar">キャンセル</router-link>
      </div>

      <p v-if="acceptError" class="error">{{ acceptError }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getInvitation, acceptInvitation } from '@/api/invitations'
import { useAuthStore } from '@/stores/auth'
import type { Invitation } from '@/api/types'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const invitation = ref<Invitation | null>(null)
const isLoading = ref(true)
const isAccepting = ref(false)
const errorMessage = ref('')
const acceptError = ref('')

onMounted(async () => {
  const token = route.query.token as string
  if (!token) {
    errorMessage.value = '招待URLが正しくありません'
    isLoading.value = false
    return
  }
  try {
    const res = await getInvitation(token)
    invitation.value = res.data.invitation
  } catch {
    errorMessage.value = '招待が見つかりません'
  } finally {
    isLoading.value = false
  }
})

const handleAccept = async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'login', query: { redirect: route.fullPath } })
    return
  }
  isAccepting.value = true
  acceptError.value = ''
  try {
    const token = route.query.token as string
    await acceptInvitation(token)
    router.push('/calendar')
  } catch {
    acceptError.value = '参加に失敗しました。もう一度お試しください'
  } finally {
    isAccepting.value = false
  }
}
</script>

<style scoped>
.invitation-view {
  max-width: 480px;
  margin: 80px auto;
  padding: 24px;
  text-align: center;
}
.invitation-box {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 32px;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  align-items: center;
}
.message {
  color: #666;
  margin-top: 16px;
}
.error-box {
  color: #c00;
}
.error {
  color: red;
  margin-top: 8px;
}
</style>
