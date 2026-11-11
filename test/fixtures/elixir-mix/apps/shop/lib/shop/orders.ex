defmodule Shop.Orders do
  alias Shop.Orders.Line

  defmodule Line do
    defstruct [:price, :quantity]

    def subtotal(%Line{price: price, quantity: quantity}), do: price * quantity
  end

  defdelegate describe(order), to: Shop.Audit

  def total(lines, discount \\ 0)

  def total([], _discount), do: 0

  def total(lines, discount) when is_list(lines) do
    lines
    |> Enum.map(fn line -> Line.subtotal(line) end)
    |> Enum.sum()
    |> apply_discount(discount)
  end

  defmacro traced(expression) do
    quote do
      Shop.Audit.record(unquote(expression))
    end
  end

  defguard is_free(order) when order.total == 0

  defp apply_discount(amount, discount) do
    rounded = round(amount)
    if discount > 0, do: rounded - discount, else: rounded
  end
end
