FactoryBot.define do
  factory :group do
    sequence(:name) { |n| "テストグループ#{n}" }
  end
end
