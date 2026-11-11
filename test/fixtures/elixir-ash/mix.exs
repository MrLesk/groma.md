defmodule Desk.MixProject do
  use Mix.Project

  def project do
    [app: :desk, version: "0.1.0", elixir: "~> 1.17", deps: deps()]
  end

  def application do
    [mod: {Desk.Application, []}]
  end

  defp deps do
    [{:ash, "~> 3.0"}, {:ash_json_api, "~> 1.0"}, {:phoenix, "~> 1.8"}]
  end
end
