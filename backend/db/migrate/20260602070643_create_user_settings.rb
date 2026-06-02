class CreateUserSettings < ActiveRecord::Migration[8.1]
  def change
    create_table :user_settings do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.integer :start_day, null: false
      t.integer :closing_day, null: false
      t.string :week_start, null: false, default: "sunday"

      t.timestamps
    end
  end
end
