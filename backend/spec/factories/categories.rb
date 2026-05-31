FactoryBot.define do
  factory :category do
    association :group
    sequence(:name) { |n| "カテゴリ#{n}" }
    transaction_type { "expense" }
  end
end
