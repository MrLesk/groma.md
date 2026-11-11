defmodule Portal.Application do
  use Application

  def start(_type, _args) do
    Supervisor.start_link([PortalWeb.Endpoint], strategy: :one_for_one)
  end
end
