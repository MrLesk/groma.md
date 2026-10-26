module Api
  class PeopleController
    def index; list_people(); end
    def show; find_person(); end
    def update_profile; save_profile(); end
    def search; search_people(); end
    def hidden; original_instance_helper(); end
    class << self
      def hidden; public_class_helper(); end
    end
    private
    def hidden; private_instance_helper(); end
  end
end

