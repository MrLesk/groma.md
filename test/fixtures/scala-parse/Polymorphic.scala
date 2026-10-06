package polymorphic

def applyToInt(f: [A] => A => A): Int = f[Int](1)

def result: Int =
  applyToInt: [A] =>
    (value: A) => identity(value)
