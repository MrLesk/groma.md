defmodule Desk.Support do
  use Ash.Domain, extensions: [AshJsonApi.Domain]

  alias Desk.Support.Ticket

  resources do
    resource Ticket do
      define :open_ticket, action: :open
      define :list_tickets, action: :read
      define :ticket_exists?, action: :read
      define_calculation :age
    end

    resource Desk.Support.Note
  end

  json_api do
    routes do
      base_route "/tickets", Ticket do
        index :read
        get :read
        post :open
        route :post, "/:id/escalate", :escalate
      end
    end
  end
end
