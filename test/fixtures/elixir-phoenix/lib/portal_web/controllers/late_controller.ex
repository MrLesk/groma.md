defmodule PortalWeb.LateController do
  use PortalWeb, :controller

  def show(conn, _params), do: json(conn, %{})
end
