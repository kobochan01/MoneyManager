<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

async function handleLogin(): Promise<void> {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await authStore.loginAction({ email: email.value, password: password.value })
    await router.push({ name: 'calendar' })
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      errorMessage.value = 'メールアドレスまたはパスワードが正しくありません'
    } else {
      errorMessage.value = '予期しないエラーが発生しました'
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <div class="auth-container">
    <h1>ログイン</h1>
    <form @submit.prevent="handleLogin">
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
          autocomplete="current-password"
          placeholder="パスワード"
        />
      </div>
      <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'ログイン中...' : 'ログイン' }}
      </button>
    </form>
    <p>アカウントをお持ちでない方は <RouterLink to="/signup">新規登録</RouterLink></p>
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

.error {
  color: #e53e3e;
  font-size: 0.875rem;
  margin: 4px 0;
}

p {
  margin-top: 16px;
  text-align: center;
  font-size: 0.875rem;
}
</style>
