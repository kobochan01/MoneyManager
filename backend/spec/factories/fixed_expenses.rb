FactoryBot.define do
  factory :fixed_expense do
    association :user
    association :category
    name { "MyString" }
    amount { 1 }
    day { 1 }
  end
end
