<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useUserSettingStore } from '@/stores/userSettings'

const store = useUserSettingStore()

const form = ref({ start_day: 1, closing_day: 31, week_start: 'sunday' as 'sunday' | 'monday' })
const saved = ref(false)

onMounted(async () => {
  await store.fetchSettings()
  form.value = { ...store.setting }
})

const days = Array.from({ length: 31 }, (_, i) => i + 1)

async function submit() {
  saved.value = false
  await store.saveSettings({ ...form.value })
  if (!store.error) saved.value = true
}
</script>

<template>
  <div class="settings">
    <h1>設定</h1>

    <form @submit.prevent="submit" class="settings-form">
      <p v-if="store.error" class="error">{{ store.error }}</p>
      <p v-if="saved" class="success">設定を保存しました</p>

      <div class="field">
        <label for="start_day">開始日</label>
        <select id="start_day" v-model="form.start_day">
          <option v-for="d in days" :key="d" :value="d">{{ d }}日</option>
        </select>
      </div>

      <div class="field">
        <label for="closing_day">締め日</label>
        <select id="closing_day" v-model="form.closing_day">
          <option v-for="d in days" :key="d" :value="d">{{ d }}日</option>
        </select>
      </div>

      <div class="field">
        <label>週の始まり</label>
        <div class="radio-group">
          <label class="radio-label">
            <input v-model="form.week_start" type="radio" value="sunday" />
            日曜始まり
          </label>
          <label class="radio-label">
            <input v-model="form.week_start" type="radio" value="monday" />
            月曜始まり
          </label>
        </div>
      </div>

      <button type="submit" class="btn-save">保存する</button>
    </form>
  </div>
</template>

<style scoped>
.settings {
  max-width: 480px;
  margin: 40px auto;
  padding: 0 16px;
}

h1 {
  font-size: 1.4rem;
  font-weight: bold;
  margin-bottom: 24px;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field label:first-child {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: #444;
}

.field select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
}

.radio-group {
  display: flex;
  gap: 24px;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-save {
  align-self: flex-start;
  padding: 10px 28px;
  background: #4caf50;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
}

.error {
  color: #cc0000;
  font-size: 0.875rem;
}

.success {
  color: #2e7d32;
  font-size: 0.875rem;
}
</style>
