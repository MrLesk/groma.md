defmodule PortalWeb.Router do
  use PortalWeb, :router

  alias PortalWeb.Reports

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/api", PortalWeb do
    pipe_through :api

    get "/items/:id", ItemController, :show

    resources "/items", ItemController, except: [:edit, :new, :show, :update, :delete], name: "entry", param: "slug" do
      resources "/notes", NoteController, singleton: true, only: [:show]
    end

    get "/v:version/status", ItemController, :status
    get "/files/*path", ItemController, :download
    get "/reports", Reports.SummaryController, :index, alias: false
    post "/hooks", HookController, :receive
    get "/secret", ItemController, :hidden
  end

  scope "/", PortalWeb do
    live_session :default do
      live "/", BoardLive
      live "/plain", PlainLive
    end

    live "/empty", EmptyLive
  end

  scope "/admin" do
    forward "/jobs", JobDashboard
    admin_routes PortalWeb.ItemController
    get "/late", PortalWeb.LateController, :show
  end

  scope "/tenant", PortalWeb, host: "tenant." do
    get "/home", ItemController, :index
  end

  if Mix.env() == :dev do
    scope "/dev" do
      get "/mail", PortalWeb.ItemController, :index
    end
  end

  match :*, "/fallback", PortalWeb.ItemController, :fallback

  forward "/backoffice", PortalWeb.AdminRouter
end
