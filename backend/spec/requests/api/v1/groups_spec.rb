require "rails_helper"

RSpec.describe "Api::V1::Groups", type: :request do
  let(:user)    { create(:user) }
  let(:group)   { user.groups.first }
  let(:token)   { JwtService.encode(user_id: user.id) }
  let(:headers) { { "Authorization" => "Bearer #{token}" } }

  describe "GET /api/v1/group" do
    context "認証済みの場合" do
      it "グループ情報とメンバー一覧を返す" do
        get "/api/v1/group", headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["group"]["name"]).to eq(group.name)
        expect(json["group"]["members"].length).to eq(1)
        expect(json["group"]["members"][0]["role"]).to eq("owner")
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        get "/api/v1/group"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
