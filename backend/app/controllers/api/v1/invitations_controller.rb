module Api
  module V1
    class InvitationsController < ApplicationController
      before_action :authenticate_user!, only: [:create, :accept]
      before_action :set_invitation,     only: [:show, :accept]

      def create
        group = @current_user.groups.first
        invitation = Invitation.new(
          group:      group,
          invited_by: @current_user,
          email:      params[:email]
        )

        if invitation.save
          render json: { token: invitation.token }, status: :created
        else
          render json: { errors: invitation.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def show
        render json: { invitation: invitation_json(@invitation) }, status: :ok
      end

      def accept
        unless @invitation.usable?
          return render json: { error: "この招待は無効または期限切れです" }, status: :unprocessable_entity
        end

        ActiveRecord::Base.transaction do
          leave_current_group
          GroupMember.create!(user: @current_user, group: @invitation.group, role: "member")
          @invitation.update!(accepted_at: Time.current)
        end

        render json: { message: "グループに参加しました" }, status: :ok
      rescue ActiveRecord::RecordInvalid => e
        render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
      end

      private

      def set_invitation
        @invitation = Invitation.find_by(token: params[:id])
        render json: { error: "招待が見つかりません" }, status: :not_found unless @invitation
      end

      def leave_current_group
        current_group = @current_user.groups.first
        return unless current_group

        member = GroupMember.find_by(user: @current_user, group: current_group)
        member&.destroy

        current_group.destroy if current_group.group_members.empty?
      end

      def invitation_json(invitation)
        {
          group_name:   invitation.group.name,
          invited_by:   invitation.invited_by.name,
          email:        invitation.email,
          expires_at:   invitation.expires_at,
          accepted:     invitation.accepted?,
          expired:      invitation.expired?
        }
      end
    end
  end
end
