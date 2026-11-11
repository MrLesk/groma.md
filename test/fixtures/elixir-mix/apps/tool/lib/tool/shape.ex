defprotocol Tool.Shape do
  def area(shape)
end

defmodule Tool.Square do
  defstruct [:side]

  defimpl Tool.Shape do
    def area(square), do: square.side * square.side
  end
end
