require "rails_helper"

RSpec.describe UserSetting, type: :model do
  let(:user) { create(:user) }

  describe "バリデーション" do
    it "有効なデータで保存できる" do
      setting = build(:user_setting, user: user)
      expect(setting).to be_valid
    end

    it "user_idがなければ無効" do
      setting = build(:user_setting, user: nil)
      expect(setting).not_to be_valid
    end

    it "start_dayがなければ無効" do
      setting = build(:user_setting, user: user, start_day: nil)
      expect(setting).not_to be_valid
    end

    it "closing_dayがなければ無効" do
      setting = build(:user_setting, user: user, closing_day: nil)
      expect(setting).not_to be_valid
    end

    it "week_startがなければ無効" do
      setting = build(:user_setting, user: user, week_start: nil)
      expect(setting).not_to be_valid
    end

    it "start_dayが1未満は無効" do
      setting = build(:user_setting, user: user, start_day: 0)
      expect(setting).not_to be_valid
    end

    it "start_dayが31より大きければ無効" do
      setting = build(:user_setting, user: user, start_day: 32)
      expect(setting).not_to be_valid
    end

    it "closing_dayが1未満は無効" do
      setting = build(:user_setting, user: user, closing_day: 0)
      expect(setting).not_to be_valid
    end

    it "closing_dayが31より大きければ無効" do
      setting = build(:user_setting, user: user, closing_day: 32)
      expect(setting).not_to be_valid
    end

    it "week_startはsunday/monday以外は無効" do
      expect {
        build(:user_setting, user: user, week_start: "tuesday")
      }.to raise_error(ArgumentError)
    end

    it "同じユーザーに複数の設定は作れない" do
      create(:user_setting, user: user)
      duplicate = build(:user_setting, user: user)
      expect(duplicate).not_to be_valid
    end
  end

  describe "アソシエーション" do
    it "ユーザーに属する" do
      association = UserSetting.reflect_on_association(:user)
      expect(association.macro).to eq(:belongs_to)
    end
  end
end
