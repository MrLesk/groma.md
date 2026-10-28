module Admin
  class OrdersController < ApplicationController
    def index
      render json: Order.all
    end
  end
end

