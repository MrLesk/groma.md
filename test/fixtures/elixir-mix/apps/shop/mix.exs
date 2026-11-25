defmodule Shop.MixProject do
  use Mix.Project

  alias Shop.Application, as: App

  def project do
    [
      app: :shop,
      version: "0.1.0",
      elixir: "~> 1.15",
      elixirc_paths: elixirc_paths(Mix.env()),
      escript: [main_module: Shop.CLI],
      deps: []
    ]
  end

  def application do
    [
      mod: {App, []},
      extra_applications: [:logger]
    ]
  end

  defp elixirc_paths(:test), do: elixirc_paths(:dev) ++ ["test/support"]
  defp elixirc_paths(_), do: ["lib", "extra/", "proto/lib"]
end
