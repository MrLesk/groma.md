defmodule PortalWeb.AdminRouter do
  use PortalWeb, :router

  get "/users", PortalWeb.ItemController, :index
end
