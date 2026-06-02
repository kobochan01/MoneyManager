module Api
  module V1
    class UserSettingsController < ApplicationController
      before_action :authenticate_user!

      def show
        setting = @current_user.user_setting
        render json: setting_json(setting), status: :ok
      end

      def update
        setting = @current_user.user_setting || @current_user.build_user_setting
        if setting.update(setting_params)
          render json: setting_json(setting), status: :ok
        else
          render json: { errors: setting.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def setting_params
        params.permit(:start_day, :closing_day, :week_start)
      end

      def setting_json(setting)
        if setting
          {
            start_day:   setting.start_day,
            closing_day: setting.closing_day,
            week_start:  setting.week_start
          }
        else
          { start_day: 1, closing_day: 31, week_start: "sunday" }
        end
      end
    end
  end
end
