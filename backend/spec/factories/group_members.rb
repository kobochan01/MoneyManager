FactoryBot.define do
  factory :group_member do
    association :user
    association :group
    role { "member" }
  end
end
