class CreateTransactions < ActiveRecord::Migration[8.1]
  def change
    create_table :transactions do |t|
      t.bigint   :group_id,          null: false
      t.bigint   :user_id,           null: false
      t.bigint   :category_id,       null: false
      t.string   :transaction_type,  null: false
      t.decimal  :amount,            null: false, precision: 10, scale: 0
      t.date     :date,              null: false
      t.text     :memo
      t.boolean  :is_fixed,          null: false, default: false
      t.bigint   :fixed_expense_id

      t.timestamps
    end

    add_index :transactions, :group_id
    add_index :transactions, :user_id
    add_index :transactions, :category_id
    add_index :transactions, :date
  end
end
