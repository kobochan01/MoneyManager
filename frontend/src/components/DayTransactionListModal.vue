<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTransactionStore } from '@/stores/transactions'
import TransactionModal from '@/components/TransactionModal.vue'
import type { Transaction } from '@/api/types'

const props = defineProps<{
  date: string
}>()

const emit = defineEmits<{
  close: []
}>()

const store = useTransactionStore()

const dayTransactions = computed(() =>
  store.transactions.filter((t) => t.date === props.date),
)

const formattedDate = computed(() => props.date.split('-').join('/'))

const showFormModal = ref(false)
const editingTransaction = ref<Transaction | undefined>(undefined)
const confirmingDeleteId = ref<number | null>(null)

function openAdd() {
  editingTransaction.value = undefined
  showFormModal.value = true
}

function openEdit(tx: Transaction) {
  editingTransaction.value = tx
  showFormModal.value = true
}

function closeForm() {
  showFormModal.value = false
  editingTransaction.value = undefined
}

function askDelete(id: number) {
  confirmingDeleteId.value = id
}

function cancelDelete() {
  confirmingDeleteId.value = null
}

async function confirmDelete(id: number) {
  await store.removeTransaction(id)
  confirmingDeleteId.value = null
}

function formatAmount(tx: Transaction): string {
  const sign = tx.transaction_type === 'income' ? '+' : '-'
  return `${sign}¥${Number(tx.amount).toLocaleString('ja-JP')}`
}
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>{{ formattedDate }} の収支</h2>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="day-list">
        <p v-if="dayTransactions.length === 0" class="empty">
          この日の収支はまだ登録されていません
        </p>
        <div v-for="tx in dayTransactions" :key="tx.id" class="day-list-item">
          <div class="tx-info">
            <span class="tx-category">{{ tx.category.name }}</span>
            <span class="tx-amount" :class="tx.transaction_type">{{ formatAmount(tx) }}</span>
          </div>

          <div v-if="confirmingDeleteId === tx.id" class="confirm-delete">
            <span>本当に削除しますか？</span>
            <button class="btn-delete-confirm" @click="confirmDelete(tx.id)">削除する</button>
            <button class="btn-delete-cancel" @click="cancelDelete">キャンセル</button>
          </div>
          <div v-else class="tx-actions">
            <button class="btn-edit" @click="openEdit(tx)">編集</button>
            <button class="btn-delete" @click="askDelete(tx.id)">削除</button>
          </div>
        </div>
      </div>

      <button class="btn-add" @click="openAdd">＋ 収支を登録する</button>
    </div>

    <TransactionModal
      v-if="showFormModal"
      :transaction="editingTransaction"
      :initial-date="date"
      @close="closeForm"
      @saved="closeForm"
    />
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 90%;
  max-width: 420px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #888;
}

.empty {
  color: #888;
  font-size: 0.9rem;
  text-align: center;
  padding: 16px 0;
}

.day-list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
  gap: 8px;
  flex-wrap: wrap;
}

.tx-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tx-amount.income {
  color: #2ecc71;
  font-weight: bold;
}

.tx-amount.expense {
  color: #e74c3c;
  font-weight: bold;
}

.tx-actions {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 4px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-delete {
  color: #e74c3c;
  border-color: #e74c3c;
}

.confirm-delete {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #e74c3c;
}

.btn-delete-confirm {
  padding: 4px 10px;
  border: none;
  border-radius: 4px;
  background: #e74c3c;
  color: #fff;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-delete-cancel {
  padding: 4px 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-add {
  width: 100%;
  margin-top: 12px;
  padding: 10px;
  border: none;
  border-radius: 4px;
  background: #2ecc71;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}
</style>
