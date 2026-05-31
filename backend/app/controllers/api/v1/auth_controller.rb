module Api
  module V1
    class AuthController < ApplicationController
      def signup
        user = nil
        ActiveRecord::Base.transaction do
          user = User.create!(
            name: signup_params[:name],
            email: signup_params[:email],
            password: signup_params[:password],
            password_confirmation: signup_params[:password_confirmation]
          )
          group = Group.create!(name: "#{user.name}のグループ")
          GroupMember.create!(user: user, group: group, role: "owner")
        end

        token = JwtService.encode(user_id: user.id)
        render json: { token: token, user: user_json(user) }, status: :created
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      def login
        user = User.find_by(email: login_params[:email]&.downcase)

        if user&.authenticate(login_params[:password])
          token = JwtService.encode(user_id: user.id)
          render json: { token: token, user: user_json(user) }, status: :ok
        else
          render json: { error: "メールアドレスまたはパスワードが正しくありません" }, status: :unauthorized
        end
      end

      def logout
        render json: { message: "ログアウトしました" }, status: :ok
      end

      private

      def signup_params
        params.require(:user).permit(:name, :email, :password, :password_confirmation)
      end

      def login_params
        params.require(:user).permit(:email, :password)
      end

      def user_json(user)
        { id: user.id, name: user.name, email: user.email }
      end
    end
  end
end
