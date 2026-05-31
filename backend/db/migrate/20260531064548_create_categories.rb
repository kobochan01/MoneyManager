class CreateCategories < ActiveRecord::Migration[8.1]
  def change
    create_table :categories do |t|
      t.bigint  :group_id,         null: false
      t.string  :name,             null: false, limit: 100
      t.string  :transaction_type, null: false

      t.timestamps
    end

    add_index :categories, :group_id
    add_index :categories, [:group_id, :name, :transaction_type], unique: true
  end
end
