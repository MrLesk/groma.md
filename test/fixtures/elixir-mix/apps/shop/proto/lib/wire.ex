defmodule Shop.Proto.Wire do
  def encode(order), do: :erlang.term_to_binary(order)
end
