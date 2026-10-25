require "net/http"
class Client
  def list
    Net::HTTP.get(URI(ENV.fetch("API_URL") + "/external/items"))
  end
end

