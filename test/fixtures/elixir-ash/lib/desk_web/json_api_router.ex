defmodule DeskWeb.JsonApiRouter do
  use AshJsonApi.Router,
    domains: [Module.concat(["Desk.Support"])],
    open_api: "/open_api"
end
