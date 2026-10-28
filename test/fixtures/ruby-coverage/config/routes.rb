Rails.application.routes.draw do
  constraints ->(request) { request.admin? } do
    mount External::Engine, at: "/external"
  end
  authenticated :user do
    mount External::Engine, at: "/private"
  end
  get "/external/items", to: "items#index"
  get "/private/items", to: "items#index"
  namespace :api, defaults: { format: :json } do
    get "/items", to: "items#index"
  end
  get "/items", to: "items#index"
end
