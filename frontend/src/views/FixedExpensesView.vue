<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFixedExpenseStore } from '@/stores/fixedExpenses'
import { useCategoryStore } from '@/stores/categories'
import type { FixedExpense } from '@/api/types'

const router = useRouter()
const store = useFixedExpenseStore()
const categoryStore = useCategoryStore()

const expenseCategories = computed(() =>
  categoryStore.categories.filter(c => c.transaction_type === 'expense'),
)

const form = ref({ name: '', amount: 0, day: 1, category_id: 0 })
const editingId = ref<number | null>(null)
const days = Array.from({ length: 31 }, (_, i) => i + 1)

onMounted(async () => {
  await store.fetchFixedExpenses()
  await categoryStore.fetchCategories()
  if (expenseCategories.value.length > 0) {
    form.value.category_id = expenseCategories.value[0]!.id
  }
})

function startEdit(fe: FixedExpense) {
  editingId.value = fe.id
  form.value = { name: fe.name, amount: fe.amount, day: fe.day, category_id: fe.category_id }
}

function cancelEdit() {
  editingId.value = null
  form.value = { name: '', amount: 0, day: 1, category_id: expenseCategories.value[0]?.id ?? 0 }
}

async function submitAdd() {
  if (!form.value.name || form.value.amount <= 0) return
  await store.addFixedExpense({ ...form.value })
  if (!store.error) {
    form.value = { name: '', amount: 0, day: 1, category_id: expenseCategories.value[0]?.id ?? 0 }
  }
}

async function submitEdit(id: number) {
  const fe = store.fixedExpenses.find(f => f.id === id)
  if (!fe) return
  await store.editFixedExpense({ ...fe, ...form.value })
  if (!store.error) cancelEdit()
}

async function remove(id: number) {
  await store.removeFixedExpense(id)
}
</script>

<template>
  <div class="fixed-expenses">
    <div class="page-header">
      <button class="btn-back" @click="router.push('/calendar')">← カレンダーへ戻る</button>
      <h1>固定費設定</h1>
    </div>

    <p v-if="store.error" class="error">{{ store.error }}</p>

    <!-- 登録済み一覧 -->
    <section class="list-section">
      <p v-if="store.fixedExpenses.length === 0" class="empty">登録された固定費はありません</p>
      <div v-for="fe in store.fixedExpenses" :key="fe.id" class="list-item">
        <template v-if="editingId === fe.id">
          <div class="edit-form">
            <input v-model="form.name" type="text" placeholder="項目名" class="input" />
            <input v-model.number="form.amount" type="number" placeholder="金額" class="input" />
            <select v-model.number="form.day" class="input">
              <option v-for="d in days" :key="d" :value="d">{{ d }}日</option>
            </select>
            <select v-model.number="form.category_id" class="input">
              <option v-for="c in expenseCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
            <div class="edit-actions">
              <button class="btn-save" @click="submitEdit(fe.id)">保存</button>
              <button class="btn-cancel" @click="cancelEdit">キャンセル</button>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="item-info">
            <span class="item-name">{{ fe.name }}</span>
            <span class="item-detail">{{ fe.day }}日払い　¥{{ fe.amount.toLocaleString('ja-JP') }}　{{ fe.category.name }}</span>
          </div>
          <div class="item-actions">
            <button class="btn-edit" @click="startEdit(fe)">編集</button>
            <button class="btn-delete" @click="remove(fe.id)">削除</button>
          </div>
        </template>
      </div>
    </section>

    <!-- 新規追加フォーム -->
    <section class="add-section">
      <h2>新規追加</h2>
      <div class="add-form">
        <div class="field">
          <label>項目名</label>
          <input v-model="form.name" type="text" placeholder="例: 家賃" class="input" />
        </div>
        <div class="field">
          <label>金額</label>
          <input v-model.number="form.amount" type="number" placeholder="例: 80000" class="input" />
        </div>
        <div class="field">
          <label>引き落とし日</label>
          <select v-model.number="form.day" class="input">
            <option v-for="d in days" :key="d" :value="d">{{ d }}日</option>
          </select>
        </div>
        <div class="field">
          <label>カテゴリー</label>
          <select v-model.number="form.category_id" class="input">
            <option v-for="c in expenseCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <button class="btn-add" @click="submitAdd">追加する</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fixed-expenses {
  max-width: 560px;
  margin: 40px auto;
  padding: 0 16px;
}

.page-header {
  margin-bottom: 24px;
}

.btn-back {
  background: none;
  border: none;
  color: #2c3e50;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 12px;
  display: block;
}

.btn-back:hover {
  text-decoration: underline;
}

h1 {
  font-size: 1.4rem;
  font-weight: bold;
  margin: 0;
}

h2 {
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0 0 16px;
}

.error {
  color: #cc0000;
  font-size: 0.875rem;
  margin-bottom: 12px;
}

.list-section {
  margin-bottom: 40px;
}

.empty {
  color: #888;
  font-size: 0.875rem;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-name {
  font-weight: 600;
}

.item-detail {
  font-size: 0.875rem;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.edit-actions {
  display: flex;
  gap: 8px;
}

.add-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 6px;
  color: #444;
}

.input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

.btn-add {
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

.btn-save {
  padding: 6px 16px;
  background: #1976d2;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel {
  padding: 6px 16px;
  background: #9e9e9e;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-edit {
  padding: 4px 12px;
  background: #fff;
  border: 1px solid #1976d2;
  color: #1976d2;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-delete {
  padding: 4px 12px;
  background: #fff;
  border: 1px solid #cc0000;
  color: #cc0000;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}
</style>
