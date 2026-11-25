defmodule Desk.Application do
  use Application

  def start(_type, _args) do
    Supervisor.start_link([DeskWeb.Endpoint], strategy: :one_for_one)
  end
end
