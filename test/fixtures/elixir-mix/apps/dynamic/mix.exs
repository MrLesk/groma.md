defmodule Dynamic.MixProject do
  use Mix.Project

  def project do
    [app: :dynamic, version: "0.1.0", elixirc_paths: Path.wildcard("s*"), deps: []]
  end
end
