class Calculations
  def first(value, offset)
    result = value + offset
    result * 2
  end
  def second(input, increment)
    total = input + increment
    total * 2
  end
  def different(value, offset)
    result = (value + offset) * 3
    result
  end
  def block_first(items)
    total = 0
    items.each do
      x = 1
      total += x
    end
    x
  end
  def block_second(values)
    count = 0
    values.each do
      y = 1
      count += y
    end
    y
  end
  def block_same(values)
    count = 0
    values.each do
      z = 1
      count += z
    end
    x
  end
end
