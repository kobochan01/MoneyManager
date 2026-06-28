require "rails_helper"

RSpec.describe "Api::V1::Invitations", type: :request do
  let(:owner)        { create(:user) }
  let(:owner_group)  { owner.groups.first }
  let(:owner_token)  { JwtService.encode(user_id: owner.id) }
  let(:owner_headers) { { "Authorization" => "Bearer #{owner_token}", "Content-Type" => "application/json" } }

  describe "POST /api/v1/invitations" do
    let(:valid_params) { { email: "invited@example.com" }.to_json }

    context "認証済みの場合" do
      it "招待トークンを返す" do
        post "/api/v1/invitations", params: valid_params, headers: owner_headers
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["token"]).to be_present
      end
    end

    context "未認証の場合" do
      it "401を返す" do
        post "/api/v1/invitations", params: valid_params, headers: { "Content-Type" => "application/json" }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /api/v1/invitations/:id" do
    let(:invitation) { create(:invitation, group: owner_group, invited_by: owner) }

    it "招待情報を返す" do
      get "/api/v1/invitations/#{invitation.token}"
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["invitation"]["group_name"]).to eq(owner_group.name)
    end

    it "存在しないトークンは404を返す" do
      get "/api/v1/invitations/invalid_token"
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/invitations/:id/accept" do
    let(:invitee)         { create(:user) }
    let(:invitee_token)   { JwtService.encode(user_id: invitee.id) }
    let(:invitee_headers) { { "Authorization" => "Bearer #{invitee_token}" } }
    let(:invitation)      { create(:invitation, group: owner_group, invited_by: owner) }

    context "有効な招待の場合" do
      it "グループに参加できる" do
        post "/api/v1/invitations/#{invitation.token}/accept", headers: invitee_headers
        expect(response).to have_http_status(:ok)
        expect(invitee.groups.reload.first).to eq(owner_group)
      end

      it "招待が受諾済みになる" do
        post "/api/v1/invitations/#{invitation.token}/accept", headers: invitee_headers
        expect(invitation.reload.accepted?).to be true
      end

      it "元のソログループが削除される" do
        solo_group = invitee.groups.first
        post "/api/v1/invitations/#{invitation.token}/accept", headers: invitee_headers
        expect(Group.exists?(solo_group.id)).to be false
      end
    end

    context "期限切れの招待の場合" do
      let(:expired_invitation) { create(:invitation, group: owner_group, invited_by: owner, expires_at: 1.day.ago) }

      it "422を返す" do
        post "/api/v1/invitations/#{expired_invitation.token}/accept", headers: invitee_headers
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context "使用済みの招待の場合" do
      let(:used_invitation) { create(:invitation, group: owner_group, invited_by: owner, accepted_at: Time.current) }

      it "422を返す" do
        post "/api/v1/invitations/#{used_invitation.token}/accept", headers: invitee_headers
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end
end
