FactoryBot.define do
  factory :user do
    sequence(:email) { |n| "user#{n}@example.com" }
    name { "テストユーザー" }
    password { "password123" }
    password_confirmation { "password123" }

    after(:create) do |user|
      group = create(:group, name: "#{user.name}のグループ")
      create(:group_member, user: user, group: group, role: "owner")
    end
  end
end
