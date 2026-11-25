defmodule DeskWeb.LateController do
  use Phoenix.Controller, formats: [:json]

  def show(conn, _params), do: json(conn, %{})
end
