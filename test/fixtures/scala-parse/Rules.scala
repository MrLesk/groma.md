package check
// UTF-16 location check: 🧭
object check:
  def price(): Int = 1
  def place(price: () => Int): Int = price()
trait Store:
  def load(id: Int): String
val transform = (n: Int) => n + 1
