factory = Module.new do
  def convert(value)
    total = value * 2
    total + 1
  end
end

transform = ->(value) { value * 2 }

