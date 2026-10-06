package extensions

extension (value: Int) def doubled: Int = Math.multiplyExact(value, 2)

extension [A](values: List[A])
  def mapped[B](f: A => B): List[B] = values.map(f)
  private def counted: Int = values.size

object TextOps:
  extension (value: String)
    def trimmed: String = value.trim()
    private[extensions] def repeated(times: Int): String = value.repeat(times)
