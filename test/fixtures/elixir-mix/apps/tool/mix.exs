defmodule Tool.MixProject do
  use Mix.Project

  def project do
    [app: :tool, version: "0.1.0", escript: [main_module: Tool.CLI], deps: []]
  end
end
