module Api
  class NotesController
    def index; list_notes(); end
    def create; save_note(); end
    def destroy; delete_note(); end
  end
end

