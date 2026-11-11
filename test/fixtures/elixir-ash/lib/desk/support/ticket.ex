defmodule Desk.Support.Ticket do
  use Ash.Resource, domain: Desk.Support, extensions: [AshJsonApi.Resource]

  actions do
    defaults [:read, :destroy, update: :*]

    create :open do
      accept [:subject]
    end

    action :escalate, :boolean do
      run fn _input, _context -> {:ok, true} end
    end
  end

  code_interface do
    define :close, action: :destroy
  end

  json_api do
    type "ticket"
  end

  def summary(ticket), do: ticket.subject
end
