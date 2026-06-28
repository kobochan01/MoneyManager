module Api
  module V1
    class GroupsController < ApplicationController
      before_action :authenticate_user!

      def show
        group = @current_user.groups.first
        render json: { group: group_json(group) }, status: :ok
      end

      private

      def group_json(group)
        {
          id:      group.id,
          name:    group.name,
          members: group.group_members.includes(:user).map { |gm|
            { id: gm.user.id, name: gm.user.name, role: gm.role }
          }
        }
      end
    end
  end
end
