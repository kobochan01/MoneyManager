<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useTransactionStore } from '@/stores/transactions'
import { useUserSettingStore } from '@/stores/userSettings'
import { buildCalendarGrid, computeTapeStatus, computePeriod } from '@/utils/calendar'
import TransactionModal from '@/components/TransactionModal.vue'
import type { Transaction } from '@/api/types'

const router = useRouter()
const store = useTransactionStore()
const authStore = useAuthStore()
const settingStore = useUserSettingStore()

const showModal = ref(false)
const editingTransaction = ref<Transaction | undefined>(undefined)
const selectedDate = ref<string | undefined>(undefined)

const todayStr = new Date().toISOString().slice(0, 10)
const SUN_LABELS = ['日', '月', '火', '水', '木', '金', '土']
const MON_LABELS = ['月', '火', '水', '木', '金', '土', '日']

const dayLabels = computed(() =>
  settingStore.setting.week_start === 'monday' ? MON_LABELS : SUN_LABELS,
)

const period = computed(() =>
  computePeriod(
    store.currentYear,
    store.currentMonth,
    settingStore.setting.start_day,
    settingStore.setting.closing_day,
  ),
)

const calendarGrid = computed(() =>
  buildCalendarGrid(
    period.value.periodStart,
    period.value.periodEnd,
    settingStore.setting.week_start === 'monday',
  ),
)

const tapeStatusMap = computed(() =>
  computeTapeStatus(store.transactions, period.value.periodStart, period.value.periodEnd),
)

const periodTransactions = computed(() =>
  store.transactions.filter(
    (t) => t.date >= period.value.periodStart && t.date <= period.value.periodEnd,
  ),
)

const transactionsByDate = computed(() => {
  const map = new Map<string, Transaction[]>()
  for (const tx of periodTransactions.value) {
    const list = map.get(tx.date) ?? []
    list.push(tx)
    map.set(tx.date, list)
  }
  return map
})

const periodIncome = computed(() =>
  periodTransactions.value
    .filter((t) => t.transaction_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0),
)

const periodExpense = computed(() =>
  periodTransactions.value
    .filter((t) => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0),
)

const periodBalance = computed(() => periodIncome.value - periodExpense.value)

function openAddModal(date?: string) {
  editingTransaction.value = undefined
  selectedDate.value = date
  showModal.value = true
}

function openEditModal(tx: Transaction) {
  editingTransaction.value = tx
  selectedDate.value = undefined
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingTransaction.value = undefined
  selectedDate.value = undefined
}

function formatAmountShort(amount: string): string {
  const n = Number(amount)
  if (n >= 10000) return `¥${Math.floor(n / 1000)}K`
  return `¥${n.toLocaleString('ja-JP')}`
}

function formatSummaryAmount(n: number): string {
  return n.toLocaleString('ja-JP')
}

async function handleLogout() {
  await authStore.logoutAction()
  router.push('/login')
}

onMounted(() => {
  store.fetchTransactions()
  settingStore.fetchSettings()
})
</script>

<template>
  <div class="layout">
    <header class="header">
      <h1 class="app-title">MoneyManager</h1>
      <div class="header-actions">
        <button class="btn-settings" @click="router.push('/settings')">設定</button>
        <button class="btn-logout" @click="handleLogout">ログアウト</button>
      </div>
    </header>

    <main class="main">
      <!-- 月ナビゲーション -->
      <div class="month-nav">
        <button class="nav-btn" @click="store.prevMonth()">＜</button>
        <h2 class="month-title">
          {{ store.currentYear }}年 {{ store.currentMonth }}月
          <span class="period-label">（{{ period.periodStart.slice(5).replace('-', '/') }}〜{{ period.periodEnd.slice(5).replace('-', '/') }}）</span>
        </h2>
        <button class="nav-btn" @click="store.nextMonth()">＞</button>
        <button class="btn-add" @click="openAddModal()">＋</button>
      </div>

      <!-- 曜日ヘッダー -->
      <div class="calendar-header">
        <div v-for="label in dayLabels" :key="label" class="day-label">{{ label }}</div>
      </div>

      <!-- カレンダーグリッド -->
      <div v-if="store.loading" class="status-message">読み込み中...</div>
      <div v-else-if="store.error" class="status-message error">{{ store.error }}</div>
      <div v-else class="calendar-grid">
        <div
          v-for="(dateStr, idx) in calendarGrid"
          :key="idx"
          class="day-cell"
          :class="{
            'is-empty': !dateStr,
            'is-today': dateStr === todayStr,
          }"
          @click="dateStr && openAddModal(dateStr)"
        >
          <template v-if="dateStr">
            <div class="day-number">{{ Number(dateStr.slice(8)) }}</div>
            <div
              v-if="tapeStatusMap.has(dateStr)"
              class="tape-bar"
              :class="tapeStatusMap.get(dateStr)"
            ></div>
            <div
              v-for="tx in transactionsByDate.get(dateStr) ?? []"
              :key="tx.id"
              class="tx-item"
              :class="tx.transaction_type"
              @click.stop="openEditModal(tx)"
            >
              {{ tx.transaction_type === 'income' ? '+' : '-' }}{{ formatAmountShort(tx.amount) }}
            </div>
          </template>
        </div>
      </div>

      <!-- 月次サマリー -->
      <div class="summary">
        <div class="summary-item income">
          <span class="summary-label">収入合計</span>
          <span class="summary-value">¥{{ formatSummaryAmount(periodIncome) }}</span>
        </div>
        <div class="summary-item expense">
          <span class="summary-label">支出合計</span>
          <span class="summary-value">¥{{ formatSummaryAmount(periodExpense) }}</span>
        </div>
        <div
          class="summary-item balance"
          :class="{ negative: periodBalance < 0 }"
        >
          <span class="summary-label">残　　高</span>
          <span class="summary-value">¥{{ formatSummaryAmount(periodBalance) }}</span>
        </div>
      </div>
    </main>

    <TransactionModal
      v-if="showModal"
      :transaction="editingTransaction"
      :initial-date="selectedDate"
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

.header-actions {
  display: flex;
  gap: 8px;
}

.btn-settings {
  padding: 6px 16px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  background: transparent;
  color: #fff;
  cursor: pointer;
  font-size: 0.875rem;
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
  padding: 16px;
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* 月ナビゲーション */
.month-nav {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.month-title {
  flex: 1;
  text-align: center;
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
  color: #2c3e50;
}

.period-label {
  font-size: 0.75rem;
  font-weight: normal;
  color: #888;
}

.nav-btn {
  padding: 6px 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  font-size: 1rem;
  color: #555;
}

.nav-btn:hover {
  background: #f0f2f5;
}

.btn-add {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  background: #2ecc71;
  color: #fff;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  line-height: 1;
}

.btn-add:hover {
  background: #27ae60;
}

/* 曜日ヘッダー */
.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 2px;
}

.day-label {
  text-align: center;
  font-size: 0.75rem;
  font-weight: 600;
  color: #888;
  padding: 4px 0;
}

/* カレンダーグリッド */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  margin-bottom: 16px;
}

.day-cell {
  background: #fff;
  border-radius: 4px;
  min-height: 72px;
  padding: 4px;
  cursor: pointer;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  border: 1px solid #eee;
}

.day-cell:hover:not(.is-empty) {
  border-color: #2ecc71;
}

.day-cell.is-empty {
  background: transparent;
  border: none;
  cursor: default;
}

.day-cell.is-today .day-number {
  background: #2c3e50;
  color: #fff;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.day-number {
  font-size: 0.8rem;
  font-weight: 600;
  color: #333;
  line-height: 1.2;
}

/* テープバー */
.tape-bar {
  height: 5px;
  border-radius: 2px;
  width: 100%;
  flex-shrink: 0;
}

.tape-bar.green {
  background: #2ecc71;
}

.tape-bar.red {
  background: #e74c3c;
}

/* 収支アイテム */
.tx-item {
  font-size: 0.7rem;
  padding: 1px 3px;
  border-radius: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  flex-shrink: 0;
}

.tx-item:hover {
  opacity: 0.8;
}

.tx-item.income {
  background: #d4f8e8;
  color: #1a8a4a;
  font-weight: 600;
}

.tx-item.expense {
  background: #fde8e8;
  color: #c0392b;
}

/* サマリー */
.summary {
  display: flex;
  gap: 12px;
}

.summary-item {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  padding: 14px 16px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.summary-label {
  display: block;
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 4px;
}

.summary-value {
  display: block;
  font-size: 1.1rem;
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

.status-message {
  text-align: center;
  padding: 40px;
  color: #888;
}

.status-message.error {
  color: #e74c3c;
}
</style>
