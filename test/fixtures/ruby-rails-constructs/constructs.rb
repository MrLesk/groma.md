module Configurable
  extend ActiveSupport::Concern
  class_methods do
    def configure
      store_configuration()
    end
    private
    def secret
      load_secret()
    end
  end
  def run
    perform()
  end
end

class Worker
  class << self
    def build
      create_worker()
    end
    private
    def key
      read_key()
    end
  end
  class Failure < StandardError
    def initialize
      record_failure()
    end
  end
  def execute
    perform_work()
  end
end

