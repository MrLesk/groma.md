defmodule Tool.MixProject do
  use Mix.Project

  def project do
    [app: :tool, version: "0.1.0", escript: escript(), deps: []]
  end

  defp escript do
    [main_module: Tool.CLI]
  end
end
