class ApplicationController < ActionController::API
  def authenticate_user!
    token = extract_token_from_header
    if token.nil?
      return render json: { error: "認証トークンがありません" }, status: :unauthorized
    end

    begin
      payload = JwtService.decode(token)
      @current_user = User.find(payload["user_id"])
    rescue JWT::DecodeError
      render json: { error: "無効なトークンです" }, status: :unauthorized
    rescue ActiveRecord::RecordNotFound
      render json: { error: "ユーザーが見つかりません" }, status: :unauthorized
    end
  end

  private

  def extract_token_from_header
    auth_header = request.headers["Authorization"]
    return nil if auth_header.blank?

    auth_header.split(" ").last
  end
end
