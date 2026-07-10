<script setup lang="ts">
const emit = defineEmits<{
  close: []
}>()
</script>

<template>
  <div class="modal-overlay" @click.self="emit('close')">
    <div class="modal">
      <div class="modal-header">
        <h2>使い方ガイド</h2>
        <button class="close-btn" @click="emit('close')">×</button>
      </div>

      <div class="help-content">
        <section class="help-section">
          <h3>カレンダー画面の見方</h3>
          <p>
            収入登録日から締め日までを緑のテープ、残高がマイナスに転落した日からを赤のテープで表示します。
            各日付には、その日の収入合計・支出合計が表示されます。
          </p>
          <p>
            日付をクリックすると、その日の収支一覧が開きます。一覧の「＋」ボタンから新しい収支を登録でき、
            各項目の「編集」「削除」ボタンから変更・削除できます（削除前には確認画面が表示されます）。
          </p>
        </section>

        <section class="help-section">
          <h3>固定費の登録方法</h3>
          <p>
            ヘッダーの「固定費」から固定費管理画面を開き、家賃・サブスクなどの毎月の支出を登録できます。
            引き落とし日が土日祝の場合は、自動で翌営業日にずらしてカレンダーに反映されます。
          </p>
        </section>

        <section class="help-section">
          <h3>グループ招待の使い方</h3>
          <p>
            ヘッダーの「グループ」からグループ管理画面を開き、「招待URLを発行する」でメンバーを招待できます。
            発行されたURLをコピーして共有し、相手がそのURLを開いて参加すると、家計簿がグループで共有されます。
          </p>
        </section>

        <section class="help-section">
          <h3>締め日・週始まり曜日の設定</h3>
          <p>
            ヘッダーの「設定」から、締め日（例: 毎月21日〜翌月20日を1ヶ月として扱う）と、
            カレンダーの週の始まりを日曜・月曜のどちらにするかを設定できます。
          </p>
        </section>
      </div>
    </div>
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
  max-width: 520px;
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

.help-section {
  margin-bottom: 20px;
}

.help-section h3 {
  font-size: 1rem;
  color: #2c3e50;
  margin-bottom: 8px;
}

.help-section p {
  font-size: 0.875rem;
  color: #555;
  line-height: 1.6;
  margin-bottom: 8px;
}
</style>
