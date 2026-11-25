defmodule PortalWeb.BoardLive do
  use Phoenix.LiveView

  def mount(_params, _session, socket), do: {:ok, socket}

  def render(assigns), do: ~H"<main>Board</main>"
end
