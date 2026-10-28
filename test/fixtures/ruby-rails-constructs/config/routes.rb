Rails.application.routes.draw do
  namespace :api do
    resources :people, only: %i[index show] do
      member do
        patch :profile, action: :update_profile
        get :hidden
        post :note, to: "notes#create"
        delete "notes/:note_id", to: "notes#destroy"
      end
      collection do
        get :search
      end
      resources :notes, only: %i[index create]
      resource :profile, only: %i[show update]
    end
  end
end

