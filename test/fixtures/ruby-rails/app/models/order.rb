# 📦 Order model
class Order < ApplicationRecord
  def initialize(value)
    @value = value
  end

  def total
    calculate(@value)
    items.each do |item|
      deferred(item)
    end
  end
end

