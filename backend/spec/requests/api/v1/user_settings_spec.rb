require "rails_helper"

RSpec.describe "Api::V1::UserSettings", type: :request do
  let(:user)  { create(:user) }
  let(:token) { JwtService.encode(user_id: user.id) }
  let(:headers) { { "Authorization" => "Bearer #{token}", "Content-Type" => "application/json" } }

  describe "GET /api/v1/user_settings" do
    context "認証済みの場合" do
      it "設定が存在する場合、設定を返す" do
        create(:user_setting, user: user, start_day: 21, closing_day: 20, week_start: "monday")
        get "/api/v1/user_settings", headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["start_day"]).to eq(21)
        expect(json["closing_day"]).to eq(20)
        expect(json["week_start"]).to eq("monday")
      end

      it "設定が存在しない場合、デフォルト値を返す" do
        get "/api/v1/user_settings", headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["start_day"]).to eq(1)
        expect(json["closing_day"]).to eq(31)
        expect(json["week_start"]).to eq("sunday")
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        get "/api/v1/user_settings"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "PUT /api/v1/user_settings" do
    context "認証済みの場合" do
      it "設定を新規作成できる" do
        params = { start_day: 21, closing_day: 20, week_start: "monday" }
        put "/api/v1/user_settings", params: params.to_json, headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["start_day"]).to eq(21)
        expect(json["closing_day"]).to eq(20)
        expect(json["week_start"]).to eq("monday")
      end

      it "設定を更新できる" do
        create(:user_setting, user: user, start_day: 1, closing_day: 31, week_start: "sunday")
        params = { start_day: 16, closing_day: 15, week_start: "monday" }
        put "/api/v1/user_settings", params: params.to_json, headers: headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["start_day"]).to eq(16)
        expect(json["closing_day"]).to eq(15)
      end

      it "不正な値は422を返す" do
        params = { start_day: 0, closing_day: 32, week_start: "sunday" }
        put "/api/v1/user_settings", params: params.to_json, headers: headers
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        put "/api/v1/user_settings"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
