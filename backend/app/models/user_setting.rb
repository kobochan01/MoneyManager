class UserSetting < ApplicationRecord
  belongs_to :user

  enum :week_start, { sunday: "sunday", monday: "monday" }, suffix: false

  validates :start_day, presence: true, inclusion: { in: 1..31 }
  validates :closing_day, presence: true, inclusion: { in: 1..31 }
  validates :week_start, presence: true
  validates :user_id, uniqueness: true
end
