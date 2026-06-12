require "rails_helper"

RSpec.describe FixedExpense, type: :model do
  let(:user)     { create(:user) }
  let(:category) { create(:category) }

  describe "バリデーション" do
    it "有効なデータで保存できる" do
      fixed_expense = build(:fixed_expense, day: 1, user: user, category: category)
      expect(fixed_expense).to be_valid
    end

    it "user_idがなければ無効" do
      fixed_expense = build(:fixed_expense, day: 1, user: nil, user_id: nil, category: category)
      expect(fixed_expense).not_to be_valid
    end

    it "category_idがなければ無効" do
      fixed_expense = build(:fixed_expense, day: 1, user: user, category: nil, category_id: nil)
      expect(fixed_expense).not_to be_valid
    end

    it "nameがなければ無効" do
      fixed_expense = build(:fixed_expense, day: 1, user: user, category: category, name: nil)
      expect(fixed_expense).not_to be_valid
    end

    it "amountがなければ無効" do
      fixed_expense = build(:fixed_expense, day: 1, user: user, category: category, amount: nil)
      expect(fixed_expense).not_to be_valid
    end

    it "amountは0以下なら無効" do
      fixed_expense = build(:fixed_expense, day: 1, user: user, category: category, amount: 0)
      expect(fixed_expense).not_to be_valid
    end

    it "amountは負の値なら無効" do
      fixed_expense = build(:fixed_expense, day: 1, user: user, category: category, amount: -100)
      expect(fixed_expense).not_to be_valid
    end

    it "dayがなければ無効" do
      fixed_expense = build(:fixed_expense, day: nil, user: user, category: category)
      expect(fixed_expense).not_to be_valid
    end

    it "dayが0なら無効" do
      fixed_expense = build(:fixed_expense, user: user, category: category, day: 0)
      expect(fixed_expense).not_to be_valid
    end

    it "dayが32なら無効" do
      fixed_expense = build(:fixed_expense, user: user, category: category, day: 32)
      expect(fixed_expense).not_to be_valid
    end
  end
end
