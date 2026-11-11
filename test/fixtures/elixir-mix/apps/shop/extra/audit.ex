defmodule Shop.Audit do
  def describe(order), do: inspect(order)

  def record(value), do: value
end
