defmodule Tool.CLI do
  def main(_arguments), do: Tool.Shape.area(%Tool.Square{side: 2})
end
