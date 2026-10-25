class OrdersController < ApplicationController
  def index
    render json: Order.all
  end

  def show
    render json: Order.find(params[:id])
  end

  def self.build
    new
  end

  protected
  def guarded
    check_access()
  end

  private
  def secret
    hidden()
  end
end

