<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import { useCategoryStore } from '@/stores/categories'
import type { Transaction } from '@/api/types'

const props = defineProps<{
  transaction?: Transaction
  initialDate?: string
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const store = useTransactionStore()
const categoryStore = useCategoryStore()

const filteredCategories = computed(() =>
  categoryStore.categories.filter((c) => c.transaction_type === form.value.transaction_type),
)

onMounted(() => {
  categoryStore.fetchCategories()
})

const form = ref({
  transaction_type: 'expense' as 'income' | 'expense',
  date: props.initialDate ?? new Date().toISOString().slice(0, 10),
  amount: '',
  category_name: '',
  memo: '',
})

const errors = ref<string[]>([])
const submitting = ref(false)

watch(
  () => props.transaction,
  (tx) => {
    if (tx) {
      form.value = {
        transaction_type: tx.transaction_type,
        date: tx.date,
        amount: tx.amount,
        category_name: tx.category.name,
        memo: tx.memo ?? '',
      }
    }
  },
  { immediate: true },
)

function validate(): boolean {
  errors.value = []
  if (!form.value.date) errors.value.push('日付は必須です')
  const amt = Number(form.value.amount)
  if (!form.value.amount || isNaN(amt) || !Number.isInteger(amt) || amt < 1) {
    errors.value.push('金額は1以上の整数を入力してください')
  }
  if (!form.value.category_name.trim() || form.value.category_name === '__new__') {
    errors.value.push('カテゴリは必須です')
  }
  return errors.value.length === 0
}

async function submit() {
  if (!validate()) return
  submitting.value = true
  try {
    if (props.transaction) {
      await store.editTransaction(props.transaction.id, {
        transaction_type: form.value.transaction_type,
        amount: Number(form.value.amount),
        date: form.value.date,
        memo: form.value.memo || undefined,
      })
    } else {
      await store.addTransaction({
        transaction_type: form.value.transaction_type,
        amount: Number(form.value.amount),
        date: form.value.date,
        category_name: form.value.category_name.trim(),
        memo: form.value.memo || undefined,
      })
    }
    emit('saved')
    emit('close')
  } catch {
    errors.value = ['保存に失敗しました。もう一度お試しください。']
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ transaction ? '収支を編集' : '収支を登録' }}</h2>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <form @submit.prevent="submit">
        <ul v-if="errors.length" class="error-list">
          <li v-for="err in errors" :key="err">{{ err }}</li>
        </ul>

        <div class="field">
          <label>種別</label>
          <div class="radio-group">
            <label class="radio-label">
              <input v-model="form.transaction_type" type="radio" value="expense" />
              支出
            </label>
            <label class="radio-label">
              <input v-model="form.transaction_type" type="radio" value="income" />
              収入
            </label>
          </div>
        </div>

        <div class="field">
          <label for="date">日付</label>
          <input id="date" v-model="form.date" type="date" required />
        </div>

        <div class="field">
          <label for="amount">金額（円）</label>
          <input
            id="amount"
            v-model="form.amount"
            type="number"
            min="1"
            step="1"
            placeholder="例: 3000"
            required
          />
        </div>

        <div class="field">
          <label for="category">カテゴリ</label>
          <select
            v-if="filteredCategories.length > 0 && !transaction"
            id="category"
            v-model="form.category_name"
            required
          >
            <option value="">カテゴリを選択してください</option>
            <option v-for="c in filteredCategories" :key="c.id" :value="c.name">{{ c.name }}</option>
            <option value="__new__">＋ 新しいカテゴリを入力</option>
          </select>
          <input
            v-if="filteredCategories.length === 0 || form.category_name === '__new__' || !!transaction"
            id="category-input"
            v-model="form.category_name"
            type="text"
            placeholder="例: 食費"
            :disabled="!!transaction"
            required
          />
          <p v-if="transaction" class="hint">編集時はカテゴリを変更できません</p>
        </div>

        <div class="field">
          <label for="memo">メモ（任意）</label>
          <input id="memo" v-model="form.memo" type="text" placeholder="例: スーパーで購入" />
        </div>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" @click="emit('close')">キャンセル</button>
          <button type="submit" class="btn-submit" :disabled="submitting">
            {{ submitting ? '保存中...' : transaction ? '更新する' : '登録する' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 440px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-header h2 {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.4rem;
  cursor: pointer;
  color: #666;
}

.field {
  margin-bottom: 16px;
}

.field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 4px;
  color: #444;
}

.field input[type='text'],
.field input[type='number'],
.field input[type='date'] {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.field input:disabled {
  background: #f5f5f5;
  color: #999;
}

.hint {
  font-size: 0.75rem;
  color: #999;
  margin: 4px 0 0;
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

.error-list {
  background: #fff0f0;
  border: 1px solid #ffcccc;
  border-radius: 4px;
  padding: 8px 16px;
  margin-bottom: 16px;
  color: #cc0000;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

.btn-cancel {
  padding: 8px 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.95rem;
}

.btn-submit {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  background: #4caf50;
  color: #fff;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
}

.btn-submit:disabled {
  background: #aaa;
  cursor: not-allowed;
}
</style>
