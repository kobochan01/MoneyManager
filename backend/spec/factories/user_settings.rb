FactoryBot.define do
  factory :user_setting do
    association :user
    start_day { 1 }
    closing_day { 31 }
    week_start { "sunday" }
  end
end
