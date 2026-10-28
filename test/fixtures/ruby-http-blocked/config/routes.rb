Rails.application.routes.draw do
  mount External::Engine, at: "/external"
  get "/external/items", to: "items#index"
end

