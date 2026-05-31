<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTransactionStore } from '@/stores/transactions'
import { useAuthStore } from '@/stores/auth'
import TransactionModal from '@/components/TransactionModal.vue'
import type { Transaction } from '@/api/types'

const router = useRouter()
const store = useTransactionStore()
const authStore = useAuthStore()

const showModal = ref(false)
const editingTransaction = ref<Transaction | undefined>(undefined)

onMounted(() => {
  store.fetchTransactions()
})

function openAddModal() {
  editingTransaction.value = undefined
  showModal.value = true
}

function openEditModal(tx: Transaction) {
  editingTransaction.value = tx
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingTransaction.value = undefined
}

async function handleDelete(id: number) {
  if (!confirm('この収支を削除しますか？')) return
  await store.removeTransaction(id)
}

async function handleLogout() {
  await authStore.logoutAction()
  router.push('/login')
}

function formatAmount(amount: string): string {
  return Number(amount).toLocaleString('ja-JP')
}

function formatDate(date: string): string {
  return date.replace(/-/g, '/')
}
</script>

<template>
  <div class="layout">
    <header class="header">
      <h1 class="app-title">MoneyManager</h1>
      <button class="btn-logout" @click="handleLogout">ログアウト</button>
    </header>

    <main class="main">
      <div class="summary-bar">
        <div class="summary-item income">
          <span class="summary-label">収入合計</span>
          <span class="summary-value">¥{{ formatAmount(String(store.totalIncome)) }}</span>
        </div>
        <div class="summary-item expense">
          <span class="summary-label">支出合計</span>
          <span class="summary-value">¥{{ formatAmount(String(store.totalExpense)) }}</span>
        </div>
        <div class="summary-item balance" :class="{ negative: store.balance < 0 }">
          <span class="summary-label">残高</span>
          <span class="summary-value">¥{{ formatAmount(String(store.balance)) }}</span>
        </div>
      </div>

      <div class="table-header">
        <button class="btn-add" @click="openAddModal">＋ 収支を追加</button>
      </div>

      <div v-if="store.loading" class="status-message">読み込み中...</div>
      <div v-else-if="store.error" class="status-message error">{{ store.error }}</div>
      <div v-else-if="store.transactions.length === 0" class="status-message">
        収支が登録されていません。「収支を追加」から登録してください。
      </div>
      <table v-else class="transaction-table">
        <thead>
          <tr>
            <th>日付</th>
            <th>種別</th>
            <th>カテゴリ</th>
            <th>金額</th>
            <th>メモ</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in store.transactions" :key="tx.id">
            <td>{{ formatDate(tx.date) }}</td>
            <td>
              <span class="badge" :class="tx.transaction_type">
                {{ tx.transaction_type === 'income' ? '収入' : '支出' }}
              </span>
            </td>
            <td>{{ tx.category.name }}</td>
            <td class="amount" :class="tx.transaction_type">
              {{ tx.transaction_type === 'income' ? '+' : '-' }}¥{{ formatAmount(tx.amount) }}
            </td>
            <td class="memo">{{ tx.memo ?? '' }}</td>
            <td class="actions">
              <button class="btn-edit" @click="openEditModal(tx)">編集</button>
              <button class="btn-delete" @click="handleDelete(tx.id)">削除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </main>

    <TransactionModal
      v-if="showModal"
      :transaction="editingTransaction"
      @close="closeModal"
      @saved="store.fetchTransactions()"
    />
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #2c3e50;
  color: #fff;
}

.app-title {
  font-size: 1.3rem;
  font-weight: bold;
  margin: 0;
}

.btn-logout {
  padding: 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;
}

.main {
  flex: 1;
  padding: 24px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.summary-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.summary-item {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.summary-label {
  display: block;
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 1.3rem;
  font-weight: bold;
}

.summary-item.income .summary-value {
  color: #2ecc71;
}

.summary-item.expense .summary-value {
  color: #e74c3c;
}

.summary-item.balance .summary-value {
  color: #2c3e50;
}

.summary-item.balance.negative .summary-value {
  color: #e74c3c;
}

.table-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.btn-add {
  padding: 8px 20px;
  background: #2ecc71;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
}

.status-message {
  text-align: center;
  padding: 40px;
  color: #888;
  background: #fff;
  border-radius: 8px;
}

.status-message.error {
  color: #e74c3c;
}

.transaction-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.transaction-table th {
  background: #f0f2f5;
  padding: 10px 14px;
  text-align: left;
  font-size: 0.8rem;
  color: #666;
  font-weight: 600;
}

.transaction-table td {
  padding: 10px 14px;
  font-size: 0.9rem;
  border-bottom: 1px solid #f0f2f5;
  vertical-align: middle;
}

.transaction-table tr:last-child td {
  border-bottom: none;
}

.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge.income {
  background: #d4f8e8;
  color: #1a8a4a;
}

.badge.expense {
  background: #fde8e8;
  color: #c0392b;
}

.amount {
  font-weight: 600;
}

.amount.income {
  color: #2ecc71;
}

.amount.expense {
  color: #e74c3c;
}

.memo {
  color: #888;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.btn-edit {
  padding: 4px 12px;
  border: 1px solid #aaa;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 0.8rem;
}

.btn-delete {
  padding: 4px 12px;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  background: #fff;
  color: #e74c3c;
  cursor: pointer;
  font-size: 0.8rem;
}
</style>
