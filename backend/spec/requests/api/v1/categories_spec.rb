require "rails_helper"

RSpec.describe "Api::V1::Categories", type: :request do
  let(:user)  { create(:user) }
  let(:group) { create(:group) }
  let(:token) { JwtService.encode(user_id: user.id) }
  let(:headers) { { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" } }

  before { create(:group_member, user: user, group: group, role: "owner") }

  describe "GET /api/v1/categories" do
    context "認証済みの場合" do
      it "グループ内のカテゴリ一覧を返す" do
        create(:category, group: group, name: "食費", transaction_type: "expense")
        create(:category, group: group, name: "給与", transaction_type: "income")

        get "/api/v1/categories", headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["categories"].length).to eq(2)
      end

      it "他グループのカテゴリは含まない" do
        other_group = create(:group)
        create(:category, group: other_group, name: "食費", transaction_type: "expense")

        get "/api/v1/categories", headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["categories"]).to be_empty
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        get "/api/v1/categories"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
