defmodule Portal.MixProject do
  use Mix.Project

  def project do
    [app: :portal, version: "0.1.0", elixir: "~> 1.17", deps: deps()]
  end

  def application do
    [mod: {Portal.Application, []}]
  end

  defp deps do
    [{:phoenix, "~> 1.8"}]
  end
end
