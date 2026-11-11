defmodule DeskWeb.Router do
  use DeskWeb, :router
  use AshAuthentication.Phoenix.Router

  scope "/api/json" do
    forward "/desk", DeskWeb.JsonApiRouter
    get "/desk/late", DeskWeb.LateController, :show
  end

  scope "/", DeskWeb do
    ash_authentication_live_session :signed_in do
      live "/home", HomeLive
    end
  end

  scope "/internal" do
    forward "/api", DeskWeb.DynamicRouter
  end
end
