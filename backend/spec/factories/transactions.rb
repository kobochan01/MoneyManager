FactoryBot.define do
  factory :transaction do
    association :group
    association :user
    association :category
    transaction_type { "expense" }
    amount { 1000 }
    date { Date.today }
    memo { nil }
    is_fixed { false }
  end
end
