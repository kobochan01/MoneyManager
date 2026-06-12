class FixedExpense < ApplicationRecord
  belongs_to :user
  belongs_to :category

  validates :user_id,     presence: true
  validates :category_id, presence: true
  validates :name,        presence: true
  validates :amount,      presence: true, numericality: { greater_than: 0 }
  validates :day,         presence: true, numericality: { greater_than: 0, less_than_or_equal_to: 31 }
end
