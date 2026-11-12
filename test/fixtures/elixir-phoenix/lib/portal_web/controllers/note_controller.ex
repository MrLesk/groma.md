defmodule PortalWeb.NoteController do
  use PortalWeb, :controller

  def show(conn, %{"entry_slug" => entry}), do: json(conn, %{entry: entry})
end
