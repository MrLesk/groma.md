module Api
  class ProfilesController
    def show; read_profile(); end
    def update; update_profile(); end
  end
end

