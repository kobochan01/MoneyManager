require "rails_helper"

RSpec.describe "Api::V1::Transactions", type: :request do
  let(:user)     { create(:user) }
  let(:group)    { create(:group) }
  let(:category) { create(:category, group: group, name: "食費", transaction_type: "expense") }
  let(:token)    { JwtService.encode(user_id: user.id) }
  let(:headers)  { { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" } }

  before { create(:group_member, user: user, group: group, role: "owner") }

  describe "GET /api/v1/transactions" do
    context "認証済みの場合" do
      it "グループ内の収支一覧を返す" do
        create(:transaction, group: group, user: user, category: category)
        create(:transaction, group: group, user: user, category: category, transaction_type: "income", amount: 200000)

        get "/api/v1/transactions", headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["transactions"].length).to eq(2)
      end

      it "他グループの収支は含まない" do
        other_group = create(:group)
        other_category = create(:category, group: other_group)
        create(:transaction, group: other_group, user: user, category: other_category)

        get "/api/v1/transactions", headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["transactions"]).to be_empty
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        get "/api/v1/transactions"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/transactions" do
    let(:valid_params) do
      {
        transaction: {
          transaction_type: "expense",
          amount: 3000,
          date: "2026-05-31",
          category_name: "食費",
          memo: "スーパー"
        }
      }.to_json
    end

    context "有効なパラメータの場合" do
      it "収支を登録し201を返す" do
        post "/api/v1/transactions", params: valid_params, headers: headers
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["transaction"]["amount"]).to eq("3000")
        expect(json["transaction"]["memo"]).to eq("スーパー")
      end

      it "既存のカテゴリがなければ自動作成する" do
        params = { transaction: { transaction_type: "expense", amount: 500, date: "2026-05-31", category_name: "新カテゴリ" } }.to_json
        expect {
          post "/api/v1/transactions", params: params, headers: headers
        }.to change(Category, :count).by(1)
      end

      it "既存カテゴリがあれば再利用する" do
        category
        params = { transaction: { transaction_type: "expense", amount: 500, date: "2026-05-31", category_name: "食費" } }.to_json
        expect {
          post "/api/v1/transactions", params: params, headers: headers
        }.not_to change(Category, :count)
      end
    end

    context "無効なパラメータの場合" do
      it "amountがなければ422を返す" do
        params = { transaction: { transaction_type: "expense", date: "2026-05-31", category_name: "食費" } }.to_json
        post "/api/v1/transactions", params: params, headers: headers
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        post "/api/v1/transactions", params: valid_params
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "PUT /api/v1/transactions/:id" do
    let(:transaction) { create(:transaction, group: group, user: user, category: category) }

    context "有効なパラメータの場合" do
      it "収支を更新し200を返す" do
        params = { transaction: { amount: 5000, memo: "更新メモ" } }.to_json
        put "/api/v1/transactions/#{transaction.id}", params: params, headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["transaction"]["amount"]).to eq("5000")
        expect(json["transaction"]["memo"]).to eq("更新メモ")
      end
    end

    context "他グループの収支の場合" do
      it "404を返す" do
        other_group = create(:group)
        other_category = create(:category, group: other_group)
        other_transaction = create(:transaction, group: other_group, user: user, category: other_category)
        params = { transaction: { amount: 5000 } }.to_json
        put "/api/v1/transactions/#{other_transaction.id}", params: params, headers: headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "DELETE /api/v1/transactions/:id" do
    let!(:transaction) { create(:transaction, group: group, user: user, category: category) }

    context "自グループの収支の場合" do
      it "収支を削除し200を返す" do
        expect {
          delete "/api/v1/transactions/#{transaction.id}", headers: headers
        }.to change(Transaction, :count).by(-1)
        expect(response).to have_http_status(:ok)
      end
    end

    context "他グループの収支の場合" do
      it "404を返す" do
        other_group = create(:group)
        other_category = create(:category, group: other_group)
        other_transaction = create(:transaction, group: other_group, user: user, category: other_category)
        delete "/api/v1/transactions/#{other_transaction.id}", headers: headers
        expect(response).to have_http_status(:not_found)
      end
    end
  end
end
