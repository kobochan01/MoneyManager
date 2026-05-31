require "rails_helper"

RSpec.describe Transaction, type: :model do
  let(:group)    { create(:group) }
  let(:user)     { create(:user) }
  let(:category) { create(:category, group: group) }

  describe "バリデーション" do
    it "有効なデータで保存できる" do
      transaction = build(:transaction, group: group, user: user, category: category)
      expect(transaction).to be_valid
    end

    it "group_idがなければ無効" do
      transaction = build(:transaction, group: nil, group_id: nil)
      expect(transaction).not_to be_valid
    end

    it "user_idがなければ無効" do
      transaction = build(:transaction, group: group, user: nil, user_id: nil, category: category)
      expect(transaction).not_to be_valid
    end

    it "category_idがなければ無効" do
      transaction = build(:transaction, group: group, user: user, category: nil, category_id: nil)
      expect(transaction).not_to be_valid
    end

    it "transaction_typeがなければ無効" do
      transaction = build(:transaction, group: group, user: user, category: category, transaction_type: nil)
      expect(transaction).not_to be_valid
    end

    it "transaction_typeはincome/expense以外は無効" do
      transaction = build(:transaction, group: group, user: user, category: category, transaction_type: "invalid")
      expect(transaction).not_to be_valid
    end

    it "amountがなければ無効" do
      transaction = build(:transaction, group: group, user: user, category: category, amount: nil)
      expect(transaction).not_to be_valid
    end

    it "amountは0以下なら無効" do
      transaction = build(:transaction, group: group, user: user, category: category, amount: 0)
      expect(transaction).not_to be_valid
    end

    it "amountは負の値なら無効" do
      transaction = build(:transaction, group: group, user: user, category: category, amount: -100)
      expect(transaction).not_to be_valid
    end

    it "dateがなければ無効" do
      transaction = build(:transaction, group: group, user: user, category: category, date: nil)
      expect(transaction).not_to be_valid
    end
  end

  describe "アソシエーション" do
    it "グループに属する" do
      association = Transaction.reflect_on_association(:group)
      expect(association.macro).to eq(:belongs_to)
    end

    it "ユーザーに属する" do
      association = Transaction.reflect_on_association(:user)
      expect(association.macro).to eq(:belongs_to)
    end

    it "カテゴリに属する" do
      association = Transaction.reflect_on_association(:category)
      expect(association.macro).to eq(:belongs_to)
    end
  end
end
