class Category < ApplicationRecord
  belongs_to :group
  has_many :transactions, dependent: :restrict_with_error

  TYPES = %w[income expense].freeze

  validates :group_id, presence: true
  validates :name, presence: true, length: { maximum: 100 }
  validates :transaction_type, presence: true, inclusion: { in: TYPES }
  validates :name, uniqueness: { scope: [:group_id, :transaction_type] }
end
