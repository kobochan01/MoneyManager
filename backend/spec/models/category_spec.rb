require "rails_helper"

RSpec.describe Category, type: :model do
  let(:group) { create(:group) }

  describe "バリデーション" do
    it "有効なデータで保存できる" do
      category = build(:category, group: group)
      expect(category).to be_valid
    end

    it "group_idがなければ無効" do
      category = build(:category, group: nil, group_id: nil)
      expect(category).not_to be_valid
    end

    it "nameがなければ無効" do
      category = build(:category, group: group, name: nil)
      expect(category).not_to be_valid
    end

    it "transaction_typeがなければ無効" do
      category = build(:category, group: group, transaction_type: nil)
      expect(category).not_to be_valid
    end

    it "transaction_typeはincome/expense以外は無効" do
      category = build(:category, group: group, transaction_type: "invalid")
      expect(category).not_to be_valid
    end

    it "同じグループ内で同名・同typeのカテゴリは重複不可" do
      create(:category, group: group, name: "食費", transaction_type: "expense")
      duplicate = build(:category, group: group, name: "食費", transaction_type: "expense")
      expect(duplicate).not_to be_valid
    end
  end

  describe "アソシエーション" do
    it "グループに属する" do
      association = Category.reflect_on_association(:group)
      expect(association.macro).to eq(:belongs_to)
    end

    it "複数のtransactionを持つ" do
      association = Category.reflect_on_association(:transactions)
      expect(association.macro).to eq(:has_many)
    end
  end
end
