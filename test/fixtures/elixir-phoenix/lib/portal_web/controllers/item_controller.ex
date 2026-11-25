defmodule PortalWeb.ItemController do
  use PortalWeb, :controller

  def index(conn, _params), do: json(conn, [])

  def show(conn, %{"id" => id}), do: json(conn, %{id: id})

  def create(conn, params), do: json(conn, params)

  def status(conn, _params), do: json(conn, %{})

  def download(conn, _params), do: conn

  def fallback(conn, _params), do: conn

  defp hidden(conn, _params), do: conn
end
