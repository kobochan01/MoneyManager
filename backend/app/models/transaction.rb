class Transaction < ApplicationRecord
  belongs_to :group
  belongs_to :user
  belongs_to :category

  TYPES = %w[income expense].freeze

  validates :group_id,         presence: true
  validates :user_id,          presence: true
  validates :category_id,      presence: true
  validates :transaction_type, presence: true, inclusion: { in: TYPES }
  validates :amount,           presence: true, numericality: { greater_than: 0 }
  validates :date,             presence: true
end
