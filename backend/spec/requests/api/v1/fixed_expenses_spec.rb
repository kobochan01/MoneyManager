require "rails_helper"

RSpec.describe "Api::V1::FixedExpenses", type: :request do
  let(:user)     { create(:user) }
  let(:category) { create(:category) }
  let(:token)    { JwtService.encode(user_id: user.id) }
  let(:headers)  { { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" } }

  describe "GET /api/v1/fixed_expenses" do
    context "認証済みの場合" do
      it "固定費一覧を返す" do
        create(:fixed_expense, user: user, category: category)

        get "/api/v1/fixed_expenses", headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["fixed_expenses"].length).to eq(1)
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        get "/api/v1/fixed_expenses"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "POST /api/v1/fixed_expenses" do
    let(:valid_params) do
      {
        fixed_expense: {
          name: "家賃",
          amount: 50000,
          day: 21,
          category_id: category.id
        }
      }.to_json
    end

    context "有効なパラメータの場合" do
      it "固定費を登録し201を返す" do
        post "/api/v1/fixed_expenses", params: valid_params, headers: headers
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["fixed_expense"]["amount"]).to eq(50000)
      end
    end

    context "無効なパラメータの場合" do
      it "amountがなければ422を返す" do
        params = { fixed_expense: { name: "家賃", day: 21, category_id: category.id } }.to_json
        post "/api/v1/fixed_expenses", params: params, headers: headers
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        post "/api/v1/fixed_expenses", params: valid_params
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "PUT /api/v1/fixed_expenses/:id" do
    let(:fixed_expense) { create(:fixed_expense, day: 1, user: user, category: category) }

    context "有効なパラメータの場合" do
      it "固定費を更新し200を返す" do
        params = { fixed_expense: { amount: 5000 } }.to_json
        put "/api/v1/fixed_expenses/#{fixed_expense.id}", params: params, headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["fixed_expense"]["amount"]).to eq(5000)
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        params = { fixed_expense: { amount: 5000 } }.to_json
        put "/api/v1/fixed_expenses/#{fixed_expense.id}", params: params
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/fixed_expenses/scheduled" do
    context "認証済みの場合" do
      it "平日の場合はその日の日付を返す" do
        create(:fixed_expense, day: 5, user: user, category: category)
        get "/api/v1/fixed_expenses/scheduled", params: { year: 2026, month: 6 }, headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["scheduled"][0]["date"]).to eq("2026-06-05")
      end

      it "土曜日の場合は翌月曜日の日付を返す" do
        create(:fixed_expense, day: 6, user: user, category: category)
        get "/api/v1/fixed_expenses/scheduled", params: { year: 2026, month: 6 }, headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["scheduled"][0]["date"]).to eq("2026-06-08")
      end

      it "日曜日の場合は翌月曜日の日付を返す" do
        create(:fixed_expense, day: 7, user: user, category: category)
        get "/api/v1/fixed_expenses/scheduled", params: { year: 2026, month: 6 }, headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["scheduled"][0]["date"]).to eq("2026-06-08")
      end

      it "祝日の場合は翌平日の日付を返す" do
        create(:fixed_expense, day: 1, user: user, category: category)
        get "/api/v1/fixed_expenses/scheduled", params: { year: 2026, month: 1 }, headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["scheduled"][0]["date"]).to eq("2026-01-02")
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        get "/api/v1/fixed_expenses/scheduled", params: { year: 2026, month: 6 }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "DELETE /api/v1/fixed_expenses/:id" do
    let!(:fixed_expense) { create(:fixed_expense, day: 1, user: user, category: category) }

    context "認証済みの場合" do
      it "固定費を削除し200を返す" do
        expect {
          delete "/api/v1/fixed_expenses/#{fixed_expense.id}", headers: headers
        }.to change(FixedExpense, :count).by(-1)
        expect(response).to have_http_status(:ok)
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        delete "/api/v1/fixed_expenses/#{fixed_expense.id}"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
