defmodule Shop.CLI do
  def main(arguments) do
    arguments |> Shop.Orders.total() |> IO.puts()
  end
end
