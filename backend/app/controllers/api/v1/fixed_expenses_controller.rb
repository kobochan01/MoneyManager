module Api
  module V1
    class FixedExpensesController < ApplicationController
      before_action :authenticate_user!
      before_action :set_fixed_expense, only: [:update, :destroy]

      def index
        fixed_expenses = @current_user.fixed_expenses.includes(:category).order(:day)
        render json: { fixed_expenses: fixed_expenses.map { |fe| fixed_expense_json(fe) } }, status: :ok
      end

      def create
        fixed_expense = @current_user.fixed_expenses.build(fixed_expense_params)

        if fixed_expense.save
          render json: { fixed_expense: fixed_expense_json(fixed_expense) }, status: :created
        else
          render json: { errors: fixed_expense.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @fixed_expense.update(fixed_expense_params)
          render json: { fixed_expense: fixed_expense_json(@fixed_expense) }, status: :ok
        else
          render json: { errors: @fixed_expense.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @fixed_expense.destroy
        render json: { message: "削除しました" }, status: :ok
      end

      private

      def set_fixed_expense
        @fixed_expense = @current_user.fixed_expenses.find_by(id: params[:id])
        render json: { error: "見つかりません" }, status: :not_found unless @fixed_expense
      end

      def fixed_expense_params
        params.require(:fixed_expense).permit(:name, :amount, :day, :category_id)
      end

      def fixed_expense_json(fe)
        {
          id:          fe.id,
          name:        fe.name,
          amount:      fe.amount,
          day:         fe.day,
          category_id: fe.category_id,
          category:    { id: fe.category_id, name: fe.category.name }
        }
      end
    end
  end
end
