defmodule PortalWeb.NoteController do
  use PortalWeb, :controller

  def show(conn, %{"item_id" => item, "id" => id}), do: json(conn, %{item: item, id: id})
end
