require "net/http"
require "faraday"
require "httparty"

class Client
  def one(id)
    uri = URI(ENV.fetch("API_URL") + "/items/#{id}?view=short")
    Net::HTTP.get(uri)
  end

  def create
    Faraday.post("/items", {})
  end

  def external
    HTTParty.get("https://remote.example/items")
  end

  def session
    connection = Faraday.new(url: ENV.fetch("API_URL"))
    connection.get("/items")
  end

  def stream(id)
    Net::HTTP.start(ENV.fetch("API_HOST")) do |http|
      http.get("/items/#{id}")
    end
  end

  def remove(id)
    Net::HTTP::Delete.new(URI(ENV.fetch("API_URL") + "/items/#{id}"))
  end

  def shadowed_path
    path = "/items"
    values.each do |path|
      Faraday.get(path)
    end
  end

  def shadowed(connection)
    connection.get("/unproven")
  end
end

class Outer
  class Inner
    def initialize
      @connection = Faraday.new(url: ENV.fetch("API_URL"))
    end
  end
  def unproven
    @connection.get("/items")
  end
end

