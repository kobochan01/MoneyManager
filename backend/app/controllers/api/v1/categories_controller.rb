module Api
  module V1
    class CategoriesController < ApplicationController
      before_action :authenticate_user!

      def index
        group_ids = @current_user.groups.pluck(:id)
        categories = Category.where(group_id: group_ids).order(:name)
        render json: { categories: categories.map { |c| category_json(c) } }, status: :ok
      end

      private

      def category_json(category)
        {
          id:               category.id,
          name:             category.name,
          transaction_type: category.transaction_type
        }
      end
    end
  end
end
