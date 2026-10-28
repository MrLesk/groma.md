Rails.application.routes.draw do
  root 'orders#index'
  get '/orders/:id', to: 'orders#show'
  resources :orders, only: [:index, :show]
  namespace :admin do
    get 'orders', to: 'orders#index'
  end
  get '/secret', to: 'orders#secret'
  get '/guarded', to: 'orders#guarded'
  scope '/unsupported' do
    get '/wrong', to: 'orders#index'
  end
end

