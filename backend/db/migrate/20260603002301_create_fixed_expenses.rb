class CreateFixedExpenses < ActiveRecord::Migration[8.1]
  def change
    create_table :fixed_expenses do |t|
      t.references :user, null: false, foreign_key: true
      t.references :category, null: false, foreign_key: true
      t.string :name, null:false
      t.integer :amount, null:false
      t.integer :day, null:false

      t.timestamps
    end
  end
end
