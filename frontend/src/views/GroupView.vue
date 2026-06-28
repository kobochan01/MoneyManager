<template>
  <div class="group-view">
    <h1>グループ管理</h1>

    <section v-if="group" class="group-info">
      <h2>{{ group.name }}</h2>
      <ul class="member-list">
        <li v-for="member in group.members" :key="member.id">
          {{ member.name }}
          <span class="role-badge">{{ member.role === 'owner' ? 'オーナー' : 'メンバー' }}</span>
        </li>
      </ul>
    </section>

    <section class="invite-section">
      <h2>メンバーを招待する</h2>
      <div class="invite-form">
        <input
          v-model="inviteEmail"
          type="email"
          placeholder="招待するメールアドレス"
        />
        <button @click="issueInvitation" :disabled="!inviteEmail || isLoading">
          招待URLを発行する
        </button>
      </div>

      <div v-if="inviteUrl" class="invite-url">
        <p>招待URLが発行されました。コピーして共有してください：</p>
        <div class="url-bar">
          <span>{{ inviteUrl }}</span>
          <button @click="copyUrl">コピー</button>
        </div>
        <p v-if="copied" class="copied-message">コピーしました！</p>
      </div>

      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getGroup } from '@/api/group'
import { createInvitation } from '@/api/invitations'
import type { Group } from '@/api/types'

const group = ref<Group | null>(null)
const inviteEmail = ref('')
const inviteUrl = ref('')
const copied = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const res = await getGroup()
  group.value = res.data.group
})

const issueInvitation = async () => {
  isLoading.value = true
  errorMessage.value = ''
  inviteUrl.value = ''
  try {
    const res = await createInvitation(inviteEmail.value)
    const token = res.data.token
    inviteUrl.value = `${window.location.origin}/invitations/accept?token=${token}`
    inviteEmail.value = ''
  } catch {
    errorMessage.value = '招待URLの発行に失敗しました'
  } finally {
    isLoading.value = false
  }
}

const copyUrl = async () => {
  await navigator.clipboard.writeText(inviteUrl.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.group-view {
  max-width: 600px;
  margin: 0 auto;
  padding: 24px;
}
.member-list {
  list-style: none;
  padding: 0;
}
.member-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.role-badge {
  font-size: 12px;
  background: #e0e0e0;
  border-radius: 4px;
  padding: 2px 6px;
}
.invite-section {
  margin-top: 32px;
}
.invite-form {
  display: flex;
  gap: 8px;
}
.invite-form input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.url-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
  word-break: break-all;
  margin-top: 8px;
}
.copied-message {
  color: green;
  font-size: 14px;
}
.error {
  color: red;
}
</style>
