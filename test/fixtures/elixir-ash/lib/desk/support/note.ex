defmodule Desk.Support.Note do
  use Ash.Resource, domain: Desk.Support, extensions: [AshJsonApi.Resource]

  actions do
    defaults [:read, create: :*]
  end

  json_api do
    type "note"

    routes do
      base "/notes"

      index :read
      post :create
      related :ticket, :read
      post_to_relationship :ticket
    end
  end
end
