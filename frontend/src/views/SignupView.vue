<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import type { ErrorResponse } from '@/api/types'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const errorMessages = ref<string[]>([])
const isLoading = ref(false)

async function handleSignup(): Promise<void> {
  errorMessages.value = []
  isLoading.value = true

  try {
    await authStore.signupAction({
      name: name.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    await router.push({ name: 'calendar' })
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 422) {
      const data = error.response.data as ErrorResponse
      errorMessages.value = data.errors ?? ['登録に失敗しました']
    } else {
      errorMessages.value = ['予期しないエラーが発生しました']
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <h1>新規登録</h1>
    <form @submit.prevent="handleSignup">
      <div class="form-group">
        <label for="name">名前</label>
        <input
          id="name"
          v-model="name"
          type="text"
          required
          placeholder="山田 太郎"
        />
      </div>
      <div class="form-group">
        <label for="email">メールアドレス</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="example@mail.com"
        />
      </div>
      <div class="form-group">
        <label for="password">パスワード</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="new-password"
          placeholder="8文字以上"
        />
      </div>
      <div class="form-group">
        <label for="password-confirmation">パスワード（確認）</label>
        <input
          id="password-confirmation"
          v-model="passwordConfirmation"
          type="password"
          required
          autocomplete="new-password"
          placeholder="もう一度入力"
        />
      </div>
      <ul v-if="errorMessages.length" class="errors">
        <li v-for="msg in errorMessages" :key="msg">{{ msg }}</li>
      </ul>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '登録中...' : '登録する' }}
      </button>
    </form>
    <p>既にアカウントをお持ちの方は <RouterLink to="/login">ログイン</RouterLink></p>
  </div>
</template>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 80px auto;
  padding: 32px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

h1 {
  margin-bottom: 24px;
  font-size: 1.5rem;
  text-align: center;
}

.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

label {
  font-size: 0.875rem;
  font-weight: 600;
}

input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 10px;
  margin-top: 8px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.errors {
  color: #e53e3e;
  font-size: 0.875rem;
  padding-left: 20px;
  margin: 4px 0;
}

p {
  margin-top: 16px;
  text-align: center;
  font-size: 0.875rem;
}
</style>
