defmodule DeskWeb.DynamicRouter do
  use AshJsonApi.Router, domains: Application.compile_env(:desk, :internal_domains)
end
