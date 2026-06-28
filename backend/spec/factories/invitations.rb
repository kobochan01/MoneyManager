FactoryBot.define do
  factory :invitation do
    association :group
    association :invited_by, factory: :user
    email { "invited@example.com" }
    expires_at { 7.days.from_now }
    accepted_at { nil }
  end
end
