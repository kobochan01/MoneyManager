class Invitation < ApplicationRecord
  belongs_to :group
  belongs_to :invited_by, class_name: "User"

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :token, presence: true, uniqueness: true
  validates :expires_at, presence: true

  before_validation :generate_token, on: :create
  before_validation :set_expiry,     on: :create

  def accepted?
    accepted_at.present?
  end

  def expired?
    expires_at < Time.current
  end

  def usable?
    !accepted? && !expired?
  end

  private

  def generate_token
    self.token ||= SecureRandom.urlsafe_base64(32)
  end

  def set_expiry
    self.expires_at ||= 7.days.from_now
  end
end
