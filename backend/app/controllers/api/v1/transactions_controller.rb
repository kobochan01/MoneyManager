module Api
  module V1
    class TransactionsController < ApplicationController
      before_action :authenticate_user!
      before_action :set_transaction, only: [:update, :destroy]

      def index
        transactions = current_group_transactions.includes(:category, :user).order(date: :desc)
        render json: { transactions: transactions.map { |t| transaction_json(t) } }, status: :ok
      end

      def create
        category = find_or_create_category(
          transaction_params[:category_name],
          transaction_params[:transaction_type]
        )

        transaction = Transaction.new(
          group:            @current_user.groups.first,
          user:             @current_user,
          category:         category,
          transaction_type: transaction_params[:transaction_type],
          amount:           transaction_params[:amount],
          date:             transaction_params[:date],
          memo:             transaction_params[:memo]
        )

        if transaction.save
          render json: { transaction: transaction_json(transaction) }, status: :created
        else
          render json: { errors: transaction.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        if @transaction.update(update_params)
          render json: { transaction: transaction_json(@transaction) }, status: :ok
        else
          render json: { errors: @transaction.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def destroy
        @transaction.destroy
        render json: { message: "削除しました" }, status: :ok
      end

      private

      def current_group_transactions
        group_ids = @current_user.groups.pluck(:id)
        Transaction.where(group_id: group_ids)
      end

      def set_transaction
        group_ids = @current_user.groups.pluck(:id)
        @transaction = Transaction.find_by(id: params[:id], group_id: group_ids)
        render json: { error: "見つかりません" }, status: :not_found unless @transaction
      end

      def find_or_create_category(name, type)
        group = @current_user.groups.first
        Category.find_or_create_by!(
          group:            group,
          name:             name,
          transaction_type: type
        )
      end

      def transaction_params
        params.require(:transaction).permit(:transaction_type, :amount, :date, :memo, :category_name)
      end

      def update_params
        params.require(:transaction).permit(:transaction_type, :amount, :date, :memo)
      end

      def transaction_json(transaction)
        {
          id:               transaction.id,
          transaction_type: transaction.transaction_type,
          amount:           transaction.amount.to_s,
          date:             transaction.date,
          memo:             transaction.memo,
          category:         { id: transaction.category_id, name: transaction.category.name },
          user:             { id: transaction.user_id, name: transaction.user.name }
        }
      end
    end
  end
end
